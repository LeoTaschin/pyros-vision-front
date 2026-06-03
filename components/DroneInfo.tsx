"use client";

import dynamic from "next/dynamic";
import type { Drone } from "@/lib/api";

const MiniMapaDrone = dynamic(() => import("@/components/MiniMapaDrone"), { ssr: false });

// ── Config ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  DISPONIVEL: { label: "DISPONÍVEL", cor: "#22C55E" },
  EM_MISSAO:  { label: "EM MISSÃO",  cor: "#F59E0B" },
  MANUTENCAO: { label: "MANUTENÇÃO", cor: "#DC2626" },
} as const;

// ── Sub-components ─────────────────────────────────────────────────
function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0",
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
    </div>
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
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
          Nenhum drone selecionado
        </p>
        <p style={{ fontSize: 12, margin: "5px 0 0", lineHeight: 1.6 }}>
          Clique em um drone da lista para ver<br />a localização e os detalhes
        </p>
      </div>
    </div>
  );
}

// ── DroneInfo ──────────────────────────────────────────────────────
interface Props {
  drone:   Drone | null;
  onClose: () => void;
}

export default function DroneInfo({ drone, onClose }: Props) {
  if (!drone) return <EmptyState />;

  const cfg      = STATUS_CFG[drone.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.DISPONIVEL;
  const emMissao = drone.status === "EM_MISSAO" && drone.missao_lat != null;
  const batCor   = drone.bateria > 50 ? "#22C55E" : drone.bateria > 20 ? "#F59E0B" : "#DC2626";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Mapa fixo ── */}
      <div style={{ height: 200, flexShrink: 0, position: "relative" }}>
        <MiniMapaDrone drone={drone} />

        {/* Badge status — canto inferior esquerdo */}
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

        {/* Coords base — canto inferior direito */}
        <div style={{
          position: "absolute", bottom: 10, right: 10, zIndex: 1,
          background: "var(--map-badge-coords)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          borderRadius: 5, padding: "3px 7px",
          fontSize: 10, color: "var(--map-badge-color)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {Math.abs(drone.lat_base).toFixed(4)}°S &nbsp; {Math.abs(drone.lon_base).toFixed(4)}°O
        </div>
      </div>

      {/* ── Detalhes scrolláveis ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Cabeçalho */}
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
              {drone.nome}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              Base: {drone.base}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 15,
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

          {/* ── Métricas planas: Status | Bateria ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 0",
          }}>
            <div style={{ padding: "0 12px", textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 16, fontWeight: 700, lineHeight: 1,
                color: cfg.cor, letterSpacing: "0.02em",
              }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Status</div>
            </div>
            <div style={{ background: "var(--border)", width: 1, margin: "4px 0" }} />
            <div style={{ padding: "0 12px", textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 19, fontWeight: 700, lineHeight: 1,
                color: batCor,
              }}>
                {drone.bateria}
                <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2, color: "var(--text-muted)" }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Bateria</div>
            </div>
          </div>

          {/* Barra de bateria */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>Carga</span>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--bg-elevated)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${drone.bateria}%`, background: batCor,
                boxShadow: `0 0 6px ${batCor}55`,
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              color: batCor, flexShrink: 0, minWidth: 32, textAlign: "right",
            }}>
              {drone.bateria}%
            </span>
          </div>

          {/* Banner de missão */}
          {emMissao && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#F59E0B",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />
              <span>
                <strong style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Em missão</strong>
                {drone.missao_alvo ? ` · ${drone.missao_alvo}` : ""}
              </span>
            </div>
          )}

          {/* Tabela de dados */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Row label="ID do drone" value={drone.id} />
            <Row label="Base"        value={drone.base} />
            {emMissao && drone.missao_alvo && (
              <Row label="Alvo da missão" value={drone.missao_alvo} />
            )}
            {emMissao && drone.missao_lat != null && drone.missao_lon != null && (
              <Row
                label="Coords. do alvo"
                value={`${Math.abs(drone.missao_lat).toFixed(4)}°S, ${Math.abs(drone.missao_lon).toFixed(4)}°O`}
                last
              />
            )}
            {!emMissao && (
              <Row
                label="Coords. da base"
                value={`${Math.abs(drone.lat_base).toFixed(4)}°S, ${Math.abs(drone.lon_base).toFixed(4)}°O`}
                last
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
