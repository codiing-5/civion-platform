"use client";

import React, { useState, useRef, MouseEvent, TouchEvent } from "react";
import { CheckCircle2, Camera, SlidersHorizontal, MapPin } from "lucide-react";

interface ImageComparisonSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  ticketNumber?: string;
  title: string;
  location?: string;
  resolutionNotes?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeImageUrl,
  afterImageUrl,
  ticketNumber,
  title,
  location,
  resolutionNotes,
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
    <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fixed &amp; Verified</span>
            </span>
            {ticketNumber && (
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {ticketNumber}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
            {title}
          </h3>
          {location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 self-start sm:self-auto">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Drag slider to compare</span>
        </div>
      </div>

      {/* Comparison Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-200 dark:border-slate-700 bg-slate-900"
      >
        {/* AFTER IMAGE (Background / Full Width) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={afterImageUrl}
            alt="Repaired municipal infrastructure"
            className="w-full h-full object-cover"
          />
          {/* After Tag */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>AFTER: FIXED</span>
          </div>
        </div>

        {/* BEFORE IMAGE (Clipped by slider position) */}
        <div
          className="absolute inset-0 h-full overflow-hidden z-10"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImageUrl}
            alt="Reported problem"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
            }}
          />
          {/* Before Tag */}
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
            <Camera className="w-4 h-4" />
            <span>BEFORE: REPORTED</span>
          </div>
        </div>

        {/* Vertical Divider Bar */}
        <div
          className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-[0_0_12px_rgba(37,99,235,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <SlidersHorizontal className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {/* Resolution Notes Footer */}
      {resolutionNotes && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <strong className="text-emerald-600 dark:text-emerald-400">Resolution:</strong>{" "}
          {resolutionNotes}
        </div>
      )}
    </div>
  );
};

export default ImageComparisonSlider;
