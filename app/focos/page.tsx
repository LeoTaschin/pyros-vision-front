"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import FocoList from "@/components/FocoList";
import FocoInfo from "@/components/FocoInfo";
import { getFocos } from "@/lib/api";
import type { RespostaFocos, Foco } from "@/lib/api";

export default function FocosPage() {
  const [dados,           setDados]           = useState<RespostaFocos | null>(null);
  const [erro,            setErro]            = useState(false);
  const [focoSelecionado, setFocoSelecionado] = useState<Foco | null>(null);
  const [ultima,          setUltima]          = useState("");

  const carregar = useCallback(async (force = false) => {
    try {
      setErro(false);
      const f = await getFocos(force);
      setDados(f);
      setUltima(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(() => carregar(), 60_000);
    return () => clearInterval(id);
  }, [carregar]);

  return (
    <>
      <Header />

      {/* Painel full-screen atrás do header — igual ao mapa */}
      <div style={{
        position:   "fixed",
        inset:      0,
        display:    "flex",
        overflow:   "hidden",
        background: "var(--bg-surface)",
      }}>

        {/* ── Coluna esquerda 60% ── */}
        <div style={{
          width:         "60%",
          display:       "flex",
          flexDirection: "column",
          borderRight:   "1px solid var(--border)",
          overflow:      "hidden",
          paddingTop:    92,           /* espaço para o header flutuante */
        }}>
          {erro && (
            <div style={{
              flexShrink: 0, padding: "8px 18px",
              background: "rgba(220,38,38,0.08)",
              borderBottom: "1px solid rgba(220,38,38,0.2)",
              fontSize: 12, color: "#DC2626",
            }}>
              Erro ao carregar dados. Verifique a conexão com a API.
            </div>
          )}

          {!dados && !erro ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
              Carregando focos...
            </div>
          ) : dados ? (
            <FocoList
              dados={dados}
              onFocoClick={setFocoSelecionado}
              focoSelecionado={focoSelecionado}
              onAtualizar={() => carregar(true)}
              ultima={ultima}
            />
          ) : null}
        </div>

        {/* ── Coluna direita 40% ── */}
        <div style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          paddingTop:    92,           /* mesma altura que a coluna esquerda */
        }}>
          <FocoInfo
            foco={focoSelecionado}
            onClose={() => setFocoSelecionado(null)}
          />
        </div>

      </div>
    </>
  );
}
