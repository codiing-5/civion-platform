import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Category, Status } from "@/lib/types";
import { verifyRoleToken } from "@/lib/auth";

// Citizen Category Titles
const CATEGORY_NAMES: Record<Category, string> = {
  POTHOLE: "Pothole / Road Defect",
  WASTE_DUMPING: "Waste Dumping / Sanitation",
  STREETLIGHT: "Streetlight / Electrical",
  WATER_LEAKAGE: "Water Pipeline Leak",
  DRAINAGE: "Drainage / Culvert Clog",
  OTHER: "Other Municipal Issue",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const myReports = searchParams.get("myReports") === "true";
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  let reporterId: string | undefined = undefined;

  if (myReports) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Please log in to view your submitted reports." }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyRoleToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }
    reporterId = payload.userId;
  }

  const rawIncidents = db.getIncidents({ reporterId, status, category, search });

  // Sanitize incidents for citizen-safe consumption (strip private numbers and backend-only AI metadata)
  const incidents = rawIncidents.map((inc) => ({
    id: inc.id,
    ticketNumber: inc.ticketNumber,
    title: inc.title,
    description: inc.description,
    customDescription: inc.customDescription,
    category: inc.category,
    status: inc.status,
    latitude: inc.latitude,
    longitude: inc.longitude,
    address: inc.address,
    wardNumber: inc.wardNumber,
    citizenPhotoUrl: inc.citizenPhotoUrl,
    resolutionPhotoUrl: inc.resolutionPhotoUrl,
    resolvedNotes: inc.resolvedNotes,
    createdAt: inc.createdAt,
    updatedAt: inc.updatedAt,
    resolvedAt: inc.resolvedAt,
    isMine: reporterId ? inc.reporterId === reporterId : false,
  }));

  return NextResponse.json({
    success: true,
    count: incidents.length,
    incidents,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let reporterId = "usr-citizen-guest";
    let reporterName = "Citizen";
    let reporterPhone = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyRoleToken(token);
      if (payload) {
        reporterId = payload.userId;
        reporterName = payload.name;
        reporterPhone = payload.phone;
      }
    }

    const body = await req.json();
    const {
      category,
      customDescription,
      latitude,
      longitude,
      address,
      citizenPhotoUrl,
      originalFileSizeKb = 2400,
      compressedFileSizeKb = 280,
    } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Please choose what the problem is." },
        { status: 400 }
      );
    }

    if (!latitude || !longitude) {
      if (!address || address.trim().length === 0) {
        return NextResponse.json(
          { error: "Please detect your location or enter a nearby landmark." },
          { status: 400 }
        );
      }
    }

    if (category === "OTHER" && (!customDescription || customDescription.trim().length === 0)) {
      return NextResponse.json(
        { error: "Please describe the problem in a few words." },
        { status: 400 }
      );
    }

    const categoryTitle = CATEGORY_NAMES[category as Category] || "Municipal Issue";
    const title = category === "OTHER" && customDescription ? customDescription : categoryTitle;
    const description =
      customDescription ||
      `Citizen reported ${categoryTitle.toLowerCase()} near ${address || "detected location"}.`;

    // Estimate ward number from location or default
    const wardNumber = 14;

    const { incident, isDuplicate, duplicateMessage } = db.createIncident({
      title,
      description,
      customDescription,
      category: category as Category,
      latitude: Number(latitude) || 11.2588,
      longitude: Number(longitude) || 75.768,
      address: address || "Near Detected Location, Kozhikode",
      wardNumber,
      citizenPhotoUrl:
        citizenPhotoUrl ||
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      reporterId,
      reporterName,
      reporterPhone,
      originalFileSizeKb,
      compressedFileSizeKb,
      confidenceScore: 0.92,
    });

    return NextResponse.json({
      success: true,
      ticketNumber: incident.ticketNumber,
      incident: {
        id: incident.id,
        ticketNumber: incident.ticketNumber,
        title: incident.title,
        category: incident.category,
        status: incident.status,
        address: incident.address,
        createdAt: incident.createdAt,
      },
      isDuplicate,
      message: "Your report has been received. Thank you for helping improve your community.",
    });
  } catch (error) {
    console.error("Create incident error:", error);
    return NextResponse.json(
      { error: "Something went wrong while sending your report. Please try again." },
      { status: 500 }
    );
  }
}
