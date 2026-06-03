"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import CameraGrid from "@/components/CameraGrid";

type Modo = "WEBCAM" | "FAZENDA";

const ABAS: { id: Modo; label: string; icone: string }[] = [
  { id: "WEBCAM",  label: "WEBCAM AO VIVO",    icone: "◉" },
  { id: "FAZENDA", label: "CÂMERAS DA FAZENDA", icone: "⊞" },
];

export default function CamerasPage() {
  const [modo, setModo] = useState<Modo>("WEBCAM");

  return (
    <>
      <Header />

      <div style={{
        position: "fixed", inset: 0,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-base)",
        paddingTop: 92,
      }}>

        {/* ── Tab bar ── */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "stretch",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          paddingLeft: 20,
        }}>
          {ABAS.map(({ id, label, icone }) => {
            const ativo = modo === id;
            return (
              <button
                key={id}
                onClick={() => setModo(id)}
                style={{
                  height: 44, padding: "0 18px",
                  background: "transparent", border: "none",
                  borderBottom: ativo ? "2px solid #EF4444" : "2px solid transparent",
                  marginBottom: -1,
                  color: ativo ? "var(--text-primary)" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
                  cursor: "pointer", outline: "none",
                  display: "flex", alignItems: "center", gap: 7,
                  transition: "color 0.12s ease, border-color 0.12s ease",
                }}
                onMouseEnter={e => { if (!ativo) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={e => { if (!ativo) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                <span style={{ fontSize: 11, opacity: ativo ? 1 : 0.4 }}>{icone}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {modo === "WEBCAM" ? <CameraView /> : <CameraGrid />}
        </div>

      </div>
    </>
  );
}
