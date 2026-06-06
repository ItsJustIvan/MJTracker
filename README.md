# 🀄 MJTracker
**Deterministic Real-Time Session & Tournament Management Platform for Mahjong**

---

## 1. Executive Summary & Core Philosophy

The objective of this application is to deliver a real-time, production-grade **Mahjong Session and Tournament Management Platform**.

Mahjong scoring involves highly complex, fluid mathematics (calculating hand scores, tracking continuous dealer streaks, applying dealer multipliers, determining point distribution based on self-draws vs. discards, and processing manual adjustments). Traditionally, software relies on client-side state machine calculation, which is fragile, prone to local desynchronization, and vulnerable to manipulation.

**Our Core Philosophy:** The client application is treated as a "dumb terminal." It renders UI components and dispatches raw intent. The PostgreSQL database operates as a **deterministic state engine**. Every score modification, seating transition, identity migration, and tournament ranking is computed atomically on the server inside transaction blocks. Tight coupling with Supabase is an intentional design choice to guarantee low-latency synchronization and backend-gated game integrity.

---

## 2. Technical Architecture & Database Blueprint

The database architecture is designed with strict relational constraints, transactional safeguards, and low-latency synchronization hooks.

### Schema Blueprint

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  bio text,
  total_games_played integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  theme_preference text DEFAULT 'system'::text,
  is_admin boolean DEFAULT false,
  lifetime_max_hand integer DEFAULT 0,
  lifetime_max_payout integer DEFAULT 0,
  lifetime_total_points bigint DEFAULT 0,
  lifetime_max_streak integer DEFAULT 0
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'active'::text,
  settings jsonb DEFAULT '{
    "strict_scoring": false,
    "scoring_type": "placement",
    "placement_points": [4, 2, 1, 0],
    "starting_bank": 25000,
    "max_hands": 8
  }'::jsonb
);

CREATE TABLE public.event_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role DEFAULT 'viewer', -- Enum: 'viewer', 'scorekeeper', 'organizer'
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid,
  status text DEFAULT 'active'::text, -- 'active', 'closed'
  prevalent_wind integer NOT NULL DEFAULT 0,
  dealer_streak integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  current_dealer_idx integer NOT NULL DEFAULT 0,
  short_code text UNIQUE,
  created_by uuid REFERENCES auth.users(id),
  rules jsonb DEFAULT '{"base_dealer_bonus": 1, "streak_multiplier": 2, "dealer_points_enabled": true}'::jsonb,
  event_id uuid REFERENCES public.events(id),
  vanity_name text,
  governance_mode text DEFAULT 'casual'::text CHECK (governance_mode = ANY (ARRAY['casual'::text, 'competitive'::text, 'event'::text])),
  last_activity_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  hand_number integer NOT NULL DEFAULT 1
);

CREATE TABLE public.session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id),
  seat_index integer NOT NULL CHECK (seat_index >= 0 AND seat_index <= 3),
  profile_id uuid REFERENCES public.profiles(id),
  is_ready boolean DEFAULT false,
  guest_name text,
  guest_session_id uuid
);

CREATE TABLE public.session_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id),
  seat_index integer NOT NULL CHECK (seat_index >= 0 AND seat_index <= 3),
  total_score integer DEFAULT 0
);

CREATE TABLE public.transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  session_id uuid REFERENCES public.sessions(id),
  winner_seat_index integer,
  loser_seat_index integer,
  points integer,
  is_self_draw boolean DEFAULT false,
  dealer_at_time integer,
  result_type text CHECK (result_type = ANY (ARRAY['win'::text, 'self_draw'::text, 'dead_hand'::text, 'adjustment'::text])),
  dealer_streak_at_time integer DEFAULT 0,
  dealer_points_applied integer DEFAULT 0,
  is_adjustment boolean DEFAULT false,
  prevalent_wind_at_time integer DEFAULT 0,
  is_dealer_points_on boolean DEFAULT true
);

CREATE TABLE public.event_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  final_table_score integer NOT NULL,
  rank_position integer NOT NULL,
  league_points_earned float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);
