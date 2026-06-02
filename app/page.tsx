"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import FocoDetalhes from "@/components/FocoDetalhes";
import { getFocos } from "@/lib/api";
import type { RespostaFocos, Foco } from "@/lib/api";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false });

export default function Home() {
  const [focos,           setFocos]           = useState<RespostaFocos | null>(null);
  const [pronto,          setPronto]          = useState(false);
  const [focoSelecionado, setFocoSelecionado] = useState<Foco | null>(null);

  const carregar = useCallback(async () => {
    try {
      const f = await getFocos();
      setFocos(f);
    } catch (err) {
      console.error("[Pyros] Erro ao carregar dados:", err);
    } finally {
      setPronto(true);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 60_000);
    return () => clearInterval(id);
  }, [carregar]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>

      {/* Mapa */}
      <div style={{ position: "absolute", inset: 0 }}>
        {pronto && focos && (
          <Mapa
            focos={focos.focos}
            onFocoClick={(foco) => setFocoSelecionado(foco)}
          />
        )}
      </div>

      {/* Header flutuante */}
      <Header />

      {/* Painel de detalhes do foco */}
      <FocoDetalhes
        foco={focoSelecionado}
        onClose={() => setFocoSelecionado(null)}
      />

    </div>
  );
}
