"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { criarWebSocket, type RespostaAnalise } from "@/lib/api";

export default function CameraAoVivo() {
  const [aberta, setAberta] = useState(false);
  const [resultado, setResultado] = useState<RespostaAnalise | null>(null);
  const [ativo, setAtivo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = useCallback(() => {
    setAtivo(false);
    intervalRef.current && clearInterval(intervalRef.current);
    wsRef.current?.close();
    videoRef.current?.srcObject &&
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
  }, []);

  async function iniciar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ws = criarWebSocket();
      wsRef.current = ws;

      ws.onmessage = (e) => setResultado(JSON.parse(e.data));

      ws.onopen = () => {
        setAtivo(true);
        intervalRef.current = setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || ws.readyState !== WebSocket.OPEN) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onload = () => {
              const b64 = (reader.result as string).split(",")[1];
              ws.send(JSON.stringify({ frame: b64 }));
            };
            reader.readAsDataURL(blob);
          }, "image/jpeg", 0.7);
        }, 1000);
      };
    } catch {
      alert("Não foi possível acessar a câmera.");
    }
  }

  useEffect(() => () => parar(), [parar]);

  const COR_NIVEL: Record<string, string> = {
    CRITICO: "text-red-400",
    ALERTA:  "text-orange-400",
    SEGURO:  "text-green-400",
  };

  if (!aberta) {
    return (
      <button
        onClick={() => setAberta(true)}
        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition flex items-center gap-2"
      >
        <span className="text-blue-400">◉</span> Câmera ao vivo
      </button>
    );
  }

  return (
    <div className="bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden w-72">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-sm font-semibold text-white">Câmera ao vivo</span>
        <button onClick={() => { parar(); setAberta(false); }} className="text-zinc-500 hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="relative bg-black aspect-video">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {resultado && (
          <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-xs">
            <span className={`font-bold ${COR_NIVEL[resultado.nivel_geral] ?? "text-white"}`}>
              {resultado.nivel_geral}
            </span>
            {resultado.total > 0 && (
              <span className="text-zinc-400 ml-1">· {resultado.total} detecção(ões)</span>
            )}
          </div>
        )}
      </div>

      <div className="p-3 flex gap-2">
        {!ativo ? (
          <button
            onClick={iniciar}
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium transition"
          >
            Iniciar análise
          </button>
        ) : (
          <button
            onClick={parar}
            className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm text-white font-medium transition"
          >
            Parar
          </button>
        )}
      </div>
    </div>
  );
}
