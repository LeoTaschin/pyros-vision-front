"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Gera histórico simulado das últimas 12h com base nos dados atuais
function gerarHistorico(totalAtual: number, criticosAtual: number) {
  const agora = new Date();
  return Array.from({ length: 13 }, (_, i) => {
    const h = new Date(agora.getTime() - (12 - i) * 3600 * 1000);
    const hora = `${h.getHours().toString().padStart(2, "0")}h`;
    const variacao = 1 + Math.sin(i * 0.8) * 0.4 + (Math.random() - 0.5) * 0.2;
    const focos = i === 12 ? totalAtual : Math.max(0, Math.round(totalAtual * variacao));
    const criticos = i === 12 ? criticosAtual : Math.max(0, Math.round(criticosAtual * variacao));
    return { hora, focos, criticos };
  });
}

interface Props {
  total: number;
  criticos: number;
}

export default function GraficoHistorico({ total, criticos }: Props) {
  const dados = gerarHistorico(total, criticos);

  return (
    <div className="bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Focos — últimas 12h
      </p>
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={dados} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradFocos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCriticos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="hora"
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#fafafa" }}
          />
          <Area
            type="monotone"
            dataKey="focos"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#gradFocos)"
            name="Focos"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="criticos"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#gradCriticos)"
            name="Críticos"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
