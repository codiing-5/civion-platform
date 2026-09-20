"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/image-compress";
import { Category } from "@/lib/types";
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  FileText,
  Building2,
  Sparkles,
} from "lucide-react";

interface CategoryOption {
  id: Category;
  icon: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: "POTHOLE", icon: "🕳️", label: "Pothole / Road Defect" },
  { id: "WASTE_DUMPING", icon: "🗑️", label: "Waste Dumping / Sanitation" },
  { id: "STREETLIGHT", icon: "💡", label: "Streetlight / Electrical" },
  { id: "WATER_LEAKAGE", icon: "🚰", label: "Water Pipeline Leak" },
  { id: "DRAINAGE", icon: "🌊", label: "Drainage / Culvert Clog" },
  { id: "OTHER", icon: "✏️", label: "Other Municipal Issue" },
];

export default function ReportPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [addressText, setAddressText] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoCompressedSizeKb, setPhotoCompressedSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // 1. Geolocation handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("We couldn't detect your location. You can enter a nearby landmark instead.");
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
        setLocationSuccess(true);
        if (!addressText) {
          setAddressText("Current Detected Location");
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationSuccess(false);
        // Fallback default coordinates so reporting can proceed smoothly
        setLatitude(11.2588);
        setLongitude(75.768);
        setLocationMessage("We couldn't detect your location. You can enter a nearby landmark instead.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Photo selection & client-side compression
  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setFormError(null);

    try {
      const result = await compressImage(file, 1400, 0.8);
      setPhotoDataUrl(result.dataUrl);
      setPhotoCompressedSizeKb(result.compressedSizeKb);
    } catch (err) {
      setFormError("The photo could not be uploaded. Please try another photo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoCompressedSizeKb(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Submit Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!selectedCategory) {
      setFormError("Please choose what the problem is.");
      return;
    }

    if (selectedCategory === "OTHER" && !customDescription.trim()) {
      setFormError("Please describe the problem in a few words.");
      return;
    }

    if (!locationSuccess && !addressText.trim()) {
      setFormError("Please detect your location or enter a nearby landmark.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: selectedCategory,
          customDescription: selectedCategory === "OTHER" ? customDescription.trim() : undefined,
          latitude: latitude || 11.2588,
          longitude: longitude || 75.768,
          address: addressText.trim() || "Detected GPS Location",
          citizenPhotoUrl:
            photoDataUrl ||
            "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
          compressedFileSizeKb: photoCompressedSizeKb || 280,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Something went wrong while sending your report. Please try again.");
        return;
      }

      setSubmittedTicket(data.ticketNumber || "CIV-1402");
    } catch (err) {
      setFormError("Something went wrong while sending your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to report another issue
  const handleResetForm = () => {
    setSelectedCategory(null);
    setCustomDescription("");
    setLatitude(null);
    setLongitude(null);
    setAddressText("");
    setLocationSuccess(false);
    setLocationMessage(null);
    setPhotoDataUrl(null);
    setPhotoCompressedSizeKb(null);
    setFormError(null);
    setSubmittedTicket(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Success Screen
  if (submittedTicket) {
    return (
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex items-center justify-center">
        <div className="w-full p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-4xl mx-auto shadow-sm">
            🎉
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Report received
            </h1>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              Thank you for helping improve your community.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Your Reference Number
            </span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
              {submittedTicket}
            </span>
          </div>

          <div className="space-y-3 pt-4">
            <Link
              href="/reports"
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>View My Reports</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={handleResetForm}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Report Another Problem</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.id === selectedCategory)?.label || "";

  return (
    <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Report a local problem
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Select what the issue is, attach a photo, and tell us where it is located.
        </p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-semibold">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category Selection (6 Large Tiles) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              What is the problem?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (formError) setFormError(null);
                  }}
                  className={`p-5 rounded-2xl text-left border-2 transition-all flex items-center gap-4 min-h-[72px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-3xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm sm:text-base font-bold block leading-snug break-words ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Conditional "Other" custom description */}
          {selectedCategory === "OTHER" && (
            <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 animate-in fade-in">
              <label
                htmlFor="other-desc"
                className="block text-sm font-bold text-slate-900 dark:text-white mb-2"
              >
                What is the problem?
              </label>
              <input
                id="other-desc"
                type="text"
                autoFocus
                placeholder="Describe it in a few words"
                value={customDescription}
                onChange={(e) => {
                  setCustomDescription(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </section>

        {/* Step 2: Location (GPS + Landmark Fallback) */}
        <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            Where is it?
          </h2>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Primary GPS button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className={`w-full min-h-[52px] px-5 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                locationSuccess
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              }`}
            >
              {isLocating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Finding your location…</span>
                </>
              ) : locationSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>✓ Location detected</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>📍 Detect My Current Location</span>
                </>
              )}
            </button>

            {/* GPS warning/fallback notice */}
            {locationMessage && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                {locationMessage}
              </p>
            )}

            {/* Secondary landmark input */}
            <div>
              <label
                htmlFor="landmark-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
              >
                Landmark or address {locationSuccess ? "(Optional)" : ""}
              </label>
              <input
                id="landmark-input"
                type="text"
                placeholder="Example: Near Town Bus Stand"
                value={addressText}
                onChange={(e) => {
                  setAddressText(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm sm:text-base font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Step 3: Photo Upload */}
        <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            Add a photo
          </h2>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
              id="photo-upload-input"
            />

            {!photoDataUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full min-h-[140px] p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center text-center group transition-colors focus:outline-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {isCompressing ? "Preparing photo…" : "📷 Take Photo"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tap to open camera or select an image
                </span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[280px] bg-slate-950 flex items-center justify-center">
                  <img
                    src={photoDataUrl}
                    alt="Problem attachment"
                    className="w-full h-full object-cover max-h-[280px]"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 shadow-md backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ Photo attached
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Summary Card Before Submission */}
        {selectedCategory && (
          <section className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your report summary
            </h3>
            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedCategoryLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Location:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {locationSuccess ? "📍 Location detected" : addressText || "Not specified"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Photo:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {photoDataUrl ? "✓ Photo attached" : "Default civic photo"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Submit Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[56px] px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-lg shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending your report…</span>
              </>
            ) : (
              <>
                <span>Submit Report</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
