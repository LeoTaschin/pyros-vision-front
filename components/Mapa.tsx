"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Foco } from "@/lib/api";
import type { BaseDrone } from "@/components/BasesDronesMapa";
import FocosMapa from "@/components/FocosMapa";
import BasesDronesMapa from "@/components/BasesDronesMapa";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Props {
  focos:        Foco[];
  estilo:       string;
  onFocoClick:  (foco: Foco) => void;
  onBaseClick:  (base: BaseDrone) => void;
}

export default function Mapa({ focos, estilo, onFocoClick, onBaseClick }: Props) {
  const containerRef             = useRef<HTMLDivElement>(null);
  const mapRef                   = useRef<mapboxgl.Map | null>(null);
  const styleAtualRef            = useRef<string>("");
  const [mapReady, setMapReady]  = useState(false);

  // ── Inicializa o mapa uma vez ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxgl.supported()) {
      console.warn("[Mapa] WebGL not supported in this environment");
      return;
    }

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
      mapRef.current    = null;
      styleAtualRef.current = "";
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Troca estilo quando o tema muda ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || estilo === styleAtualRef.current) return;
    styleAtualRef.current = estilo;

    const aplicar = () => map.setStyle(estilo);
    if (map.isStyleLoaded()) {
      aplicar();
    } else {
      map.once("load", aplicar);
    }
  }, [estilo]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {mapReady && mapRef.current && (
        <>
          <FocosMapa map={mapRef.current} focos={focos} onFocoClick={onFocoClick} />
          <BasesDronesMapa map={mapRef.current} onBaseClick={onBaseClick} />
        </>
      )}
    </div>
  );
}
