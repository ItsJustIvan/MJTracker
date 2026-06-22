# MJTracker: Project Context

## 1. Executive Summary

MJTracker is a real-time, production-grade Mahjong Session and Tournament Management Platform. Its core philosophy is to treat the client application as a "dumb terminal" and the PostgreSQL database (Supabase) as a deterministic state engine. This design choice guarantees low-latency synchronization and backend-gated game integrity, especially crucial for the complex and fluid mathematics involved in Mahjong scoring.

## 2. Key Features

### A. Session Management
-   **Real-time Scoring:** Handles complex Mahjong scoring calculations, including hand scores, dealer streaks, dealer multipliers, and point distribution.
-   **Atomic Transactions:** Every score modification, seating transition, and identity migration is computed atomically on the server within transaction blocks.
-   **Vanity Short Codes:** Sessions can have unique short codes for easy access and identification.
-   **Configurable Rules:** Sessions can be configured with custom rules (e.g., base dealer bonus, streak multiplier, dealer points enabled).
-   **Governance Modes:** Supports `casual`, `competitive`, and `event` governance modes for sessions.

### B. Tournament & Event Management
-   **Event Creation:** Allows creation of events with customizable settings such as strict scoring, scoring type, placement points, starting bank, and maximum hands.
-   **Role-Based Permissions:** Implements a robust permission system with roles like `viewer`, `scorekeeper`, and `organizer` to control access and actions within events.
-   **Atomic Leaderboard Computations:** Automatically computes and records tournament standings in `event_standings` table as soon as an administrator closes a table session.
-   **Event Registrations:** Users can register themselves for events, and admins/moderators can manage these registrations.
-   **Multi-table Event Provisioning:** Admins and moderators can create multiple competitive sessions for an event.

### C. User & Profile Management
-   **User Profiles:** Users have profiles with display names, avatars, bios, and statistics like total games played, total wins, lifetime max hand, and total points.
-   **Admin Roles:** Supports `admin` and `moderator` roles for enhanced control over the platform.

### D. Technical Architecture Highlights
-   **Supabase Integration:** Tightly coupled with Supabase for backend services, including authentication, real-time database, and RPC functions.
-   **PostgreSQL as State Engine:** Utilizes PostgreSQL with strict relational constraints, transactional safeguards, and low-latency synchronization hooks.
-   **Row Level Security (RLS):** Extensive RLS policies are in place for tables like `sessions`, `profiles`, `events`, `event_permissions`, `session_players`, `session_scores`, `transactions`, and `event_standings` to ensure data security and proper access control.
-   **Server-Side Logic (RPCs & Triggers):** Critical game logic, such as `record_hand`, `revert_last_round`, `claim_seat`, `seal_session`, and `create_event_tables` are implemented as Supabase RPC functions or database triggers to ensure data integrity and prevent client-side manipulation.
-   **Realtime Broadcast:** Uses a `broadcast_room_hand_record` trigger to send real-time updates to clients when a hand is recorded.

## 3. Development Setup

This project is a Next.js application. To set up locally:

1.  **Environment Variables:** Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2.  **Dependencies:** Install dependencies using `npm install`.
3.  **Run Development Server:** `npm run dev`
4.  **Testing:** Run Playwright tests with `npx playwright test` (after `npm run dev`).

## 4. Supabase Migrations

The `supabase/migrations` directory contains the database schema evolution. Key migration files include:
-   `0001_setup_supabase.sql`: Initializes the database with core tables, RLS policies, and essential RPC functions for session management and scoring.
-   `20260608003744_remote_schema.sql`: (Content not detailed, but likely contains schema changes synced from a remote Supabase instance).
-   `20260614120000_add_roles_and_events.sql`: Introduces event registration functionality, additional RLS policies for competitive sessions, and a `create_event_tables` function.


