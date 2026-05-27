// src/shared/ui/ErrorBoundary.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Two exports:
//   1. <ErrorBoundary>   — class component that catches render/lifecycle errors
//   2. <DevErrorPanel>   — global panel that catches unhandled JS + promise errors
//
// USAGE in App.tsx:
//   import { ErrorBoundary, DevErrorPanel } from "../shared/ui/ErrorBoundary";
//
//   // Wrap any subtree you want isolated:
//   <ErrorBoundary label="CreateNotePage">
//     <CreateNotePage ... />
//   </ErrorBoundary>
//
//   // Mount once near the root for global JS errors:
//   <DevErrorPanel />
//
// In production builds (import.meta.env.PROD === true) DevErrorPanel renders
// nothing, so there is zero overhead in shipped builds.
// ─────────────────────────────────────────────────────────────────────────────

import React, { Component, ErrorInfo, useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapturedError {
  id: string;
  kind: "render" | "unhandled" | "promise";
  label: string;          // component name or source
  message: string;
  stack: string;
  timestamp: string;
  dismissed: boolean;
}

// ─── Tiny UUID ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

// ─── Timestamp ───────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ERROR BOUNDARY CLASS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Short label shown in the error card, e.g. "CreateNotePage" */
  label?: string;
  /** If provided, renders instead of the default fallback UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null, errorId: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error, errorId: uid() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });
    // Also surface in DevErrorPanel if it's mounted
    window.dispatchEvent(
      new CustomEvent("__dev_error__", {
        detail: {
          kind: "render",
          label: this.props.label ?? "Unknown Component",
          message: error.message,
          stack: info.componentStack ?? error.stack ?? "",
        },
      })
    );
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null, errorId: "" });
  };

  render() {
    const { error, errorId } = this.state;
    const { label = "Component", fallback, children } = this.props;

    if (!error) return children;
    if (fallback) return fallback;

    return (
      <div style={styles.boundaryWrap}>
        <div style={styles.boundaryCard}>
          {/* Header */}
          <div style={styles.boundaryHeader}>
            <span style={styles.boundaryIcon}>⚠</span>
            <div>
              <div style={styles.boundaryTitle}>Render Error — {label}</div>
              <div style={styles.boundaryCode}>ERR-{errorId}</div>
            </div>
            <button style={styles.resetBtn} onClick={this.handleReset}>
              ↺ Retry
            </button>
          </div>

          {/* Message */}
          <div style={styles.boundaryMsg}>{error.message}</div>

          {/* Stack accordion */}
          <details style={styles.details}>
            <summary style={styles.summary}>Stack trace</summary>
            <pre style={styles.stack}>
              {this.state.errorInfo?.componentStack ?? error.stack}
            </pre>
          </details>

          <div style={styles.boundaryHint}>
            Fix the error above and save the file — HMR will auto-reload.
          </div>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DEV ERROR PANEL — global floating banner stack
// ═══════════════════════════════════════════════════════════════════════════════

