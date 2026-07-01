# Screenshot Capture Guide for Project Report

This guide maps the report sections to the screens and code paths in the current codebase so you can capture the right screenshots before inserting them into the final report.

## How To Run The Project

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open the local app in the browser and keep the page visible while capturing screenshots.
4. Use these URLs as the fixed capture targets:
	- `http://localhost:3000/overview`
	- `http://localhost:3000/turbine`
	- `http://localhost:3000/metrics`
	- `http://localhost:3000/controls`
	- `http://localhost:3000/ai`
	- `http://localhost:3000/reports`

## Recommended Screenshot Order

Capture the screenshots in this order so the report shows the system from setup to live behavior:

1. App startup / initialization screen.
2. Main dashboard with normal live telemetry.
3. Full 3D turbine visualization.
4. Control panel with sliders and toggles visible.
5. AI insights card with a populated health score.
6. Reports tab with session statistics, alerts, and recommendations.
7. Backend or terminal output showing the project running.
8. Build or validation output if you want proof of deployment readiness.

## Where To Place Screenshots In The Report

| Report section | What to capture | Best screen / code area | Suggested figure use |
| --- | --- | --- | --- |
| Chapter 1: Introduction | Optional overview image of the system | Main app dashboard | Use only if you want a high-level project preview |
| 3.1 System Architecture Overview | Architecture diagram or a clean system flow graphic | Report figure, not a UI screen | Insert as a conceptual block diagram |
| 3.6 Data Flow: User Input → Simulation → Display | Screenshot showing controls, live metrics, and chart together | [App.tsx](../src/App.tsx), [Dashboard.tsx](../src/components/Dashboard.tsx), [ControlPanel.tsx](../src/components/ControlPanel.tsx) | Best place for a live working-system screenshot |
| 3.7 Classes and Components | Optional component mapping image or code architecture figure | [App.tsx](../src/App.tsx), [Sidebar.tsx](../src/components/Sidebar.tsx), [DigitalTwin3D.tsx](../src/components/DigitalTwin3D.tsx), [AIInsights.tsx](../src/components/AIInsights.tsx) | Use if the report needs a software structure visual |
| 4.2 Backend Implementation | Terminal output, API running, or endpoint response screenshot | [server.ts](../server.ts) | Show that the backend is active and serving telemetry |
| 4.3 Frontend Implementation | Main dashboard UI | [App.tsx](../src/App.tsx), [Dashboard.tsx](../src/components/Dashboard.tsx), [DigitalTwin3D.tsx](../src/components/DigitalTwin3D.tsx), [AIInsights.tsx](../src/components/AIInsights.tsx), [ControlPanel.tsx](../src/components/ControlPanel.tsx) | Use as the main implementation screenshot |
| 4.5 Real-Time Data Flow | A live state change after adjusting a control | [ControlPanel.tsx](../src/components/ControlPanel.tsx) + [Dashboard.tsx](../src/components/Dashboard.tsx) | Capture before/after behavior if possible |
| 4.6 Build and Deployment | Build output or successful startup output | `npm run build` or `npm run dev` terminal | Good evidence that the project compiles and runs |
| 4.7 Output Demonstrations | The most important screenshots from the finished UI | All frontend components, especially [DigitalTwin3D.tsx](../src/components/DigitalTwin3D.tsx), [Dashboard.tsx](../src/components/Dashboard.tsx), [AIInsights.tsx](../src/components/AIInsights.tsx), [ControlPanel.tsx](../src/components/ControlPanel.tsx) | This is the best chapter for most screenshots |
| 4.8 Testing and Validation | Validation output, browser proof, or stable runtime screen | Backend terminal plus browser dashboard | Use one screenshot for runtime proof and one for validation if needed |
| Chapter 5: Results / Conclusion | Final report-style screenshots, reports tab, and stable dashboard state | Reports tab in [App.tsx](../src/App.tsx) | Best place for polished final-state visuals |

## Exact Screenshots To Capture

### 1. Startup / Running Project

Capture the terminal after running `npm run dev` so the report shows the system is live. This is best placed in the build/deployment or testing section.

### 2. Main Dashboard

Capture the default dashboard view with these elements visible:

- 3D turbine panel
- real-time metric cards
- trend chart
- AI health card
- control panel

This is the strongest general screenshot for Chapter 4.3 and Chapter 4.7.

### 3. 3D Visualization

Capture the turbine close enough that the rotor, yaw direction, and status light are visible. This belongs in the implementation or output demonstration section.

### 4. Control Interaction

Capture the control panel while adjusting:

- wind speed
- wind direction
- blade pitch
- yaw
- auto mode
- emergency brake

This is best for the data-flow section because it shows user input affecting the simulation.

### 5. AI Diagnostic Output

Capture the AI card with a visible health score, analysis, and recommendation. If possible, capture both a healthy state and a warning/critical state.

### 6. Reports Tab

Capture the reports page after switching from Dashboard to Reports in the sidebar. This should show:

- average power
- peak power
- operating rate
- dominant status
- alerts
- recommendations

This is the best screenshot for the results/conclusion part of the report.

### 7. Backend Proof

Capture the terminal or console output that shows the backend running and serving the app. If you want to be more specific, also capture a browser response from an endpoint like `/api/state` or `/api/reports`.

## Practical Capture Tips

- Use a browser window size that keeps the full dashboard layout visible.
- Capture one clean screenshot per report subsection instead of one crowded composite image.
- Prefer screenshots with meaningful state changes, not idle default values only.
- If the report needs strong evidence, capture both normal and warning states.
- Keep file names consistent, for example `fig-4-3-dashboard.png`, `fig-4-7-ai-card.png`, and `fig-4-8-reports-tab.png`.

## Best Placement Summary

If you only add a few screenshots, put them here:

1. Chapter 4.3 Frontend Implementation: main dashboard screenshot.
2. Chapter 4.5 Real-Time Data Flow: control change screenshot.
3. Chapter 4.7 Output Demonstrations: 3D view, AI card, and reports tab.
4. Chapter 4.8 Testing and Validation: backend running or build output.
5. Chapter 5 Results: reports tab with final stable state.
