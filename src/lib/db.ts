import { Incident, Ward, User, Status } from "./types";
import { SEED_INCIDENTS, SEED_WARDS, DEMO_USERS } from "./seed-data";
import { checkSpatialDeduplication } from "./spatial";

export interface AuditLog {
  id: string;
  incidentId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: any;
  details?: string;
  timestamp: string;
}

// Global data store for stateful demo & local persistence
class CivionDataStore {
  private incidents: Incident[] = [...SEED_INCIDENTS];
  private wards: Ward[] = [...SEED_WARDS];
  private auditLogs: AuditLog[] = [];
  private users: Record<string, User> = {
    "usr-citizen-01": {
      id: "usr-citizen-01",
      name: "Rohan Nair",
      phone: "9895011223",
      email: "rohan.nair@civion.org",
      role: "CITIZEN",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    ...DEMO_USERS,
  };

  public findUserByPhone(phone: string): User | undefined {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    return Object.values(this.users).find((u) => {
      const userClean = u.phone?.replace(/\D/g, "").slice(-10);
      return userClean === cleanPhone;
    });
  }

  public findUserById(id: string): User | undefined {
    return this.users[id];
  }

  public createUser(data: { phone: string; name: string }): User {
    const cleanPhone = data.phone.replace(/\D/g, "").slice(-10);
    const existing = this.findUserByPhone(cleanPhone);
    if (existing) {
      existing.name = data.name;
      return existing;
    }

    const newUser: User = {
      id: `usr-citizen-${Date.now()}`,
      name: data.name,
      phone: cleanPhone,
      role: "CITIZEN",
      createdAt: new Date().toISOString(),
    };

    this.users[newUser.id] = newUser;
    return newUser;
  }

  public getIncidents(filters?: {
    reporterId?: string;
    status?: string;
    category?: string;
    ward?: number;
    search?: string;
  }): Incident[] {
    let result = [...this.incidents];

    if (filters?.reporterId) {
      result = result.filter((i) => i.reporterId === filters.reporterId);
    }
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

  public createIncident(data: {
    title: string;
    description: string;
    category: any;
    customDescription?: string;
    latitude: number;
    longitude: number;
    address: string;
    wardNumber: number;
    citizenPhotoUrl: string;
    reporterId: string;
    reporterName?: string;
    reporterPhone?: string;
    originalFileSizeKb?: number;
    compressedFileSizeKb?: number;
    confidenceScore?: number;
  }): {
    incident: Incident;
    isDuplicate: boolean;
    duplicateMessage?: string;
  } {
    // 50m Deduplication Check
    const dedup = checkSpatialDeduplication(
      data.latitude,
      data.longitude,
      data.category,
      this.incidents,
      50,
      72
    );

    const ticketNum = `CIV-${data.wardNumber}${Math.floor(100 + Math.random() * 900)}`;
    const slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const newIncident: Incident = {
      id: `civ-inc-${Date.now()}`,
      ticketNumber: ticketNum,
      title: data.title,
      description: data.description,
      customDescription: data.customDescription,
      category: data.category,
      status: "SUBMITTED",
      severity: "MEDIUM",
      confidenceScore: data.confidenceScore ?? 0.88,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      wardNumber: data.wardNumber,
      citizenPhotoUrl: data.citizenPhotoUrl,
      originalFileSizeKb: data.originalFileSizeKb ?? 2400,
      compressedFileSizeKb: data.compressedFileSizeKb ?? 280,
      slaDeadline,
      isSlaBreached: false,
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      reporterPhone: data.reporterPhone,
      duplicateOfId: dedup.isDuplicate ? dedup.nearestIncident?.id : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.incidents.unshift(newIncident);

    const targetWard = this.wards.find((w) => w.number === data.wardNumber);
    if (targetWard) {
      targetWard.activeIssuesCount += 1;
    }

    return {
      incident: newIncident,
      isDuplicate: dedup.isDuplicate,
      duplicateMessage: dedup.message,
    };
  }

  public updateIncident(
    id: string,
    updates: Partial<Incident>,
    actor?: any
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
    return updated;
  }

  public runSlaEscalationCron(): { escalatedCount: number; escalatedTickets: string[]; message: string } {
    const now = Date.now();
    const escalatedTickets: string[] = [];

    this.incidents.forEach((inc) => {
      if (inc.status !== "RESOLVED" && inc.status !== "REJECTED_INVALID" && !inc.isSlaBreached) {
        const deadline = inc.slaDeadline ? new Date(inc.slaDeadline).getTime() : now + 10000;
        if (now > deadline) {
          inc.isSlaBreached = true;
          inc.status = "ESCALATED_SLA";
          inc.updatedAt = new Date().toISOString();
          escalatedTickets.push(inc.ticketNumber);
        }
      }
    });

    return {
      escalatedCount: escalatedTickets.length,
      escalatedTickets,
      message: `Escalated ${escalatedTickets.length} breached incidents.`,
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
