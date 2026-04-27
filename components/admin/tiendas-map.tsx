"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Tienda {
  id: string;
  nombre: string;
  isla: string;
  lat: number | null;
  lng: number | null;
  activo: boolean;
  direccion?: string | null;
}

// ── Pin SVG con la paleta TQ ──────────────────────────────
function pinSvg(active: boolean): string {
  const fill = active ? "url(#tqGrad)" : "#94a3b8";
  const dot = active ? "#C8A164" : "#cbd5e1";
  return `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,68,107,0.35));">
      <defs>
        <linearGradient id="tqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0099F2"/>
          <stop offset="100%" stop-color="#00557F"/>
        </linearGradient>
      </defs>
      <path d="M15 0 C 6.7 0 0 6.7 0 15 C 0 26 15 40 15 40 C 15 40 30 26 30 15 C 30 6.7 23.3 0 15 0 Z"
            fill="${fill}" />
      <circle cx="15" cy="14" r="5.5" fill="${dot}" />
      <circle cx="15" cy="14" r="5.5" fill="none" stroke="white" stroke-width="1.5" />
    </svg>
  `;
}

const tqIcon = L.divIcon({
  className: "tq-map-pin",
  html: pinSvg(true),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

const inactiveIcon = L.divIcon({
  className: "tq-map-pin",
  html: pinSvg(false),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

function FitBounds({ tiendas }: { tiendas: Tienda[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = tiendas
      .filter((t) => t.lat != null && t.lng != null)
      .map((t) => [t.lat as number, t.lng as number] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 14);
    } else {
      map.fitBounds(pts, { padding: [40, 40] });
    }
  }, [tiendas, map]);
  return null;
}

export default function TiendasMap({ tiendas }: { tiendas: Tienda[] }) {
  const geo = tiendas.filter((t) => t.lat != null && t.lng != null);

  if (geo.length === 0) {
    return (
      <div className="rounded-xl border border-tq-ink/10 bg-tq-paper/50 p-10 text-center">
        <p className="font-display text-tq-ink/70 text-lg">
          Aún no hay tiendas con coordenadas.
        </p>
        <p className="text-sm text-tq-ink/50 mt-1.5">
          Edita una tienda y añade su latitud/longitud para verla en el mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-tq-ink/15 shadow-tq-soft">
      <MapContainer
        center={[28.42, -16.55]}
        zoom={10}
        scrollWheelZoom
        style={{ height: 520, width: "100%" }}
        className="font-body"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds tiendas={geo} />

        {geo.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat as number, t.lng as number]}
            icon={t.activo ? tqIcon : inactiveIcon}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-display text-[15px] text-tq-ink leading-tight mb-1">
                  {t.nombre}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-tq-gold2 font-semibold">
                  {t.isla}
                </p>
                {t.direccion && (
                  <p className="text-xs text-tq-ink/70 mt-2">{t.direccion}</p>
                )}
                <p className="text-[10px] text-tq-ink/50 mt-2">
                  {t.activo ? "● Activa" : "○ Inactiva"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
