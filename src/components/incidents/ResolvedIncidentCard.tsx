"use client";

import React, { useState, useRef, MouseEvent, TouchEvent, KeyboardEvent } from "react";
import { ResolvedShowcaseIncident } from "@/lib/resolved-showcase-data";
import { MapPin, Check, ChevronsLeftRight } from "lucide-react";

interface ResolvedIncidentCardProps {
  incident: ResolvedShowcaseIncident;
}

export const ResolvedIncidentCard: React.FC<ResolvedIncidentCardProps> = ({ incident }) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (e.touches[0]) updatePosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.touches[0]) updatePosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(5, prev - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(95, prev + 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSliderPosition(10);
    } else if (e.key === "End") {
      e.preventDefault();
      setSliderPosition(90);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Top Header Row */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Category Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${incident.categoryTheme.badgeBg} ${incident.categoryTheme.badgeText} ${incident.categoryTheme.badgeBorder}`}
          >
            <span>{incident.categoryIcon}</span>
            <span>{incident.categoryLabel}</span>
          </div>

          {/* Fixed Status Pill */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 dark:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Fixed</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mb-1">
          {incident.title}
        </h3>

        {/* Location */}
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
          <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span>{incident.location}</span>
        </p>

        {/* Image Comparison Viewport */}
        <div
          ref={containerRef}
          role="slider"
          aria-label={`Compare before and after for ${incident.title}`}
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[16/10] sm:aspect-[16/10] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-200 dark:border-slate-700 bg-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {/* Complete Source Image (Contains Before on left and After on right) */}
          <img
            src={incident.comparisonImage}
            alt={`${incident.title} Before and After Municipal Fix`}
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
          />

          {/* "Before" Tag (Top-Left) */}
          <div className="absolute top-3.5 left-3.5 z-20 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-bold text-xs sm:text-sm shadow-md pointer-events-none">
            Before
          </div>

          {/* "After" Tag (Top-Right) */}
          <div className="absolute top-3.5 right-3.5 z-20 px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs sm:text-sm shadow-md pointer-events-none">
            After
          </div>

          {/* Draggable Vertical Divider */}
          <div
            className="absolute top-0 bottom-0 z-30 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Center Handle Button with < > Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center pointer-events-auto">
              <ChevronsLeftRight className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Resolution Box */}
      <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <strong className="font-extrabold text-emerald-900 dark:text-emerald-300 mr-1">
            Resolution:
          </strong>
          <span>{incident.resolution}</span>
        </div>
      </div>
    </div>
  );
};

export default ResolvedIncidentCard;
