import { useEffect, useId, useState } from "react";
import "./MermaidDiagram.css";

const mermaidPromises = new Map();

function getMermaid(themeMode) {
  if (!mermaidPromises.has(themeMode)) {
    mermaidPromises.set(themeMode, import("mermaid").then((module) => {
      const mermaid = module.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          background: "#fafbfd",
          primaryColor: "#ffffff",
          primaryTextColor: "#111827",
          primaryBorderColor: themeMode === "dark" ? "#2563eb" : "#2368e8",
          lineColor: "#1f2937",
          secondaryColor: "#eef4ff",
          tertiaryColor: "#f8fafc",
          edgeLabelBackground: "#ffffff",
          nodeTextColor: "#111827",
          textColor: "#111827",
        },
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          nodeSpacing: 40,
          rankSpacing: 50,
          padding: 14,
        },
      });
      return mermaid;
    }));
  }
  return mermaidPromises.get(themeMode);
}

function normalizeChart(chart) {
  return String(chart)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^```(?:mermaid)?\s*$/i.test(line.trim()))
    .join("\n")
    .replace(/^\s*mermaid\s*\n/i, "")
    .replace(/\\"/g, '"')
    .trim();
}

export default function MermaidDiagram({ chart, complete = true }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [showSource, setShowSource] = useState(false);
  const source = normalizeChart(chart);

  useEffect(() => {
    if (!complete) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const themeMode = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        const mermaid = await getMermaid(themeMode);
        if (document.fonts?.ready) await document.fonts.ready;
        await mermaid.parse(source);
        const result = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(result.svg);
          setError("");
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg("");
          setError(renderError?.message || "Could not render this diagram.");
        }
        document.getElementById(`d${id}`)?.remove();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, complete, id]);

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(source);
  };

  return (
    <figure className="mmd">
      <figcaption className="mmd-bar">
        <span>Diagram</span>
        <span className="mmd-actions">
          <button type="button" onClick={() => setShowSource((visible) => !visible)}>
            {showSource ? "Hide code" : "View code"}
          </button>
          <button type="button" onClick={copy}>Copy code</button>
        </span>
      </figcaption>
      {svg && !showSource && (
        <div className="mmd-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {!svg && !error && !showSource && <div className="mmd-status">Drawing diagram...</div>}
      {error && !showSource && (
        <div className="mmd-status mmd-error">
          This diagram could not be drawn. Open &quot;View code&quot; to inspect it or ask Blui to redraw it.
        </div>
      )}
      {showSource && (
        <>
          {error && <div className="mmd-source-error">{error}</div>}
          <pre className="mmd-source"><code>{source}</code></pre>
        </>
      )}
    </figure>
  );
}
