# Civion — AI Municipal Intelligence & Ward Issue Dispatch Platform

> **"Real People. Real Photos. Healthier Cities."**  
> **Created & Architected by:** Rojan Jose  
> **Target Repository:** `codiing-5/civion-platform`  
> **Deployment Target:** Vercel (Serverless Functions + Vercel Cron + Static Front-end Hosting)

---

## 1. Overview

**Civion** is an AI-powered municipal issue reporting and ward management platform designed for the Kozhikode Municipal Corporation (Calicut, Kerala). It bridges citizen ground-truth reporting with automated computer vision severity classification, client-side WebP compression, AI privacy scrubbing (heuristic face & license plate blurring), sub-50m PostGIS spatial deduplication, automated SLA escalation via Vercel Cron, and tamper-proof audit trails.

---

## 2. Key Architecture & Features

### A. ProtoX Visual Design System & Aesthetics
- **Dark Ambient Lighting Engine**: Base canvas `#050508` overlaid with soft indigo and cyan radial backdrop blur gradients (`bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 blur-3xl`).
- **Nordax Live Telemetry Pill**: Monospaced status badge with pulsating live indicator (`● Protocol v1.0 • Live | Grid Health: 99.4%`).
- **Odyssey Display Typography**: High-contrast display headlines using Google Fonts Syne and Plus Jakarta Sans.
- **ProtoX Spotlight Bento Grid**: Interactive cards tracking mouse cursor coordinates to project dynamic radial spotlight lights (`radial-gradient(circle at x y)`).

### B. Role Immutability & QuickDemo Switcher
- **Absolute Role Lock**: User roles (`CITIZEN`, `OFFICER`, `ADMIN`) are immutable upon account creation. Role fields are stripped from all profile updates to prevent privilege escalation.
- **Pitch Mode Header (`QuickDemoBanner`)**: Enables judges and evaluators to instantly switch between:
  - **Citizen View** (Rohan Nair): WebP photo submission, live AI privacy redactor, confidence flooring.
  - **Officer View** (Ward 14 Officer K. V. Suresh Kumar): Resolution dispatch, Before/After repair proof upload.
  - **Admin View** (Director Rojan Jose): SLA escalation trigger, municipal export center, PostGIS telemetry.

### C. PostGIS Spatial Deduplication (<50m Radius)
- Runs real-time distance calculations using `ST_DWithin` over active tickets submitted within a 72-hour window:
  ```sql
  SELECT id, "ticketNumber", title, category, status,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography
    ) AS distance_meters
  FROM "Incident"
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography,
    50
  )
  AND "createdAt" >= NOW() - INTERVAL '72 hours'
  AND status != 'RESOLVED';
  ```

### D. AI Privacy Scrubbing & Confidence Flooring
- **Client-Side WebP Compression**: Reduces image payloads from ~3.5MB to <350KB before upload.
- **Privacy Redactor**: Overlays blur masks on detected human faces and vehicle license plates.
- **Confidence Flooring**: Rejects any upload with confidence `< 0.40` as `REJECTED_INVALID`.

### E. Before / After Resolution Verification Slider
- Interactive touch/drag split-screen slider comparing original citizen report proof with municipal repair certification.

### F. Municipal Export Panel
- Generates downloadable CSV audit tables and print-ready formatted PDF reports using `jsPDF`.

---

## 3. Pre-Seeded Kozhikode Dataset

| Landmark / Hotspot | Ward | Coordinates | Defect Type | Status |
|---|---|---|---|---|
| **South Beach Road** | Ward 14 | `11.2588, 75.7680` | Waste Dumping | Resolved (Cleaned) |
| **Mavoor Road (KSRTC)** | Ward 22 | `11.2612, 75.7894` | Severe Pothole Cluster | In Progress |
| **SM Street (Mittayi Theruvu)** | Ward 07 | `11.2514, 75.7818` | Heritage Streetlight Outage | Dispatched |
| **Mananchira Square** | Ward 12 | `11.2541, 75.7788` | Water Pipeline Burst | Escalated (SLA Breach) |
| **Sarovaram Bio Park** | Ward 31 | `11.2721, 75.8012` | Wetland Drainage Clog | AI Verified |
| **Medical College Road** | Ward 45 | `11.2736, 75.8365` | Emergency Ramp Subsidence | Submitted |

---

## 4. Local Development

```bash
# Clone the repository
git clone https://github.com/codiing-5/civion-platform.git
cd civion-platform

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to access the interactive platform.

---

## 5. Vercel Deployment & Cron Setup

1. Push to GitHub repository `codiing-5/civion-platform`.
2. Connect the repository in the Vercel Dashboard.
3. Configure environment variables (optional for standalone demo, or connect Supabase PostGIS):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
4. The automated hourly SLA escalation cron job (`0 * * * *`) is configured via `vercel.json`:
   ```json
   {
     "framework": "nextjs",
     "crons": [
       {
         "path": "/api/cron/sla-escalation",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

---

## 6. Author

**Rojan Jose**  
Lead Developer & AI Systems Architect  
GitHub: `codiing-5`
