"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { criarWebSocketSensores } from "@/lib/api";
import type { LeituraSensor } from "@/lib/api";

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

// Tempo máximo sem leitura antes de considerar ESP32 offline (ms)
const TIMEOUT_DISPOSITIVO = 15_000;

export default function SensoresPage() {
  const [ultimo,         setUltimo]         = useState<LeituraSensor | null>(null);
  const [historico,      setHistorico]      = useState<LeituraSensor[]>([]);
  const [conectado,      setConectado]      = useState(false);
  const [dispositivoOff, setDispositivoOff] = useState(false);
  const [ultima,         setUltima]         = useState("");
  const wsRef        = useRef<WebSocket | null>(null);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetarTimeoutDispositivo() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDispositivoOff(false);
    timeoutRef.current = setTimeout(() => setDispositivoOff(true), TIMEOUT_DISPOSITIVO);
  }

  useEffect(() => {
    function conectar() {
      const ws = criarWebSocketSensores();
      wsRef.current = ws;

      ws.onopen = () => {
        setConectado(true);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setUltima(agora);

        if (data.tipo === "historico") {
          setHistorico(data.leituras);
          if (data.leituras.length > 0) {
            setUltimo(data.leituras[0]);
            resetarTimeoutDispositivo();
          }
        } else {
          setUltimo(data);
          setHistorico((prev) => [data, ...prev].slice(0, 50));
          resetarTimeoutDispositivo();
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        setConectado(false);
        setTimeout(conectar, 3000);
      };
    }

    conectar();
    return () => {
      wsRef.current?.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
                ESP32 · DHT11 + MQ-2 · tempo real
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {ultima && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Última leitura às {ultima}
                </span>
              )}
              {(() => {
                const cor = !conectado ? "#6B7280"
                          : dispositivoOff ? "#F59E0B"
                          : "#22C55E";
                const bg  = !conectado ? "rgba(107,114,128,0.10)"
                          : dispositivoOff ? "rgba(245,158,11,0.10)"
                          : "rgba(34,197,94,0.10)";
                const label = !conectado ? "Reconectando..."
                            : dispositivoOff ? "ESP32 offline"
                            : "Ao vivo";
                return (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    color: cor, background: bg,
                    border: `1px solid ${cor}40`,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: cor,
                      boxShadow: !dispositivoOff && conectado ? `0 0 0 3px ${cor}30` : "none",
                    }} />
                    {label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Banner — ESP32 sem sinal */}
          {dispositivoOff && conectado && (
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          14,
              padding:      "16px 20px",
              marginBottom: 20,
              borderRadius: 14,
              background:   "rgba(245,158,11,0.07)",
              border:       "1px solid rgba(245,158,11,0.30)",
            }}>
              {/* Ícone antena */}
              <div style={{
                flexShrink:     0,
                width:          40,
                height:         40,
                borderRadius:   10,
                background:     "rgba(245,158,11,0.12)",
                border:         "1px solid rgba(245,158,11,0.25)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                  <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                  <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                  <circle cx="12" cy="20" r="1" fill="#F59E0B"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B", margin: 0, fontFamily: "var(--font-display)" }}>
                  Dispositivo sem conexão
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
                  Nenhuma leitura recebida nos últimos 15 segundos. Verifique se o ESP32 está ligado e conectado ao Wi-Fi.
                </p>
              </div>
              {ultima && (
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Última leitura</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "2px 0 0", fontFamily: "monospace" }}>
                    {ultima}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sem dados */}
          {!ultimo && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Aguardando primeira leitura do ESP32...
            </div>
          )}

          {/* Conteúdo */}
          {ultimo && <CardUltima leitura={ultimo} />}
          {historico.length > 0 && (
            <TabelaHistorico leituras={historico} />
          )}

        </div>
      </div>
    </>
  );
}
