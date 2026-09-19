import { Incident, Ward, User, AuditLog, Status } from "./types";
import { SEED_INCIDENTS, SEED_WARDS, DEMO_USERS } from "./seed-data";
import { checkSpatialDeduplication } from "./spatial";

// Global in-memory state for instant serverless execution and local demo persistence
class CivionDataStore {
  private incidents: Incident[] = [...SEED_INCIDENTS];
  private wards: Ward[] = [...SEED_WARDS];
  private users: Record<string, User> = { ...DEMO_USERS };
  private auditLogs: AuditLog[] = [
    {
      id: "log-001",
      incidentId: "civ-inc-001",
      action: "STATUS_RESOLVED",
      actorId: "usr-officer-14",
      actorName: "K. V. Suresh Kumar",
      actorRole: "OFFICER",
      details: "Resolution proof photo uploaded. Site cleared and sanitized.",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "log-002",
      incidentId: "civ-inc-004",
      action: "SLA_BREACH_ESCALATED",
      actorId: "system-cron",
      actorName: "Vercel SLA Escalation Daemon",
      actorRole: "ADMIN",
      details: "Water leakage incident exceeded 24-hour SLA threshold. Auto-escalated to Municipal Director.",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  public getIncidents(filters?: {
    status?: string;
    category?: string;
    ward?: number;
    search?: string;
  }): Incident[] {
    let result = [...this.incidents];

    if (filters?.status && filters.status !== "ALL") {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.category && filters.category !== "ALL") {
      result = result.filter((i) => i.category === filters.category);
    }
    if (filters?.ward) {
      result = result.filter((i) => i.wardNumber === Number(filters.ward));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.ticketNumber.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id || i.ticketNumber === id);
  }

  public createIncident(data: Omit<Incident, "id" | "ticketNumber" | "createdAt" | "updatedAt">): {
    incident: Incident;
    isDuplicate: boolean;
    duplicateMessage?: string;
  } {
    // 1. PostGIS 50m Spatial Deduplication Check
    const dedup = checkSpatialDeduplication(
      data.latitude,
      data.longitude,
      data.category,
      this.incidents,
      50,
      72
    );

    const ticketNum = `CIV-${data.wardNumber}${Math.floor(100 + Math.random() * 900)}`;
    const newIncident: Incident = {
      ...data,
      id: `civ-inc-${Date.now()}`,
      ticketNumber: ticketNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duplicateOfId: dedup.isDuplicate ? dedup.nearestIncident?.id : undefined,
    };

    this.incidents.unshift(newIncident);

    // Update Ward active count
    const targetWard = this.wards.find((w) => w.number === data.wardNumber);
    if (targetWard) {
      targetWard.activeIssuesCount += 1;
    }

    // Add Audit Log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      incidentId: newIncident.id,
      action: "INCIDENT_CREATED",
      actorId: data.reporterId,
      actorName: data.reporterName,
      actorRole: "CITIZEN",
      details: dedup.isDuplicate ? `Merged near ${dedup.nearestIncident?.ticketNumber}` : "Clean ingestion",
      timestamp: new Date().toISOString(),
    });

    return {
      incident: newIncident,
      isDuplicate: dedup.isDuplicate,
      duplicateMessage: dedup.message,
    };
  }

  public updateIncident(
    id: string,
    updates: Partial<Incident>,
    actor: { id: string; name: string; role: any }
  ): Incident | null {
    const idx = this.incidents.findIndex((i) => i.id === id || i.ticketNumber === id);
    if (idx === -1) return null;

    const current = this.incidents[idx];
    const updated: Incident = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === "RESOLVED" && !updated.resolvedAt) {
      updated.resolvedAt = new Date().toISOString();
      const targetWard = this.wards.find((w) => w.number === updated.wardNumber);
      if (targetWard && targetWard.activeIssuesCount > 0) {
        targetWard.activeIssuesCount -= 1;
      }
    }

    this.incidents[idx] = updated;

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      incidentId: updated.id,
      action: `STATUS_${updates.status || "UPDATED"}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: updates.resolvedNotes || "Incident updated via officer dispatch console",
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public runSlaEscalationCron(): { escalatedCount: number; escalatedTickets: string[] } {
    const now = Date.now();
    const escalatedTickets: string[] = [];

    this.incidents.forEach((inc) => {
      if (inc.status !== "RESOLVED" && inc.status !== "REJECTED_INVALID" && !inc.isSlaBreached) {
        const deadline = new Date(inc.slaDeadline).getTime();
        if (now > deadline) {
          inc.isSlaBreached = true;
          inc.status = "ESCALATED_SLA";
          inc.updatedAt = new Date().toISOString();
          escalatedTickets.push(inc.ticketNumber);

          this.auditLogs.unshift({
            id: `log-${Date.now()}-${inc.id}`,
            incidentId: inc.id,
            action: "SLA_BREACH_ESCALATED",
            actorId: "system-cron",
            actorName: "Vercel Cron Daemon",
            actorRole: "ADMIN",
            details: `Automated hourly cron detected SLA breach past ${inc.slaDeadline}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    return {
      escalatedCount: escalatedTickets.length,
      escalatedTickets,
    };
  }

  public getWards(): Ward[] {
    return this.wards;
  }

  public getAuditLogs(incidentId?: string): AuditLog[] {
    if (incidentId) {
      return this.auditLogs.filter((l) => l.incidentId === incidentId);
    }
    return this.auditLogs;
  }
}

// Singleton pattern across Next.js hot-reloads
const globalForCivion = global as unknown as { civionStore?: CivionDataStore };
export const db = globalForCivion.civionStore || new CivionDataStore();
if (process.env.NODE_ENV !== "production") globalForCivion.civionStore = db;
