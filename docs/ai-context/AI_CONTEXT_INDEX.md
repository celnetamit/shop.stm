# AI Developer Context Index

Welcome to the AI context center for this project. This directory contains organized, high-density documentation specifically constructed for AI coding agents and developers to rapidly bootstrap context about the codebase architecture, state systems, and component flows.

## Context Assets

Please refer to the specialized artifacts inside this folder for specific architecture areas:

| File | Purpose | Read Condition |
| :--- | :--- | :--- |
| [**`SCHEMA_SUMMARY.md`**](./SCHEMA_SUMMARY.md) | High-level map of database tables, static datasets, relationship bounds, and type enums. | Before implementing data models, mutations, or querying workflows. |
| [**`MODULE_MAP.md`**](./MODULE_MAP.md) | Physical file hierarchy, directory conventions, API layouts, and shared utility vectors. | Before organizing code files, finding components, or binding routing maps. |
| [**`ENHANCEMENT_BRIEF_TEMPLATE.md`**](./ENHANCEMENT_BRIEF_TEMPLATE.md) | Standard markdown structure for proposing features, scoping architectural refactors, or specifying bug reports. | When initiating a new development cycle or planning complex codebase modifications. |

## Rapid Project Profile

- **Framework Stack**: Next.js (App Router), React, TypeScript
- **Data Pipeline**: PostgreSQL managed by Prisma ORM
- **Local Dataset**: Validated `journal-price.json` filesystem database managed via unified helpers
- **Authentication**: Role-based credential management sessions (Admin vs User restricted views)
- **Styling Approach**: Vanilla Global & Scoped CSS for high flexibility
- **Key Use Case**: High-conversion storefront platform managing journal subscriptions, catalogues, and dynamic proforma quote building.
