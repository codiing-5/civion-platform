const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Kozhikode municipal wards and users into Supabase...");

  // 1. Seed Wards
  const wards = [
    { number: 14, name: "Beach Ward (Thekkepuram)", zone: "Coastal Central", officerName: "K. V. Suresh Kumar", officerPhone: "+91 98470 12345", slaComplianceRate: 96.8, activeIssuesCount: 3 },
    { number: 22, name: "Mavoor Road Commercial", zone: "Transit Hub", officerName: "P. R. Anjali Devi", officerPhone: "+91 94471 67890", slaComplianceRate: 91.2, activeIssuesCount: 5 },
    { number: 7, name: "SM Street Heritage", zone: "Downtown Central", officerName: "Muhammed Fayaz", officerPhone: "+91 98952 34567", slaComplianceRate: 98.4, activeIssuesCount: 1 },
    { number: 12, name: "Mananchira Square Ward", zone: "Civic Core", officerName: "Deepa Nambiar", officerPhone: "+91 94963 89012", slaComplianceRate: 94.0, activeIssuesCount: 2 },
    { number: 31, name: "Sarovaram Eco-Belt", zone: "East Wetlands", officerName: "M. Haridasan", officerPhone: "+91 98464 56789", slaComplianceRate: 89.5, activeIssuesCount: 4 },
    { number: 45, name: "Govt. Medical College Ward", zone: "Health Corridor", officerName: "Dr. Vinod Varma", officerPhone: "+91 94475 23456", slaComplianceRate: 95.1, activeIssuesCount: 2 },
  ];

  for (const w of wards) {
    await prisma.ward.upsert({
      where: { number: w.number },
      update: w,
      create: w,
    });
  }

  // 2. Seed Users
  const users = [
    { id: "usr-citizen-01", email: "rohan.nair@civion.org", name: "Rohan Nair", role: "CITIZEN", phone: "+91 98950 11223" },
    { id: "usr-officer-14", email: "suresh.kumar@kozhikodecorp.gov.in", name: "K. V. Suresh Kumar", role: "OFFICER", phone: "+91 98470 12345", wardId: 14 },
    { id: "usr-admin-director", email: "rojan.jose@civion.org", name: "Rojan Jose", role: "ADMIN", phone: "+91 98460 99887" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
  }

  // 3. Seed Incidents
  const incidents = [
    {
      id: "civ-inc-001",
      ticketNumber: "CIV-1401",
      title: "Illegal Solid Waste Dumping along South Beach Walkway",
      description: "Multiple plastic sacks and commercial debris dumped near Gandhi statue promenade. Obstructing pedestrian flow and creating bio-hazard.",
      category: "WASTE_DUMPING",
      status: "RESOLVED",
      severity: "HIGH",
      confidenceScore: 0.94,
      latitude: 11.2588,
      longitude: 75.7680,
      address: "South Beach Road, Opp. Marine Aquarium, Kozhikode, Kerala 673032",
      wardNumber: 14,
      citizenPhotoUrl: "https://images.unsplash.com/photo-1611288875785-5a50785ffac1?auto=format&fit=crop&w=800&q=80",
      resolutionPhotoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      isPrivacyRedacted: true,
      originalFileSizeKb: 3420,
      compressedFileSizeKb: 340,
      slaDeadline: new Date(Date.now() - 3600000 * 12),
      isSlaBreached: false,
      resolvedNotes: "Ward 14 Sanitation squad deployed with compactor truck. Site cleared, disinfected, and warning sign erected.",
      reporterId: "usr-citizen-01",
      assignedOfficerId: "usr-officer-14",
      resolvedAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      id: "civ-inc-002",
      ticketNumber: "CIV-2204",
      title: "Severe Asphalt Pothole Cluster outside KSRTC Terminal",
      description: "Deep pothole (approx 28cm deep, 1.2m wide) causing heavy vehicular congestion and acute hazard for two-wheelers.",
      category: "POTHOLE",
      status: "IN_PROGRESS",
      severity: "CRITICAL",
      confidenceScore: 0.98,
      latitude: 11.2612,
      longitude: 75.7894,
      address: "Mavoor Road Junction, Near KSRTC Terminal, Kozhikode, Kerala 673004",
      wardNumber: 22,
      citizenPhotoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      resolutionPhotoUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80",
      isPrivacyRedacted: true,
      originalFileSizeKb: 4100,
      compressedFileSizeKb: 412,
      slaDeadline: new Date(Date.now() + 3600000 * 6),
      isSlaBreached: false,
      reporterId: "usr-citizen-01",
      assignedOfficerId: "usr-officer-14",
    },
  ];

  for (const inc of incidents) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: inc,
      create: inc,
    });
  }

  console.log("Database seeded successfully with Kozhikode municipal records!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
