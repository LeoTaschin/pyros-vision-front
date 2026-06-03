"use client";

import dynamic from "next/dynamic";
import type { Foco } from "@/lib/api";

const MiniMapa = dynamic(() => import("@/components/MiniMapa"), { ssr: false });

// ── Config ─────────────────────────────────────────────────────────
const NIVEL_CFG = {
  CRITICO:     { label: "CRÍTICO",     cor: "#DC2626", barra: 100 },
  ALERTA:      { label: "ALERTA",      cor: "#F59E0B", barra: 66  },
  MONITORANDO: { label: "MONITORANDO", cor: "#FACC15", barra: 33  },
} as const;

// ── Helpers ────────────────────────────────────────────────────────
function formatarData(data: string) {
  const [, mes, dia] = data.split("-");
  const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${dia} ${MESES[parseInt(mes) - 1] ?? mes}`;
}

function formatarHora(hora: string) {
  const raw = hora.replace(/h$/, "").padStart(4, "0");
  return `${raw.slice(0, 2)}:${raw.slice(2)}`;
}

// ── Icons ──────────────────────────────────────────────────────────
function IconeSol() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>    <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="5" y2="12"/>    <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IconeLua() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ── Empty state ────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      flex: 1,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px", gap: 14, textAlign: "center",
      color: "var(--text-muted)",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
          <path d="M12 2c0 0-5 6-5 11a5 5 0 0 0 10 0c0-5-5-11-5-11z"/>
          <path d="M12 12c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z"/>
        </svg>
      </div>
      <div>
        <p style={{
          fontSize: 13, fontWeight: 600, margin: 0,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-display)",
        }}>
          Nenhum foco selecionado
        </p>
        <p style={{ fontSize: 12, margin: "5px 0 0", lineHeight: 1.6 }}>
          Clique em um item da lista para ver<br />a localização e todos os detalhes
        </p>
      </div>
    </div>
  );
}

// ── FocoInfo ───────────────────────────────────────────────────────
interface Props {
  foco:    Foco | null;
  onClose: () => void;
}

export default function FocoInfo({ foco, onClose }: Props) {
  if (!foco) return <EmptyState />;

  const cfg       = NIVEL_CFG[foco.nivel as keyof typeof NIVEL_CFG] ?? NIVEL_CFG.MONITORANDO;
  const confianca = parseFloat(foco.confidence) || 0;
  const confCor   = confianca >= 80 ? "#22C55E" : confianca >= 50 ? "#F59E0B" : "#DC2626";
  const isDia     = foco.daynight === "D";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Mapa fixo ── */}
      <div style={{ height: 200, flexShrink: 0, position: "relative" }}>
        <MiniMapa lat={foco.lat} lon={foco.lon} nivel={foco.nivel} />

        {/* Badge nível — canto inferior esquerdo */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 1,
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "var(--map-badge-bg)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${cfg.cor}44`,
          borderRadius: 6, padding: "4px 9px",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          color: cfg.cor, fontFamily: "var(--font-display)",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.cor }} />
          {cfg.label}
        </div>

        {/* Coordenadas — canto inferior direito */}
        <div style={{
          position: "absolute", bottom: 10, right: 10, zIndex: 1,
          background: "var(--map-badge-bg)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          borderRadius: 5, padding: "3px 7px",
          fontSize: 10, color: "rgba(29, 29, 29, 0.55)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {Math.abs(foco.lat).toFixed(4)}°S &nbsp; {Math.abs(foco.lon).toFixed(4)}°O
        </div>
      </div>

      {/* ── Detalhes scrolláveis ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Cidade + data + fechar */}
        <div style={{
          padding: "16px 20px 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <h2 style={{
              margin: 0, fontFamily: "var(--font-display)",
              fontSize: 19, fontWeight: 700, lineHeight: 1.2,
              color: "var(--text-primary)",
            }}>
              {foco.cidade}
            </h2>
            <p style={{
              margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ color: isDia ? "#F59E0B" : "var(--text-muted)", display: "flex" }}>
                {isDia ? <IconeSol /> : <IconeLua />}
              </span>
              {formatarData(foco.data)} · {formatarHora(foco.hora)} · {isDia ? "Dia" : "Noite"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 15, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              outline: "none", transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "14px 20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Nível de risco */}
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                color: "var(--text-muted)", textTransform: "uppercase",
                fontFamily: "var(--font-display)",
              }}>
                Nível de Risco
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: cfg.cor, letterSpacing: "0.06em" }}>
                {cfg.label}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--bg-elevated)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, width: `${cfg.barra}%`,
                background: cfg.cor, boxShadow: `0 0 8px ${cfg.cor}55`,
              }} />
            </div>
          </div>

          {/* ── Métricas planas: linha com divisores ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 0",
          }}>
            {([
              { valor: parseFloat(foco.frp).toFixed(1), unidade: "MW", label: "FRP"        },
              null,
              { valor: foco.brightness.toFixed(0),       unidade: "K",  label: "Brilho"     },
              null,
              { valor: String(foco.dist_km),              unidade: "km", label: "Distância"  },
            ] as ({ valor: string; unidade: string; label: string } | null)[]).map((item, i) =>
              item === null ? (
                <div key={i} style={{ background: "var(--border)", width: 1, margin: "4px 0" }} />
              ) : (
                <div key={i} style={{ padding: "0 10px", textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 19, fontWeight: 700, lineHeight: 1,
                    color: "var(--text-primary)",
                  }}>
                    {item.valor}
                    <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2, color: "var(--text-muted)" }}>
                      {item.unidade}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{item.label}</div>
                </div>
              )
            )}
          </div>

          {/* Confiança — inline */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>Confiança</span>
            <div style={{
              flex: 1, height: 3, borderRadius: 2,
              background: "var(--bg-elevated)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${confianca}%`, background: confCor,
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              color: confCor, flexShrink: 0, minWidth: 32, textAlign: "right",
            }}>
              {foco.confidence}%
            </span>
          </div>

          {/* Dados secundários — tabela plana */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Satélite",    value: foco.satelite },
              { label: "Período",     value: isDia ? "Dia" : "Noite" },
              { label: "Coordenadas", value: `${Math.abs(foco.lat).toFixed(4)}°S, ${Math.abs(foco.lon).toFixed(4)}°O` },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => alert(`Drone despachado para ${foco.cidade}`)}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 10, border: "none",
              background: "#EF4444", color: "#fff",
              fontFamily: "var(--font-display)",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            ✦ ENVIAR DRONE
          </button>

        </div>
      </div>
    </div>
  );
}
