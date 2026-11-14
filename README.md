# Orbit ZA — Community Risk Intelligence & Environmental Digital Twin

**Tagline:** Seeing Hazards. Understanding Risk. Protecting Communities.  
**Challenge:** NASA Space Apps Challenge 2026 — *Dancing with the SARs*  
**Initial Study Focus:** Durban & KwaZulu-Natal, South Africa

## Overview

Orbit ZA transforms multi-mission Synthetic Aperture Radar (SAR) and Earth-observation indicators into understandable community risk intelligence, infrastructure screening, agricultural monitoring, and hypothetical digital-twin scenarios.

## Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Leaflet & React Leaflet, Recharts, Lucide React
- **Backend:** Node.js + Express (`server.ts`) exposing REST endpoints:
  - `GET /api/overview` — Aggregated study-area command-centre state
  - `GET /api/facilities`, `POST /api/facilities`, `PUT /api/facilities/:id` — Community facility registry with evacuation verification enforcement
  - `GET /api/infrastructure` — Water infrastructure and InSAR ground movement stations
  - `GET /api/agriculture` — Agricultural land degradation, NDVI, soil moisture, and HV/VV backscatter
  - `GET /api/streetlights`, `POST /api/streetlights/simulate` — Simulated municipal smart streetlight warning controller & command log
  - `GET /api/digital-twin` — Rule-based scenario and timeline engine (`Current`, `+1h`, `+2h`, `+3h`, `+6h`)
  - `GET /api/satellite-observations`, `GET /api/satellite-adapters/live-catalog` — Modular data adapters + live NASA CMR public catalog query
  - `GET /api/reports/summary`, `GET /api/reports/export` — CSV and JSON demonstration report exports

## Scientific & Ethical Guardrails

1. **Real vs. Simulated Transparency:** Demonstration extracts for Durban and KwaZulu-Natal are explicitly labelled `Simulated Demonstration Data`. Live collection metadata queries target NASA's official Common Metadata Repository (`cmr.earthdata.nasa.gov`).
2. **Non-Alarmist Hazard Engine:** Uses `GREEN (Normal)`, `YELLOW (Advisory)`, `ORANGE (High)`, and `RED (Critical)` screening records with explicit data provenance, confidence notes, and expiry timestamps. Never manufactures official government warnings.
3. **Shelter Verification & Privacy:** Churches and schools are marked `Unverified for Evacuation` unless explicitly verified. No household-level personal data is collected or exposed.
4. **Infrastructure & Lighting Realism:** Radar observations alone never confirm pipeline leaks or structural failures, and NASA VIIRS Black Marble nighttime radiance is never equated with individual streetlight IoT telemetry.
