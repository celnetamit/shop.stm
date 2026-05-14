# Schema Summary Matrix

This document exposes state and persistence models deployed across the platform. The system integrates a relational SQL database (via Prisma ORM) alongside persistent local JSON data files.

---

## 1. Persistent Databases (Prisma PostgreSQL)

### Core Data Models

#### 👤 User System
- **`User`**: System authentication credentials and access levels.
  - `id`: String (CUID, PK)
  - `role`: `UserRole` enum (`USER`, `ADMIN`)
  - `email`: String (Unique)
  - `passwordHash`: String (nullable)
  - `provider`: "credentials" or external provider

#### 📦 Commercial System (Orders & Transactions)
- **`Order`**: Direct purchases and payment transactions.
  - `id`: String (PK)
  - `userId`: String (FK -> `User`, nullable)
  - `status`: `OrderStatus` enum (`PENDING`, `PAID`, `CANCELLED`)
  - `currency`: `CurrencyCode` enum (`INR`, `USD`)
  - `subtotal`, `cgst`, `sgst`, `discount`, `total`: Numeric totals
  - `razorpayOrderId`, `razorpayPaymentId`: Payment Gateway reference identifiers
- **`OrderItem`**: Individual entries bound inside orders.
  - `journalName`, `subject`, `issn`, `selectedPlan`, `unitPrice`, `qty`

#### 📄 Quoting System
- **`ProformaQuote`**: Estimates generated for B2B entities and institutions.
  - `id`: String (PK)
  - `status`: `QuoteStatus` enum (`DRAFT`, `SUBMITTED`, `PAID`)
  - `organization`, `contactName`, `email`, `phone`, `country`
  - `couponCode`, `couponPercent`: Percentage reduction hooks
- **`ProformaQuoteItem`**: Items bound within proforma documents.
  - Maps closely to `OrderItem` properties matching specific journal subscription configuration.

### Supplemental & Admin Models
- **`Coupon`**: Multi-use discount vouchers (`code`, `discount` percentage, `isActive` bool).
- **`ContactEntry`**: Captures contact forms (`NEW`, `IN_PROGRESS`, `RESOLVED`).
- **`AgencyQuery`**: Capture submissions from external subscription agencies.
- **`EmailTemplate`**: Dynamically updated system transactional email contents (`key`, `subject`, `body`).
- **`ClonedPage`**: Landing page overrides and caching models.

---

## 2. Static System Datasets (Local Storage)

### 📚 Journal & Price Matrix
Stored in `journal-price.json` at the repo root. Manipulated using functions defined under `lib/journal-data.ts`.

#### Schema Definition (`JournalRow`)
| Field | Type | Notes |
| :--- | :--- | :--- |
| `"S/No"` | `number` | Unique sequential integer acting as the identifier key. |
| `"Journal Name"` | `string` | Primary title of publication. |
| `Abbreviation` | `string` | Slug used for system matching and identification. |
| `Subject` | `string` | General academic categorization (e.g., "Agriculture", "Computer/IT"). |
| `issn` | `string \| null` | International Standard Serial Number. |
| `frequency` | `string \| null` | Issues frequency (e.g. "3 Issues"). |
| `Indexing` | `string \| null` | Catalog index registrations. |
| `"Subscription\n[Print]"` | `number` | Domestic Print price (INR). |
| `"Subscription\n[Online]"` | `number` | Domestic Online price (INR). |
| `"Subscription\n[Print+Online]"` | `number` | Domestic Combined price (INR). |
| `"Subscription\n[Print] USD"` | `number` | International Print price (USD). |
| `"Subscription\n[Online] USD"` | `number` | International Online price (USD). |
| `"Subscription\n[Print+Online] USD"` | `number` | International Combined price (USD). |

---

## 3. Common Enums (`prisma/schema.prisma`)
- **`UserRole`**: `USER` \| `ADMIN`
- **`CurrencyCode`**: `INR` \| `USD`
- **`SubscriptionPlan`**: `PRINT` \| `ONLINE` \| `PRINT_ONLINE`
- **`OrderStatus`**: `PENDING` \| `PAID` \| `CANCELLED`
- **`QuoteStatus`**: `DRAFT` \| `SUBMITTED` \| `PAID`
- **`ContactStatus`**: `NEW` \| `IN_PROGRESS` \| `RESOLVED`
