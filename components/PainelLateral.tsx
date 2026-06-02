"use client";

import { useState } from "react";
import type { RespostaFocos, RespostaDrones } from "@/lib/api";

const BADGE_NIVEL: Record<string, string> = {
  CRITICO: "bg-red-600 text-white",
  ALERTA:  "bg-orange-500 text-white",
  SEGURO:  "bg-green-600 text-white",
};

const COR_NIVEL: Record<string, string> = {
  CRITICO:     "text-red-400",
  ALERTA:      "text-orange-400",
  MONITORANDO: "text-yellow-400",
};

const BADGE_DRONE: Record<string, string> = {
  DISPONIVEL: "bg-green-900 text-green-300",
  EM_MISSAO:  "bg-blue-900 text-blue-300",
  MANUTENCAO: "bg-zinc-700 text-zinc-400",
};

interface Props {
  focos: RespostaFocos;
  drones: RespostaDrones;
  onAtualizarFocos: () => void;
}

type Aba = "focos" | "drones";

export default function PainelLateral({ focos, drones, onAtualizarFocos }: Props) {
  const [aba, setAba] = useState<Aba>("focos");

  return (
    <aside className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">Pyros Vision</h1>
            <p className="text-zinc-500 text-xs">Monitoramento — SP</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${BADGE_NIVEL[focos.nivel_geral] ?? "bg-zinc-700 text-white"}`}>
            {focos.nivel_geral}
          </span>
        </div>

        {/* Métricas focos */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Focos</p>
            <p className="text-white font-bold text-lg">{focos.total}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Críticos</p>
            <p className="text-red-400 font-bold text-lg">{focos.criticos}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Alertas</p>
            <p className="text-orange-400 font-bold text-lg">{focos.alertas}</p>
          </div>
        </div>

        {/* Métricas drones */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Drones</p>
            <p className="text-white font-bold text-lg">{drones.total}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Livres</p>
            <p className="text-green-400 font-bold text-lg">{drones.disponiveis}</p>
          </div>
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs">Missão</p>
            <p className="text-blue-400 font-bold text-lg">{drones.em_missao}</p>
          </div>
        </div>

        <button
          onClick={onAtualizarFocos}
          className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition py-1"
        >
          Atualizado: {focos.ultima_atualizacao} · Forçar atualização
        </button>
      </div>

      {/* Abas */}
      <div className="flex border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setAba("focos")}
          className={`flex-1 py-2 text-sm font-medium transition ${
            aba === "focos"
              ? "text-orange-400 border-b-2 border-orange-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Focos ({focos.total})
        </button>
        <button
          onClick={() => setAba("drones")}
          className={`flex-1 py-2 text-sm font-medium transition ${
            aba === "drones"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Drones ({drones.total})
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {aba === "focos" && (
          <ul className="divide-y divide-zinc-800/60">
            {focos.focos.map((f, i) => (
              <li key={i} className="px-4 py-3 hover:bg-zinc-900/60 transition">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-white text-sm font-medium">{f.cidade}</span>
                  <span className={`text-xs font-semibold shrink-0 ${COR_NIVEL[f.nivel]}`}>
                    {f.nivel}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {f.dist_km} km · {f.satelite} · {f.brightness.toFixed(0)} K
                </p>
              </li>
            ))}
          </ul>
        )}

        {aba === "drones" && (
          <ul className="divide-y divide-zinc-800/60">
            {drones.drones.map((d) => (
              <li key={d.id} className="px-4 py-3 hover:bg-zinc-900/60 transition">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-white text-sm font-medium">{d.nome}</p>
                    <p className="text-zinc-500 text-xs">{d.base}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${BADGE_DRONE[d.status]}`}>
                    {d.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.bateria}%`,
                        backgroundColor: d.bateria > 50 ? "#22c55e" : d.bateria > 20 ? "#f97316" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-zinc-500 text-xs w-8 text-right">{d.bateria}%</span>
                </div>
                {d.missao_alvo && (
                  <p className="text-blue-400 text-xs mt-1">→ {d.missao_alvo}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
