import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Vercel Serverless Cron Handler: /api/cron/sla-escalation
 * Executed hourly (0 * * * *) or via Admin Director trigger.
 * Scans active tickets, evaluates SLA breach timestamps, and auto-escalates overdue issues.
 */
export async function GET(req: NextRequest) {
  try {
    const result = db.runSlaEscalationCron();

    return NextResponse.json({
      cron: "sla-escalation",
      timestamp: new Date().toISOString(),
      status: "SUCCESS",
      escalatedCount: result.escalatedCount,
      escalatedTickets: result.escalatedTickets,
      message:
        result.escalatedCount > 0
          ? `SLA breach detected! Auto-escalated ${result.escalatedCount} overdue ticket(s) to Municipal Director.`
          : "All active tickets within acceptable SLA bounds. Zero escalations required.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron execution failed" },
      { status: 500 }
    );
  }
}
