import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow } from "@xyflow/react";
import { Box, Cloud, Database, Globe, KeyRound, Lock, Mail, Network, RotateCcw, Server, ShieldCheck, Upload, User, Zap } from "lucide-react";
import { validateDiagram, layoutDiagram, groupColor, DEFAULT_COLOR } from "./diagramUtils";
import "@xyflow/react/dist/style.css";
import "./RichDiagram.css";

const KIND_LABEL = { start: "Start", decision: "Decision", data: "Data", end: "Result" };
const STEP_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#4f46e5", "#65a30d", "#ea580c", "#9333ea", "#0284c7", "#be123c"];

function StepIcon({ name, kind }) {
  const key = name || kind;
  const Icon = key === "user" || key === "start" ? User
    : key === "browser" ? Globe
      : key === "database" || key.includes("dynamodb") || key.includes("rds") ? Database
        : key === "server" || key.includes("ec2") || key.includes("ecs") || key.includes("eks") ? Server
          : key === "lock" || key.includes("cognito") || key.includes("iam") ? Lock
            : key === "aws-s3" || key === "cloud" || key.includes("cloudfront") ? Cloud
              : key === "mail" || key.includes("sns") ? Mail
                : key.includes("api-gateway") || key.includes("load-balancer") ? Network
                  : key.includes("waf") || key.includes("secrets") ? ShieldCheck
                    : key.includes("lambda") || key === "function" || key.includes("step-functions") ? Zap
                      : key === "queue" || key.includes("sqs") || key.includes("eventbridge") ? Box
                        : key.includes("route53") ? Globe
                          : key === "upload" ? Upload
                            : key === "decision" ? KeyRound : Server;
  return <Icon className="rd-icon" size={16} strokeWidth={2.4} aria-hidden="true" />;
}

function StepNode({ data }) {
  const className = ["rd-node", data.selected && "is-selected"].filter(Boolean).join(" ");
  return (
    <div className={className} style={{ "--accent": data.color, "--motion-delay": data.motionDelay }}>
      <Handle type="target" position={data.targetPos} />
      <span className="rd-step"><StepIcon name={data.icon} kind={data.kind} /><b>{data.step}</b></span>
      <div className="rd-title">{data.title}</div>
      <div className="rd-summary">{data.summary}</div>
      {KIND_LABEL[data.kind] && <span className="rd-kind">{KIND_LABEL[data.kind]}</span>}
      <Handle type="source" position={data.sourcePos} />
    </div>
  );
}

const nodeTypes = { step: StepNode };