```

---

## 3. Core Architectural Decisions

### Decision A: Trigger Consolidation & Elimination of Drift
* **The Problem:** The `sessions` table previously contained multiple redundant triggers (`after_session_created`, `on_session_created`, `tr_initialize_session`, `trigger_initialize_session`) competing to instantiate seat data alongside an independent short-code generator. This caused race conditions and duplicate seating records.
* **The Resolution:** Consolidated all logic into a single, comprehensive `BEFORE INSERT` trigger named `tr_session_init_all` that executes `initialize_session_data()`.
* **Behavior:** This function dynamically provisions initial score matrices based on rule inputs, creates the 4 empty player seating slots (0-3), generates vanity short codes, and fully establishes base session invariants on the database level before serialization.

### Decision B: Native Score Portability on Seating Swaps
* **The Problem:** Moving seats dynamically in standard systems orphans transaction history or breaks historical continuity.
* **The Resolution:** Standardized seat re-allocations on a `claim_seat()` system executing under `SECURITY DEFINER` constraints. Shifting a player between seats executes an **atomic mathematical swap** of their banking scores and structural table linkages, preserving full ledger histories automatically.

### Decision C: Server-Side Permission Hardening & Staff Gating
* **The Problem:** Vulnerable front-ends can be manipulated. If an unauthorized player executes direct transaction inserts via the PostgREST API bypass, scores can be falsified.
* **The Resolution:** Re-architected both `record_hand()` and `revert_last_round()` as hard-gated server wrappers.
* **Behavior:** If a parent session is part of an event operating under **Strict Mode (`strict_scoring: true`)**, the system maps execution context via `auth.uid()` to verify `event_permissions`. If the client lacks a role higher than simple user (`organizer` or `scorekeeper`), the database raises an exception and completely rolls back any transaction updates.

### Decision D: Atomic Leaderboard Computations
* **The Problem:** Computing tournament standing tables asynchronously puts heavy performance costs on web and mobile UI layers.
* **The Resolution:** Implemented a backend pipeline executing `process_league_standings(p_session_id)` mapped directly to `seal_session()`.
* **Behavior:** As soon as an administrator closes a table session, the database ranks scores, aggregates tournament weights relative to event settings rules (`placement_points: [4, 2, 1, 0]`), and immediately writes permanent records into `event_standings`.

---

## 4. Supabase Integration & Endpoint Map

The client coordinates exclusively with Supabase RPC procedures to handle game state:

### Core RPC Endpoint Signatures:
1.  **`record_hand(p_session_id uuid, p_winner_seat_index integer, p_loser_seat_index integer, p_points integer, p_result_type text, p_is_self_draw boolean)`**
    *   *Purpose:* Submits a complete round result. Executes dealer rotation rules, adds streak indices, and logs atomic transactions.
2.  **`revert_last_round(p_session_id uuid)`**
    *   *Purpose:* Safely reverts the most recent transaction entry inside the table's score history.
3.  **`claim_seat(p_session_id uuid, p_seat_index integer)`**
    *   *Purpose:* Claims an empty seat or securely performs an atomic swap of seat coordinates, profiles, and associated point records.
4.  **`seal_session(p_session_id uuid)`**
    *   *Purpose:* Ends a table session, updates game history, and triggers direct ranking standing calculations.

---

## 5. Next Feature Horizon: The "League-Ready" Organizer Module

Upcoming development cycles focus on transitioning the current single-table logic to an integrated **League Ecosystem**:

1.  **The Organizer Dashboard UI:** Dedicated UI module to provision events, delegate role privileges dynamically, adjust JSONB config values, and orchestrate tournament grids.
2.  **The "Staff-Gated" Scoring Drawer:** Conditional UI display depending on strict event settings:
    *   *Staff/Organizer View:* Full scoring submission controllers, manual adjustments, and sealing utilities.
    *   *Standard Player View:* Fallback view displaying a read-only live broadcast of the table's state.
3.  **Global Leaderboard Interface:** Real-time, server-derived tournament ranking lists fetched straight from `event_standings`.

---

## 6. Developing & Testing

### Installation & Client Setup
Ensure you configure local env values in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Playwright Test Suites
To run testing configurations:
```bash
npm run dev
# In another window:
npx playwright test
```
*Note on tests:* Our tests target atomic server logic pathways and ensure permissions blocks are fully enforced.
