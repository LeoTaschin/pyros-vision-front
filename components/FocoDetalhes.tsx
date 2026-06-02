"use client";

import { useEffect, useState } from "react";
import type { Foco } from "@/lib/api";

const NIVEL: Record<string, { label: string; cor: string; barra: number }> = {
  CRITICO:     { label: "CRÍTICO",     cor: "#DC2626", barra: 100 },
  ALERTA:      { label: "ALERTA",      cor: "#F59E0B", barra: 66  },
  MONITORANDO: { label: "MONITORANDO", cor: "#FACC15", barra: 33  },
};

interface Props {
  foco:    Foco | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function MetricCard({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border:     "1px solid var(--border)",
      borderRadius: 12,
      padding:    "14px 16px",
    }}>
      <p style={{
        margin: 0, lineHeight: 1,
        fontFamily: "var(--font-display)",
        fontSize: 26, fontWeight: 700,
        color: "var(--text-primary)",
      }}>
        {value}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
        {unit} · {label}
      </p>
    </div>
  );
}

export default function FocoDetalhes({ foco, onClose }: Props) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (foco) {
      const t = setTimeout(() => setVisivel(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisivel(false);
    }
  }, [foco]);

  if (!foco) return null;

  const cfg        = NIVEL[foco.nivel] ?? NIVEL.MONITORANDO;
  const confianca  = parseFloat(foco.confidence) || 0;
  const confCor    = confianca >= 80 ? "#22C55E" : confianca >= 50 ? "#F59E0B" : "#DC2626";

  return (
    <div
      style={{
        position:   "fixed",
        top:        108,
        right:      20,
        width:      320,
        maxHeight:  "calc(100vh - 128px)",
        overflowY:  "auto",
        zIndex:     40,
        background: "var(--bg-surface)",
        border:     "1px solid var(--border)",
        borderRadius: 16,
        boxShadow:  "0 24px 48px rgba(0,0,0,0.4)",
        transform:  visivel ? "translateX(0)" : "translateX(calc(100% + 24px))",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        background: `${cfg.cor}0D`,
        position: "sticky", top: 0, zIndex: 1,
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>🔥</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: cfg.cor, textTransform: "uppercase",
          }}>
            Foco de Calor
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
            cursor: "pointer", fontSize: 16, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 24px" }}>

        {/* Cidade + badge + data */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h2 style={{
              margin: 0, lineHeight: 1.15,
              fontFamily: "var(--font-display)",
              fontSize: 22, fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              {foco.cidade}
            </h2>
            <span style={{
              flexShrink: 0,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: cfg.cor,
              background: `${cfg.cor}18`,
              border: `1px solid ${cfg.cor}44`,
              padding: "3px 10px", borderRadius: 20,
            }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {foco.data} · {foco.hora}h
          </p>
        </div>

        {/* Barra de nível de risco */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-muted)", textTransform: "uppercase",
          }}>
            Nível de Risco
          </p>
          <div style={{ height: 6, borderRadius: 3, background: "var(--bg-elevated)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${cfg.barra}%`,
              background: cfg.cor,
              boxShadow: `0 0 8px ${cfg.cor}88`,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>

        {/* Métricas principais */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <MetricCard
            value={parseFloat(foco.frp).toFixed(1)}
            unit="MW"
            label="Potência FRP"
          />
          <MetricCard
            value={foco.brightness.toFixed(0)}
            unit="K"
            label="Temperatura"
          />
        </div>

        {/* Confiança */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12, padding: "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Confiança da detecção</span>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 14, fontWeight: 700,
              color: confCor,
            }}>
              {foco.confidence}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--bg-base)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${confianca}%`,
              background: confCor,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>

        {/* Dados secundários */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 9,
          marginBottom: 20,
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}>
          <Row label="Distância"    value={`${foco.dist_km} km do centro`} />
          <Row label="Satélite"     value={foco.satelite} />
          <Row label="Período"      value={foco.daynight === "D" ? "☀️ Dia" : "🌙 Noite"} />
          <Row label="Coordenadas"  value={`${Math.abs(foco.lat).toFixed(2)}°S, ${Math.abs(foco.lon).toFixed(2)}°O`} />
        </div>

        {/* CTA */}
        <button
          onClick={() => alert(`Drone despachado para ${foco.cidade}`)}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 10, border: "none",
            background: "#EF4444",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          ✦ ENVIAR DRONE
        </button>

      </div>
    </div>
  );
}
