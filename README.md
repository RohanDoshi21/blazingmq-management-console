<div align="center">

# ⚡ BlazingMQ Management Console

**A professional, real-time management UI for [BlazingMQ](https://github.com/bloomberg/blazingmq) message brokers.**

Built with Next.js 16, React 19, and the [`blazingmq-node`](https://www.npmjs.com/package/blazingmq-node) SDK.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-green)](LICENSE)

[Report Bug](https://github.com/RohanDoshi21/blazingmq-management-console/issues) · [Request Feature](https://github.com/RohanDoshi21/blazingmq-management-console/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Pages & Features](#pages--features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

---

## Overview

The BlazingMQ Management Console is a full-featured web application for monitoring and administering BlazingMQ message brokers. It connects directly to broker instances via the `blazingmq-node` SDK's `BrokerAdmin` class over TCP, providing real-time visibility into queues, domains, clusters, consumers, and producers — all from a single dark-themed dashboard.

**Zero mock data** — every metric, chart, and table is populated from live broker responses.

---

## Features

### 🔌 Live Broker Connection
- Connects to any BlazingMQ broker via TCP (host/port configurable)
- Connection health indicator in the sidebar (polls every 15 seconds)
- Graceful degradation when the broker is unreachable (empty states, no crashes)

### 📊 Real-Time Dashboard
- Aggregate stat cards — total queues, domains, clusters, messages, producers, consumers
- Throughput time-series chart (PUT / PUSH / CONFIRM rates)
- Latency time-series chart (ACK avg/max, Confirm avg/max)
- Top queues by message count, cluster health overview
- Auto-refresh every 15 seconds

### 📈 Metrics & Analytics
- Dedicated metrics page with throughput, latency, and consumer lag charts
- In-memory server-side time-series ring buffer (60 data points, ~15 min history)
- Per-queue breakdown table with all key performance indicators

### 📬 Queue Management
- Browse all queues with capacity progress bars (messages & bytes)
- Per-queue stats: PUT/s, PUSH/s, ACK time, queue time, consumer/producer counts
- **Purge** individual queues with confirmation dialog
- **Open Queue** helper with URI builder, domain selector, and CLI command generator

### 🏷️ Domain Management
- View all domains with mode badges (fanout, priority, broadcast)
- Storage type indicators (persistent / in-memory)
- TTL, max retries, dedup time, and queue count per domain
- **Purge Domain** — purges all queues in a domain
- **Reconfigure Domain** — triggers live config reload on the broker

### 🖧 Cluster Monitoring
- Cluster health status (Healthy / Degraded)
- Node list with availability indicators and partition assignments
- Partition grid — primary status, lease IDs, queue mappings, storage bytes
- Elector state — leader node, leader status
- **Force GC** — trigger garbage collection on a cluster

### 👥 Consumer Monitoring
- Total consumer count, aggregate PUSH rate, total lag, lagging queue count
- Per-queue consumer cards with status badges (active / idle / lagging)
- Consumer lag progress bars showing messages behind

### 🚀 Producer Monitoring
- Total producer count, aggregate PUT rate, ACK success percentage, NACK count
- Per-queue producer cards with status badges (active / idle / degraded)
- ACK progress bars showing the ratio of ACK rate to PUT rate

### ⚙️ Settings & Administration
- **Connection config** — host, port, timeout (persisted in HTTP-only cookies)
- **Dashboard preferences** — refresh interval, metrics history length, max queue display
- **Tunables** — view and edit all broker tunable parameters
- **Danger Zone** — graceful shutdown or immediate termination of the broker

### 🛡️ Production-Ready
- Security headers (X-Frame-Options, HSTS, Content-Type-Options, Permissions-Policy)
- No client-side secrets — all broker communication happens server-side
- Server Actions for all mutations with `revalidatePath` for instant UI updates
- Environment variable support for default connection settings
- Responsive, accessible UI with Radix UI primitives

---

## Screenshots

> _Coming soon — connect to a live broker and capture screenshots of each page._

---

## Prerequisites

- **Node.js** ≥ 18.18 (LTS recommended)
- **npm** ≥ 9
- A running **BlazingMQ broker** with the admin port accessible (default `30114`)

---

## Getting Started

### 1. Install dependencies

```bash
cd ui
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` to point to your broker:

```env
BMQ_BROKER_HOST=localhost
BMQ_BROKER_PORT=30114
BMQ_BROKER_TIMEOUT=5000
```

> You can also configure the connection at runtime via **Settings → Connection**.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `BMQ_BROKER_HOST` | `localhost` | BlazingMQ broker hostname or IP |
| `BMQ_BROKER_PORT` | `30114` | Broker admin port |
| `BMQ_BROKER_TIMEOUT` | `5000` | Connection timeout in milliseconds |

These env vars set the **default** connection. Users can override them per-session via the Settings page (values are stored in an HTTP-only cookie).

---

## Pages & Features

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/` | Aggregate overview with stat cards, time-series charts, top queues, and cluster health |
| **Queues** | `/queues` | Browse, inspect, and purge queues; view capacity and throughput per queue |
| **Open Queue** | `/queues/create` | URI builder with domain selector and `bmqtool` CLI command generator |
| **Domains** | `/domains` | View domain config, capacity, and queues; purge or reconfigure domains |
| **Clusters** | `/clusters` | Monitor cluster health, nodes, partitions, and elector state; trigger GC |
| **Consumers** | `/consumers` | Monitor consumer connections, PUSH rates, lag, and confirm metrics |
| **Producers** | `/producers` | Monitor producer connections, PUT rates, ACK percentages, and NACKs |
| **Metrics** | `/metrics` | Real-time charts for throughput, latency, and consumer lag with per-queue breakdown |
| **Settings** | `/settings` | Configure connection, dashboard preferences, tunables, and broker lifecycle |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│   Next.js App Router (React 19 Server Components)    │
│   ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│   │  Pages    │  │ Charts   │  │  Action Comps  │   │
│   │ (server)  │  │ (client) │  │   (client)     │   │
│   └────┬─────┘  └──────────┘  └───────┬────────┘   │
│        │                               │             │
│        ▼                               ▼             │
│   broker-client.ts              Server Actions       │
│   (server-side only)            (actions.ts)         │
│        │                               │             │
│        └───────────┬───────────────────┘             │
│                    ▼                                  │
│           blazingmq-node SDK                         │
│           (BrokerAdmin class)                        │
│                    │                                  │
└────────────────────┼─────────────────────────────────┘
                     │ TCP
                     ▼
            ┌──────────────┐
            │  BlazingMQ   │
            │   Broker     │
            │  (port 30114)│
            └──────────────┘
```

**Key design decisions:**

- **Server Components** for all data fetching — the broker TCP connection never leaks to the client
- **Server Actions** for all mutations (purge, reconfigure, shutdown, etc.)
- **In-memory time-series ring buffer** on the server accumulates real broker snapshots at each page load / refresh cycle
- **Auto-refresh** via `router.refresh()` every 15 seconds keeps data current without WebSockets
- **HTTP-only cookies** store connection config and dashboard preferences (no localStorage)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) |
| **Runtime** | [React 19](https://react.dev) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Components** | [Radix UI](https://radix-ui.com) (Dialog, Dropdown, Tooltip, Select, Switch, Tabs, etc.) |
| **Charts** | [Recharts 3](https://recharts.org) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Utilities** | [class-variance-authority](https://cva.style), [tailwind-merge](https://github.com/dcastil/tailwind-merge), [date-fns](https://date-fns.org) |
| **Broker SDK** | [`blazingmq-node@1.2.0`](https://www.npmjs.com/package/blazingmq-node) |

---

## Project Structure

```
ui/
├── public/                     # Static assets (favicon, etc.)
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── dashboard-charts.tsx# Dashboard chart client component
│   │   ├── layout.tsx          # Root layout (fonts, sidebar, toast)
│   │   ├── loading.tsx         # Skeleton loading state
│   │   ├── error.tsx           # Error boundary with retry
│   │   ├── actions.ts          # Server Actions (purge, reconfig, etc.)
│   │   ├── api/health/         # Health-check API route
│   │   ├── queues/             # Queue list + create page
│   │   ├── domains/            # Domain list page
│   │   ├── clusters/           # Cluster monitoring page
│   │   ├── consumers/          # Consumer monitoring page
│   │   ├── producers/          # Producer monitoring page
│   │   ├── metrics/            # Metrics & analytics page
│   │   └── settings/           # Settings & admin page
│   ├── components/
│   │   ├── dashboard/          # Stat cards, chart wrappers
│   │   ├── layout/             # Sidebar, header
│   │   └── ui/                 # Badge, button, card, table, toast, etc.
│   └── lib/
│       ├── broker-client.ts    # Server-side BrokerAdmin wrapper
│       ├── data.ts             # Type & function re-exports
│       ├── time-series.ts      # In-memory ring buffer for chart history
│       └── utils.ts            # Formatting utilities (bytes, numbers, etc.)
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js config (security headers, externals)
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

---

## Production Deployment

### Docker (recommended)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables

Set `BMQ_BROKER_HOST`, `BMQ_BROKER_PORT`, and `BMQ_BROKER_TIMEOUT` in your deployment environment. The UI runs entirely server-side — no broker credentials are exposed to the client.

### Reverse Proxy

The console is designed to run behind a reverse proxy (nginx, Caddy, Traefik). Security headers (HSTS, X-Frame-Options, etc.) are already configured in `next.config.ts`.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---
