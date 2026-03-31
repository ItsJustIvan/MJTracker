# 🀄 MJTracker (v0.2)
**Atomic Ledger & Real-time Scoring Orchestrator for Mahjong**

---

## 🚀 The Vision
MJTracker is a high-legibility, mobile-first scoring tool designed for a synchronized, multi-device experience. Unlike traditional trackers that store static scores, MJTracker utilizes a **ledger-based architecture** to ensure mathematical integrity across diverse Mahjong styles (Riichi, Hong Kong, etc.).

## 🏗️ Technical Architecture
The core of MJTracker is built on the principle of **Data Integrity**.

### 1. The Atomic Ledger System
Scores are not stored as variables. They are calculated in real-time via a **PostgreSQL View** (`session_scores`) that sums the `transactions` table. This ensures the table is always **zero-sum**; a point cannot be gained by one player without being exactly lost by another.

### 2. Server-Side Orchestration (RPC)
Critical game logic—such as dealer rotation, streak tracking, and profile stat increments—lives within PostgreSQL **Stored Procedures**. This prevents "race conditions" where two players might attempt to update the table state simultaneously.

### 3. Real-time Sync
Leveraging **Supabase Realtime**, the UI stays in sync across all devices. When a "Win" is recorded, the database broadcasts the change, and all players' screens update instantly without a page refresh.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 16 + Tailwind CSS (Optimized for high-contrast legibility)
- **Backend/Auth:** Supabase (PostgreSQL + Realtime)
- **State Management:** Custom `useMahjongSession` hook for unified table state
- **Infrastructure:** Vercel + GitHub Actions for CI/CD

---

## 📂 Project Structure
```text
├── supabase/
│   └── migrations/        # SQL Schema, RPCs, and Views (The "Source of Truth")
├── src/
│   ├── app/               # Next.js App Router (Pages)
│   ├── components/        # UI Components (SeatGrid, ScoreCard, Modals)
│   ├── hooks/             # useMahjongSession (The core engine)
│   └── lib/               # Supabase Client & Shared Utilities