# Codebase Module Map

This map provides the logical and physical blueprints for understanding folder layouts, shared helper files, routing endpoints, and component placements.

---

## 📂 Physical Root Topology

- **`/app`**: Next.js App Router housing pages, layouts, and API route handlers.
- **`/lib`**: Reusable business logic layers (Auth, DB Connectors, Common Utilities, External Datasets).
- **`/prisma`**: Persistence schema definitions and database connection configs.
- **`/public`**: Statically served assets (images, PDFs, logos).
- **`/scripts`**: Build tools, data refresh utilities, and migration triggers.

---

## 🗺️ Application Route Map (`/app`)

### 🧑‍💻 Administrative Dashboard (`/app/admin`)
Contains modules guarded by session validation forcing `role === 'ADMIN'`.
- `/admin` — Main Metrics Dashboard.
- `/admin/journals` — High-performance Catalog Management Interface.
- `/admin/orders` — Customer sales orders listing & adjustment tools.
- `/admin/proforma` — Corporate/Institutional quotation trackers.
- `/admin/coupons` — System-wide discount voucher generators.
- `/admin/users` — Registered user control deck.
- `/admin/email-templates` — WYSIWYG/Plaintext management of dynamic system email templates.
- `/admin/contact-entries` / `/admin/agency-queries` — CRM hubs logging incoming inbound contacts.

### 🔌 API Backend Core (`/app/api`)
Provides Next.js Node.js routes consumed via Fetch inside frontend clients.
- `/api/admin/journals` — Secure database controllers (GET, POST, DELETE).
- `/api/checkout/razorpay-order` — Integration with commercial payment processors.
- `/api/auth` — Session lifecycle handling (Login, Registration, Session checks).

### 🛒 Public Client Views (`/app/*`)
- `/catalogues-list` — Full interactive grid of available journal subjects and individual prices.
- `/get-proforma-invoice-quote` — Dynamic wizard for generating printable quotation records.
- `/account` — Logged-in user control panel for viewing local orders and history.

---

## 🧠 Shared Business Logic Matrix (`/lib`)

| Module Path | Core Domain | Key Exports |
| :--- | :--- | :--- |
| `lib/prisma.ts` | Database Connection | Centralized Prisma Client connector. |
| `lib/journal-data.ts` | Static Dataset Access | `loadJournals()`, `saveJournal()`, `deleteJournal()`. |
| `lib/journal-catalog.ts` | Domain Modeling | Maps CSV metadata with price data to generate rich catalog payloads. |
| `lib/auth/session.ts` | Authentication | `getCurrentSession()`, cookie validation routines. |

---

## 🎨 User Interface Elements (`/app/components`)

General layout and shared components reside here.
- `components/admin/admin-sidebar.tsx` — Main Navigation frame for Admin modules.
- Styling relies extensively on centralized classes configured inside `/app/globals.css` backed by component-encapsulated configurations.
