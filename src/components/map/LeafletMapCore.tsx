"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Incident } from "@/lib/types";

interface LeafletMapCoreProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId?: string;
}

// Custom Leaflet Pin Icon Generator with Glowing Effects
const createCustomIcon = (status: string, isSelected: boolean) => {
  let color = "#f59e0b"; // amber for in progress
  let glow = "rgba(245, 158, 11, 0.4)";

  if (status === "RESOLVED") {
    color = "#10b981"; // emerald
    glow = "rgba(16, 185, 129, 0.4)";
  } else if (status === "ESCALATED_SLA") {
    color = "#f43f5e"; // rose
    glow = "rgba(244, 63, 94, 0.6)";
  } else if (status === "AI_VERIFIED") {
    color = "#00f2fe"; // cyan
    glow = "rgba(0, 242, 254, 0.4)";
  }

  const html = `
    <div style="
      position: relative;
      width: ${isSelected ? "32px" : "26px"};
      height: ${isSelected ? "32px" : "26px"};
      background: ${color};
      border-radius: 50%;
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 16px ${glow}, 0 4px 6px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      transform: ${isSelected ? "scale(1.2)" : "scale(1)"};
    ">
      <div style="width: 8px; height: 8px; background: #050508; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-map-pin",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
};

// Component to handle pan to selected incident
const MapUpdater: React.FC<{ selectedIncident?: Incident }> = ({ selectedIncident }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 16, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedIncident, map]);
  return null;
};

export const LeafletMapCore: React.FC<LeafletMapCoreProps> = ({
  incidents,
  onSelectIncident,
  selectedIncidentId,
}) => {
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);
  const kozhikodeCenter: [number, number] = [11.2588, 75.7804];

  const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !cartoApiKey) {
      console.warn(
        "[Civion Map] NEXT_PUBLIC_CARTO_API_KEY is not configured. To enable high-resolution CARTO basemap tiles without key notices, add NEXT_PUBLIC_CARTO_API_KEY to your .env.local file or Vercel Environment Variables."
      );
    }
  }, [cartoApiKey]);

  const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : "";
  const tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`;

  return (
    <div className="w-full h-[550px]">
      <MapContainer
        center={kozhikodeCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapUpdater selectedIncident={selectedIncident} />

        {/* CartoDB Dark Matter High-Performance Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          maxZoom={19}
        />

        {incidents.map((inc) => {
          const isSelected = inc.id === selectedIncidentId;
          return (
            <React.Fragment key={inc.id}>
              {/* 50m PostGIS Spatial Deduplication Inspection Radius Circle */}
              <Circle
                center={[inc.latitude, inc.longitude]}
                radius={50}
                pathOptions={{
                  color: inc.status === "RESOLVED" ? "#10b981" : inc.status === "ESCALATED_SLA" ? "#f43f5e" : "#00f2fe",
                  fillColor: inc.status === "RESOLVED" ? "#10b981" : inc.status === "ESCALATED_SLA" ? "#f43f5e" : "#00f2fe",
                  fillOpacity: isSelected ? 0.25 : 0.1,
                  weight: isSelected ? 2 : 1,
                  dashArray: "4, 6",
                }}
              />

              {/* Marker with Popup */}
              <Marker
                position={[inc.latitude, inc.longitude]}
                icon={createCustomIcon(inc.status, isSelected)}
                eventHandlers={{
                  click: () => onSelectIncident(inc),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                      <span className="font-bold">{inc.ticketNumber}</span>
                      <span className="text-slate-400">Ward {inc.wardNumber}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white mb-1 leading-tight">
                      {inc.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
                      {inc.address}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono">
                      <span className="text-slate-400">
                        Status: <strong className="text-white">{inc.status}</strong>
                      </span>
                      <button
                        onClick={() => onSelectIncident(inc)}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        Inspect Details →
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
