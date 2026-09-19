import { Category, Severity, Status } from "./types";

export interface BoundingBox {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number;
  height: number;
  type: "FACE" | "LICENSE_PLATE";
  confidence: number;
}

export interface AIPipelineResult {
  category: Category;
  confidenceScore: number;
  severity: Severity;
  detectedEntities: string[];
  privacyBoundingBoxes: BoundingBox[];
  status: Status;
  isPrivacyCompliant: boolean;
  compressionRatio: number;
  rejectionReason?: string;
}

/**
 * Simulates the Gemini Vision / Computer Vision municipal classifier.
 * Evaluates issue authenticity, categories, severity, and detects faces/plates for blurring.
 */
export function processCivicAI(
  category: Category,
  description: string,
  fileName?: string
): AIPipelineResult {
  // Deterministic high-confidence heuristic based on civic keywords
  const descLower = description.toLowerCase();
  let baseScore = 0.88;

  // Category keyword scoring
  if (category === "POTHOLE" && (descLower.includes("crater") || descLower.includes("road") || descLower.includes("pothole") || descLower.includes("asphalt"))) {
    baseScore = 0.96;
  } else if (category === "WASTE_DUMPING" && (descLower.includes("garbage") || descLower.includes("waste") || descLower.includes("plastic") || descLower.includes("dump"))) {
    baseScore = 0.94;
  } else if (category === "WATER_LEAKAGE" && (descLower.includes("pipe") || descLower.includes("water") || descLower.includes("burst") || descLower.includes("leak"))) {
    baseScore = 0.95;
  } else if (category === "STREETLIGHT" && (descLower.includes("light") || descLower.includes("lamp") || descLower.includes("dark") || descLower.includes("wire"))) {
    baseScore = 0.91;
  } else if (category === "DRAINAGE" && (descLower.includes("drain") || descLower.includes("clog") || descLower.includes("flood") || descLower.includes("gutter"))) {
    baseScore = 0.92;
  } else if (description.trim().length < 10) {
    baseScore = 0.35; // Trigger auto-rejection due to low confidence / insufficient metadata
  }

  // Severity assignment
  let severity: Severity = "MEDIUM";
  if (descLower.includes("danger") || descLower.includes("burst") || descLower.includes("accident") || descLower.includes("hospital") || descLower.includes("urgent")) {
    severity = "CRITICAL";
  } else if (descLower.includes("heavy") || descLower.includes("overflow") || descLower.includes("traffic")) {
    severity = "HIGH";
  } else if (descLower.includes("minor") || descLower.includes("small")) {
    severity = "LOW";
  }

  // Auto-rejection threshold: < 0.40 confidence
  const isRejected = baseScore < 0.40;
  const status: Status = isRejected ? "REJECTED_INVALID" : "AI_VERIFIED";

  // Simulated AI detected bounding boxes for privacy scrubbing (faces + vehicle plates)
  const privacyBoundingBoxes: BoundingBox[] = [
    {
      x: 28,
      y: 35,
      width: 14,
      height: 18,
      type: "FACE",
      confidence: 0.93,
    },
    {
      x: 64,
      y: 72,
      width: 22,
      height: 10,
      type: "LICENSE_PLATE",
      confidence: 0.97,
    },
  ];

  return {
    category,
    confidenceScore: Math.round(baseScore * 100) / 100,
    severity,
    detectedEntities: [
      `${category.toLowerCase().replace("_", " ")} pattern`,
      "urban road infrastructure",
      "spatial coordinate timestamp",
    ],
    privacyBoundingBoxes,
    status,
    isPrivacyCompliant: true,
    compressionRatio: 88.5, // e.g. 2.8MB down to 320KB
    rejectionReason: isRejected
      ? "AI Confidence below 0.40 floor threshold. Image content or description does not match validated municipal incident parameters."
      : undefined,
  };
}

/**
 * Client-side canvas helper: converts an image file into WebP under 1MB.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.82
): Promise<{ blob: Blob; dataUrl: string; originalSizeKb: number; compressedSizeKb: number }> {
  return new Promise((resolve, reject) => {
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to obtain 2D canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP
        const dataUrl = canvas.toDataURL("image/webp", quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion blob failed"));
              return;
            }
            const compressedSizeKb = Math.round(blob.size / 1024);
            resolve({ blob, dataUrl, originalSizeKb, compressedSizeKb });
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load source image file"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
