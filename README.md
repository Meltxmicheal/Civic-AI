# 🏛️ Matram AI / CivicAI — AI-Powered Civic Grievance & Municipal Redressal Platform

[![React 19](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-orange.svg)](https://aistudio.google.com/)
[![MapLibre GL](https://img.shields.io/badge/GIS-MapLibre_GL-3273DC.svg)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Matram AI (CivicAI)** is a comprehensive, production-ready civic grievance redressal and municipal governance platform. Built with **React 19, Vite, Tailwind CSS v4, and Google Gemini 2.5 Flash Vision AI**, it empowers citizens to report public infrastructure issues with AI-assisted verification, real-time geocoding, live GIS mapping, SLA tracking, and side-by-side Before/After resolution proof.

---

## 🌟 Key Highlights & Features

### 🤖 1. Multimodal Gemini 2.5 Flash Vision Engine
- **Authenticity & Fake Image Detection:** Automatically flags synthetic, screen-captured, or manipulated images with confidence ratings.
- **Civic Issue Verification:** Validates whether uploaded images depict genuine municipal problems (potholes, garbage, broken streetlights, water pipeline leaks, clogged storm drains).
- **Automated Classification & Severity Routing:** Infers priority (`Low`, `Medium`, `High`, `Critical`), SLA timeline, and suggests the exact responsible municipal department.
- **Bilingual Smart Title & Description Generation:** Instantly creates English and Tamil (தமிழ்) titles, descriptions, and hashtags with resilient JSON extraction and heuristic recovery.

### 📍 2. Browser-Native Geocoding & Interactive GIS Map
- **Automated Reverse-Geocoding:** Fetches State, District, Landmark, and Coordinates (`Lat/Lng`) directly from the browser's native location API with OpenStreetMap Nominatim support.
- **MapLibre GL Live Map:** Interactive vector map rendering active civic issues with dynamic radius filters (100m, 500m, 1km, 5km).
- **Auto-Filter Resolved Grievances:** Automatically cleanses the map view to display only open and in-progress complaints.

### 📄 3. Live Official PDF Dossier Generator
- Generates high-resolution, printable municipal inspection dossiers in 1-click.
- Includes Before & After photographic evidence, GPS coordinates, SLA status, audit logs, and digital verification seal.

### 💬 4. Field Officer WhatsApp & SMS 1-Click Dispatch
- Pre-configured with designated municipal field officer contact lines (`8940707924`, `8098583730`, `8190947256`).
- Enables instant 1-click WhatsApp (`https://wa.me/...`) and native SMS dispatch containing complete complaint reference, address, and repair instructions.

### 📸 5. Before & After Resolution Verification
- Field officers access on-site resolution workflows to capture verified **After Photos** and log official repair notes.
- Home page and details cards showcase side-by-side visual comparisons of resolved civic issues.

### 📊 6. Public Department Leaderboard & Analytics Hub
- Transparent citizen analytics powered by **Recharts**:
  - Daily reported vs resolved area charts.
  - Department-wise resolution counts.
  - Category breakdown pie charts.
  - SLA compliance percentages and live points standings across all 9 municipal wings.

### 📢 7. Government Circular & Municipal Updates Marquee
- Continuous, smooth moving marquee loop ticker in the header displaying official municipal announcements, monsoon alerts, and PWD road notices with hover-to-pause capability.

### 🌐 8. Bilingual & Accessibility-First Design
- Full language support in **English** and **Tamil (தமிழ்)** with instant toggle.
- WCAG-compliant accessibility toolbar with High Contrast mode, font-size adjustments, reduced motion, and link highlighting.

---

## 🏛️ The 9 Municipal Departments Integrated

| # | Department Name | Category | SLA Window | Default Head Officer |
|---|-----------------|----------|------------|----------------------|
| 1 | **Public Works Department (PWD)** | Roads, Potholes & Bridges | 48 Hours | Er. K. Murugan |
| 2 | **Sanitation & Solid Waste** | Garbage Overflow & Cleaning | 24 Hours | Dr. Selvi R. |
| 3 | **Water Supply & Sewerage** | Water Supply & Leaks | 36 Hours | Er. Priya S. |
| 4 | **General Services & Utilities** | Street Lights & Electrics | 48 Hours | M. Selvam |
| 5 | **Transportation & Traffic** | Signals, Signs & Road Safety | 24 Hours | Inspector V. Natarajan |
| 6 | **Parks & Recreation** | Fallen Trees & Public Gardens | 72 Hours | K. Sundaram |
| 7 | **Code Enforcement & Safety** | Encroachments & Structures | 96 Hours | S. Anandan |
| 8 | **Animal Control & Care** | Stray Animals & Cattle | 48 Hours | Dr. M. Karthik |
| 9 | **Fire & Emergency Services** | Urgent Public Safety Hazards | 12 Hours | Commander R. Bharathi |

---

---

## 📂 Project Structure

```
matram-ai/
├── backend/                  # Express + TypeScript + MongoDB Backend API
│   ├── src/
│   │   ├── config/db.ts      # MongoDB Atlas connection & local fallback logic
│   │   ├── models/           # Mongoose schemas & TypeScript interfaces
│   │   ├── routes/           # REST API routes (/api/issues, /api/stats)
│   │   ├── seed.ts           # Auto-seeding script with SVG evidence generators
│   │   └── server.ts         # Express server entry point (Port 5000)
│   ├── package.json
│   └── README.md             # Backend API Documentation
│
├── src/                      # React 19 + Vite + Tailwind CSS v4 Frontend Application
│   ├── ai/                   # Multimodal Gemini 2.5 Flash Vision AI engine
│   ├── components/           # Reusable UI components & interactive maps
│   ├── contexts/             # App global context & language providers
│   ├── i18n/                 # English & Tamil (தமிழ்) translation strings
│   ├── pages/                # Page components (Home, Report, Track, Dashboards, Map)
│   ├── services/             # API services & PDF report generator
│   └── utils/                # SVG Data URI sanitizers & helpers
├── package.json
└── README.md                 # Root Platform Documentation
```

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`)
- **Backend:** Node.js, Express.js, Mongoose, MongoDB Atlas
- **AI / Multimodal:** Google Generative AI (Gemini 2.5 Flash / Flash-Lite / Pro)
- **Mapping & GIS:** MapLibre GL
- **Data Visualization:** Recharts
- **Icons & UI:** React Icons, Custom SVG civic badges

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Vasanth69-code/matram-ai.git
cd matram-ai
```

### 2. Install Dependencies (Frontend & Backend)
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

**Frontend (`.env` in root):**
```env
VITE_GEMINI_API_KEY="your_google_gemini_api_key_here"
VITE_BACKEND_URL="http://localhost:5000"
```

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI="mongodb+srv://hemavasanth69_db_user:Hema%402006@cluster0.zgnq98j.mongodb.net/matram_ai?retryWrites=true&w=majority&appName=Cluster0"
```

### 4. Run Development Servers

**Run Express Backend Server (Port 5000):**
```bash
cd backend
npm run dev
```

**Run React Frontend Application (Port 5173):**
```bash
# In a new terminal window at project root
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Credentials & Role-Based Access

| Role | Portal / Page | Credentials | Access Scope |
|------|---------------|-------------|--------------|
| **Public Citizen** | Home, Report, Track, Map, Leaderboard | Open Access | Report issues, track status, view public map and department leaderboard |
| **Central Admin** | Admin Control Hub (`admin`) | **Email:** `civic123@gmail.com`<br/>**Password:** `12345` | Master governance, officer assignment, WhatsApp dispatch, department routing |
| **Department Staff** | Department Dashboard (`department`) | **Email:** `pwd@civic.gov`<br/>**Password:** `pass123` | Department-specific ticket management & performance metrics |
| **Field Officers** | Field Officer Resolver (`officer`) | Open via dispatch links | Site inspection, Before pic view, After resolution photo upload |

---

## 📱 Official Field Officers Directory & Contact Numbers

The platform integrates direct **1-click WhatsApp and SMS dispatch** to assigned field officers using their official contact numbers:

| Officer Name | Municipal Department | Role / Jurisdiction | Contact Number | Direct Dispatch Link |
|--------------|----------------------|---------------------|----------------|----------------------|
| **Er. Murugan K.** | Public Works Department (PWD) | Roads & Pothole Lead | `+91 8940707924` | [WhatsApp Dispatch](https://wa.me/918940707924) |
| **M. Selvam** | General Services & Utilities | Streetlights & Electrics | `+91 8098583730` | [WhatsApp Dispatch](https://wa.me/918098583730) |
| **Er. Priya S.** | Water Supply & Sewerage | Pipeline & Drainage | `+91 8190947256` | [WhatsApp Dispatch](https://wa.me/918190947256) |
| **T. Rajan** | Sanitation & Solid Waste | Waste Management Officer | `+91 8940707924` | [WhatsApp Dispatch](https://wa.me/918940707924) |
| **Inspector V. Natarajan** | Transportation & Traffic | Signals & Road Safety | `+91 8098583730` | [WhatsApp Dispatch](https://wa.me/918098583730) |
| **K. Sundaram** | Parks & Recreation | Horticulture & Tree Pruning | `+91 8190947256` | [WhatsApp Dispatch](https://wa.me/918190947256) |
| **S. Anandan** | Code Enforcement & Safety | Structural Safety Inspector | `+91 8940707924` | [WhatsApp Dispatch](https://wa.me/918940707924) |
| **Dr. M. Karthik** | Animal Control & Care | Stray Animals & Veterinary | `+91 8098583730` | [WhatsApp Dispatch](https://wa.me/918098583730) |
| **Commander R. Bharathi** | Fire & Emergency Services | Hazard Response Lead | `+91 8190947256` | [WhatsApp Dispatch](https://wa.me/918190947256) |

### 🚨 24x7 Municipal & Emergency Helplines
- **Municipal Grievance Helpline:** `1913`
- **Flood & Waterlogging Control Room:** `044-25619206`
- **State CM Cell Helpline:** `1100`
- **Fire & Rescue:** `101`
- **Emergency Medical:** `108`


---

## 📂 Project Architecture

```
matram-ai/
├── src/
│   ├── ai/                      # Gemini 2.5 Flash Vision & AI logic
│   │   └── genkit.ts            # Multimodal vision analyzer with resilient parser
│   ├── components/              # Reusable UI components
│   │   ├── CivicMap.tsx         # MapLibre interactive GIS map
│   │   ├── ComplaintCard.tsx    # High-res cards with Before/After preview
│   │   ├── Header.tsx           # Navigation & Admin login modal
│   │   ├── GovernmentCircularTicker.tsx # Moving loop announcement banner
│   │   ├── LocationPicker.tsx   # Live geolocation & OSM reverse geocoding
│   │   └── StatusBadge.tsx      # SLA, Priority, and Status badges
│   ├── contexts/                # React Context providers
│   │   └── AppContext.tsx       # Auth state, Language, and Accessibility
│   ├── data/                    # Municipal data & definitions
│   │   └── civicData.ts         # 9 Departments, dummy data, and officers
│   ├── pages/                   # Application pages
│   │   ├── HomePage.tsx         # Landing page with stats & Before/After proof
│   │   ├── ReportIssuePage.tsx  # Fast 1-page report submission flow
│   │   ├── ComplaintDetailPage.tsx # Detailed audit log, map, & WhatsApp dispatch
│   │   ├── AdminControlPage.tsx # Master admin control & deployment hub
│   │   ├── DepartmentDashboardPage.tsx # 9 Municipal department dashboards
│   │   ├── FieldOfficerPage.tsx # Field officer resolution & After photo upload
│   │   └── TransparencyPage.tsx # Public department rankings & charts
│   ├── services/                # Core business services
│   │   ├── civicIssueService.ts # Local & database persistence methods
│   │   └── pdfReportService.ts  # Official PDF dossier generator
│   ├── types/                   # TypeScript interfaces
│   ├── App.tsx                  # Root application router
│   ├── index.css                # Tailwind CSS v4 & animations
│   └── main.tsx                 # Entrypoint
├── index.html                   # HTML template with complete CivicAI metadata
├── vite.config.ts               # Vite configuration
└── package.json                 # Project dependencies & scripts
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
