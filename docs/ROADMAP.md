# 🗺️ MJTracker Development Roadmap

This document outlines the journey from **v0.2** to **v1.0**.

---

## 👤 User Personas & Roles
- **Guest:** Unauthenticated; instant seat claim via nickname.
- **Player:** Authenticated; permanent stat tracking and profile history.
- **Host:** Session Creator; access to table management (Close/Undo).
- **Admin:** Global Superuser; "God Mode" access to all sessions and overrides.

---

## 🚀 Phase 1: Identity & Entry (The "Join" Journey)
*Goal: Zero-friction onboarding for live environments.*

- [x] Schema Update: Added is_admin to profiles and guest_name to session_players.
- [x] Guest Mode: Implemented "Claim Seat as Guest" with local persistence via localStorage.
- [x] Auth Bridge: Created the "Identity Choice" UI and the Automatic Account Merge logic in useMahjongSession.
- [x] Seat Management: Added "Leave Seat" and "Manage Seat" modals to allow users to vacate or upgrade mid-game.
- [x] Manual Auth: Deployed Email/Password authentication with CAN-SPAM compliant marketing opt-ins.

---

## 🛠️ Phase 2: Control Center (The "Settings" Journey)
*Goal: Mobile-first administrative tools and error recovery.*

- [ ] **Bottom-Sheet Drawer:** Implement a high-legibility "Settings Drawer" using `vaul`.
- [ ] **The Undo Engine:** Deploy `undo_last_transaction` RPC to revert scores and rewind the dealer ring.
- [ ] **Role-Based UI:** Dynamically show/hide "Undo," "Close," and "Reopen" buttons based on user permissions.
- [ ] **Manual Overrides:** Add "Rotate Dealer" and "Adjust Streak" for table sync issues.

---

## 📊 Phase 3: Trust & Audit (The "History" Journey)
*Goal: Transparency and data integrity for all players.*

- [ ] **Transaction Ledger UI:** A scrollable list of "Hand History" within the Settings Drawer.
- [ ] **Audit Tags:** Visually flag transactions that were "Undone" or "Edited by Admin."
- [ ] **Haptic Feedback:** Add "Vibration/Toast" notifications when a score is successfully recorded.

---

## 💎 Phase 4: Beta Polish (The "Vegas" Journey)
*Goal: Stability and "Senior Legibility" for the first live test.*

- [ ] **Legibility Audit:** High-contrast pass for low-light environments (Casinos/Bars).
- [ ] **Offline Handling:** Graceful "Connection Lost" states for spotty Wi-Fi.
- [ ] **End-of-Game Summary:** A "Post-Game" screen with total score distributions and "MVP" highlights.

---

## ✅ Definition of Done (MVP)
1. A Host can text a link to 3 friends.
2. Guests can join and pick a seat in < 10 seconds.
3. Errors can be undone via the Drawer.
4. The Session math is guaranteed zero-sum.