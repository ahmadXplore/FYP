# AI-Based Emergency Vehicle Priority and Dynamic Green Corridor System
### Intelligent Traffic Management Decision Layer for Emergency Response
**Final Year Project (Artificial Intelligence / Intelligent Transportation Systems)**
**Institution**: University of Management and Technology (UMT), Lahore — School of System & Technology (SST)  
**Proposed Deployment Environment**: Punjab Safe Cities Authority (PSCA) – PPIC3, Lahore  
**Team Members**:
- Muhammad Ahmad Asif (`F2023266537`) — Lead / Platform, Integration & Safety Layer
- Muhammad Taimoor Nasir (`F2023266620`) — Simulation, Routing & Signal Control
- Muhammad Usman Danial (`F2023266622`) — Data, Perception & Traffic Prediction

**Advisors**:
- **Project Advisor**: Prof. Hafiz Ahsan Arshad (`ahsan.arshad@umt.edu.pk`)
- **Project Co-advisor**: Dr. Muhammad Husnain Ashfaq (`husnain.ashfaq@umt.edu.pk`)

---

## 1. Executive Summary & Problem Context

In dense metropolitan areas like Lahore, Pakistan, emergency ambulances (Rescue 1122) lose critical, life-saving minutes navigating congested signalised intersections. Existing preemption systems (such as Opticom or isolated acoustic sensors) suffer from four fundamental shortcomings:
1. **Reactive, Not Predictive**: Signals are triggered only when the ambulance arrives directly at the stop line, leaving no time to clear standing queues.
2. **One Intersection at a Time**: Preemption operates in isolation with zero knowledge of downstream arrival times or coordinated green waves.
3. **Shortest Distance ≠ Fastest Time**: Standard GPS navigators route through congested bottlenecks rather than dynamically evaluating signal delays and incidents.
4. **Severe Cross-Street Gridlock**: Hard, uncoordinated manual signal holds cause massive secondary spillbacks.

### The Proposed AI Solution
We propose an automated **AI Emergency-Priority Decision Layer** built on top of municipal traffic systems. Instead of replacing hardware, it ingests traffic states (CCTV perception), AVLS ambulance GPS telemetry, and central signal states. It selects the optimal hospital via multi-criteria scoring, computes a traffic-aware A* route, predicts downstream queue flush timings, and coordinates a **Moving Green Corridor** (preparing signals ahead and restoring normal signal cycles behind the vehicle). Crucially, a **Deterministic Rule-Based Safety Layer (NFR1)** validates every command before execution.

---

## 2. Implemented System Architecture

```
[ CCTV Analytics / AVLS GPS ] ──► [ Data Ingestion & Preprocessing ]
                                                │
                                                ▼
                                    [ SUMO / PSCA Digital Twin ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        [ Spatio-Temporal Prediction ]                           [ Traffic-Aware A* Router ]
         - 1, 3, 5 min ETA & Volume                               - Dynamic Hospital Ranking
                     │                                                     │
                     └──────────────────────────┬──────────────────────────┘
                                                ▼
                                    [ Moving Green Corridor ]
                                     - Coordinated Pre-Flushing
                                                │
                                                ▼
                                  [ Rule-Based Safety Layer ]
                                   (NFR1 Safety Invariants)
                                    - Conflicting Greens Blocked
                                    - Min Green >= 15s / Max Red <= 120s
                                    - Pedestrian Clearance Guaranteed
                                                │
                                                ▼
                                  [ Signal Execution Layer ]
                                   - Mode 2: SUMO TraCI Socket
                                   - Mode 1: PSCA PTSC Sandbox
                                                │
                                                ▼
                               [ React + Vite Operator HUD & Map ]
```

---

## 3. Project Structure

