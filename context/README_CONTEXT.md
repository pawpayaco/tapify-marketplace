# 🧭 Tapify Context Overview

This directory serves as the **single source of truth** for Tapify’s entire ecosystem — connecting the **Next.js frontend**, **Shopify commerce backend**, **Supabase database**, and **UI system** into one documented architecture.

Every file here exists to make the repo *explainable, scalable, and AI-readable* — so Claude, Cursor, or any engineer can fully understand the system’s structure and logic instantly.

---

## 📂 Folder Structure
├── context
│   ├── AuthContext.js
│   ├── CLAUDE.md
│   ├── data_model.md
│   ├── GAME_PLAN_2.0.md
│   ├── nextjs
│   │   ├── db_calls_summary.md
│   │   ├── frontend_flow.md
│   │   ├── pages_api_summary.md
│   │   └── shopify_integration.md
│   ├── payouts_flow.md
│   ├── README_CONTEXT.md
│   ├── shopify
│   │   ├── flows.md
│   │   ├── integration_points.md
│   │   ├── metafields.md
│   │   ├── overview.md
│   │   ├── store_structure.md
│   │   └── webhooks.md
│   ├── supabase
│   │   ├── constraints.md
│   │   ├── fk_candidates.md
│   │   ├── foreign_keys.md
│   │   ├── overview.md
│   │   ├── queries
│   │   │   ├── constraints.sql
│   │   │   ├── fk_candidates.sql
│   │   │   ├── foreign_keys.sql
│   │   │   ├── row_counts.sql
│   │   │   └── tables_and_columns.sql
│   │   ├── row_counts.md
│   │   └── tables_and_columns.md
│   └── ui
│       ├── design_system_tokens.md
│       └── ui_overview.md


---

## 🧩 Overview of Major Sections

### 🪄 Next.js (Frontend + API)
Documents the app’s frontend logic, authentication context, and how API routes interact with Supabase and Shopify.

### ⚛️ Next.js (Frontend Layer)
The @context/nextjs folder documents how the Tapify frontend operates.

| File | Description |
|------|--------------|
| pages_api_summary.md | Full catalog of all API routes |
| frontend_flow.md | Maps user journeys and routing logic |
| auth_flow.md | Authentication architecture and SSR patterns |
| db_calls_summary.md | Summarizes all Supabase query usage |
| shopify_integration.md | Details Shopify data and webhook connections |
| components_overview.md | React components and design patterns |
| overview.md | Master index and system-level architecture |


---

### 🛍 Shopify (Commerce Layer)
Outlines how Shopify powers checkout, product data, and order events that sync into Tapify’s Supabase backend.

| File | Purpose |
|------|----------|
| **flows.md** | Full sequence from checkout → webhook → Supabase order insert. |
| **integration_points.md** | Describes all Tapify↔Shopify integration hooks (e.g., line item attributes, UID tracking). |
| **metafields.md** | Defines Shopify metafields used for product, display, and vendor data. |
| **overview.md** | High-level description of Shopify’s role as Tapify’s transaction engine. |
| **store_structure.md** | Explains how Shopify collections, tags, and navigation are organized. |
| **webhooks.md** | Enumerates all active webhooks, payload examples, and how they sync with Supabase. |

---

### 🧠 Supabase (Database + Backend)
Central data layer handling authentication, relationships, payouts, and display attribution.

| File | Purpose |
|------|----------|
| **overview.md** | Explains the DB’s purpose and key entities (`retailers`, `vendors`, `uids`, `payout_jobs`, etc). |
| **tables_and_columns.md** | Raw schema reference (auto-generated via `information_schema`). |
| **foreign_keys.md** | Documents real and inferred FK relationships. |
| **fk_candidates.md** | Notes potential relationships not yet formalized. |
| **constraints.md** | Table constraints, default values, and checks. |
| **row_counts.md** | Approximate record counts for debugging or scaling analytics. |
| **queries/** | SQL snapshots of your schema (for reproducibility and Claude context). |

---

### 🎨 UI (Design System)
Defines all visual patterns, design tokens, and UI philosophy.

| File | Purpose |
|------|----------|
| **design_system_tokens.md** | Lists the global design constants: colors, gradients, spacing, typography, radii. |
| **ui_overview.md** | Describes the design principles, motion styles, and reusable component patterns. |

---

### 🧱 Root-Level Files

| File | Purpose |
|------|----------|
| **AuthContext.js** | React Auth Provider using Supabase session logic. Wraps the app in `_app.js`. |
| **CLAUDE.md** | Developer guidance file for Claude Code — defines how AI should interpret this repo. |
| **GAME_PLAN_2.0.md** | Tapify’s master vision document: strategy, phases, payout logic, and architecture. |
| **data_model.md** | Conceptual overview of entity relationships and data flow (Supabase ↔ Shopify ↔ Next.js). |
| **payouts_flow.md** | Documents how Dwolla/Plaid payouts are triggered and reconciled through Supabase. |

---

## 🧭 Usage Guidelines

- **Claude + Cursor Context:**  
  All `.md` files here exist to give AI full situational awareness. Keep them human-readable and version-controlled.
  
- **If Supabase schema changes:**  
  Run your SQL exports and update the relevant `.md` + `.sql` files under `supabase/`.

- **If Shopify webhooks or flows change:**  
  Update both `shopify/webhooks.md` and `shopify/integration_points.md` for consistency.

- **If new API routes are added:**  
  Append them in `nextjs/pages_api_summary.md` and update `db_calls_summary.md` if they touch the database.

---

## ✅ Purpose Recap

> The **Context Directory** is not just documentation — it’s a living system map that ensures Claude, Cursor, and any developer can operate Tapify’s full stack without missing context.

Everything ties back to one central goal:
> **Turn Pawpaya into the Trojan Horse that proves Tapify — and scale it into a self-propagating retail engine.**