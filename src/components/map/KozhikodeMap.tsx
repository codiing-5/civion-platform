"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Incident, Status, Category } from "@/lib/types";
import { 
  MapPin, 
  Layers, 
  Filter, 
  Compass, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Shield,
  Eye
} from "lucide-react";

interface KozhikodeMapProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId?: string;
  onOpenReportModalWithCoords?: (lat: number, lng: number, address: string) => void;
}

// Leaflet dynamic map wrapper to prevent SSR hydration mismatches
const LeafletMapCore = dynamic(
  () =>
    import("./LeafletMapCore").then((mod) => mod.LeafletMapCore),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] bg-[#090d19] rounded-2xl flex flex-col items-center justify-center border border-white/10 text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mb-3" />
        <p className="font-mono text-xs">Initializing Kozhikode Spatial Vector Tiles...</p>
      </div>
    ),
  }
);

export const KozhikodeMap: React.FC<KozhikodeMapProps> = ({
  incidents,
  onSelectIncident,
  selectedIncidentId,
  onOpenReportModalWithCoords,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [selectedWard, setSelectedWard] = useState<string>("ALL");

  const venues = [
    { name: "Beach Road", lat: 11.2588, lng: 75.7680, ward: 14 },
    { name: "Mavoor Road", lat: 11.2612, lng: 75.7894, ward: 22 },
    { name: "SM Street", lat: 11.2514, lng: 75.7818, ward: 7 },
    { name: "Mananchira", lat: 11.2541, lng: 75.7788, ward: 12 },
    { name: "Sarovaram Park", lat: 11.2721, lng: 75.8012, ward: 31 },
    { name: "Medical College", lat: 11.2736, lng: 75.8365, ward: 45 },
  ];

  const filteredIncidents = incidents.filter((inc) => {
    if (activeCategory !== "ALL" && inc.category !== activeCategory) return false;
    if (activeStatus !== "ALL" && inc.status !== activeStatus) return false;
    if (selectedWard !== "ALL" && inc.wardNumber !== Number(selectedWard)) return false;
    return true;
  });

  return (
    <section id="map-section" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Map Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>GEOSPATIAL POSTGIS RADAR</span>
            </div>
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">
              Live Kozhikode Incident Matrix
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Real-time PostGIS spatial clusters with sub-50m deduplication radius overlays.
            </p>
          </div>

          {/* Quick Location Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-slate-400 mr-1">Hotspots:</span>
            {venues.map((v) => (
              <button
                key={v.name}
                onClick={() => {
                  setSelectedWard(String(v.ward));
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  selectedWard === String(v.ward)
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                    : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {v.name} (W{v.ward})
              </button>
            ))}
            {selectedWard !== "ALL" && (
              <button
                onClick={() => setSelectedWard("ALL")}
                className="text-xs px-2 py-1 rounded-lg text-rose-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 rounded-xl bg-[#0a0d18] border border-white/10 backdrop-blur-md mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Category:
            </span>
            {["ALL", "POTHOLE", "WASTE_DUMPING", "STREETLIGHT", "WATER_LEAKAGE", "DRAINAGE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            {["ALL", "SUBMITTED", "IN_PROGRESS", "RESOLVED", "ESCALATED_SLA"].map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatus(st)}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeStatus === st
                    ? "bg-indigo-500 text-white font-bold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas & Interactive Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2-Columns Map View */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <LeafletMapCore
              incidents={filteredIncidents}
              onSelectIncident={onSelectIncident}
              selectedIncidentId={selectedIncidentId}
            />
            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-black/80 backdrop-blur-md border border-white/10 p-2.5 rounded-xl text-[11px] font-mono text-slate-300 space-y-1">
              <div className="font-bold text-white mb-1">Spatial Status Codes</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Resolved (Cleaned)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> In Progress (Active)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> SLA Breached (Escalated)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-400/30" /> 50m Deduplication Zone
              </div>
            </div>
          </div>

          {/* Incident List Inspector Sidebar */}
          <div className="rounded-2xl bg-[#090d1a] border border-white/10 p-4 h-[550px] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="font-syne font-bold text-sm text-white">
                  Active Ward Tickets ({filteredIncidents.length})
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  PostGIS Indexed
                </span>
              </div>

              <div className="space-y-3">
                {filteredIncidents.map((inc) => {
                  const isSelected = inc.id === selectedIncidentId;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10"
                          : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-bold text-cyan-300">
                          {inc.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            inc.status === "RESOLVED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : inc.status === "ESCALATED_SLA"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">
                        {inc.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        {inc.address}
                      </p>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Ward {inc.wardNumber}</span>
                        <span className="text-cyan-400 font-semibold">
                          Score: {Math.round(inc.confidenceScore * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 text-center">
              <span className="text-[11px] text-slate-400">
                Click any ticket or pin on map to inspect details &amp; before/after proof.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
