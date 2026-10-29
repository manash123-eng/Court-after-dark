# Courts After Dark 🏸🏀⚽
**Full-Stack Sports Facility Discovery, Fair Allocation & Equipment Management Platform**

Built with **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, and **MongoDB / Mongoose**.

---

## 🚀 Live Demo & Instant Exploration

The application is running live at **http://localhost:3000**.

### ⚡ 1-Click Instant Demo Accounts (Zero Credentials Required!)
Anyone can explore and test the platform immediately without filling out forms:
- **⚡ Demo Athlete / Player (Aarav Sharma):** `aarav@example.com`
  - Book courts, check out sports equipment, view digital game passes, monitor fair-allocation quotas.
- **🛡️ Demo Administrator (Admin User):** `admin@courtsafterdark.com`
  - Full management suite: manage facility inventory, schedule maintenance blocks, track equipment stock, configure fair-use rules, review audit logs, and view revenue analytics.

**Where to find 1-Click Demo buttons:**
1. **Top Navigation Bar:** Click the **"⚡ Demo Mode"** dropdown to switch roles instantly.
2. **Sign In Page (`/login`):** Prominent 1-click login buttons for Demo Player and Demo Admin.
3. **Sign Up Page (`/register`):** "Just Exploring?" fast access panel.
4. **Home Page Hero (`/`):** Instant demo access pills right below the search bar.
5. **Facility Detail Booking Modal:** When exploring as a guest, clicking "Book Selected Slot" allows 1-click continuation as Demo Player.
6. **Equipment Catalog Checkout Modal:** Free sports gear checkout with 1-click Demo Player access.

### 👀 Explore as Guest (No Login Needed)
You can freely browse the entire platform without creating an account:
- **Discover Facilities (`/facilities`):** Filter by sport (Badminton, Basketball, Football, Cricket, Tennis, Volleyball, Gym, Table Tennis), price slider, city, indoor/outdoor, and amenities.
- **Inspect Live Calendars (`/facilities/[id]`):** View real-time operating hours, prime-time flags (18:00 - 21:00), booked slots, and maintenance blocks.
- **Equipment Directory (`/equipment`):** Browse sports gear catalog, live stock meters, and condition ratings.
- **Fair-Use Rules & FAQs (`/help`):** Comprehensive explainer on anti-monopoly caps and concurrency safety.

---

## 🛠️ Quickstart Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/courtsafterdark
JWT_SECRET=courts-after-dark-jwt-super-secret-key-32charslong!
```

### 3. Seed Database
Seeds 10 facilities, 15 equipment items, 10 users, 18 historical/future bookings, 5 maintenance blocks, waitlist entries, and system rules:
```bash
npm run seed
```

### 4. Run Application
```bash
# Production mode on Port 3001:
npm run build
npx next start -p 3001

# Or Development mode:
npm run dev
```

### 5. Automated End-to-End Test Suite
Run the automated verification script testing auth, concurrency-safe booking, fair-use limits, waitlists, and equipment tracking:
```bash
node scripts/test-workflows.js
```

---

## 🏛️ System Architecture & Core Modules

Courts After Dark is architected into three tightly integrated modules:

```
[ Facility Inventory ] ──► [ Availability Calculation ] ──► [ Fair Allocation & Concurrency Guard ]
                                                                      │
                                                                      ├──► [ Digital Game Pass ]
                                                                      └──► [ Equipment Checkout ]
                                                                                    │
                                                                                    ▼
                                                                      [ Maintenance Block Overrides ]
```

### Module 1: Facility Discovery & Real-Time Availability
- **Multi-Attribute Search & Filters:** Search by venue name, sport type, city, indoor/outdoor status, price range, and amenities (floodlights, locker rooms, parking).
- **Sorting & Pagination:** Sort by popularity, price ascending/descending, or featured status.
- **Real-Time Calendar:** Slot states are computed dynamically: `Available` (green), `Booked` (slate), `Blocked / Maintenance` (amber striping), with a `Flame` icon for prime-time hours (18:00 - 21:00).
- **Persisted Favorites:** Players can save favorite facilities directly to their user document in MongoDB.

### Module 2: Concurrency-Safe Fair Booking & Anti-Monopoly Engine
- **Atomic Transactions:** Uses MongoDB sessions (`mongoose.startSession()` with `withTransaction`) to eliminate double-booking race conditions when multiple players book simultaneously.
- **Anti-Monopoly Quota:** Caps each player at a maximum of **2 active bookings** simultaneously.
- **Prime-Time Distribution:** Enforces a maximum of **3 prime-time reservations per week** per athlete to prevent court hoarding.
- **Priority Waitlist:** When a booked slot is cancelled by the holding player, players queued on the waitlist are automatically notified in FIFO order.
- **Digital Game Pass:** Upon confirmed reservation, players receive a digital ticket with a reference code (`CAD-XXXXX`), status pill, and venue check-in details.

### Module 3: Equipment Inventory & Facility Operations
- **Linked Gear Reservations:** Players can check out sports equipment (rackets, match balls, training vests) linked directly to their court reservation.
- **Inventory Stock Meters:** Live decrement upon checkout and automatic restoration upon return.
- **Maintenance Overrides:** Admins can schedule routine pitch maintenance or lighting repairs, immediately blocking out affected court slots on public calendars.
- **Audit Logging:** Security and operational events are recorded in `AuditLog` with actor ID, timestamp, and severity levels.

---

## 🔑 Demo Credentials Reference

| Role | Name | Email | Password | Access Level |
|---|---|---|---|---|
| **Player** | Aarav Sharma | `aarav@example.com` | `player123` | Booking, Pass, Equipment, Favorites |
| **Player** | Priya Nair | `priya@example.com` | `player123` | Booking, Pass, Equipment, Favorites |
| **Admin** | Admin User | `admin@courtsafterdark.com` | `admin123` | Full Administrative & Operations Suite |

*Note: You can also use the 1-Click Instant Demo buttons on the site to log in with zero typing.*

---

## 💻 Tech Stack Summary

- **Frontend:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons
- **Design System:** Electric Lime (`#a3e635`) on Midnight Obsidian (`#080d1a`, `#0f172a`), responsive on mobile/tablet/desktop
- **Backend API:** Next.js Route Handlers (`app/api/*`)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Signed HTTP-only JWT cookies (`cad_token`), bcrypt password hashing, automatic session hydration via `useAuth()`
