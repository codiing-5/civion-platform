export type Role = "CITIZEN" | "OFFICER" | "ADMIN";

export type Category =
  | "POTHOLE"
  | "WASTE_DUMPING"
  | "STREETLIGHT"
  | "WATER_LEAKAGE"
  | "DRAINAGE"
  | "OTHER";

export type Status =
  | "SUBMITTED"
  | "AI_VERIFIED"
  | "DISPATCHED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ESCALATED_SLA"
  | "REJECTED_INVALID";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  wardId?: number;
  avatarUrl?: string;
}

export interface Ward {
  id: number;
  number: number;
  name: string;
  zone: string;
  officerName: string;
  officerPhone: string;
  slaComplianceRate: number;
  activeIssuesCount: number;
}

export interface Incident {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  severity: Severity;
  confidenceScore: number;
  latitude: number;
  longitude: number;
  address: string;
  wardNumber: number;
  citizenPhotoUrl: string;
  resolutionPhotoUrl?: string;
  isPrivacyRedacted: boolean;
  originalFileSizeKb: number;
  compressedFileSizeKb: number;
  slaDeadline: string; // ISO string
  isSlaBreached: boolean;
  duplicateOfId?: string;
  resolvedNotes?: string;
  reporterId: string;
  reporterName: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string; // ISO string
  updatedAt: string;
  resolvedAt?: string;
}

export interface DedupCheckResult {
  isDuplicate: boolean;
  nearestIncident?: Incident;
  distanceMeters?: number;
  confidenceScore?: number;
  message: string;
}

export interface AuditLog {
  id: string;
  incidentId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  details?: string;
  timestamp: string;
}

export interface PipelineStage {
  id: number;
  name: string;
  title: string;
  description: string;
  status: "complete" | "processing" | "pending";
  metric: string;
  badge: string;
}
