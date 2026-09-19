"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { Category, Severity, Incident, User } from "@/lib/types";
import { processCivicAI, compressImageToWebP } from "@/lib/ai-pipeline";
import { 
  X, 
  Upload, 
  Camera, 
  EyeOff, 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Zap,
  MapPin,
  ShieldCheck,
  Cpu
} from "lucide-react";
import confetti from "canvas-confetti";

interface IncidentSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (incident: Incident, isDuplicate: boolean, message?: string) => void;
  currentUser: User;
}

export const IncidentSubmitModal: React.FC<IncidentSubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  currentUser,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("POTHOLE");
  const [wardNumber, setWardNumber] = useState<number>(14);
  const [latitude, setLatitude] = useState<number>(11.2588);
  const [longitude, setLongitude] = useState<number>(75.7680);
  const [address, setAddress] = useState<string>("South Beach Road, Opp. Marine Aquarium, Kozhikode");
  
  // Image & AI states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(2800);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(310);
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.92);
  const [isPrivacyRedacted, setIsPrivacyRedacted] = useState<boolean>(true);
  const [detectedEntities, setDetectedEntities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dedupWarning, setDedupWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleKozhikodePreset = (lat: number, lng: number, addr: string, ward: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setWardNumber(ward);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAI(true);
    try {
      // 1. Client-Side WebP Compression
      const compressed = await compressImageToWebP(file, 1400, 0.82);
      setImagePreview(compressed.dataUrl);
      setOriginalSizeKb(compressed.originalSizeKb);
      setCompressedSizeKb(compressed.compressedSizeKb);

      // 2. AI Privacy & Confidence Pipeline
      const aiResult = processCivicAI(category, description || title, file.name);
      setConfidenceScore(aiResult.confidenceScore);
      setDetectedEntities(aiResult.detectedEntities);
    } catch (err) {
      console.error("Compression error:", err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);

    try {
      // Default placeholder civic image if none uploaded in demo
      const finalImage = imagePreview || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || "Reported via mobile civic client.",
          category,
          wardNumber: Number(wardNumber),
          latitude: Number(latitude),
          longitude: Number(longitude),
          address,
          citizenPhotoUrl: finalImage,
          originalFileSizeKb: originalSizeKb,
          compressedFileSizeKb: compressedSizeKb,
          confidenceScore,
          isPrivacyRedacted,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00f2fe", "#6366f1", "#10b981"],
        });

        onSubmitSuccess(data.incident, data.isDuplicate, data.duplicateMessage);
        onClose();
      } else {
        alert(data.error || "Failed to submit incident.");
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed. Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090d1a] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-lg text-white">
                Submit Municipal Incident
              </h3>
              <p className="text-xs text-slate-400">
                Kozhikode Smart City AI Dispatch Intake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 mt-5">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">
              INCIDENT HEADLINE / SUMMARY *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                const ai = processCivicAI(category, e.target.value);
                setConfidenceScore(ai.confidenceScore);
              }}
              placeholder="e.g. Hazardous Pothole cluster near Mavoor Road bus bay"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Category & Ward Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as Category;
                  setCategory(cat);
                  const ai = processCivicAI(cat, description || title);
                  setConfidenceScore(ai.confidenceScore);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="POTHOLE">Pothole / Road Defect</option>
                <option value="WASTE_DUMPING">Waste Dumping / Sanitation</option>
                <option value="STREETLIGHT">Streetlight / Electrical</option>
                <option value="WATER_LEAKAGE">Water Pipeline Leak</option>
                <option value="DRAINAGE">Drainage / Culvert Clog</option>
                <option value="OTHER">Other Municipal Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">
                WARD NUMBER
              </label>
              <select
                value={wardNumber}
                onChange={(e) => setWardNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value={14}>Ward 14 (South Beach)</option>
                <option value={22}>Ward 22 (Mavoor Road)</option>
                <option value={7}>Ward 07 (SM Street)</option>
                <option value={12}>Ward 12 (Mananchira)</option>
                <option value={31}>Ward 31 (Sarovaram Bio Park)</option>
                <option value={45}>Ward 45 (Medical College)</option>
              </select>
            </div>
          </div>

          {/* Quick Location Presets (Kozhikode Hotspots) */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5 font-semibold">
              <span>LOCATION PRESETS (KOZHIKODE)</span>
              <span className="text-cyan-400 font-normal">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleKozhikodePreset(
                    11.2588,
                    75.7680,
                    "South Beach Road, Opp. Marine Aquarium",
                    14
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                🏖️ Beach Road (W14)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleKozhikodePreset(
                    11.2612,
                    75.7894,
                    "Mavoor Road Junction, Near KSRTC",
                    22
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                🚌 Mavoor Rd (W22)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleKozhikodePreset(
                    11.2514,
                    75.7818,
                    "SM Street Heritage Lane, Palayam",
                    7
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-300 text-left transition-colors"
              >
                🛍️ SM Street (W07)
              </button>
            </div>
          </div>

          {/* Address Text */}
          <div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Exact Street Address / Landmark"
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Image Upload & Client WebP + AI Scrubbing */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-200 font-semibold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                CITIZEN PHOTO PROOF
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                WebP AUTO-COMPRESS (<strong className="text-white">&lt;1MB</strong>)
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/15 h-44 bg-black">
                <img
                  src={imagePreview}
                  alt="Captured Civic Proof"
                  className="w-full h-full object-cover"
                />

                {/* Simulated AI Privacy Scrubbing Overlay */}
                {isPrivacyRedacted && (
                  <>
                    <div className="absolute top-1/4 left-1/3 w-16 h-12 border-2 border-cyan-400 bg-cyan-500/30 backdrop-blur-md rounded flex items-center justify-center">
                      <span className="text-[9px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                        [BLUR: FACE]
                      </span>
                    </div>
                    <div className="absolute bottom-1/4 right-1/4 w-20 h-10 border-2 border-indigo-400 bg-indigo-500/30 backdrop-blur-md rounded flex items-center justify-center">
                      <span className="text-[9px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                        [BLUR: PLATE]
                      </span>
                    </div>
                  </>
                )}

                {/* Compression Specs Badge */}
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/80 border border-white/10 text-[10px] font-mono text-slate-300">
                  {originalSizeKb}KB → <strong className="text-cyan-400">{compressedSizeKb}KB WebP</strong>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 border border-white/20 text-[11px] text-white hover:bg-black"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.02]"
              >
                <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-medium">
                  Click or drag photo of defect
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  PNG, JPG, HEIC automatically converted to WebP
                </p>
              </div>
            )}
          </div>

          {/* AI Confidence Meter & Floor Threshold Status */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-medium">
                AI Confidence Score:
              </span>
              <span
                className={`font-mono font-bold ${
                  confidenceScore >= 0.40 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(confidenceScore * 100).toFixed(0)}%
              </span>
            </div>

            {confidenceScore >= 0.40 ? (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PASSES 0.40 FLOOR
              </span>
            ) : (
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> BELOW 0.40 FLOOR
              </span>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confidenceScore < 0.40}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing PostGIS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Dispatch Issue to Ward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