export function DevErrorPanel() {
  // No-op in production
  if (import.meta.env.PROD) return null;

  const [errors, setErrors] = useState<CapturedError[]>([]);
  const [minimized, setMinimized] = useState(false);

  const addError = useCallback((detail: Omit<CapturedError, "id" | "timestamp" | "dismissed">) => {
    setErrors(prev => {
      // Deduplicate by message (avoid flooding from repeated renders)
      if (prev.some(e => e.message === detail.message && !e.dismissed)) return prev;
      return [
        {
          ...detail,
          id: uid(),
          timestamp: now(),
          dismissed: false,
        },
        ...prev,
      ].slice(0, 8); // cap at 8
    });
    setMinimized(false);
  }, []);

  useEffect(() => {
    // ── Listen for errors emitted by ErrorBoundary ──
    const onDevError = (e: Event) => {
      addError((e as CustomEvent).detail);
    };

    // ── Unhandled JS errors (e.g. undefined is not a function) ──
    const onError = (e: ErrorEvent) => {
      addError({
        kind: "unhandled",
        label: e.filename ? e.filename.split("/").pop() ?? "script" : "window",
        message: e.message,
        stack: e.error?.stack ?? `${e.filename}:${e.lineno}:${e.colno}`,
      });
    };

    // ── Unhandled promise rejections ──
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      addError({
        kind: "promise",
        label: "Promise",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack ?? "" : "",
      });
    };

    window.addEventListener("__dev_error__", onDevError);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("__dev_error__", onDevError);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [addError]);

  const dismiss = (id: string) =>
    setErrors(prev => prev.map(e => e.id === id ? { ...e, dismissed: true } : e));

  const dismissAll = () =>
    setErrors(prev => prev.map(e => ({ ...e, dismissed: true })));

  const visible = errors.filter(e => !e.dismissed);

  if (visible.length === 0) return null;

  return (
    <div style={styles.panelWrap}>
      {/* Pill header */}
      <div style={styles.panelHeader}>
        <div style={styles.panelHeaderLeft}>
          <span style={styles.panelDot} />
          <span style={styles.panelTitle}>
            DEV · {visible.length} error{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={styles.pillBtn} onClick={() => setMinimized(m => !m)}>
            {minimized ? "▲ Show" : "▼ Hide"}
          </button>
          <button style={{ ...styles.pillBtn, color: "#f87171" }} onClick={dismissAll}>
            Clear all
          </button>
        </div>
      </div>

      {/* Error cards */}
      {!minimized && (
        <div style={styles.panelList}>
          {visible.map(err => (
            <ErrorCard key={err.id} err={err} onDismiss={() => dismiss(err.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Individual error card ────────────────────────────────────────────────────

function ErrorCard({ err, onDismiss }: { err: CapturedError; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const kindMeta: Record<CapturedError["kind"], { label: string; color: string; bg: string }> = {
    render:    { label: "RENDER",    color: "#fca5a5", bg: "rgba(239,68,68,0.12)"  },
    unhandled: { label: "JS ERROR",  color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
    promise:   { label: "PROMISE",   color: "#c084fc", bg: "rgba(168,85,247,0.12)" },
  };

  const meta = kindMeta[err.kind];

  return (
    <div style={{ ...styles.card, background: meta.bg }}>
      {/* Card header row */}
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <span style={{ ...styles.kindBadge, color: meta.color, borderColor: meta.color }}>
            {meta.label}
          </span>
          <span style={styles.cardLabel}>{err.label}</span>
          <span style={styles.cardTime}>{err.timestamp}</span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={styles.errCode}>ERR-{err.id}</span>
          <button style={styles.iconBtn} onClick={() => setExpanded(e => !e)} title="Toggle stack">
            {expanded ? "▲" : "▼"}
          </button>
          <button style={{ ...styles.iconBtn, color: "#f87171" }} onClick={onDismiss} title="Dismiss">
            ✕
          </button>
        </div>
      </div>

      {/* Message */}
      <div style={styles.cardMsg}>{err.message}</div>

      {/* Stack */}
      {expanded && err.stack && (
        <pre style={styles.cardStack}>{err.stack.trim()}</pre>
      )}

      {/* Copy button */}
      {expanded && (
        <button
          style={styles.copyBtn}
          onClick={() => navigator.clipboard.writeText(`ERR-${err.id}\n${err.message}\n\n${err.stack}`)}
        >
          Copy error
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  // ── ErrorBoundary fallback UI ──
  boundaryWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    padding: "1.5rem",
  },
  boundaryCard: {
    background: "#0f0f0f",
    border: "1px solid #ef4444",
    borderLeft: "4px solid #ef4444",
    borderRadius: "10px",
    padding: "1.25rem 1.5rem",
    maxWidth: "680px",
    width: "100%",
    fontFamily: "monospace",
  },
  boundaryHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginBottom: "0.85rem",
  },
  boundaryIcon: {
    fontSize: "1.4rem",
    color: "#ef4444",
    lineHeight: 1,
    flexShrink: 0,
  },
  boundaryTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#fca5a5",
    fontFamily: "monospace",
  },
  boundaryCode: {
    fontSize: "0.65rem",
    color: "#6b7280",
    marginTop: "2px",
    letterSpacing: "0.08em",
  },
  resetBtn: {
    marginLeft: "auto",
    background: "transparent",
    border: "1px solid #374151",
    color: "#9ca3af",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  boundaryMsg: {
    fontSize: "0.85rem",
    color: "#f9fafb",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "6px",
    padding: "0.6rem 0.85rem",
    marginBottom: "0.75rem",
    lineHeight: 1.5,
    wordBreak: "break-word",
    fontFamily: "monospace",
  },
  details: {
    marginBottom: "0.75rem",
  },
  summary: {
    fontSize: "0.72rem",
    color: "#6b7280",
    cursor: "pointer",
    letterSpacing: "0.04em",
    userSelect: "none",
  },
  stack: {
    fontSize: "0.68rem",
    color: "#9ca3af",
    background: "#050505",
    border: "1px solid #1f2937",
    borderRadius: "6px",
    padding: "0.75rem",
    marginTop: "0.4rem",
    overflowX: "auto",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  boundaryHint: {
    fontSize: "0.68rem",
    color: "#4b5563",
    fontStyle: "italic",
  },

  // ── DevErrorPanel ──
  panelWrap: {
    position: "fixed",
    bottom: "1.25rem",
    right: "1.25rem",
    width: "420px",
    maxWidth: "calc(100vw - 2rem)",
    zIndex: 9999,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0d0d0d",
    border: "1px solid #1f2937",
    borderRadius: "8px",
    padding: "6px 10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  panelHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  panelDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 6px #ef4444",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  panelTitle: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#f87171",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  pillBtn: {
    background: "transparent",
    border: "1px solid #1f2937",
    color: "#6b7280",
    borderRadius: "5px",
    padding: "2px 8px",
    fontSize: "0.65rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  panelList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    maxHeight: "60vh",
    overflowY: "auto",
  },

  // ── ErrorCard ──
  card: {
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px",
    padding: "0.75rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.4rem",
    gap: "6px",
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
  kindBadge: {
    fontSize: "0.58rem",
    fontWeight: 800,
    border: "1px solid",
    borderRadius: "4px",
    padding: "1px 6px",
    letterSpacing: "0.07em",
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: "0.72rem",
    color: "#e5e7eb",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardTime: {
    fontSize: "0.6rem",
    color: "#4b5563",
    flexShrink: 0,
  },
  errCode: {
    fontSize: "0.58rem",
    color: "#374151",
    letterSpacing: "0.06em",
    flexShrink: 0,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "0.7rem",
    padding: "2px 4px",
    fontFamily: "inherit",
    lineHeight: 1,
  },
  cardMsg: {
    fontSize: "0.75rem",
    color: "#f3f4f6",
    lineHeight: 1.5,
    wordBreak: "break-word",
    marginBottom: "0.3rem",
  },
  cardStack: {
    fontSize: "0.62rem",
    color: "#6b7280",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "5px",
    padding: "0.5rem",
    marginTop: "0.4rem",
    overflowX: "auto",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    maxHeight: "160px",
  },
  copyBtn: {
    marginTop: "0.4rem",
    background: "transparent",
    border: "1px solid #1f2937",
    color: "#6b7280",
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "0.62rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};