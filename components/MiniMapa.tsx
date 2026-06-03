"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const STYLE_DARK  = "mapbox://styles/tascoleo/cmpwycapz000701s00m9y4kbl";
const STYLE_LIGHT = "mapbox://styles/tascoleo/cmpwy1n0z005701s5h82vcb81";

const NIVEL_COR: Record<string, string> = {
  CRITICO:     "#DC2626",
  ALERTA:      "#F59E0B",
  MONITORANDO: "#FACC15",
};

interface Props { lat: number; lon: number; nivel: string }

export default function MiniMapa({ lat, lon, nivel }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<mapboxgl.Map | null>(null);
  const markerRef     = useRef<mapboxgl.Marker | null>(null);
  const markerElRef   = useRef<HTMLElement | null>(null);
  const styleAtualRef = useRef<string>("");

  const { resolvedTheme } = useTheme();

  // Refs para leitura no init sem adicionar como dependência
  const latRef   = useRef(lat);
  const lonRef   = useRef(lon);
  const nivelRef = useRef(nivel);
  latRef.current   = lat;
  lonRef.current   = lon;
  nivelRef.current = nivel;

  // ── Init map uma vez ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxgl.supported()) return;

    const cor   = NIVEL_COR[nivelRef.current] ?? "#FACC15";
    const style = resolvedTheme === "light" ? STYLE_LIGHT : STYLE_DARK;
    styleAtualRef.current = style;

    const map = new mapboxgl.Map({
      container:          containerRef.current,
      style,
      center:             [lonRef.current, latRef.current],
      zoom:               10,
      attributionControl: false,
    });

    // Atribuição compacta — logo suprimido via .mini-mapa no globals.css
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    // Marker colorido por nível
    const el = document.createElement("div");
    el.style.cssText = `
      width: 18px; height: 18px; border-radius: 50%;
      background: ${cor};
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 0 14px ${cor}, 0 2px 8px rgba(0,0,0,0.5);
    `;
    markerElRef.current = el;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lonRef.current, latRef.current])
      .addTo(map);

    mapRef.current    = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current      = null;
      markerRef.current   = null;
      markerElRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Troca estilo quando o tema muda — igual Mapa.tsx ──────────
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

  // ── Atualiza posição e cor do marker ao trocar de foco ────────
  useEffect(() => {
    const cor = NIVEL_COR[nivel] ?? "#FACC15";

    markerRef.current?.setLngLat([lon, lat]);
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 10, duration: 700, essential: true });

    if (markerElRef.current) {
      markerElRef.current.style.background = cor;
      markerElRef.current.style.boxShadow  = `0 0 14px ${cor}, 0 2px 8px rgba(0,0,0,0.5)`;
    }
  }, [lat, lon, nivel]);

  // Wrapper com classe "mini-mapa" — CSS em globals.css oculta logo e atribuição
  return (
    <div className="mini-mapa" style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
