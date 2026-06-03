"use client";

import { useState, useMemo } from "react";
import type { Foco, RespostaFocos } from "@/lib/api";

// ── Config ─────────────────────────────────────────────────────────
const NIVEL_CFG = {
  CRITICO:     { label: "CRÍTICO",     cor: "#DC2626", ordem: 0 },
  ALERTA:      { label: "ALERTA",      cor: "#F59E0B", ordem: 1 },
  MONITORANDO: { label: "MONITORANDO", cor: "#FACC15", ordem: 2 },
} as const;

type Filtro  = "TODOS" | "CRITICO" | "ALERTA" | "MONITORANDO";
type Ordenar = "nivel" | "brightness" | "frp" | "dist_km" | "data";

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
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2"  x2="12" y2="5"/>    <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="5" y2="12"/>    <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IconeLua() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function IconeRefresh() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

// ── FocoItem ───────────────────────────────────────────────────────
interface ItemProps {
  foco:        Foco;
  selecionado: boolean;
  onClick:     () => void;
}

function FocoItem({ foco, selecionado, onClick }: ItemProps) {
  const cfg   = NIVEL_CFG[foco.nivel as keyof typeof NIVEL_CFG] ?? NIVEL_CFG.MONITORANDO;
  const isDia = foco.daynight === "D";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding:      "13px 18px 13px 20px",
        background:   selecionado ? `${cfg.cor}0D` : "transparent",
        borderLeft:   `3px solid ${selecionado ? cfg.cor : "transparent"}`,
        borderRight:  "none", borderTop: "none",
        borderBottom: "1px solid var(--border)",
        outline:      "none",               /* remove browser focus ring azul */
        cursor:       "pointer",
        transition:   "background 0.12s ease, border-color 0.12s ease",
        display:      "flex", flexDirection: "column", gap: 5,
      }}
      onMouseEnter={(e) => {
        if (!selecionado) {
          (e.currentTarget as HTMLElement).style.background      = "var(--bg-elevated)";
          (e.currentTarget as HTMLElement).style.borderLeftColor = `${cfg.cor}55`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selecionado) {
          (e.currentTarget as HTMLElement).style.background      = "transparent";
          (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent";
        }
      }}
    >
      {/* Linha 1: cidade + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 14, fontWeight: 600, lineHeight: 1,
          color: selecionado ? "var(--text-primary)" : "var(--text-secondary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {foco.cidade}
        </span>
        <span style={{
          flexShrink: 0,
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
          color: cfg.cor, fontFamily: "var(--font-display)",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.cor }} />
          {cfg.label}
        </span>
      </div>

      {/* Linha 2: data + métricas */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3, color: isDia ? "#F59E0B" : "var(--text-muted)" }}>
          {isDia ? <IconeSol /> : <IconeLua />}
        </span>
        <span>{formatarData(foco.data)} · {formatarHora(foco.hora)}</span>
        <span style={{ opacity: 0.25 }}>|</span>
        <span>{parseFloat(foco.frp).toFixed(1)} MW</span>
        <span style={{ opacity: 0.25 }}>·</span>
        <span>{foco.brightness.toFixed(0)} K</span>
        <span style={{ opacity: 0.25 }}>·</span>
        <span>{foco.dist_km} km</span>
      </div>
    </button>
  );
}

// ── FocoList ───────────────────────────────────────────────────────
interface Props {
  dados:           RespostaFocos;
  onFocoClick:     (foco: Foco) => void;
  focoSelecionado: Foco | null;
  onAtualizar:     () => void;
  ultima:          string;
}

