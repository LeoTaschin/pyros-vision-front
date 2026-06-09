"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export interface BaseDrone {
  id:          string;
  nome:        string;
  mesorregiao: string;
  cluster:     string;
  prioridade:  number;
  lat:         number;
  lon:         number;
  municipios:  number;
  risco_medio: number;
  codigo_ibge: string;
}

const BASES: BaseDrone[] = [
  {
    id:          "penapoplis",
    nome:        "Penápolis",
    mesorregiao: "Araçatuba",
    cluster:     "Alto Risco — Histórico Intenso",
    prioridade:  1,
    lat:         -21.4148,
    lon:         -50.0769,
    municipios:  53,
    risco_medio: 72.0,
    codigo_ibge: "3537305",
  },
  {
    id:          "luis-antonio",
    nome:        "Luís Antônio",
    mesorregiao: "Ribeirão Preto",
    cluster:     "Moderado — Zona de Transição",
    prioridade:  2,
    lat:         -21.55,
    lon:         -47.7801,
    municipios:  90,
    risco_medio: 33.1,
    codigo_ibge: "3527603",
  },
  {
    id:          "itai",
    nome:        "Itaí",
    mesorregiao: "Bauru",
    cluster:     "Estável — Baixo Histórico",
    prioridade:  3,
    lat:         -23.4213,
    lon:         -49.092,
    municipios:  73,
    risco_medio: 21.6,
    codigo_ibge: "3521804",
  },
  {
    id:          "eldorado",
    nome:        "Eldorado",
    mesorregiao: "Litoral Sul Paulista",
    cluster:     "Baixo Risco — Úmido",
    prioridade:  4,
    lat:         -24.5281,
    lon:         -48.1141,
    municipios:  24,
    risco_medio: 14.8,
    codigo_ibge: "3514809",
  },
];

const COR_BASE = "#3B82F6";

function toGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: BASES.map((b) => ({
      type:     "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [b.lon, b.lat] },
      properties: { ...b },
    })),
  };
}

function adicionarLayers(map: mapboxgl.Map) {
  const data = toGeoJSON();

  if (!map.getSource("bases-drones")) {
    map.addSource("bases-drones", { type: "geojson", data });
  } else {
    (map.getSource("bases-drones") as mapboxgl.GeoJSONSource).setData(data);
    return;
  }

  // Glow — mesmo estilo do FocosMapa
  map.addLayer({
    id: "bases-glow", type: "circle", source: "bases-drones",
    paint: {
      "circle-radius":            ["interpolate", ["linear"], ["zoom"], 4, 14, 12, 36],
      "circle-color":             COR_BASE,
      "circle-opacity":           0.12,
      "circle-blur":              1,
      "circle-emissive-strength": 1,
    } as object,
  });

  // Círculo principal — mesmo estilo do FocosMapa
  map.addLayer({
    id: "bases-circle", type: "circle", source: "bases-drones",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"],
        4,  6,
        10, 10,
        16, 14,
      ],
      "circle-color":             COR_BASE,
      "circle-stroke-width":      1.5,
      "circle-stroke-color":      "rgba(255,255,255,0.5)",
      "circle-opacity":           1,
      "circle-emissive-strength": 1,
    } as object,
  });
}

function removerLayers(map: mapboxgl.Map) {
  try {
    if (map.getLayer("bases-circle")) map.removeLayer("bases-circle");
    if (map.getLayer("bases-glow"))   map.removeLayer("bases-glow");
    if (map.getSource("bases-drones")) map.removeSource("bases-drones");
  } catch { /* mapa destruído */ }
}

interface Props {
  map:          mapboxgl.Map;
  onBaseClick:  (base: BaseDrone) => void;
}

export default function BasesDronesMapa({ map, onBaseClick }: Props) {
  const hoverRef      = useRef<mapboxgl.Popup | null>(null);
  const onBaseClickRef = useRef(onBaseClick);
  onBaseClickRef.current = onBaseClick;

  useEffect(() => {
    adicionarLayers(map);

    function onStyleLoad() {
      adicionarLayers(map);
    }
    map.on("style.load", onStyleLoad);

    function onEnter(e: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) {
      if (!e.features?.[0]) return;
      map.getCanvas().style.cursor = "pointer";

      const p = e.features[0].properties as Record<string, string | number>;
      const [lon, lat] = (e.features[0].geometry as GeoJSON.Point).coordinates;

      hoverRef.current?.remove();
      hoverRef.current = new mapboxgl.Popup({
        closeButton: false, closeOnClick: false,
        offset: 14, className: "pyros-tooltip",
      })
        .setLngLat([lon, lat])
        .setHTML(`
          <div style="display:flex;align-items:center;gap:8px;font-family:system-ui;">
            <span style="width:8px;height:8px;border-radius:50%;background:${COR_BASE};box-shadow:0 0 6px ${COR_BASE};flex-shrink:0;"></span>
            <span style="font-size:13px;font-weight:600;">Base ${p.prioridade} — ${p.nome}</span>
            <span style="font-size:10px;font-weight:700;color:${COR_BASE};background:${COR_BASE}22;border:1px solid ${COR_BASE}44;padding:1px 7px;border-radius:20px;">${p.mesorregiao}</span>
          </div>
        `)
        .addTo(map);
    }

    function onLeave() {
      map.getCanvas().style.cursor = "";
      hoverRef.current?.remove();
      hoverRef.current = null;
    }

    function onClick(e: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) {
      if (!e.features?.[0]) return;
      hoverRef.current?.remove();
      const p = e.features[0].properties as Record<string, string | number>;
      const base = BASES.find((b) => b.id === p.id);
      if (base) onBaseClickRef.current(base);
    }

    map.on("mouseenter", "bases-circle", onEnter);
    map.on("mouseleave", "bases-circle", onLeave);
    map.on("click",      "bases-circle", onClick);

    return () => {
      map.off("style.load",                      onStyleLoad);
      map.off("mouseenter", "bases-circle",      onEnter);
      map.off("mouseleave", "bases-circle",      onLeave);
      map.off("click",      "bases-circle",      onClick);
      hoverRef.current?.remove();
      removerLayers(map);
    };
  }, [map]);

  return null;
}
