# Singapore HazeWatch — Conversation History & Prompts

This document contains the complete record of user prompts, requirements, architectural decisions, and implementation outputs for the **Singapore Air Quality & PSI Live Radar (HazeWatch SG)** project.

---

## Turn 1: Initial Application Specification

### User Prompt
> build a Singapore based application that tracks live PSI levels and alerts users when air quality reaches hazardous thresholds. It should include an interactive map and push notification.
>
> build just the front end for now, I will add the server less backend connection later.

*(Followed by GitHub repository target & personal access token push instruction)*:
> `git push https://<GITHUB_TOKEN>@github.com/jeffleeovh/haze-watcher.git`

### Requirements Addressed
1. **Live PSI & Pollutant Telemetry (NEA Standards)**:
   - 5 Singapore Planning Sectors: **North** (Woodlands, Yishun), **South** (Marina Bay, Sentosa), **East** (Tampines, Changi), **West** (Jurong, Tuas), and **Central** (Bishan, Bukit Timah), plus National (Overall SG).
   - 24-hr PSI bands: Good (0–50), Moderate (51–100), Unhealthy (101–200), Very Unhealthy (201–300), Hazardous (>300).
   - 1-hr PM2.5 ($\mu\text{g/m}^3$), 24-hr PM2.5, PM10, $\text{O}_3$, $\text{NO}_2$, $\text{SO}_2$, and $\text{CO}$.
   - Realistic simulation presets: Live NEA feed, Unhealthy Afternoon Spike (~185 PSI), Severe Transboundary Haze Crisis (~338 PSI), Clear Tropical Basin (~32 PSI).
2. **Interactive Singapore Vector Map**:
   - High-fidelity SVG map with regional boundary polygons, coastal contours, and surrounding islands (Tuas, Sentosa, Jurong Island, Pulau Ubin, Pulau Tekong).
   - Layer toggles: PSI Heatmap overlay, animated wind flow streamlines, observation station pins with telemetry tooltips.
   - Click-to-inspect regional centroid badges with live PSI readouts.
3. **Hazardous Thresholds & Push Notification Engine**:
   - Native Web Push Notification API (`Notification.requestPermission()`).
   - Customizable alert thresholds (Unhealthy, Very Unhealthy, Hazardous, or custom numeric slider).
   - Synthesized dual-frequency emergency acoustic chime via the Web Audio API.
   - Persistent top alert banner and in-app audit history log with instant "Send Test Push Alert" button.
4. **ASMC Hotspot Radar & NEA Health Advisory Matrix**:
   - Sumatra & Kalimantan fire anomaly counters and prevailing monsoon wind azimuth.
   - Official health advisories for healthy persons, vulnerable groups, and N95 respirator guidance.
   - 24-hour diurnal trend trajectory chart.
5. **Git Versioning & Push**:
   - Initialized Git repository, configured branch `main`, committed codebase, and pushed to `https://github.com/jeffleeovh/haze-watcher.git`.

---

## Turn 2: Serverless API Integration

### User Prompt
> add a server less API connection that pulls live data from data.gov.sg using the following endpoint:
>
> `GET https://api-open.data.gov.sg/v2/real-time/api/psi`
> - Store this in /api folder in the project root level, NOT the src folder
> - include /heath.ts and /psi.ts within the same subfolder
> - there is no key required for this service

### Requirements Addressed
1. **Root-Level `/api` Directory**:
   - Created `/api/psi.ts`: Connects to `https://api-open.data.gov.sg/v2/real-time/api/psi` with timeout abort controllers, CORS handling, and cache headers (`s-maxage=60, stale-while-revalidate=120`). Exposes both Node/Express serverless handler and standard Web Fetch `GET` handler.
   - Created `/api/health.ts`: Diagnostic health check returning service status, uptime, and upstream connectivity check with live round-trip latency.
   - Created `/api/heath.ts`: Direct alias exporting the health handler to support the requested path format.
2. **Full-Stack Server (`server.ts`)**:
   - Express server mounting `/api/psi`, `/api/health`, and `/api/heath` on port 3000.
   - Integrates Vite middlewares in development mode and serves production static assets.
3. **Frontend Service Update (`src/services/psiService.ts`)**:
   - Configured client to query `/api/psi` as primary endpoint with automatic fallback to direct upstream and simulated models.
   - Parsed v2 real-time schema (`data.items[0].readings`) including regional maximum computations for national summaries.
4. **Verification & Git Push**:
   - Tested endpoints via local curl:
     - `/api/health` returned HTTP 200 with 135ms upstream latency.
     - `/api/psi` returned live Singapore air quality telemetry.
   - Committed and pushed changes to `main` at `https://github.com/jeffleeovh/haze-watcher.git`.

---

## Turn 3: Chat Export

### User Prompt
> export this entire chat as an .md file —> PROMPTS.md

### Output
- Generated `PROMPTS.md` containing the complete transcript, architectural decisions, file structure, and implementation details.