export default function FocoList({ dados, onFocoClick, focoSelecionado, onAtualizar, ultima }: Props) {
  const [filtro,  setFiltro]  = useState<Filtro>("TODOS");
  const [ordenar, setOrdenar] = useState<Ordenar>("nivel");
  const [busca,   setBusca]   = useState("");

  const focosFiltrados = useMemo(() => {
    let lista = [...dados.focos];
    if (filtro !== "TODOS") lista = lista.filter((f) => f.nivel === filtro);
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter((f) => f.cidade.toLowerCase().includes(q));
    }
    lista.sort((a, b) => {
      switch (ordenar) {
        case "nivel":
          return (NIVEL_CFG[a.nivel as keyof typeof NIVEL_CFG]?.ordem ?? 9)
               - (NIVEL_CFG[b.nivel as keyof typeof NIVEL_CFG]?.ordem ?? 9);
        case "brightness": return b.brightness - a.brightness;
        case "frp":        return parseFloat(b.frp) - parseFloat(a.frp);
        case "dist_km":    return a.dist_km - b.dist_km;
        case "data":       return `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`);
      }
    });
    return lista;
  }, [dados.focos, filtro, ordenar, busca]);

  const nivelGeralCor = dados.nivel_geral === "CRITICO" ? "#DC2626"
    : dados.nivel_geral === "ALERTA" ? "#F59E0B" : "#22C55E";

  const FILTROS: { id: Filtro; label: string; cor?: string }[] = [
    { id: "TODOS",       label: "Todos" },
    { id: "CRITICO",     label: "Crítico",     cor: "#DC2626" },
    { id: "ALERTA",      label: "Alerta",      cor: "#F59E0B" },
    { id: "MONITORANDO", label: "Monitorando", cor: "#FACC15" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Controls ── */}
      <div style={{ flexShrink: 0, padding: "12px 18px 10px", borderBottom: "1px solid var(--border)" }}>

        {/* Stats + atualizar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 11 }}>
          <span style={{ color: "var(--text-muted)" }}>
            <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}>
              {dados.total}
            </strong> focos
          </span>
          {dados.criticos > 0 && (
            <span style={{ color: "#DC2626" }}>
              · <strong style={{ fontFamily: "var(--font-display)" }}>{dados.criticos}</strong> crítico{dados.criticos !== 1 ? "s" : ""}
            </span>
          )}
          {dados.alertas > 0 && (
            <span style={{ color: "#F59E0B" }}>
              · <strong style={{ fontFamily: "var(--font-display)" }}>{dados.alertas}</strong> alerta{dados.alertas !== 1 ? "s" : ""}
            </span>
          )}

          {/* Nível geral */}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: nivelGeralCor, boxShadow: `0 0 5px ${nivelGeralCor}`,
            }} />
            <span style={{ color: nivelGeralCor, fontWeight: 600, fontSize: 10, letterSpacing: "0.06em" }}>
              {dados.nivel_geral}
            </span>
          </span>

          {/* Atualizar */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {ultima && (
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{ultima}</span>
            )}
            <button
              onClick={onAtualizar}
              style={{
                height: 24, padding: "0 8px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 5,
                color: "var(--text-muted)",
                fontSize: 11, fontWeight: 600, fontFamily: "var(--font-display)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                outline: "none",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#EF4444";
                (e.currentTarget as HTMLElement).style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              <IconeRefresh /> Atualizar
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", pointerEvents: "none",
            }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: "100%", height: 32,
              paddingLeft: 32, paddingRight: 12,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              color: "var(--text-primary)",
              fontSize: 12, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filters + sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {FILTROS.map(({ id, label, cor }) => {
            const ativo = filtro === id;
            return (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                style={{
                  height: 26, padding: "0 9px", borderRadius: 6,
                  border:     ativo ? `1px solid ${cor ?? "rgba(248,250,252,.2)"}` : "1px solid var(--border)",
                  background: ativo ? (cor ? `${cor}14` : "var(--bg-elevated)") : "transparent",
                  color:      ativo ? (cor ?? "var(--text-primary)") : "var(--text-muted)",
                  fontSize: 11, fontWeight: 600, fontFamily: "var(--font-display)",
                  cursor: "pointer", outline: "none", transition: "all 0.12s ease",
                  display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                }}
              >
                {cor && (
                  <span style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: ativo ? cor : "var(--text-muted)",
                  }} />
                )}
                {label}
              </button>
            );
          })}
          <select
            value={ordenar}
            onChange={(e) => setOrdenar(e.target.value as Ordenar)}
            style={{
              height: 26, padding: "0 8px", marginLeft: "auto",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--text-muted)",
              fontSize: 11, cursor: "pointer", outline: "none",
            }}
          >
            <option value="nivel">Nível</option>
            <option value="brightness">Temperatura</option>
            <option value="frp">FRP</option>
            <option value="dist_km">Distância</option>
            <option value="data">Data</option>
          </select>
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {focosFiltrados.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            Nenhum foco encontrado.
          </div>
        ) : (
          focosFiltrados.map((foco, i) => (
            <FocoItem
              key={`${foco.lat}-${foco.lon}-${i}`}
              foco={foco}
              selecionado={focoSelecionado?.lat === foco.lat && focoSelecionado?.lon === foco.lon}
              onClick={() => onFocoClick(foco)}
            />
          ))
        )}
      </div>

      {/* ── Rodapé ── */}
      <div style={{
        flexShrink: 0, padding: "7px 18px",
        borderTop: "1px solid var(--border)",
        fontSize: 10, color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {focosFiltrados.length} de {dados.total} foco{dados.total !== 1 ? "s" : ""}
        {filtro !== "TODOS" && ` · ${filtro.toLowerCase()}`}
      </div>
    </div>
  );
}
