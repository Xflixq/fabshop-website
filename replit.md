# Workspace

## Overview

FabShop — a full-stack e-commerce platform for welding supplies. pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MySQL (external hosted) + Drizzle ORM (mysql2 driver)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Services

| Service | Port | URL |
|---|---|---|
| API Server | 8080 | `/api/...` |
| Weld Supply Store (storefront) | 22689 | `/` |
| FabShop Admin | 20227 | `/admin/` |

## Database

- **Host**: mysql-200-151.mysql.prositehosting.net
- **Database**: FabShop
- **User**: website
- **Password**: set via MYSQL_PASSWORD env var
- Schema: categories, products, cart_items, orders, order_items
- Seeded with 6 categories and 18+ products

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed DB with sample data
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Workflow Commands

All workflows require explicit env vars:
- API Server: `PORT=8080 MYSQL_HOST=... MYSQL_USER=website MYSQL_PASSWORD=... MYSQL_DATABASE=FabShop pnpm --filter @workspace/api-server run dev`
- Storefront: `PORT=22689 BASE_PATH=/ pnpm --filter @workspace/weld-supply-store run dev`
- Admin: `PORT=20227 BASE_PATH=/admin/ pnpm --filter @workspace/fabshop-admin run dev`

## Important Notes

- MySQL does not support `CAST(x AS INT)` — use `CAST(x AS UNSIGNED)` or `CAST(x AS SIGNED)`
- MySQL does not support `.returning()` in Drizzle — use insertId then select pattern
- Vite dev servers proxy `/api/*` and `/__clerk/*` to `localhost:8080`
- Both frontends need `BASE_PATH` and `PORT` env vars to start

## Architecture

- `lib/db` — Drizzle schema + DB connection (MySQL/mysql2)
- `lib/api-spec` — OpenAPI spec (source of truth)
- `lib/api-zod` — generated Zod validators
- `lib/api-client-react` — generated TanStack Query hooks
- `artifacts/api-server` — Express 5 REST API
- `artifacts/weld-supply-store` — Customer storefront (React + Vite)
- `artifacts/fabshop-admin` — Admin dashboard (React + Vite)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
