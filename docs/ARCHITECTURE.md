# System Architecture

The core of MJTracker is engineered around a single fundamental design principle: **The front-end client acts as a "dumb terminal" while the Supabase PostgreSQL database serves as the complete, deterministic state engine.**

This architecture prevents desynchronization across player devices, protects room states from local clock deviations or client-side tampering, and ensures robust multi-device synchronization in real-time.

```text
                  +-----------------------------------+
                  |      React Next.js Frontend       |
                  |     (Renders UI & Dispatches)     |
                  +-----------------+-----------------+
                                    |
                                    |  (Direct DB Calls & RPC)
                                    v
                  +-----------------+-----------------+
                  |      Supabase PostgREST API       |
                  +-----------------+-----------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                     PostgreSQL Database Engine                        |
|                                                                       |
|  +--------------------+   +-------------------+   +----------------+  |
|  |    Transactions    |   |     Triggers      |   |  RPC Procedures|  |
|  |   (Zero-sum Ledger)|   | (Session Init, etc|   | (record_hand)  |  |
|  +--------------------+   +-------------------+   +----------------+  |
|                                                                       |
+-----------------------------------+-----------------------------------+
                                    |
                                    |  (Broadcast Changes)
                                    v
                  +-----------------+-----------------+
                  |      Supabase Realtime Engine     |
                  +-----------------+-----------------+
                                    |
                                    |  (Live Updates)
                                    v
                  +-----------------+-----------------+
                  |      All Seated & Spectator       |
                  |             Screens               |
                  +-----------------------------------+
```

## System Components

### 1. Presentation & State Dispatcher (Frontend)
*   **Next.js 16 Client Components:** Formulate interactive drawers, seat layouts, and scoring selectors. These components read table configurations and emit simple intention payloads to Supabase.
*   **State Containers (`src/context/TableContext.tsx`):** Maintains active context states without executing score-distribution logic.
*   **Seeding & Session Sync Hooks (`src/hooks/`):** Initializes subscription bindings using Supabase real-time sockets. Any updates triggered on the server broadcast immediately, causing standard React updates on the client UI.

### 2. State Controller & Validation Layer (Database RPC / Triggers)
*   **`claim_seat` Procedure:** Controls guest/authenticated player seating allocations. Implements transactional boundaries preventing seat overlaps.
*   **`record_mahjong_hand` / `record_mahjong_win` Procedures:** Receives the winner, loser, and hand points parameters, then calculates double-dealer multipliers, dealer streak adjustments, and seat payouts directly on the database.
*   **`tr_session_init_all` Trigger:** Hooked on the `sessions` table insert. Automatically creates 4 default seat arrays, computes rule defaults, and registers a unique, readable room short-code.

### 3. State Subscription Network (Supabase Realtime)
*   Enables low-latency reactive connections. Instead of polling REST endpoints, client hooks join a websocket channel mapping active mutations to tables like `session_players`, `sessions`, and `transactions`.
