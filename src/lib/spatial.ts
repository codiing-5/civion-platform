import { Incident, DedupCheckResult } from "./types";

/**
 * Calculates Great-Circle Distance between two coordinates in meters using Haversine formula.
 * Used for client-side evaluation and in-memory PostGIS equivalence fallback.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Executes sub-50m spatial deduplication scan against active incidents within 72 hours window.
 */
export function checkSpatialDeduplication(
  targetLat: number,
  targetLon: number,
  category: string,
  existingIncidents: Incident[],
  thresholdMeters: number = 50,
  windowHours: number = 72
): DedupCheckResult {
  const cutoffTime = new Date(Date.now() - windowHours * 3600 * 1000).getTime();

  let closestMatch: Incident | null = null;
  let minDistance = Infinity;

  for (const inc of existingIncidents) {
    // Only compare active non-resolved tickets within the 72-hour window
    if (inc.status === "RESOLVED") continue;
    const incTime = new Date(inc.createdAt).getTime();
    if (incTime < cutoffTime) continue;

    const dist = calculateDistanceMeters(targetLat, targetLon, inc.latitude, inc.longitude);

    if (dist <= thresholdMeters) {
      if (dist < minDistance) {
        minDistance = dist;
        closestMatch = inc;
      }
    }
  }

  if (closestMatch && minDistance <= thresholdMeters) {
    return {
      isDuplicate: true,
      nearestIncident: closestMatch,
      distanceMeters: minDistance,
      confidenceScore: Math.round((1 - minDistance / thresholdMeters) * 100) / 100,
      message: `Duplicate incident detected ${minDistance}m away at "${closestMatch.title}" (${closestMatch.ticketNumber}). Merging to prevent double-ticketing.`,
    };
  }

  return {
    isDuplicate: false,
    distanceMeters: minDistance < Infinity ? minDistance : undefined,
    message: "No spatial collision detected within 50m radius. Clean ticket creation permitted.",
  };
}

/**
 * Returns raw PostGIS SQL query equivalent for PostgreSQL instance with PostGIS extension.
 */
export function getPostGisDedupQuery(lat: number, lon: number, radiusMeters: number = 50) {
  return `
    SELECT id, "ticketNumber", title, category, status,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      ) AS distance_meters
    FROM "Incident"
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
    AND "createdAt" >= NOW() - INTERVAL '72 hours'
    AND status != 'RESOLVED'
    ORDER BY distance_meters ASC
    LIMIT 1;
  `;
}
