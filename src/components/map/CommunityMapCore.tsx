"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Incident, getCitizenStatus } from "@/lib/types";

interface CommunityMapCoreProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  isDarkMode?: boolean;
}

// Custom Leaflet Status Pin Generator
const createStatusIcon = (status: any, isSelected: boolean) => {
  const statusInfo = getCitizenStatus(status);
  let color = "#DC2626"; // Red (Under Review)

  if (statusInfo.markerColor === "green") {
    color = "#16A34A"; // Green (Fixed)
  } else if (statusInfo.markerColor === "yellow") {
    color = "#F59E0B"; // Yellow (Work team assigned)
  }

  const size = isSelected ? 34 : 26;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
    ">
      <div style="width: 7px; height: 7px; background: #FFFFFF; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "civion-map-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// Map Pan/Zoom synchronizer
const MapSync: React.FC<{ target?: Incident | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.latitude && target.longitude) {
      map.flyTo([target.latitude, target.longitude], 15, {
        animate: true,
        duration: 1,
      });
    }
  }, [target, map]);
  return null;
};

export const CommunityMapCore: React.FC<CommunityMapCoreProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isDarkMode = true,
}) => {
  const defaultCenter: [number, number] = [11.2588, 75.7804]; // Kozhikode City Center
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // CartoDB Voyager for light mode, Dark Matter for dark mode
  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full min-h-[500px]">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[500px]"
      >
        <MapSync target={selectedIncident} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
          maxZoom={19}
        />

        {incidents.map((inc) => {
          const isSelected = inc.id === selectedIncidentId;
          const statusInfo = getCitizenStatus(inc.status);

          return (
            <Marker
              key={inc.id}
              position={[inc.latitude, inc.longitude]}
              icon={createStatusIcon(inc.status, isSelected)}
              eventHandlers={{
                click: () => onSelectIncident?.(inc),
              }}
            >
              <Popup>
                <div className="p-3 max-w-[280px] space-y-2">
                  {inc.citizenPhotoUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 mb-2">
                      <img
                        src={inc.citizenPhotoUrl}
                        alt={inc.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                      {inc.ticketNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {inc.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    📍 {inc.address}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    Reported on{" "}
                    {new Date(inc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CommunityMapCore;
