"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import DroneList from "@/components/DroneList";
import DroneInfo from "@/components/DroneInfo";
import { getDrones } from "@/lib/api";
import type { RespostaDrones, Drone } from "@/lib/api";

export default function FrotaPage() {
  const [dados,            setDados]            = useState<RespostaDrones | null>(null);
  const [erro,             setErro]             = useState(false);
  const [droneSelecionado, setDroneSelecionado] = useState<Drone | null>(null);
  const [ultima,           setUltima]           = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro(false);
      const d = await getDrones();
      setDados(d);
      setUltima(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(() => carregar(), 30_000);   /* frota atualiza a cada 30s */
    return () => clearInterval(id);
  }, [carregar]);

  return (
    <>
      <Header />

      {/* Painel full-screen — mesmo padrão da tela de Focos */}
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
          paddingTop:    92,
        }}>
          {erro && (
            <div style={{
              flexShrink: 0, padding: "8px 18px",
              background: "rgba(220,38,38,0.08)",
              borderBottom: "1px solid rgba(220,38,38,0.2)",
              fontSize: 12, color: "#DC2626",
            }}>
              Erro ao carregar dados da frota. Verifique a conexão com a API.
            </div>
          )}

          {!dados && !erro ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
              Carregando frota...
            </div>
          ) : dados ? (
            <DroneList
              dados={dados}
              onDroneClick={setDroneSelecionado}
              droneSelecionado={droneSelecionado}
              onAtualizar={carregar}
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
          paddingTop:    92,
        }}>
          <DroneInfo
            drone={droneSelecionado}
            onClose={() => setDroneSelecionado(null)}
          />
        </div>

      </div>
    </>
  );
}
