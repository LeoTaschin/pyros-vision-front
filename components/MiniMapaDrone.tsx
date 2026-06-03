"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import type { Drone } from "@/lib/api";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const STYLE_DARK  = "mapbox://styles/tascoleo/cmpwycapz000701s00m9y4kbl";
const STYLE_LIGHT = "mapbox://styles/tascoleo/cmpwy1n0z005701s5h82vcb81";

const STATUS_COR: Record<string, string> = {
  DISPONIVEL: "#22C55E",
  EM_MISSAO:  "#F59E0B",
  MANUTENCAO: "#DC2626",
};

interface Props { drone: Drone }

export default function MiniMapaDrone({ drone }: Props) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<mapboxgl.Map | null>(null);
  const baseMarkerRef    = useRef<mapboxgl.Marker | null>(null);
  const baseMarkerElRef  = useRef<HTMLElement | null>(null);
  const missaoMarkerRef  = useRef<mapboxgl.Marker | null>(null);
  const styleAtualRef    = useRef<string>("");
  const { resolvedTheme } = useTheme();

  const droneRef = useRef(drone);
  droneRef.current = drone;

  // ── Init map uma vez ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxgl.supported()) return;

    const d     = droneRef.current;
    const cor   = STATUS_COR[d.status] ?? "#22C55E";
    const style = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
    styleAtualRef.current = style;

    const map = new mapboxgl.Map({
      container:          containerRef.current,
      style,
      center:             [d.lon_base, d.lat_base],
      zoom:               10,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    // Marcador da base — quadrado (diferencia de focos)
    const baseEl = document.createElement("div");
    baseEl.style.cssText = `
      width: 14px; height: 14px; border-radius: 4px;
      background: ${cor};
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 0 10px ${cor}, 0 2px 6px rgba(0,0,0,0.4);
    `;
    baseMarkerElRef.current = baseEl;

    const baseMarker = new mapboxgl.Marker({ element: baseEl })
      .setLngLat([d.lon_base, d.lat_base])
      .addTo(map);
    baseMarkerRef.current = baseMarker;

    // Marcador do alvo de missão (círculo vermelho = foco de incêndio)
    if (d.missao_lat != null && d.missao_lon != null) {
      const missionEl = document.createElement("div");
      missionEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #DC2626;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 14px #DC2626, 0 2px 8px rgba(0,0,0,0.5);
      `;
      const missionMarker = new mapboxgl.Marker({ element: missionEl })
        .setLngLat([d.missao_lon, d.missao_lat])
        .addTo(map);
      missaoMarkerRef.current = missionMarker;

      map.on("load", () => {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([d.lon_base, d.lat_base])
          .extend([d.missao_lon!, d.missao_lat!]);
        map.fitBounds(bounds, { padding: 50, duration: 0 });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current        = null;
      baseMarkerRef.current = null;
      missaoMarkerRef.current = null;
      baseMarkerElRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Troca de tema — igual Mapa.tsx ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const novoEstilo = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
    if (novoEstilo === styleAtualRef.current) return;
    styleAtualRef.current = novoEstilo;

    if (map.isStyleLoaded()) {
      map.setStyle(novoEstilo);
    } else {
      map.once("load", () => map.setStyle(novoEstilo));
    }
  }, [resolvedTheme]);

  // ── Atualiza marcadores quando o drone selecionado muda ────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const cor = STATUS_COR[drone.status] ?? "#22C55E";

    // Atualiza base
    baseMarkerRef.current?.setLngLat([drone.lon_base, drone.lat_base]);
    if (baseMarkerElRef.current) {
      baseMarkerElRef.current.style.background = cor;
      baseMarkerElRef.current.style.boxShadow  = `0 0 10px ${cor}, 0 2px 6px rgba(0,0,0,0.4)`;
    }

    // Remove marcador de missão anterior
    missaoMarkerRef.current?.remove();
    missaoMarkerRef.current = null;

    if (drone.missao_lat != null && drone.missao_lon != null) {
      const missionEl = document.createElement("div");
      missionEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #DC2626;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 14px #DC2626, 0 2px 8px rgba(0,0,0,0.5);
      `;
      const missionMarker = new mapboxgl.Marker({ element: missionEl })
        .setLngLat([drone.missao_lon, drone.missao_lat])
        .addTo(map);
      missaoMarkerRef.current = missionMarker;

      // Ajusta o mapa para mostrar os dois pontos
      const bounds = new mapboxgl.LngLatBounds()
        .extend([drone.lon_base, drone.lat_base])
        .extend([drone.missao_lon, drone.missao_lat]);
      map.fitBounds(bounds, { padding: 50, duration: 600, essential: true });
    } else {
      map.flyTo({ center: [drone.lon_base, drone.lat_base], zoom: 10, duration: 600, essential: true });
    }
  }, [drone.id, drone.status, drone.missao_lat, drone.missao_lon, drone.lat_base, drone.lon_base]);

  return (
    <div className="mini-mapa" style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
