"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Foco } from "@/lib/api";

const COR: Record<string, string> = {
  CRITICO:     "#DC2626",
  ALERTA:      "#F59E0B",
  MONITORANDO: "#FACC15",
};


function toGeoJSON(focos: Foco[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: focos.map((f) => ({
      type:       "Feature" as const,
      geometry:   { type: "Point" as const, coordinates: [f.lon, f.lat] },
      properties: { ...f },
    })),
  };
}

function adicionarLayers(map: mapboxgl.Map, data: GeoJSON.FeatureCollection) {
  if (!map.getSource("focos")) {
    map.addSource("focos", { type: "geojson", data });
  } else {
    (map.getSource("focos") as mapboxgl.GeoJSONSource).setData(data);
    return; // layers já existem
  }

  const corExpression = ["case",
    ["==", ["get", "nivel"], "CRITICO"], "#EF4444",
    ["==", ["get", "nivel"], "ALERTA"],  "#F59E0B",
    "#FACC15",
  ];

  // Glow — emissive para não ser afetado pela iluminação do estilo
  map.addLayer({
    id: "focos-glow", type: "circle", source: "focos",
    paint: {
      "circle-radius":            ["interpolate", ["linear"], ["zoom"], 4, 14, 12, 36],
      "circle-color":             corExpression,
      "circle-opacity":           0.12,
      "circle-blur":              1,
      "circle-emissive-strength": 1,
    } as object,
  });

  // Círculo principal — emissive garante cor correta em ambos os modos
  map.addLayer({
    id: "focos-circle", type: "circle", source: "focos",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"],
        4,  ["case", ["==", ["get", "nivel"], "CRITICO"], 5,  ["==", ["get", "nivel"], "ALERTA"], 4,  3],
        10, ["case", ["==", ["get", "nivel"], "CRITICO"], 10, ["==", ["get", "nivel"], "ALERTA"], 8,  6],
        16, ["case", ["==", ["get", "nivel"], "CRITICO"], 16, ["==", ["get", "nivel"], "ALERTA"], 12, 9],
      ],
      "circle-color":             corExpression,
      "circle-stroke-width":      1.5,
      "circle-stroke-color":      "rgba(255,255,255,0.5)",
      "circle-opacity":           1,
      "circle-emissive-strength": 1,
    } as object,
  });
}

function removerLayers(map: mapboxgl.Map) {
  try {
    if (map.getLayer("focos-circle")) map.removeLayer("focos-circle");
    if (map.getLayer("focos-glow"))   map.removeLayer("focos-glow");
    if (map.getSource("focos"))       map.removeSource("focos");
  } catch { /* mapa destruído */ }
}

interface Props {
  map:          mapboxgl.Map;
  focos:        Foco[];
  onFocoClick:  (foco: Foco) => void;
}

export default function FocosMapa({ map, focos, onFocoClick }: Props) {
  const hoverRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    const data = toGeoJSON(focos);

    // Adiciona ou atualiza layers
    adicionarLayers(map, data);

    // Re-adiciona após troca de estilo (setStyle apaga tudo)
    function onStyleLoad() {
      adicionarLayers(map, toGeoJSON(focos));
    }
    map.on("style.load", onStyleLoad);

    // ── Hover ────────────────────────────────────────────────
    function onEnter(e: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) {
      if (!e.features?.[0]) return;
      map.getCanvas().style.cursor = "pointer";

      const p   = e.features[0].properties as Record<string, string>;
      const cor = COR[p.nivel] ?? "#FACC15";
      const [lon, lat] = (e.features[0].geometry as GeoJSON.Point).coordinates;

      hoverRef.current?.remove();
      hoverRef.current = new mapboxgl.Popup({
        closeButton: false, closeOnClick: false,
        offset: 12, className: "pyros-tooltip",
      })
        .setLngLat([lon, lat])
        .setHTML(`
          <div style="display:flex;align-items:center;gap:8px;font-family:system-ui;">
            <span style="width:8px;height:8px;border-radius:50%;background:${cor};box-shadow:0 0 6px ${cor};flex-shrink:0;"></span>
            <span style="font-size:13px;font-weight:600;">${p.cidade}</span>
            <span style="font-size:10px;font-weight:700;color:${cor};background:${cor}22;border:1px solid ${cor}44;padding:1px 7px;border-radius:20px;">${p.nivel}</span>
          </div>
        `)
        .addTo(map);
    }

    function onLeave() {
      map.getCanvas().style.cursor = "";
      hoverRef.current?.remove();
      hoverRef.current = null;
    }

    // ── Click — abre o painel lateral ────────────────────────
    function onClick(e: mapboxgl.MapMouseEvent & { features?: GeoJSON.Feature[] }) {
      if (!e.features?.[0]) return;
      hoverRef.current?.remove();

      const p = e.features[0].properties as Record<string, string | number>;
      const foco: Foco = {
        lat:        Number(p.lat),
        lon:        Number(p.lon),
        brightness: Number(p.brightness),
        nivel:      String(p.nivel) as Foco["nivel"],
        cidade:     String(p.cidade),
        dist_km:    Number(p.dist_km),
        satelite:   String(p.satelite),
        data:       String(p.data),
        hora:       String(p.hora),
        frp:        String(p.frp),
        confidence: String(p.confidence),
        daynight:   String(p.daynight),
      };
      onFocoClick(foco);
    }

    map.on("mouseenter", "focos-circle", onEnter);
    map.on("mouseleave", "focos-circle", onLeave);
    map.on("click",      "focos-circle", onClick);

    return () => {
      map.off("style.load",                    onStyleLoad);
      map.off("mouseenter", "focos-circle",    onEnter);
      map.off("mouseleave", "focos-circle",    onLeave);
      map.off("click",      "focos-circle",    onClick);
      hoverRef.current?.remove();
      removerLayers(map);
    };
  }, [focos, map]);

  return null;
}
