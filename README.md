# Civion — AI Municipal Intelligence & Ward Issue Dispatch Platform

> **"Real People. Real Photos. Healthier Cities."**  
> **Created & Architected by:** Rojan Jose  
> **Target Repository:** `codiing-5/civion-platform`  
> **Deployment Target:** Vercel (Serverless Functions + Vercel Cron + Next.js App Router)

---

## 1. Overview

**Civion** is an AI-powered municipal issue reporting and ward management platform designed for the Kozhikode Municipal Corporation (Calicut, Kerala). It bridges citizen ground-truth reporting with automated computer vision severity classification, client-side WebP compression, AI privacy scrubbing (heuristic face & license plate blurring), sub-50m PostGIS spatial deduplication, automated SLA escalation via Vercel Cron, and tamper-proof audit trails.

---

## 2. Key Architecture & Features

### A. Secure Email OTP Authentication
Civion uses a zero-leakage, production-grade **Email OTP Authentication Service**:
- **Email-First Interface**: Citizens register and log in using their email address (`/login`).
- **Cryptographically Secure OTP**: 6-digit codes generated using Node.js `crypto.randomInt` (never `Math.random`).
- **HMAC-SHA256 Hash Storage**: Plaintext codes are never stored in memory or databases; verified using `crypto.timingSafeEqual` to thwart timing attacks.
- **5-Minute Expiry & Single-Use**: Codes expire in 5 minutes and are invalidated immediately upon verification. Max 5 failed attempts allowed before mandatory lockout.
- **Multi-Tier Rate Limiting**: In-memory sliding window rate limits per IP (10 requests/10 min) and per Email (4 sends/10 min, 5 verify attempts/10 min) with `429 Too Many Requests` + `Retry-After` headers.
- **Session Protection**: Issues scoped JWT tokens stored in secure `HttpOnly`, `SameSite=Lax` cookies.

#### Local Dev vs. Production Behavior:
- **Local Development (`localhost`)**: When running locally without `GMAIL_USER` / `GMAIL_APP_PASSWORD`, the server operates in Dev Simulation mode — generating the code to the server terminal and rendering a convenient **Auto-Fill Dev Code** badge in the UI for instant testing.
- **Production Deployments (`NODE_ENV=production`)**: Dev codes and helper badges are strictly disabled. Verification emails are dispatched directly to user inboxes via **Gmail SMTP**.

---

### B. Modern Visual Design System & Aesthetics
- **Dark Ambient Lighting Engine**: Base canvas `#050508` overlaid with soft indigo and cyan radial backdrop blur gradients.
- **Live Telemetry Pill**: Monospaced status badge with pulsating live indicator (`● Protocol v1.0 • Live | Grid Health: 99.4%`).
- **Modern Display Typography**: High-contrast display headlines using Google Fonts Syne and Plus Jakarta Sans.
- **Interactive Spotlight Bento Grid**: Cards tracking mouse cursor coordinates to project dynamic radial spotlights.

---

### C. Role Immutability & QuickDemo Switcher
- **Absolute Role Lock**: User roles (`CITIZEN`, `OFFICER`, `ADMIN`) are immutable upon account creation. Role fields are stripped from all profile updates to prevent privilege escalation.
- **Pitch Mode Header (`QuickDemoBanner`)**: Enables evaluators to instantly test role behaviors:
  - **Citizen View** (Rohan Nair): WebP photo submission, live AI privacy redactor, confidence flooring.
  - **Officer View** (Ward 14 Officer K. V. Suresh Kumar): Resolution dispatch, Before/After repair proof upload.
  - **Admin View** (Director Rojan Jose): SLA escalation trigger, municipal export center, PostGIS telemetry.

---

### D. PostGIS Spatial Deduplication (<50m Radius)
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

---

### E. AI Privacy Scrubbing & Confidence Flooring
- **Client-Side WebP Compression**: Reduces image payloads from ~3.5MB to <350KB before upload.
- **Privacy Redactor**: Overlays blur masks on detected human faces and vehicle license plates.
- **Confidence Flooring**: Rejects any upload with confidence `< 0.40` as `REJECTED_INVALID`.

---

### F. Before / After Resolution Verification Slider
- Interactive touch/drag split-screen slider comparing original citizen report proof with municipal repair certification.

---

### G. Municipal Export Panel
- Generates downloadable CSV audit tables and print-ready formatted PDF reports using `jspdf`.

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

## 4. Environment Variables

Configure the following variables in your `.env` (or Vercel Project Settings):

| Variable | Description | Required in Production |
|---|---|:---:|
| `DATABASE_URL` | PostgreSQL connection string (Supabase / PostGIS) | Yes |
| `JWT_SECRET` | Secret key used to sign and verify session JWTs | Yes |
| `GMAIL_USER` | Dedicated Civion Gmail account (e.g. `your-civion-email@gmail.com`) | Yes (Prod only) |
| `GMAIL_APP_PASSWORD` | Google App Password (16 characters) for Gmail SMTP | Yes (Prod only) |
| `OTP_PEPPER` | Cryptographic secret salt for hashing OTP codes | Optional |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL token for street tiles | Optional |

---

## 5. Local Development

```bash
# 1. Clone repository
git clone https://github.com/codiing-5/civion-platform.git
cd civion-platform

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` or `http://localhost:3000/login` to interact with the platform.

---

## 6. Vercel Deployment & Cron Setup

1. Connect your repository `codiing-5/civion-platform` in the **Vercel Dashboard**.
2. Add environment variables (`DATABASE_URL`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`).
3. Deploy!
4. The automated hourly SLA escalation cron job (`0 * * * *`) runs automatically via `vercel.json`:
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

## 7. Author

**Rojan Jose**  
Lead Developer & AI Systems Architect  
GitHub: `codiing-5`
