# MJTracker Project Context

## Project Vision
MJTracker is a high-legibility, mobile-first scoring and event tracking dashboard optimized for Mahjong tournaments and league seasons. By enforcing a **server-driven deterministic state engine** via Supabase, we ensure mathematically flawless, zero-sum game states that synchronize in real-time across multiple spectator and player screens.

## Active Milestone
**League-Ready Organizer Module:** We are transitioning the platform from single-session games to multi-table league tournaments. This includes setting up events, role-based event permissions, staff-gated scoring controls, and live aggregated standings tables.

## Tech Stack
*   **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4 + TypeScript
*   **Backend & Infrastructure:** Supabase (Auth, real-time broadcasts, PostgreSQL views and triggers)
*   **Testing:** Playwright E2E Integration tests

## Architecture Highlights
*   **Scoring Mechanics:** No score math in Next.js. The frontend invokes Supabase Stored Procedures (RPCs) like `record_mahjong_hand` or `claim_seat`, which evaluate dealer streaks, multipliers, and tax rules on PostgreSQL.
*   **Audit Ledger:** Score states are logged continuously in `public.transactions` to maintain accountability.
*   **Real-time Synced Rooms:** Clients listen to table modifications using Supabase real-time broadcast channels.
