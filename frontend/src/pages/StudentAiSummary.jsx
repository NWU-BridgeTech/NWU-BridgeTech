import { useEffect, useState } from "react";
import { Eraser, Sparkles } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { getToken } from "../utils/authStorage";
import MermaidDiagram from "../components/MermaidDiagram";
import "./StudentAiSummary.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function BluiMascot({ thinking = false, small = false }) {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (!thinking) {
      setFrame(1);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFrame((current) => (current % 16) + 1);
    }, 90);
    return () => window.clearInterval(timer);
  }, [thinking]);

  return (
    <img
      className={small ? "blui-mini-mascot" : "blui-mascot"}
      src={`/blui/frame-${String(frame).padStart(2, "0")}.png`}
      alt={small ? "" : "Blui"}
      aria-hidden={small}
    />
  );
}

function renderInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function isMarkdownTableRow(line) {
  return line.includes("|") && line.split("|").length >= 3;
}

function isMarkdownTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdownTableRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function parseCodeFence(line) {
  const match = line.trim().match(/^```([\w#+.-]*)\s*$/);
  return match ? match[1] : null;
}

function renderAnalysis(analysis) {
  const lines = analysis.split(/\r?\n/);
  const rendered = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const language = parseCodeFence(line);
    if (language !== null) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && parseCodeFence(lines[index]) === null) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (language.toLowerCase() === "mermaid") {
        rendered.push(<MermaidDiagram key={`diagram-${index}`} chart={codeLines.join("\n")} />);
      } else {
        rendered.push(
          <div className="blui-code-block" key={`code-${index}`}>
            {language && <div className="blui-code-language">{language}</div>}
            <pre><code>{codeLines.join("\n")}</code></pre>
          </div>,
        );
      }
      continue;
    }

    if (isMarkdownTableRow(line) && index + 1 < lines.length && isMarkdownTableSeparator(lines[index + 1])) {
      const header = parseMarkdownTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        rows.push(parseMarkdownTableRow(lines[index]));
        index += 1;
      }

      const columnCount = Math.max(header.length, ...rows.map((row) => row.length));
      const columns = Array.from({ length: columnCount });

      rendered.push(
        <div className="blui-table-scroll" key={`table-${index}`}>
          <table className="blui-table">
            <thead>
              <tr>{columns.map((_, cellIndex) => <th key={`header-${cellIndex}`}>{renderInlineMarkdown(header[cellIndex] || "")}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {columns.map((_, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>
                      {renderInlineMarkdown(row[cellIndex] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      index -= 1;
      continue;
    }

    if (!trimmed) {
      rendered.push(<div className="blui-analysis-spacer" key={`spacer-${index}`} />);
      continue;
    }

    const heading = trimmed.match(/^(?:#{1,3}\s*)?\*\*(.+?)\*\*:?\s*$/)
      || trimmed.match(/^#{1,3}\s+(.+?)\s*$/);
    if (heading) {
      rendered.push(<h3 key={`heading-${index}`}>{heading[1]}</h3>);
      continue;
    }

    const numbered = trimmed.match(/^(\d+)\.\s+(?:\*\*(.+?)\*\*)\s*[-—:]?\s*(.*)$/)
      || trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      const label = numbered[2];
      const detail = numbered[3] || "";
      rendered.push(
        <div className="blui-analysis-item" key={`number-${index}`}>
          <span className="blui-analysis-number">{numbered[1]}.</span>
          <span>{numbered[3] ? <><strong>{label}</strong> — {renderInlineMarkdown(detail)}</> : renderInlineMarkdown(label)}</span>
        </div>,
      );
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*•])\s+(?:\*\*(.+?)\*\*:?\s*(.*)|(.+))$/);
    if (bullet) {
      const label = bullet[1];
      const detail = bullet[2];
      rendered.push(
        <div className="blui-analysis-item" key={`bullet-${index}`}>
          <span className="blui-analysis-bullet" aria-hidden="true">•</span>
          <span>{label ? <><strong>{label}</strong>{detail && <>: {renderInlineMarkdown(detail)}</>}</> : renderInlineMarkdown(bullet[3])}</span>
        </div>,
      );
      continue;
    }

    rendered.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(trimmed)}</p>);
  }

  return rendered;
}

async function readResponse(response, fallback) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || fallback);
  return data;
}

export default function StudentAiSummary() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/learning-insights`, { headers: authHeaders() })
        .then((response) => readResponse(response, "Unable to load your learning progress.")),
      fetch(`${API_URL}/api/learning-insights/chat`, { headers: authHeaders() })
        .then((response) => readResponse(response, "Unable to load your chat history.")),
    ])
      .then(([progress, history]) => {
        setInsights(progress);
        setChatMessages(history.messages || []);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  async function generateSummary() {
    setError("");
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/learning-insights/generate`, {
        method: "POST",
        headers: authHeaders(),
      });
      setInsights(await readResponse(response, "Unable to generate your AI summary."));
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setGenerating(false);
    }
  }

  async function submitChatMessage(message, editIndex = null) {
    if (!message || chatting) return;

    const nextMessages = editIndex === null
      ? [...chatMessages, { role: "user", content: message }]
      : chatMessages.map((chatMessage, index) => (
        index === editIndex ? { role: "user", content: message } : chatMessage
      )).filter((chatMessage, index) => !(editIndex !== null && index > editIndex && chatMessage.role === "assistant"));
    setChatMessages(nextMessages);
    setChatInput("");
    setEditingMessageIndex(null);
    setError("");
    setChatting(true);
    try {
      const response = await fetch(`${API_URL}/api/learning-insights/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message }),
      });
      const data = await readResponse(response, "Unable to send your message.");
      setChatMessages([...nextMessages, { role: "assistant", content: data.message }]);
    } catch (chatError) {
      setChatMessages(nextMessages.map((chatMessage, index) => (
        index === (editIndex === null ? nextMessages.length - 1 : editIndex)
          ? { ...chatMessage, failed: true, error: chatError.message }
          : chatMessage
      )));
    } finally {
      setChatting(false);
    }
  }

  function sendChatMessage(event) {
    event.preventDefault();
    submitChatMessage(chatInput.trim(), editingMessageIndex);
  }

  function editChatMessage(index) {
    setChatInput(chatMessages[index].content);
    setEditingMessageIndex(index);
  }

  function regenerateChatMessage(index) {
    submitChatMessage(chatMessages[index].content, index);
  }

  async function clearChatHistory() {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/learning-insights/chat`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Unable to clear your chat memory.");
      setChatMessages([]);
    } catch (clearError) {
      setError(clearError.message);
    }
  }

  return (
    <StudentLayout title="Blui AI summary">
      <main className="content student-ai-summary">
        <section className="blui-hero">
          <BluiMascot thinking={generating} />
          <div>
            <p className="blui-eyebrow">Your learning companion</p>
            <h1>Hi, I&apos;m Blui — your personal learning assistant</h1>
            <p>I look across your courses, quizzes, practical work, certificates, badges, and GitHub activity to help you understand your progress.</p>
            <button className="blui-generate-button" type="button" onClick={generateSummary} disabled={generating || loading}>
              <Sparkles size={17} aria-hidden="true" />
              {generating ? "Blui is thinking..." : "Generate summary"}
            </button>
          </div>
        </section>

        {loading && <p className="blui-status">Loading your progress...</p>}
        {error && <p className="blui-error" role="alert">{error}</p>}

        <section className="blui-chat-card" aria-labelledby="blui-chat-heading">
          <div className="blui-chat-heading">
            <BluiMascot small />
            <div>
              <h2 id="blui-chat-heading">Chat with Blui</h2>
              <p>Ask about your learning, or ask a general question.</p>
            </div>
            {chatMessages.length > 0 && (
              <button className="blui-clear-chat" type="button" onClick={clearChatHistory}>
                <Eraser size={14} aria-hidden="true" /> Clear memory
              </button>
            )}
          </div>
          <div className="blui-chat-messages" aria-live="polite">
            {chatMessages.length === 0 && (
              <div className="blui-chat-empty">
                <strong>Hi, I&apos;m Blui.</strong>
                <span>Try asking “What should I focus on next?” or “Explain REST APIs simply.”</span>
              </div>
            )}
            {chatMessages.map((chatMessage, index) => (
              <div className={`blui-chat-message ${chatMessage.role}`} key={`${chatMessage.role}-${index}`}>
              {chatMessage.role === "assistant" ? (
                <div className="blui-formatted-content">{renderAnalysis(chatMessage.content)}</div>
              ) : (
                <>
                  <p>{chatMessage.content}</p>
                  {chatMessage.failed && (
                    <div className="blui-chat-failure">
                      <span>{chatMessage.error || "Blui did not respond."}</span>
                      <button type="button" onClick={() => regenerateChatMessage(index)} disabled={chatting}>Regenerate</button>
                    </div>
                  )}
                  {!chatMessage.failed && !chatting && (
                    <button className="blui-edit-message" type="button" onClick={() => editChatMessage(index)}>Edit</button>
                  )}
                </>
              )}
              </div>
            ))}
            {chatting && (
              <div className="blui-chat-thinking">
                <BluiMascot small thinking />
                <span>Blui is thinking...</span>
              </div>
            )}
          </div>
          <form className="blui-chat-form" onSubmit={sendChatMessage}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask Blui something..."
              maxLength={2000}
              aria-label="Message Blui"
              disabled={chatting || loading}
            />
            <button type="submit" disabled={chatting || loading || !chatInput.trim()}>
              {chatting ? "Sending..." : editingMessageIndex !== null ? "Resend" : "Send"}
            </button>
          </form>
        </section>

        {insights?.analysis && (
          <section className="blui-analysis-card" aria-labelledby="blui-analysis-heading">
            <div className="blui-analysis-title">
              <BluiMascot small />
              <div><h2 id="blui-analysis-heading">Blui's learning summary</h2><p>Generated on request from your latest progress.</p></div>
            </div>
            <div className="blui-analysis-content">{renderAnalysis(insights.analysis)}</div>
          </section>
        )}
      </main>
    </StudentLayout>
  );
}