export default function RichDiagram({ spec, complete = true, onAsk, onRegenerate }) {
  const result = useMemo(() => (complete ? validateDiagram(spec) : null), [spec, complete]);
  const [pickedId, setPickedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flowInstances = useRef(new Set());
  const activeId = pickedId && result?.ok && result.diagram.nodes.some((node) => node.id === pickedId)
    ? pickedId
    : result?.diagram?.nodes?.[0]?.id;

  useEffect(() => {
    if (!isFullscreen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsFullscreen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (!activeId || !flowInstances.current.size) return;

    flowInstances.current.forEach((instance) => {
      const node = instance.getNode(activeId);
      if (!node) return;
      const zoom = instance.getViewport().zoom;
      const x = node.position.x + (node.measured?.width ?? 220) / 2;
      const y = node.position.y + (node.measured?.height ?? 88) / 2;
      instance.setCenter(x, y, { zoom, duration: 300 });
    });
  }, [activeId]);
  const built = useMemo(() => {
    if (!result?.ok) return null;
    const { positions, height } = layoutDiagram(result.diagram);
    const horizontal = result.diagram.direction === "LR";
    return {
      d: result.diagram,
      positions,
      height: Math.min(500, Math.max(320, Math.round(height) + 20)),
      targetPos: horizontal ? Position.Left : Position.Top,
      sourcePos: horizontal ? Position.Right : Position.Bottom,
    };
  }, [result]);

  if (!complete) return <div className="rd rd-status">Drawing diagram...</div>;
  if (!result?.ok) {
    return (
      <div className="rd rd-status rd-error">
        <span>Blui&apos;s diagram could not be drawn: {result.errors?.[0] || "The diagram data is invalid."}</span>
        {onRegenerate && (
          <button className="rd-regenerate" type="button" onClick={onRegenerate}>
            <RotateCcw size={14} aria-hidden="true" /> Regenerate diagram
          </button>
        )}
      </div>
    );
  }

  const { d, positions, height, targetPos, sourcePos } = built;
  const selectedId = activeId;
  const index = d.nodes.findIndex((node) => node.id === selectedId);
  const selected = d.nodes[index];
  const connected = new Set(d.edges.filter((edge) => edge.from === selectedId || edge.to === selectedId).map((edge) => edge.id));
  const nodes = d.nodes.map((node, nodeIndex) => ({
    id: node.id, type: "step", position: positions[node.id], draggable: false,
    data: {
      ...node,
      color: STEP_COLORS[nodeIndex % STEP_COLORS.length],
      selected: node.id === selectedId,
      motionDelay: `${Math.min(node.step, 12) * 90}ms`,
      targetPos,
      sourcePos,
    },
  }));
  const edges = d.edges.map((edge) => {
    const active = connected.has(edge.id);
    const color = edge.kind === "error" ? "#dc2626" : active ? "#60a5fa" : "#64748b";
    return {
      id: edge.id, source: edge.from, target: edge.to, label: edge.label, type: "smoothstep", animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: active ? 2.5 : 1.5, strokeDasharray: edge.kind === "async" ? "7 5" : undefined },
      labelStyle: { fontSize: 13, fill: "var(--rd-edge-text)" },
      labelBgStyle: { fill: "var(--rd-edge-bg)", fillOpacity: 0.96 },
      labelBgPadding: [7, 4], labelBgBorderRadius: 5,
    };
  });
  const go = (delta) => setPickedId(d.nodes[(index + delta + d.nodes.length) % d.nodes.length].id);

  const diagram = (
    <>
      <figcaption className="rd-bar">
        <span className="rd-name">{d.title}</span>
        <span className="rd-hint">Click a step to explore it</span>
        <button className="rd-fullscreen" type="button" onClick={() => setIsFullscreen((visible) => !visible)}>
          {isFullscreen ? "Close" : "View full screen"}
        </button>
      </figcaption>
      {d.description && <p className="rd-desc">{d.description}</p>}
      {d.groups.length > 0 && <ul className="rd-legend">{d.groups.map((group) => <li key={group.id}><i style={{ background: group.color }} />{group.label}</li>)}</ul>}
      <div className="rd-canvas" style={{ height }}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={(instance) => flowInstances.current.add(instance)} onNodeClick={(_, node) => setPickedId(node.id)} fitView fitViewOptions={{ padding: 0.04 }} minZoom={0.25} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false} preventScrolling={false}>
          <Background gap={24} color="var(--rd-grid)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <section className="rd-panel" aria-live="polite">
        <div className="rd-panel-head"><span className="rd-badge" style={{ background: groupColor(d, selected.group) || DEFAULT_COLOR }}>{selected.step}</span><h4>{selected.title}</h4><span className="rd-count">Step {index + 1} of {d.nodes.length}</span></div>
        <p className="rd-panel-summary">{selected.summary}</p>
        {selected.details && <p className="rd-panel-details">{selected.details}</p>}
        {selected.code && <pre className="rd-code"><code>{selected.code.text}</code></pre>}
        <div className="rd-actions">
          <button type="button" onClick={() => go(-1)}>Previous step</button>
          <button type="button" onClick={() => go(1)}>Next step</button>
          {onAsk && <button type="button" className="rd-primary" onClick={() => onAsk(`Explain step ${selected.step} (${selected.title}) of the "${d.title}" diagram in more detail.`)}>Ask Blui about this step</button>}
          <button type="button" onClick={() => setShowAll((visible) => !visible)}>{showAll ? "Hide all steps" : "All steps"}</button>
        </div>
        {showAll && <ol className="rd-steps">{d.nodes.map((node) => <li key={node.id}><button type="button" onClick={() => setPickedId(node.id)} aria-current={node.id === selectedId}><b>{node.title}</b> {node.summary}</button></li>)}</ol>}
      </section>
    </>
  );

  return (
    <>
      <figure className="rd" aria-label={`Diagram: ${d.title}`}>
        {diagram}
      </figure>
      {isFullscreen && createPortal(
        <div className="rd-fullscreen-overlay" role="dialog" aria-modal="true" aria-label={`${d.title} full screen`}>
          <figure className="rd rd-fullscreen-view">{diagram}</figure>
        </div>,
        document.body,
      )}
    </>
  );
}
