export interface ResolvedShowcaseIncident {
  id: string;
  ticketNumber: string;
  category: "sanitation" | "road";
  categoryLabel: string;
  categoryIcon: string;
  categoryTheme: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconColor: string;
  };
  title: string;
  location: string;
  status: string;
  comparisonImage: string;
  resolution: string;
}

export const RESOLVED_SHOWCASE_INCIDENTS: ResolvedShowcaseIncident[] = [
  {
    id: "CIV-1401",
    ticketNumber: "CIV-1401",
    category: "sanitation",
    categoryLabel: "Sanitation",
    categoryIcon: "🗑️",
    categoryTheme: {
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      badgeBorder: "border-emerald-200 dark:border-emerald-800/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    title: "Illegal Waste Dumping Clearance",
    location: "South Beach Promenade, Kozhikode",
    status: "Fixed",
    comparisonImage: "/images/resolved/waste-dumping-before-after.jpg",
    resolution: "Sanitation crew cleared the reported waste and restored the affected roadside area.",
  },
  {
    id: "CIV-2204",
    ticketNumber: "CIV-2204",
    category: "road",
    categoryLabel: "Road Repair",
    categoryIcon: "🛣️",
    categoryTheme: {
      badgeBg: "bg-blue-50 dark:bg-blue-950/40",
      badgeText: "text-blue-700 dark:text-blue-300",
      badgeBorder: "border-blue-200 dark:border-blue-800/60",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    title: "Asphalt Pothole Cluster Resurfacing",
    location: "Mavoor Road Junction, Kozhikode",
    status: "Fixed",
    comparisonImage: "/images/resolved/road-repair-before-after.png",
    resolution: "The damaged road was repaired and resurfaced with new asphalt for a smoother and safer journey.",
  },
];
