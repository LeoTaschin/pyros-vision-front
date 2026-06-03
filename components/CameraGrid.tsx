"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// ── Config ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  NORMAL:  { label: "NORMAL",  cor: "#22C55E", det: null         as null },
  ALERTA:  { label: "ALERTA",  cor: "#F59E0B", det: "FUMACA"     as "FUMACA" },
  CRITICO: { label: "CRÍTICO", cor: "#DC2626", det: "FOGO"       as "FOGO"   },
  OFFLINE: { label: "OFFLINE", cor: "#64748B", det: null         as null },
} as const;

type CamStatus = keyof typeof STATUS_CFG;

const DET_CFG = {
  FUMACA: { label: "FUMAÇA", cor: "#F59E0B" },
  FOGO:   { label: "FOGO",   cor: "#DC2626" },
} as const;

// ── Data ───────────────────────────────────────────────────────────
interface Cam {
  id:              string;
  nome:            string;
  zona:            string;
  status:          CamStatus;
  ultimaDeteccao:  { tipo: "FUMACA" | "FOGO"; hora: string; conf: number } | null;
}

const CAMERAS: Cam[] = [
  { id: "cam1", nome: "Pasto Norte",  zona: "Zona A", status: "NORMAL",  ultimaDeteccao: null },
  { id: "cam2", nome: "Curral",       zona: "Zona B", status: "ALERTA",  ultimaDeteccao: { tipo: "FUMACA", hora: "14:18", conf: 78 } },
  { id: "cam3", nome: "Galpão",       zona: "Zona C", status: "CRITICO", ultimaDeteccao: { tipo: "FOGO",   hora: "14:22", conf: 94 } },
  { id: "cam4", nome: "Aceiro Leste", zona: "Zona D", status: "OFFLINE", ultimaDeteccao: null },
];

// ── Corner accent ──────────────────────────────────────────────────
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

// ── Camera tile ────────────────────────────────────────────────────
function CameraTile({ cam, onClick }: { cam: Cam; onClick: () => void }) {
  const cfg       = STATUS_CFG[cam.status];
  const isOffline = cam.status === "OFFLINE";
  const isCritico = cam.status === "CRITICO";
  const isAlerta  = cam.status === "ALERTA";
  const [tMounted, setTMounted]   = useState(false);
  const { resolvedTheme }         = useTheme();
  const isLight                   = tMounted && resolvedTheme === "light";

  useEffect(() => setTMounted(true), []);

  const borderBase = isCritico
    ? `${cfg.cor}60`
    : isAlerta
      ? `${cfg.cor}40`
      : "rgba(255,255,255,0.06)";

  return (
    <button
      onClick={isOffline ? undefined : onClick}
      style={{
        position: "relative", width: "100%", height: "100%",
        background: "#050810", padding: 0,
        border: `1px solid ${borderBase}`, borderRadius: 0,
        cursor: isOffline ? "default" : "pointer", outline: "none",
        overflow: "hidden",
        ...(isCritico ? { animation: "alertaPulse 2.5s ease-in-out infinite" } : {}),
      }}
      onMouseEnter={e => { if (!isOffline) (e.currentTarget as HTMLElement).style.borderColor = `${cfg.cor}80`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderBase; }}
    >
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        opacity: isOffline ? 0.3 : 1,
        background: `
          repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)
        `,
      }} />

      {/* CRITICO inner glow */}
      {isCritico && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 60%, rgba(220,38,38,0.10) 0%, transparent 70%)",
        }} />
      )}

      {/* Offline overlay */}
      {isOffline && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
              color: "rgba(255,255,255,0.14)", letterSpacing: "0.2em",
            }}>
              SEM SINAL
            </span>
          </div>
        </>
      )}

      {/* Top row: zona + badge */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "10px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)",
      }}>
        <span style={{
          fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
          color: "rgba(255,255,255,0.38)", letterSpacing: "0.15em",
        }}>
          {cam.zona.toUpperCase()}
        </span>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          border: `1px solid ${cfg.cor}50`, borderRadius: 4, padding: "2px 8px",
          fontSize: 9, fontWeight: 700, fontFamily: "var(--font-display)",
          color: cfg.cor, letterSpacing: "0.10em",
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.cor }} />
          {cfg.label}
        </div>
      </div>

      {/* Bottom row: nome + última detecção */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "28px 12px 12px",
        background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
        textAlign: "left",
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)",
          color: isOffline ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.88)",
          marginBottom: cam.ultimaDeteccao ? 3 : 0,
        }}>
          {cam.nome}
        </div>
        {cam.ultimaDeteccao ? (
          <div style={{
            fontSize: 10, fontWeight: 600, fontFamily: "var(--font-display)",
            color: cam.ultimaDeteccao.tipo === "FOGO" ? "#DC2626" : "#F59E0B",
          }}>
            {cam.ultimaDeteccao.tipo === "FOGO" ? "FOGO" : "FUMAÇA"} · {cam.ultimaDeteccao.hora} · {cam.ultimaDeteccao.conf}%
          </div>
        ) : (
          !isOffline && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-display)" }}>
              Sem ocorrências
            </div>
          )
        )}
      </div>
    </button>
  );
}

