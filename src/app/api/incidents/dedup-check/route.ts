import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSpatialDeduplication } from "@/lib/spatial";

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, category } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude required" },
        { status: 400 }
      );
    }

    const allIncidents = db.getIncidents();
    const result = checkSpatialDeduplication(
      Number(latitude),
      Number(longitude),
      category || "POTHOLE",
      allIncidents,
      50,
      72
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to perform spatial deduplication check" },
      { status: 500 }
    );
  }
}