```
d:/FYP/
├── FYP_Proposal_Updated.pdf      # Complete 14-page FYP proposal document
├── README.md                     # Architecture, instructions & presentation guide
├── backend/                      # FastAPI Backend & Simulation Engine
│   └── main.py                   # REST API, WebSocket server, moving corridor physics & safety rules
└── frontend/                     # Modern React 19 + TypeScript + Vite + Tailwind CSS Frontend
    ├── package.json              # Frontend scripts and dependencies
    ├── vite.config.ts            # Vite config with Tailwind v4 & API/WS proxy
    ├── tsconfig.app.json         # TypeScript compiler configuration
    ├── index.html                # Application root with custom styling
    └── src/
        ├── App.tsx               # Main application controller with WebSocket listener
        ├── index.css             # Enterprise dark theme tokens, glassmorphism & glow
        ├── types/                # Strict TypeScript entity interfaces
        ├── services/             # Centralized API service client
        ├── components/           # Reusable UI & presentation widgets
        │   ├── Navbar.tsx        # Top status beacon, simulation controls & mode switcher
        │   ├── Sidebar.tsx       # Enterprise navigation menu
        │   ├── CorridorMap.tsx   # Interactive vector map of Lahore corridor
        │   ├── SignalOverrideModal.tsx # Interlock modal with live safety checks
        │   └── EmergencyDispatchModal.tsx # Emergency intake & triage modal
        └── pages/                # Dedicated FYP modules
            ├── LandingPage.tsx   # Presentation overview & architecture diagrams
            ├── LiveCorridorPage.tsx # Live Operations Center & Telemetry HUD
            ├── EmergencyDispatchPage.tsx # Hospital ranking matrix & route options
            ├── DigitalTwinStudioPage.tsx # SUMO & TraCI simulation studio
            ├── PerceptionStudioPage.tsx # CCTV YOLOv8 computer vision analytics
            ├── PredictionsPage.tsx # Traffic forecasting (1, 3, 5 min horizons)
            ├── SafetyInspectorPage.tsx # NFR1 rule invariants & live audit logs
            ├── AgenticCopilotPage.tsx # LangGraph multi-agent explainability console
            ├── BenchmarksPage.tsx # Section 9 comparative benchmarks (Strategies A to F)
            └── SettingsPage.tsx  # Role-based access control & demo reset
```

---

## 4. How to Run Locally

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) with `pip`

### Step 1: Start the FastAPI Backend
```bash
cd d:\FYP\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
Backend API will be live at: `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`).

### Step 2: Start the Frontend Dev Server
```bash
cd d:\FYP\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend web application will be live at: `http://127.0.0.1:5173/`.

---

## 5. Recommended Presentation Sequence for FYP Advisor

During your demo, guide your advisor through this 5-stage walkthrough:

1. **Stage 1: FYP Executive Overview (`/overview`)**
   - Introduce the project title, UMT faculty advisors, and the PSCA PPIC3 target environment.
   - Point out the moving corridor timeline diagram (Figure 1 in proposal).
   - Highlight the 63.0% travel time reduction (from 18.4 min down to 6.8 min).

2. **Stage 2: Live Operations Center (`/live_corridor`)**
   - Show the real-time telemetry HUD: speed, dynamic ETA countdown, and distance traveled.
   - Point to the interactive vector corridor map of Lahore: watch the ambulance progress along Ferozepur Road from Kalma Chowk to Services Hospital.
   - Explain the moving corridor principle: I-1 restores to normal cycle behind the ambulance, I-2 holds green priority, and I-3 prepares queue flushing 40s ahead.

3. **Stage 3: Interactive Safety Layer Demonstration (`/safety` or via Junction Override)**
   - Click "Override / Inspect" on any intersection.
   - Intentionally attempt an unsafe command: select `ALL_GREEN` for `110 seconds`.
   - Click "Dispatch to Safety Validator" and show how the **Rule-Based Safety Validator (NFR1)** intercepts and rejects it due to conflict matrix and maximum red violations!
   - Now select `EMERGENCY_GREEN_HOLD` for `45 seconds`, show that it is approved, and explain that AI/ML models only advise while deterministic rules protect public safety.

4. **Stage 4: AI Hospital Scoring & Traffic-Aware A* Routing (`/dispatch`)**
   - Show the clinical hospital ranking matrix (Services Hospital 96.5% vs Jinnah 91.2% vs Mayo 84.0%).
   - Compare Route 1 (Dijkstra shortest distance: 17.5 min, 5 stops) vs Route 3 (Coordinated Green Corridor: 6.8 min, 0 stops).

5. **Stage 5: LangGraph AI Co-Pilot & Research Benchmarks (`/agentic` & `/benchmarks`)**
   - Click on the explainability query: *"Why was Services Hospital chosen instead of Jinnah Hospital?"* to show the multi-agent reasoning chain.
   - Open the Benchmarks page to present the quantitative evaluation across Strategies A through F.
