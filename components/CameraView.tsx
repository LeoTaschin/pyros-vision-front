"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";

// ── Types ──────────────────────────────────────────────────────────
type DetTipo = "LIMPO" | "FUMACA" | "FOGO";

const DET_CFG = {
  LIMPO:  { label: "SEM DETECÇÃO", cor: "#22C55E" },
  FUMACA: { label: "FUMAÇA",       cor: "#F59E0B" },
  FOGO:   { label: "FOGO",         cor: "#DC2626" },
} as const;

interface LogItem { hora: string; tipo: Exclude<DetTipo, "LIMPO">; conf: number }

interface Deteccao {
  classe:    string;
  confianca: number;
  nivel:     string;
  x:         number;
  y:         number;
  largura:   number;
  altura:    number;
}

// ── Config ─────────────────────────────────────────────────────────
const CAPTURE_W   = 640;
const FRAME_MS    = 80;   // polling rápido — semáforo controla envio real
const BASE_URL    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL      = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/ws/camera";

// ── CameraView ─────────────────────────────────────────────────────
export default function CameraView() {
  const [ativa,    setAtiva]    = useState(false);
  const [deteccao, setDeteccao] = useState<DetTipo>("LIMPO");
  const [confianca,setConfianca]= useState(0);
  const [log,      setLog]      = useState<LogItem[]>([]);
  const [erro,     setErro]     = useState<string | null>(null);
  const [conectado,setConectado]= useState(false);

  const [mounted, setMounted]     = useState(false);
  const { resolvedTheme }         = useTheme();
  const isLight                   = mounted && resolvedTheme === "light";

  useEffect(() => setMounted(true), []);

  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const wsRef         = useRef<WebSocket | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const aguardandoRef = useRef(false); // semáforo: não envia novo frame enquanto resposta pende

  // ── Limpa canvas ─────────────────────────────────────────────────
  const limparCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, []);

  // ── Desenha bounding boxes no canvas overlay ──────────────────────
  const desenharBoxes = useCallback((dets: Deteccao[], inferW: number, inferH: number) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const dw = video.clientWidth;
    const dh = video.clientHeight;
    if (canvas.width !== dw)  canvas.width  = dw;
    if (canvas.height !== dh) canvas.height = dh;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, dw, dh);

    const sx = dw / inferW;
    const sy = dh / inferH;

    dets.forEach(det => {
      const isSmoke = /smoke|fuma[cç]/i.test(det.classe);
      const cor     = isSmoke ? "#F59E0B" : "#DC2626";
      const label   = `${isSmoke ? "FUMAÇA" : "FOGO"} ${Math.round(det.confianca * 100)}%`;

      const x = det.x * sx;
      const y = det.y * sy;
      const w = det.largura  * sx;
      const h = det.altura   * sy;
      const cs = 14; // corner size

      // Fundo semitransparente
      ctx.fillStyle = `${cor}18`;
      ctx.fillRect(x, y, w, h);

      // Cantos estilo HUD
      ctx.strokeStyle = cor;
      ctx.lineWidth = 2.5;
      [[x, y, cs, 0, 0, cs], [x+w, y, -cs, 0, 0, cs],
       [x, y+h, cs, 0, 0, -cs], [x+w, y+h, -cs, 0, 0, -cs]]
        .forEach(([ox, oy, dx1, dy1, dx2, dy2]) => {
          ctx.beginPath();
          ctx.moveTo(ox + dx1, oy + dy1);
          ctx.lineTo(ox, oy);
          ctx.lineTo(ox + dx2, oy + dy2);
          ctx.stroke();
        });

      // Label badge
      ctx.font = "bold 11px 'Space Grotesk', system-ui";
      const lw = ctx.measureText(label).width + 16;
      ctx.fillStyle = cor;
      ctx.fillRect(x, y - 22, lw, 22);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 8, y - 7);
    });
  }, []);

  // ── Para câmera ───────────────────────────────────────────────────
  const parar = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (wsRef.current)        { wsRef.current.close(); wsRef.current = null; }
    if (streamRef.current)    { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    limparCanvas();
    setAtiva(false);
    setDeteccao("LIMPO");
    setConfianca(0);
    setConectado(false);
  }, [limparCanvas]);

  // ── Inicia câmera ─────────────────────────────────────────────────
  const iniciar = useCallback(async () => {
    setErro(null);

    // 1. Pede permissão de câmera
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch {
      setErro("Permissão de câmera negada. Libere o acesso nas configurações do navegador.");
      return;
    }
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => null);
    }

    // 2. Conecta WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConectado(true);

      // 3. Loop de captura — semáforo garante 1 frame em voo por vez
      intervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (!video || ws.readyState !== WebSocket.OPEN || !video.videoWidth) return;
        if (aguardandoRef.current) return; // resposta anterior ainda não chegou

        const capH = Math.round(CAPTURE_W * (video.videoHeight / video.videoWidth));
        const tmp  = document.createElement("canvas");
        tmp.width  = CAPTURE_W;
        tmp.height = capH;
        tmp.getContext("2d")?.drawImage(video, 0, 0, CAPTURE_W, capH);

        const b64 = tmp.toDataURL("image/jpeg", 0.85).split(",")[1];
        aguardandoRef.current = true;
        ws.send(JSON.stringify({ frame: b64 }));
      }, FRAME_MS);
    };

    ws.onmessage = (ev) => {
      aguardandoRef.current = false; // libera semáforo — pronto para próximo frame
      const data: { deteccoes: Deteccao[]; total: number; nivel_geral: string } = JSON.parse(ev.data);
      const video = videoRef.current;

      if (data.total === 0) {
        setDeteccao("LIMPO");
        setConfianca(0);
        limparCanvas();
        return;
      }

      const hasSmoke = data.deteccoes.some(d => /smoke|fuma[cç]/i.test(d.classe));
      const hasFire  = data.deteccoes.some(d => /fire|fogo/i.test(d.classe));
      const tipo: DetTipo = hasFire ? "FOGO" : hasSmoke ? "FUMACA" : "FOGO";
      const maxConf = Math.max(...data.deteccoes.map(d => d.confianca)) * 100;

      setDeteccao(tipo);
      setConfianca(maxConf);
      setLog(prev => [
        { hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), tipo: tipo === "FOGO" ? "FOGO" : "FUMACA", conf: Math.round(maxConf) },
        ...prev.slice(0, 9),
      ]);

      if (video) {
        const capH = Math.round(CAPTURE_W * (video.videoHeight / video.videoWidth));
        desenharBoxes(data.deteccoes, CAPTURE_W, capH);
      }
    };

    ws.onerror = () => { aguardandoRef.current = false; setErro("Não foi possível conectar ao servidor de detecção."); };
    ws.onclose = () => { aguardandoRef.current = false; setConectado(false); };

    setAtiva(true);
  }, [limparCanvas, desenharBoxes]);

  // Cleanup ao desmontar
  useEffect(() => () => parar(), [parar]);

  const cfg = DET_CFG[deteccao];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>

      {/* ── Placeholder (inativo) ── */}
      {!ativa && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
          background: isLight
            ? `repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 40px),
               repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 40px),
               var(--bg-base)`
            : `repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px),
               repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 40px),
               #060b16`,
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.10)" }}>
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>

          <div style={{ textAlign: "center", fontFamily: "var(--font-display)" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.18)" }}>
              CÂMERA INATIVA
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: isLight ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.10)" }}>
              Aguardando permissão de câmera
            </p>
          </div>

          {erro && (
            <div style={{
              maxWidth: 320, padding: "8px 14px", borderRadius: 8,
              background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.3)",
              fontSize: 11, color: "#DC2626", textAlign: "center",
            }}>
              {erro}
            </div>
          )}

          <button
            onClick={iniciar}
            style={{
              marginTop: 4, padding: "10px 26px",
              background: "#EF4444", border: "none", borderRadius: 8,
              color: "#fff", fontFamily: "var(--font-display)",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.35)",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            ▶ INICIAR CÂMERA
          </button>
        </div>
      )}

      {/* Vídeo e canvas sempre no DOM — ref disponível antes de setAtiva(true) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          display: ativa ? "block" : "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          display: ativa ? "block" : "none",
        }}
      />

      {/* ── Feed ativo — HUD ── */}
      {ativa && (
        <>

          {/* HUD — barra superior */}
          <div style={{
            position: "absolute", top: 14, left: 14, right: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
              border: "1px solid var(--border)", borderRadius: 6,
              padding: "5px 11px",
              fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
              color: "#EF4444", letterSpacing: "0.12em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "piscar 1.2s ease-in-out infinite" }} />
              AO VIVO
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--map-badge-bg)", backdropFilter: "blur(10px)",
              border: `1px solid ${conectado ? "rgba(34,197,94,0.4)" : "var(--border)"}`, borderRadius: 6,
              padding: "5px 11px",
              fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-display)",
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: conectado ? "#22C55E" : "#64748B" }} />
              {conectado ? "pyros-v1 · Roboflow" : "conectando…"}
            </div>
          </div>

          {/* HUD — painel direito flutuante */}
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "var(--map-badge-bg)", backdropFilter: "blur(16px)",
            border: `1px solid ${cfg.cor}30`,
            borderRadius: 12, padding: "16px 14px", width: 148,
            display: "flex", flexDirection: "column", gap: 14,
            pointerEvents: "none",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
                letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8,
              }}>
                DETECÇÃO
              </div>
              <div style={{
                fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 700,
                color: cfg.cor, lineHeight: 1,
              }}>
                {cfg.label}
              </div>
            </div>

            {confianca > 0 && (
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 9, fontFamily: "var(--font-display)", marginBottom: 5,
                }}>
                  <span style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>CONFIANÇA</span>
                  <span style={{ color: cfg.cor, fontWeight: 700 }}>{confianca.toFixed(0)}%</span>
                </div>
                <div style={{ height: 2, borderRadius: 1, background: "var(--bg-elevated)" }}>
                  <div style={{
                    height: "100%", borderRadius: 1, width: `${confianca}%`,
                    background: cfg.cor, boxShadow: `0 0 6px ${cfg.cor}80`,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            )}

            {log.length > 0 && (
              <>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div>
                  <div style={{
                    fontSize: 9, fontFamily: "var(--font-display)", fontWeight: 700,
                    letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 7,
                  }}>
                    LOG
                  </div>
                  {log.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? 5 : 0 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: "var(--font-display)",
                        color: item.tipo === "FOGO" ? "#DC2626" : "#F59E0B",
                        letterSpacing: "0.05em",
                      }}>
                        {item.tipo === "FOGO" ? "FOGO" : "FUMAÇA"} {item.conf}%
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {item.hora}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* HUD — barra inferior */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "52px 18px 16px",
            background: isLight
              ? "linear-gradient(to top, rgba(228,234,244,0.92) 0%, transparent 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 5,
              background: `${cfg.cor}1A`, border: `1px solid ${cfg.cor}38`,
              fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)",
              color: cfg.cor, letterSpacing: "0.08em",
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.cor }} />
              {cfg.label}
            </div>

            <button
              onClick={parar}
              style={{
                padding: "5px 14px",
                background: "var(--bg-elevated)", backdropFilter: "blur(8px)",
                border: "1px solid var(--border)", borderRadius: 6,
                color: "var(--text-muted)", fontFamily: "var(--font-display)",
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = "var(--text-primary)"); }}
              onMouseLeave={e => { (e.currentTarget.style.color = "var(--text-muted)"); }}
            >
              ■ PARAR
            </button>
          </div>
        </>
      )}
    </div>
  );
}