// ── Expanded camera view ───────────────────────────────────────────
function CameraExpandida({ cam, onVoltar }: { cam: Cam; onVoltar: () => void }) {
  const detTipo = STATUS_CFG[cam.status].det;
  const cfg     = detTipo ? DET_CFG[detTipo] : null;
  const conf    = cam.ultimaDeteccao?.conf ?? 0;

  const bgTint = cam.status === "CRITICO"
    ? "linear-gradient(160deg, #160404 0%, #0a0a12 100%)"
    : cam.status === "ALERTA"
      ? "linear-gradient(160deg, #141005 0%, #0a0a12 100%)"
      : "linear-gradient(160deg, #080d18 0%, #0a0a12 100%)";

  const statusCfg = STATUS_CFG[cam.status];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, background: bgTint }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 4px)",
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }} />
      </div>

      {/* Bounding box (se há detecção) */}
      {cfg && (
        <div style={{ position: "absolute", top: "28%", left: "30%", width: "32%", height: "40%" }}>
          <div style={{ position: "absolute", inset: 0, background: `${cfg.cor}09` }} />
          <div style={{
            position: "absolute", top: -22, left: 0,
            background: cfg.cor, color: "#fff",
            fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700,
            padding: "2px 8px", borderRadius: "3px 3px 0 0",
            letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            {cfg.label} · {conf}%
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
      }}>
        <button
          onClick={onVoltar}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
            border: "1px solid var(--border)", borderRadius: 6,
            padding: "5px 11px",
            fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
            color: "var(--text-muted)", letterSpacing: "0.08em", cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          ← VOLTAR
        </button>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
          border: "1px solid var(--border)", borderRadius: 6,
          padding: "5px 11px",
          fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
          color: "var(--text-secondary)", letterSpacing: "0.08em",
          pointerEvents: "none",
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: statusCfg.cor }} />
          {cam.nome.toUpperCase()} · {cam.zona.toUpperCase()}
        </div>
      </div>

      {/* HUD — painel direito (só se há detecção) */}
      {cfg && (
        <div style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          background: "rgba(5,8,18,0.82)", backdropFilter: "blur(16px)",
          border: `1px solid ${cfg.cor}28`,
          borderRadius: 12, padding: "16px 14px", width: 148,
          display: "flex", flexDirection: "column", gap: 14,
          pointerEvents: "none",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
              letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", marginBottom: 8,
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
              <span style={{ color: "rgba(255,255,255,0.30)", letterSpacing: "0.08em" }}>CONFIANÇA</span>
              <span style={{ color: cfg.cor, fontWeight: 700 }}>{conf}%</span>
            </div>
            <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                height: "100%", borderRadius: 1, width: `${conf}%`,
                background: cfg.cor, boxShadow: `0 0 6px ${cfg.cor}80`,
              }} />
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-display)" }}>
            <span style={{ letterSpacing: "0.08em", fontSize: 9 }}>ÚLTIMA DETECÇÃO</span>
            <div style={{ marginTop: 4, fontWeight: 700, color: cfg.cor }}>
              {cam.ultimaDeteccao?.hora ?? "--:--"}
            </div>
          </div>
        </div>
      )}

      {/* HUD — barra inferior */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "52px 18px 16px",
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        pointerEvents: "none",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 5,
          background: `${statusCfg.cor}1A`, border: `1px solid ${statusCfg.cor}38`,
          fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
          color: statusCfg.cor, letterSpacing: "0.08em",
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: statusCfg.cor }} />
          {statusCfg.label}
        </div>
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.20)",
          fontFamily: "var(--font-display)", letterSpacing: "0.05em",
        }}>
          CÂMERAS DA FAZENDA · PYROS VISION
        </div>
      </div>
    </div>
  );
}

// ── CameraGrid ─────────────────────────────────────────────────────
export default function CameraGrid() {
  const [expandida, setExpandida] = useState<Cam | null>(null);
  const [mounted,   setMounted]   = useState(false);
  const { resolvedTheme }         = useTheme();
  const isLight                   = mounted && resolvedTheme === "light";

  useEffect(() => setMounted(true), []);

  if (expandida) {
    return <CameraExpandida cam={expandida} onVoltar={() => setExpandida(null)} />;
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "var(--bg-base)" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        width: "100%", height: "100%",
        gap: 2,
        background: isLight ? "var(--border)" : "rgba(255,255,255,0.04)",
      }}>
        {CAMERAS.map(cam => (
          <CameraTile key={cam.id} cam={cam} onClick={() => setExpandida(cam)} />
        ))}
      </div>
    </div>
  );
}
