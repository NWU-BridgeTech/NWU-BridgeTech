import dagre from "@dagrejs/dagre";
import { ICON_KEYS } from "./iconKeys";

export const NODE_W = 240;
export const NODE_H = 92;

const MAX_NODES = 12;
const KINDS = new Set(["start", "process", "decision", "data", "end"]);
const ICONS = new Set(ICON_KEYS);
const PALETTE = ["#2e6be6", "#2f9e5b", "#d98a00", "#8a4fd8", "#d6455d", "#0e9db3"];
const GROUP_COLORS = {
  blue: "#2e6be6", green: "#2f9e5b", orange: "#d98a00", purple: "#8a4fd8",
  red: "#d6455d", teal: "#0e9db3", pink: "#d14d9b", gray: "#64748b",
};
const EDGE_KINDS = new Set(["request", "response", "error", "async"]);
const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const slug = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function toId(value, fallback) {
  const text = typeof value === "number" || typeof value === "string" ? value : "";
  const valueSlug = slug(text) || slug(fallback);
  if (!valueSlug) return "";
  return /^[a-z]/.test(valueSlug) ? valueSlug : `n${valueSlug}`;
}

export function validateDiagram(input) {
  const warnings = [];
  const fail = (message, raw) => {
    if (typeof console !== "undefined") console.warn("[blui-diagram] could not draw:", message, raw ?? input);
    return { ok: false, errors: [message] };
  };
  let raw = input;
  if (typeof input === "string") {
    const text = input.trim().replace(/^```(?:json|blui-diagram)?\s*/i, "").replace(/```\s*$/, "").trim();
    try {
      raw = JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) return fail("The diagram data is not valid JSON.");
      try {
        raw = JSON.parse(text.slice(start, end + 1));
      } catch {
        return fail("The diagram data is not valid JSON.");
      }
    }
  }

  const payload = raw?.diagram && typeof raw.diagram === "object" ? raw.diagram : raw;
  const list = Array.isArray(raw) ? raw
    : Array.isArray(payload?.nodes) ? payload.nodes
      : Array.isArray(payload?.steps) ? payload.steps
        : Array.isArray(payload?.components) ? payload.components
          : Array.isArray(payload?.flow) ? payload.flow : null;
  if (!list) return fail("The diagram has no steps.", raw);
  const meta = Array.isArray(raw) ? {} : payload;
  const groupMap = new Map();
  (Array.isArray(meta.groups) ? meta.groups : []).slice(0, 5).forEach((group) => {
    const id = clean(group?.id, 40);
    if (id) {
      const requestedColor = clean(group?.color, 30).toLowerCase();
      groupMap.set(id, { id, label: clean(group?.label, 40) || id, requestedColor });
    }
  });

  const seen = new Set();
  const idMap = new Map();
  const nodes = [];
  list.slice(0, MAX_NODES).forEach((node, index) => {
    if (typeof node === "string" || typeof node === "number") {
      node = { id: node, title: String(node) };
    }
    if (!node || typeof node !== "object") return warnings.push(`Skipped step #${index + 1}: not an object.`);
    const title = clean(node.title ?? node.label ?? node.name, 60);
    let id = toId(node.id, title);
    if (!id) return warnings.push(`Skipped step #${index + 1}: it has no id and no title.`);
    const base = id;
    for (let suffix = 2; seen.has(id); suffix += 1) id = `${base}-${suffix}`;
    seen.add(id);
    if (node.id !== undefined) idMap.set(String(node.id), id);
    if (title) idMap.set(slug(title), id);
    idMap.set(id, id);
    const group = clean(node.group, 40);
    if (group && !groupMap.has(group)) groupMap.set(group, { id: group, label: group, requestedColor: "" });
    const step = Number(node.step);
    nodes.push({
      id,
      title: title || id,
      summary: clean(node.summary ?? node.description, 140),
      details: clean(node.details ?? node.explanation, 700),
      code: node.code && typeof node.code.text === "string" && node.code.text.trim()
        ? { language: clean(node.code.language, 20) || "text", text: node.code.text.slice(0, 600) } : null,
      group: group || null,
      step: Number.isInteger(step) && step > 0 ? step : index + 1,
      kind: KINDS.has(node.kind) ? node.kind : "process",
      icon: ICONS.has(node.icon) ? node.icon : null,
    });
  });
  if (nodes.length < 2) return fail(`The diagram needs at least two usable steps (found ${list.length} entries, ${nodes.length} usable).`, raw);
  nodes.sort((a, b) => a.step - b.step);

  const resolve = (value) => idMap.get(String(value)) ?? idMap.get(toId(value)) ?? idMap.get(slug(value));
  const edges = [];
  (Array.isArray(meta.edges) ? meta.edges : []).slice(0, 30).forEach((edge, index) => {
    const from = resolve(edge?.from ?? edge?.source);
    const to = resolve(edge?.to ?? edge?.target);
    if (!from || !to || from === to) return warnings.push(`Dropped an arrow that points to an unknown step (#${index + 1}).`);
    edges.push({
      id: `e${index}`,
      from,
      to,
      label: clean(edge?.label ?? edge?.text, 80),
      kind: EDGE_KINDS.has(edge?.kind) ? edge.kind : "request",
    });
  });
  if (edges.length === 0) {
    nodes.slice(1).forEach((node, index) => edges.push({
      id: `auto${index}`, from: nodes[index].id, to: node.id, label: "", kind: "request",
    }));
    warnings.push("No usable arrows, so the steps were connected in order.");
  }

  return {
    ok: true,
    warnings,
    diagram: {
      title: clean(meta.title, 80) || "Diagram",
      description: clean(meta.description, 240),
      direction: meta.direction === "LR" || (!meta.direction && nodes.length <= 4) ? "LR" : "TB",
      groups: [...groupMap.values()].map((group, index) => {
        const requested = group.requestedColor;
        const color = /^#[0-9a-f]{6}$/i.test(requested)
          ? requested
          : GROUP_COLORS[requested] || PALETTE[index % PALETTE.length];
        return { id: group.id, label: group.label, color };
      }),
      nodes,
      edges,
    },
  };
}

export const DEFAULT_COLOR = "#5b6b8c";
export function groupColor(diagram, groupId) {
  return diagram.groups.find((group) => group.id === groupId)?.color ?? DEFAULT_COLOR;
}

export function layoutDiagram(diagram) {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: diagram.direction, nodesep: 50, ranksep: diagram.direction === "LR" ? 90 : 60, marginx: 20, marginy: 20 });
  graph.setDefaultEdgeLabel(() => ({}));
  diagram.nodes.forEach((node) => graph.setNode(node.id, { width: NODE_W, height: NODE_H }));
  diagram.edges.forEach((edge) => graph.setEdge(edge.from, edge.to));
  dagre.layout(graph);
  const positions = {};
  diagram.nodes.forEach((node) => {
    const position = graph.node(node.id);
    positions[node.id] = { x: position.x - NODE_W / 2, y: position.y - NODE_H / 2 };
  });
  const { width, height } = graph.graph();
  return { positions, width, height };
}
