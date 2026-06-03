"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// ── Types ──────────────────────────────────────────────────────────
type DetTipo = "LIMPO" | "FUMACA" | "FOGO";

const DET_CFG = {
  LIMPO:  { label: "SEM DETECÇÃO", cor: "#22C55E" },
  FUMACA: { label: "FUMAÇA",       cor: "#F59E0B" },
  FOGO:   { label: "FOGO",         cor: "#DC2626" },
} as const;

interface LogItem { hora: string; tipo: Exclude<DetTipo, "LIMPO">; conf: number }

const LOG_DEMO: LogItem[] = [
  { hora: "14:22", tipo: "FOGO",   conf: 94 },
  { hora: "14:18", tipo: "FUMACA", conf: 78 },
  { hora: "14:05", tipo: "FUMACA", conf: 62 },
];

// ── Bounding box corner ────────────────────────────────────────────
function Corner({ pos, cor }: { pos: "TL" | "TR" | "BL" | "BR"; cor: string }) {
  const isT = pos[0] === "T";
  const isL = pos[1] === "L";
  return (
    <div style={{
      position: "absolute", width: 14, height: 14,
      top:    isT ? -1 : undefined, bottom: isT ? undefined : -1,
      left:   isL ? -1 : undefined, right:  isL ? undefined  : -1,
      borderTop:    isT ? `2px solid ${cor}` : "none",
      borderBottom: isT ? "none" : `2px solid ${cor}`,
      borderLeft:   isL ? `2px solid ${cor}` : "none",
      borderRight:  isL ? "none" : `2px solid ${cor}`,
    }} />
  );
}

// ── CameraView ─────────────────────────────────────────────────────
export default function CameraView() {
  const [ativa,     setAtiva]     = useState(false);
  const [deteccao,  setDeteccao]  = useState<DetTipo>("FUMACA");
  const [confianca, setConfianca] = useState(78);
  const [log]                     = useState<LogItem[]>(LOG_DEMO);
  const { resolvedTheme }         = useTheme();
  const isLight                   = resolvedTheme === "light";

  useEffect(() => {
    if (!ativa) return;
    const id = setInterval(() => {
      setConfianca(p => Math.min(99, Math.max(55, p + (Math.random() - 0.5) * 6)));
    }, 600);
    return () => clearInterval(id);
  }, [ativa]);

  const cfg = DET_CFG[deteccao];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>

      {/* ── Placeholder (inativo) ── */}
      {!ativa && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
          background: isLight
            ? `repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 40px),
               repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 40px),
               var(--bg-base)`
            : `repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px),
               repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px),
               #060b16`,
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.10)" }}>
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>

          <div style={{ textAlign: "center", fontFamily: "var(--font-display)" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.18)" }}>
              CÂMERA INATIVA
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: isLight ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.10)" }}>
              Aguardando permissão de câmera
            </p>
          </div>

          <button
            onClick={() => setAtiva(true)}
            style={{
              marginTop: 4, padding: "10px 26px",
              background: "#EF4444", border: "none", borderRadius: 8,
              color: "#fff", fontFamily: "var(--font-display)",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.35)",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            ▶ INICIAR CÂMERA
          </button>
        </div>
      )}

      {/* ── Feed ativo ── */}
      {ativa && (
        <>
          {/* Background simulado */}
          <div style={{
            position: "absolute", inset: 0,
            background: isLight
              ? "linear-gradient(160deg, #e4eaf4 0%, #eceef8 60%, #e4ede8 100%)"
              : "linear-gradient(160deg, #080d18 0%, #0a0a12 60%, #070e08 100%)",
          }}>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: isLight
                ? "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)"
                : "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 4px)",
            }} />
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: isLight
                ? "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.06) 100%)"
                : "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
            }} />
          </div>

          {/* Bounding box */}
          {deteccao !== "LIMPO" && (
            <div style={{ position: "absolute", top: "28%", left: "30%", width: "32%", height: "40%" }}>
              <div style={{ position: "absolute", inset: 0, background: `${cfg.cor}09` }} />
              <div style={{
                position: "absolute", top: -22, left: 0,
                background: cfg.cor, color: "#fff",
                fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: "3px 3px 0 0",
                letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>
                {cfg.label} · {confianca.toFixed(0)}%
              </div>
              <Corner pos="TL" cor={cfg.cor} />
              <Corner pos="TR" cor={cfg.cor} />
              <Corner pos="BL" cor={cfg.cor} />
              <Corner pos="BR" cor={cfg.cor} />
            </div>
          )}

          {/* HUD — barra superior */}
          <div style={{
            position: "absolute", top: 14, left: 14, right: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
              border: "1px solid var(--border)", borderRadius: 6,
              padding: "5px 11px",
              fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
              color: "#EF4444", letterSpacing: "0.12em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "piscar 1.2s ease-in-out infinite" }} />
              AO VIVO
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
              border: "1px solid var(--border)", borderRadius: 6,
              padding: "5px 11px",
              fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-display)",
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22C55E" }} />
              pyros-v1 · Roboflow
            </div>
          </div>

          {/* HUD — painel direito flutuante */}
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "var(--map-badge-bg)", backdropFilter: "blur(16px)",
            border: `1px solid ${cfg.cor}30`,
            borderRadius: 12, padding: "16px 14px", width: 148,
            display: "flex", flexDirection: "column", gap: 14,
            pointerEvents: "none",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
                letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8,
              }}>
                DETECÇÃO
              </div>
              <div style={{
                fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 700,
                color: cfg.cor, lineHeight: 1,
              }}>
                {cfg.label}
              </div>
            </div>

            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 9, fontFamily: "var(--font-display)", marginBottom: 5,
              }}>
                <span style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>CONFIANÇA</span>
                <span style={{ color: cfg.cor, fontWeight: 700 }}>{confianca.toFixed(0)}%</span>
              </div>
              <div style={{ height: 2, borderRadius: 1, background: "var(--bg-elevated)" }}>
                <div style={{
                  height: "100%", borderRadius: 1, width: `${confianca}%`,
                  background: cfg.cor, boxShadow: `0 0 6px ${cfg.cor}80`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            <div>
              <div style={{
                fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
                letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 7,
              }}>
                LOG
              </div>
              {log.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? 5 : 0 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: "var(--font-display)",
                    color: item.tipo === "FOGO" ? "#DC2626" : "#F59E0B",
                    letterSpacing: "0.05em",
                  }}>
                    {item.tipo === "FOGO" ? "FOGO" : "FUMAÇA"} {item.conf}%
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {item.hora}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HUD — barra inferior */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "52px 18px 16px",
            background: isLight
              ? "linear-gradient(to top, rgba(228,234,244,0.92) 0%, transparent 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 5,
              background: `${cfg.cor}1A`, border: `1px solid ${cfg.cor}38`,
              fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
              color: cfg.cor, letterSpacing: "0.08em",
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.cor }} />
              {cfg.label}
            </div>

            <button
              onClick={() => { setAtiva(false); setConfianca(78); }}
              style={{
                padding: "5px 14px",
                background: "var(--bg-elevated)", backdropFilter: "blur(8px)",
                border: "1px solid var(--border)", borderRadius: 6,
                color: "var(--text-muted)", fontFamily: "var(--font-display)",
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = "var(--text-primary)"); }}
              onMouseLeave={e => { (e.currentTarget.style.color = "var(--text-muted)"); }}
            >
              ■ PARAR
            </button>
          </div>
        </>
      )}
    </div>
  );
}
