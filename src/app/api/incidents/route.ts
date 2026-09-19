import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Category, Severity, Status } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const ward = searchParams.get("ward") ? Number(searchParams.get("ward")) : undefined;
  const search = searchParams.get("search") || undefined;

  const incidents = db.getIncidents({ status, category, ward, search });
  const wards = db.getWards();

  return NextResponse.json({
    success: true,
    count: incidents.length,
    incidents,
    wards,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      category,
      wardNumber,
      latitude,
      longitude,
      address,
      citizenPhotoUrl,
      originalFileSizeKb = 2800,
      compressedFileSizeKb = 320,
      confidenceScore = 0.85,
      isPrivacyRedacted = true,
      reporterId = "usr-citizen-01",
      reporterName = "Rohan Nair",
    } = body;

    if (!title || !category || !latitude || !longitude || !wardNumber) {
      return NextResponse.json(
        { error: "Missing mandatory fields: title, category, latitude, longitude, wardNumber" },
        { status: 400 }
      );
    }

    // 1. Confidence Flooring Guard: < 0.40 rejection
    if (confidenceScore < 0.40) {
      return NextResponse.json(
        {
          error: "REJECTED_INVALID: AI Confidence below 0.40 floor threshold. Defect metadata invalid.",
          status: "REJECTED_INVALID",
        },
        { status: 422 }
      );
    }

    // Default 24-hour SLA deadline for newly reported issues
    const slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // 2. PostGIS 50m Deduplication & Incident Creation
    const { incident, isDuplicate, duplicateMessage } = db.createIncident({
      title,
      description,
      category: category as Category,
      status: "AI_VERIFIED" as Status,
      severity: "MEDIUM" as Severity,
      confidenceScore,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || `Ward ${wardNumber}, Kozhikode, Kerala`,
      wardNumber: Number(wardNumber),
      citizenPhotoUrl: citizenPhotoUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      isPrivacyRedacted,
      originalFileSizeKb,
      compressedFileSizeKb,
      slaDeadline,
      isSlaBreached: false,
      reporterId,
      reporterName,
    });

    return NextResponse.json({
      success: true,
      incident,
      isDuplicate,
      duplicateMessage,
      message: isDuplicate
        ? duplicateMessage
        : "Incident created and dispatched to Kozhikode ward officer with active SLA tracking.",
    });
  } catch (error) {
    console.error("Create incident error:", error);
    return NextResponse.json(
      { error: "Failed to create municipal incident" },
      { status: 500 }
    );
  }
}
