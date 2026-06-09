"use client";

import { useEffect, useState } from "react";
import type { BaseDrone } from "@/components/BasesDronesMapa";

const COR_CLUSTER: Record<string, string> = {
  "Alto Risco — Histórico Intenso":  "#EF4444",
  "Moderado — Zona de Transição":    "#F59E0B",
  "Estável — Baixo Histórico":       "#3B82F6",
  "Baixo Risco — Úmido":             "#22C55E",
};

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

interface Props {
  base:    BaseDrone | null;
  onClose: () => void;
}

export default function BaseDetalhes({ base, onClose }: Props) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (base) {
      const t = setTimeout(() => setVisivel(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisivel(false);
    }
  }, [base]);

  if (!base) return null;

  const cor        = COR_CLUSTER[base.cluster] ?? "#3B82F6";
  const riscoBarra = (base.risco_medio / 100) * 100;

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
        background: "#3B82F60D",
        position: "sticky", top: 0, zIndex: 1,
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>🚁</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "#3B82F6", textTransform: "uppercase",
          }}>
            Base de Drone
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

        {/* Nome + badge de prioridade */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h2 style={{
              margin: 0, lineHeight: 1.15,
              fontFamily: "var(--font-display)",
              fontSize: 22, fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              {base.nome}
            </h2>
            <span style={{
              flexShrink: 0,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#3B82F6",
              background: "#3B82F618",
              border: "1px solid #3B82F644",
              padding: "3px 10px", borderRadius: 20,
            }}>
              PRIORIDADE {base.prioridade}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {base.mesorregiao}
          </p>
        </div>

        {/* Barra de risco médio do cluster */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-muted)", textTransform: "uppercase",
          }}>
            Risco Médio do Cluster
          </p>
          <div style={{ height: 6, borderRadius: 3, background: "var(--bg-elevated)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${riscoBarra}%`,
              background: cor,
              boxShadow: `0 0 8px ${cor}88`,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>

        {/* Métricas principais */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <MetricCard
            value={String(base.municipios)}
            unit="municípios"
            label="Zona coberta"
          />
          <MetricCard
            value={String(base.risco_medio)}
            unit="/ 100"
            label="Índice médio"
          />
        </div>

        {/* Perfil do cluster */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12, padding: "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Perfil do cluster</span>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 11, fontWeight: 700,
              color: cor,
            }}>
              {base.cluster}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--bg-base)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${riscoBarra}%`,
              background: cor,
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
          <Row label="Mesorregião"   value={base.mesorregiao} />
          <Row label="Coordenadas"   value={`${Math.abs(base.lat).toFixed(4)}°S, ${Math.abs(base.lon).toFixed(4)}°O`} />
          <Row label="Código IBGE"   value={base.codigo_ibge} />
          <Row label="Análise"       value="Space Risk IA — K-Means" />
        </div>

        {/* CTA */}
        <button
          onClick={() => alert(`Base ${base.nome} selecionada como ponto de operação`)}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 10, border: "none",
            background: "#3B82F6",
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
          ✦ DEFINIR COMO BASE ATIVA
        </button>

      </div>
    </div>
  );
}
