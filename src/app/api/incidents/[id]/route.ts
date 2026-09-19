import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEMO_USERS } from "@/lib/seed-data";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const incident = db.getIncidentById(params.id);
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const auditLogs = db.getAuditLogs(incident.id);

  return NextResponse.json({
    success: true,
    incident,
    auditLogs,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, resolutionPhotoUrl, resolvedNotes, actorRole } = body;

    const actor =
      actorRole === "OFFICER"
        ? DEMO_USERS.officer
        : actorRole === "ADMIN"
        ? DEMO_USERS.admin
        : DEMO_USERS.citizen;

    const updated = db.updateIncident(
      params.id,
      {
        ...(status && { status }),
        ...(resolutionPhotoUrl && { resolutionPhotoUrl }),
        ...(resolvedNotes && { resolvedNotes }),
      },
      actor
    );

    if (!updated) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      incident: updated,
      message: `Incident ${updated.ticketNumber} updated to status: ${updated.status}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 }
    );
  }
}
