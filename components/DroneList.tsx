"use client";

import { useState, useMemo } from "react";
import type { Drone, RespostaDrones } from "@/lib/api";

// ── Config ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  DISPONIVEL: { label: "DISPONÍVEL", cor: "#22C55E", ordem: 0 },
  EM_MISSAO:  { label: "EM MISSÃO",  cor: "#F59E0B", ordem: 1 },
  MANUTENCAO: { label: "MANUTENÇÃO", cor: "#DC2626", ordem: 2 },
} as const;

type Filtro  = "TODOS" | "DISPONIVEL" | "EM_MISSAO" | "MANUTENCAO";
type Ordenar = "status" | "bateria_asc" | "bateria_desc" | "nome";

// ── Icons ──────────────────────────────────────────────────────────
function IconeRefresh() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

// ── Barra de bateria compacta ──────────────────────────────────────
function BateriaCompacta({ nivel }: { nivel: number }) {
  const cor = nivel > 50 ? "#22C55E" : nivel > 20 ? "#F59E0B" : "#DC2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 24, height: 3, borderRadius: 2, background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${nivel}%`, background: cor, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: cor, fontFamily: "var(--font-display)", fontWeight: 600 }}>
        {nivel}%
      </span>
    </div>
  );
}

// ── DroneItem ──────────────────────────────────────────────────────
interface ItemProps {
  drone:       Drone;
  selecionado: boolean;
  onClick:     () => void;
}

function DroneItem({ drone, selecionado, onClick }: ItemProps) {
  const cfg = STATUS_CFG[drone.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.DISPONIVEL;
  const emMissao = drone.status === "EM_MISSAO";

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
        outline:      "none",
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
      {/* Linha 1: nome + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 14, fontWeight: 600, lineHeight: 1,
          color: selecionado ? "var(--text-primary)" : "var(--text-secondary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {drone.nome}
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

      {/* Linha 2: base / missão + bateria */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, color: "var(--text-muted)",
      }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {emMissao && drone.missao_alvo
            ? `→ ${drone.missao_alvo}`
            : drone.base
          }
        </span>
        <BateriaCompacta nivel={drone.bateria} />
      </div>
    </button>
  );
}

// ── DroneList ──────────────────────────────────────────────────────
interface Props {
  dados:            RespostaDrones;
  onDroneClick:     (drone: Drone) => void;
  droneSelecionado: Drone | null;
  onAtualizar:      () => void;
  ultima:           string;
}

export default function DroneList({ dados, onDroneClick, droneSelecionado, onAtualizar, ultima }: Props) {
  const [filtro,  setFiltro]  = useState<Filtro>("TODOS");
  const [ordenar, setOrdenar] = useState<Ordenar>("status");
  const [busca,   setBusca]   = useState("");

  const dronesFiltrados = useMemo(() => {
    let lista = [...dados.drones];

    if (filtro !== "TODOS") lista = lista.filter((d) => d.status === filtro);

    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter((d) =>
        d.nome.toLowerCase().includes(q) || d.base.toLowerCase().includes(q)
      );
    }

    lista.sort((a, b) => {
      switch (ordenar) {
        case "status":
          return (STATUS_CFG[a.status as keyof typeof STATUS_CFG]?.ordem ?? 9)
               - (STATUS_CFG[b.status as keyof typeof STATUS_CFG]?.ordem ?? 9);
        case "bateria_asc":  return a.bateria - b.bateria;
        case "bateria_desc": return b.bateria - a.bateria;
        case "nome":         return a.nome.localeCompare(b.nome);
      }
    });

    return lista;
  }, [dados.drones, filtro, ordenar, busca]);

  const FILTROS: { id: Filtro; label: string; cor?: string }[] = [
    { id: "TODOS",      label: "Todos" },
    { id: "DISPONIVEL", label: "Disponível", cor: "#22C55E" },
    { id: "EM_MISSAO",  label: "Em Missão",  cor: "#F59E0B" },
    { id: "MANUTENCAO", label: "Manutenção", cor: "#DC2626" },
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
            </strong> drones
          </span>
          {dados.disponiveis > 0 && (
            <span style={{ color: "#22C55E" }}>
              · <strong style={{ fontFamily: "var(--font-display)" }}>{dados.disponiveis}</strong> disponíve{dados.disponiveis !== 1 ? "is" : "l"}
            </span>
          )}
          {dados.em_missao > 0 && (
            <span style={{ color: "#F59E0B" }}>
              · <strong style={{ fontFamily: "var(--font-display)" }}>{dados.em_missao}</strong> em missão
            </span>
          )}
          {dados.manutencao > 0 && (
            <span style={{ color: "#DC2626" }}>
              · <strong style={{ fontFamily: "var(--font-display)" }}>{dados.manutencao}</strong> em manutenção
            </span>
          )}

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
                cursor: "pointer", outline: "none",
                display: "flex", alignItems: "center", gap: 4,
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

        {/* Busca */}
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
            placeholder="Buscar drone ou base..."
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

        {/* Filtros + ordenar */}
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
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: ativo ? cor : "var(--text-muted)" }} />
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
            <option value="status">Status</option>
            <option value="bateria_asc">Bateria ↑</option>
            <option value="bateria_desc">Bateria ↓</option>
            <option value="nome">Nome</option>
          </select>
        </div>
      </div>

      {/* ── Lista ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {dronesFiltrados.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            Nenhum drone encontrado.
          </div>
        ) : (
          dronesFiltrados.map((drone) => (
            <DroneItem
              key={drone.id}
              drone={drone}
              selecionado={droneSelecionado?.id === drone.id}
              onClick={() => onDroneClick(drone)}
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
        {dronesFiltrados.length} de {dados.total} drone{dados.total !== 1 ? "s" : ""}
        {filtro !== "TODOS" && ` · ${filtro.toLowerCase().replace("_", " ")}`}
      </div>
    </div>
  );
}
