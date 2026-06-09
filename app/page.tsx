"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import FocoDetalhes from "@/components/FocoDetalhes";
import BaseDetalhes from "@/components/BaseDetalhes";
import { getFocos } from "@/lib/api";
import type { RespostaFocos, Foco } from "@/lib/api";
import type { BaseDrone } from "@/components/BasesDronesMapa";

const STYLE_LIGHT = "mapbox://styles/tascoleo/cmpwy1n0z005701s5h82vcb81";
const STYLE_DARK  = "mapbox://styles/tascoleo/cmpwycapz000701s00m9y4kbl";

const Mapa = dynamic(() => import("@/components/Mapa"), { ssr: false });

export default function Home() {
  const [focos,           setFocos]           = useState<RespostaFocos | null>(null);
  const [pronto,          setPronto]          = useState(false);
  const [focoSelecionado, setFocoSelecionado] = useState<Foco | null>(null);
  const [baseSelecionada, setBaseSelecionada] = useState<BaseDrone | null>(null);
  const { theme }                             = useTheme();
  const estilo = theme === "light" ? STYLE_LIGHT : STYLE_DARK;

  const handleFocoClick = useCallback((foco: Foco) => {
    setBaseSelecionada(null);
    setFocoSelecionado(foco);
  }, []);

  const handleBaseClick = useCallback((base: BaseDrone) => {
    setFocoSelecionado(null);
    setBaseSelecionada(base);
  }, []);

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
            estilo={estilo}
            onFocoClick={handleFocoClick}
            onBaseClick={handleBaseClick}
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

      <BaseDetalhes
        base={baseSelecionada}
        onClose={() => setBaseSelecionada(null)}
      />

    </div>
  );
}
