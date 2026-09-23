export type Role = "CITIZEN" | "OFFICER" | "ADMIN";

export type AuthorityStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Category =
  | "POTHOLE"
  | "WASTE_DUMPING"
  | "STREETLIGHT"
  | "WATER_LEAKAGE"
  | "DRAINAGE"
  | "OTHER";

export type Status =
  | "SUBMITTED"
  | "IN_REVIEW"
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
  passwordHash?: string;
  phone?: string;
  role: Role;
  wardId?: number;
  avatarUrl?: string;
  emailVerified?: boolean;
  authorityStatus?: AuthorityStatus;
  organization?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Incident {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: Category;
  customDescription?: string;
  status: Status;
  severity?: Severity;
  confidenceScore?: number; // Backend only - never exposed to citizen directly
  latitude: number;
  longitude: number;
  address: string;
  wardNumber: number;
  citizenPhotoUrl: string;
  resolutionPhotoUrl?: string;
  isPrivacyRedacted?: boolean;
  originalFileSizeKb?: number;
  compressedFileSizeKb?: number;
  slaDeadline?: string;
  isSlaBreached?: boolean;
  duplicateOfId?: string;
  resolvedNotes?: string;
  reporterId: string;
  reporterName?: string;
  reporterPhone?: string; // Private
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CitizenStatusInfo {
  label: string;
  icon: string;
  badgeClass: string;
  dotColor: string;
  markerColor: "red" | "yellow" | "green";
  description: string;
}

/**
 * Maps technical backend statuses into plain citizen-friendly language
 */
export function getCitizenStatus(status: Status): CitizenStatusInfo {
  switch (status) {
    case "RESOLVED":
      return {
        label: "Fixed",
        icon: "✅",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        dotColor: "#16A34A",
        markerColor: "green",
        description: "The municipal work team has repaired and closed this issue.",
      };
    case "DISPATCHED":
    case "IN_PROGRESS":
      return {
        label: "Work Team Assigned",
        icon: "🛠️",
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        dotColor: "#F59E0B",
        markerColor: "yellow",
        description: "A municipal crew has been scheduled or is on-site working on this issue.",
      };
    case "SUBMITTED":
    case "IN_REVIEW":
    case "AI_VERIFIED":
    case "ESCALATED_SLA":
    case "REJECTED_INVALID":
    default:
      return {
        label: "Received & Under Review",
        icon: "⏳",
        badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
        dotColor: "#2563EB",
        markerColor: "red",
        description: "Your report is received and being verified by the municipal ward team.",
      };
  }
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

export interface DedupCheckResult {
  isDuplicate: boolean;
  nearestIncident?: Incident;
  distanceMeters?: number;
  confidenceScore?: number;
  message: string;
}

