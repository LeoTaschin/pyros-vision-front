"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { getSensores, getUltimoSensor } from "@/lib/api";
import type { LeituraSensor, RespostaSensores } from "@/lib/api";

const COR_NIVEL: Record<string, string> = {
  NORMAL:  "#22C55E",
  ATENCAO: "#F59E0B",
  PERIGO:  "#EF4444",
};

const BG_NIVEL: Record<string, string> = {
  NORMAL:  "rgba(34,197,94,0.10)",
  ATENCAO: "rgba(245,158,11,0.10)",
  PERIGO:  "rgba(239,68,68,0.10)",
};

function BadgeNivel({ nivel }: { nivel: string }) {
  return (
    <span style={{
      padding:      "3px 10px",
      borderRadius: 20,
      fontSize:     11,
      fontWeight:   600,
      letterSpacing: "0.05em",
      color:        COR_NIVEL[nivel] ?? "#888",
      background:   BG_NIVEL[nivel]  ?? "transparent",
      border:       `1px solid ${COR_NIVEL[nivel] ?? "#888"}40`,
    }}>
      {nivel}
    </span>
  );
}

function CardUltima({ leitura }: { leitura: LeituraSensor }) {
  const hora = new Date(leitura.timestamp + "Z").toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div style={{
      background:   "var(--bg-elevated)",
      border:       `1px solid ${COR_NIVEL[leitura.nivel]}40`,
      borderRadius: 16,
      padding:      "24px 28px",
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Leitura mais recente
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {leitura.device_id}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BadgeNivel nivel={leitura.nivel} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hora}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Temperatura", value: leitura.temperatura != null ? `${leitura.temperatura.toFixed(1)} °C` : "—", icon: "🌡️" },
          { label: "Umidade",     value: leitura.umidade     != null ? `${leitura.umidade.toFixed(1)} %`     : "—", icon: "💧" },
          { label: "Fumaça (MQ-2)", value: String(leitura.fumaca), icon: "💨" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background:   "var(--bg-surface)",
            border:       "1px solid var(--border)",
            borderRadius: 12,
            padding:      "16px 18px",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{icon} {label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaHistorico({ leituras }: { leituras: LeituraSensor[] }) {
  return (
    <div style={{
      background:   "var(--bg-elevated)",
      border:       "1px solid var(--border)",
      borderRadius: 16,
      overflow:     "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Histórico ({leituras.length} leituras)
        </p>
      </div>
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 380px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Horário", "Temperatura", "Umidade", "Fumaça", "Nível"].map((h) => (
                <th key={h} style={{
                  padding:   "10px 16px",
                  fontSize:  11,
                  fontWeight: 600,
                  textAlign: "left",
                  color:     "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: "var(--bg-elevated)",
                  position:  "sticky",
                  top:       0,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leituras.map((l, i) => {
              const hora = new Date(l.timestamp + "Z").toLocaleTimeString("pt-BR", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              });
              return (
                <tr key={i} style={{
                  borderBottom: "1px solid var(--border)",
                  background:   i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>{hora}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)" }}>
                    {l.temperatura != null ? `${l.temperatura.toFixed(1)} °C` : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)" }}>
                    {l.umidade != null ? `${l.umidade.toFixed(1)} %` : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--text-primary)" }}>{l.fumaca}</td>
                  <td style={{ padding: "10px 16px" }}><BadgeNivel nivel={l.nivel} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SensoresPage() {
  const [ultimo,   setUltimo]   = useState<LeituraSensor | null>(null);
  const [historico, setHistorico] = useState<RespostaSensores | null>(null);
  const [erro,     setErro]     = useState(false);
  const [ultima,   setUltima]   = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro(false);
      const [u, h] = await Promise.all([getUltimoSensor(), getSensores()]);
      setUltimo(u.leitura);
      setHistorico(h);
      setUltima(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 10_000);
    return () => clearInterval(id);
  }, [carregar]);

  return (
    <>
      <Header />
      <div style={{
        position:   "fixed",
        inset:      0,
        paddingTop: 92,
        background: "var(--bg-surface)",
        overflowY:  "auto",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 40px" }}>

          {/* Cabeçalho */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
                Sensores de Campo
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                ESP32 · DHT11 + MQ-2 · atualiza a cada 10s
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {ultima && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Atualizado às {ultima}
                </span>
              )}
              <button
                onClick={carregar}
                style={{
                  padding:      "6px 14px",
                  borderRadius: 8,
                  border:       "1px solid var(--border)",
                  background:   "var(--bg-elevated)",
                  color:        "var(--text-secondary)",
                  fontSize:     12,
                  cursor:       "pointer",
                  fontFamily:   "var(--font-display)",
                }}
              >
                Atualizar
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              padding: "10px 16px", marginBottom: 16, borderRadius: 10,
              background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
              fontSize: 12, color: "#DC2626",
            }}>
              Erro ao conectar com o dispositivo. Verifique a API.
            </div>
          )}

          {/* Sem dados */}
          {!erro && !ultimo && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Aguardando primeira leitura do ESP32...
            </div>
          )}

          {/* Conteúdo */}
          {ultimo && <CardUltima leitura={ultimo} />}
          {historico && historico.leituras.length > 0 && (
            <TabelaHistorico leituras={historico.leituras} />
          )}

        </div>
      </div>
    </>
  );
}
