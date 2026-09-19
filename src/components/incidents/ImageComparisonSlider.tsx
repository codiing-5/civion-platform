"use client";

import React, { useState, useRef, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, Camera, Sparkles, SlidersHorizontal } from "lucide-react";

interface ImageComparisonSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  ticketNumber: string;
  title: string;
  resolutionNotes?: string;
  officerName?: string;
  resolvedDate?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeImageUrl,
  afterImageUrl,
  ticketNumber,
  title,
  resolutionNotes,
  officerName,
  resolvedDate,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="rounded-2xl bg-[#090d1a] border border-white/10 p-6 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              RESOLVED &amp; VERIFIED
            </span>
            <span className="font-mono text-xs text-slate-400">{ticketNumber}</span>
          </div>
          <h3 className="font-syne font-bold text-lg text-white">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Drag Slider to Compare Proof</span>
        </div>
      </div>

      {/* Comparison Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[380px] sm:h-[460px] rounded-xl overflow-hidden cursor-ew-resize select-none border border-white/10 shadow-inner bg-black"
      >
        {/* AFTER IMAGE (Background / Full Width) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={afterImageUrl}
            alt="Officer Resolution Proof"
            className="w-full h-full object-cover"
          />
          {/* After Tag */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>AFTER: REPAIRED PROOF</span>
          </div>
        </div>

        {/* BEFORE IMAGE (Clipped by slider position) */}
        <div
          className="absolute inset-0 h-full overflow-hidden z-10"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImageUrl}
            alt="Citizen Reported Incident Proof"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
            }}
          />
          {/* Before Tag */}
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <Camera className="w-3.5 h-3.5 text-rose-400" />
            <span>BEFORE: CITIZEN REPORT</span>
          </div>
        </div>

        {/* Vertical Divider Bar */}
        <div
          className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-[0_0_15px_rgba(0,242,254,1)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-cyan-400 border-2 border-white shadow-xl flex items-center justify-center text-slate-950">
            <SlidersHorizontal className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {/* Resolution Audit Footer */}
      <div className="mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold text-slate-200">
            Officer Notes:{" "}
            <span className="text-slate-400 font-normal">
              {resolutionNotes || "Site cleared, sanitized, and certified by Kozhikode Ward 14 Sanitation Squad."}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            Inspected by <strong className="text-slate-300">{officerName || "K. V. Suresh Kumar"}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>SLA Fulfilled &amp; Cryptographically Logged</span>
        </div>
      </div>
    </div>
  );
};
