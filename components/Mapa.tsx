"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Foco } from "@/lib/api";
import FocosMapa from "@/components/FocosMapa";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const STYLE_LIGHT = "mapbox://styles/tascoleo/cmpwy1n0z005701s5h82vcb81";
const STYLE_DARK  = "mapbox://styles/tascoleo/cmpwycapz000701s00m9y4kbl";

interface Props {
  focos:       Foco[];
  onFocoClick: (foco: Foco) => void;
}

export default function Mapa({ focos, onFocoClick }: Props) {
  const containerRef             = useRef<HTMLDivElement>(null);
  const mapRef                   = useRef<mapboxgl.Map | null>(null);
  const styleAtualRef            = useRef<string>("");
  const [mapReady, setMapReady]  = useState(false);
  const { resolvedTheme }        = useTheme();

  // ── Inicializa o mapa uma vez ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Usa dark como padrão até next-themes resolver
    const estilo = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
    styleAtualRef.current = estilo;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     estilo,
      center:    [-48.5, -22.3],
      zoom:      6.2,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.on("load", () => setMapReady(true));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      styleAtualRef.current = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Troca estilo só quando o tema REALMENTE muda ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const novoEstilo = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;

    // Evita setStyle() se o estilo já é o correto — previne apagar layers
    if (novoEstilo === styleAtualRef.current) return;
    styleAtualRef.current = novoEstilo;

    if (map.isStyleLoaded()) {
      map.setStyle(novoEstilo);
    } else {
      map.once("load", () => map.setStyle(novoEstilo));
    }
  }, [resolvedTheme]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {mapReady && mapRef.current && (
        <FocosMapa map={mapRef.current} focos={focos} onFocoClick={onFocoClick} />
      )}
    </div>
  );
}
