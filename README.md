# 🏎️ UltraDrive Enterprise API Backend

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.11-teal.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Caching](https://img.shields.io/badge/Redis-Alpine-red.svg?style=for-the-badge&logo=redis)](https://redis.io/)
[![Realtime](https://img.shields.io/badge/Socket.io-4.8-lightgrey.svg?style=for-the-badge&logo=socket.io)](https://socket.io/)

UltraDrive Backend is a high-performance, enterprise-grade, modular Node.js API engine powering a luxury supercar showroom and dealership platform. Built with **TypeScript**, **Express**, and **Prisma ORM**, it features out-of-the-box multi-tenancy, real-time WebSockets, robust Role-Based Access Control (RBAC), and automated event-driven workflows.

---

## ⚡ Key Architectural Capabilities

### 🏢 1. Native Multi-Tenant SaaS Engine
- **Logical Scoping:** Complete multi-tenancy model backed by `Organization` entities.
- **Automated Routing Middleware:** Global tenant identification via `tenantMiddleware`, dynamically resolving headers to isolate queries.
- **Cascading Safety:** Fully enforced database-level cascade triggers for safe organization deletions.

### 🛡️ 2. Enterprise RBAC & High-Security Auth
- **Session Lifecycle:** Advanced cookie-shared state management powered by JWT access (15-min short life) and refresh tokens (7-day longevity) using HTTP-Only cookies.
- **Granular Permissions:** Custom permissions system (e.g. `cars:create`, `bookings:view`) tied to dynamic `Role` templates rather than rigid roles.
- **Audit Trails:** Automatic database-backed action capturing (`AuditLog` model) recording logins, record modifications, and media deletions with diagnostic metadata.

### 📡 3. Event-Driven Real-time Bus
- **Socket.IO Layer:** Low-latency live events propagation under custom sockets streams for live dashboard tracking.
- **Domain Event Pub/Sub:** Decoupled internal event subscribers (such as `notification.subscriber.ts`) triggering automatic events and alerts on system mutations (e.g., new booking triggers).

### ⚙️ 4. Automated Workflows Engine
- **Dynamic Workflows:** Real-time business workflow engine capable of listening to state shifts (like a booking changing to `confirmed`) and triggering automated downstream actions (email dispatching, lead assignments).

### 🤖 5. Advanced Domain Modules
- **AI & Agents:** Dynamic AI features and recommendations.
- **Search & Filter:** Optimized compound index searching with category tags.
- **File Management:** Fully handled image/video uploading using `multer` with local fallback static serving or cloud storage sync via `cloudinary`.
- **System Hardening:** Security protection via `helmet` headers, CORS whitelists, client payload compression (`compression`), request timeouts, and client rate-limiting.

---

## 🛠️ Tech Stack & Core Dependencies

| Component | Technology | Role in System |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+) | Execution environment |
| **Language** | TypeScript (v5.3) | Static typing & advanced OOP |
| **Framework** | Express (v4.19) | Modular routing & middleware pipelines |
| **ORM** | Prisma (v5.11) | Type-safe SQL client & database migrations |
| **Database** | PostgreSQL | Primary relational data store |
| **Caching & PubSub** | Redis | Server-side query caching & session pooling |
| **Sockets** | Socket.IO (v4.8) | Persistent client-server event duplexing |
| **Validator** | Zod (v3.22) | Robust runtime input & schema verification |
| **Security** | Helmet, Bcrypt, CORS, Rate-Limit | Bulletproof security compliance |

---

## 📂 Modular System Folder Architecture

The codebase implements a **Feature-Driven (Modular) Architecture** under the `src` directory, keeping files cohesive, focused, and maintaining strict Separation of Concerns (SoC).

```text
CarSale-Backend/
├── prisma/                    # Database migrations and seeding definitions
│   ├── schema.prisma          # Main PostgreSQL schema definitions
│   ├── seed.ts                # General supercars and default users seed
│   └── seed-multi-tenant.ts   # Advanced multi-organization tenant seed
├── src/
│   ├── app.ts                 # Express core instantiation & middlewares setup
│   ├── server.ts              # HTTP & WebSocket servers bootstrapper
│   ├── compliance/            # Legal, logging, and security compliance route rules
│   ├── controllers/           # Standalone controllers layer
│   ├── events/                # Event-driven system triggers & subscribers
│   ├── lib/                   # Shared singletons (Prisma, Redis, Env schema)
│   ├── middleware/            # Security, error-handlers, timeout, tenant middleware
│   ├── modules/               # Domain-driven feature directories (self-contained)
│   │   ├── auth/              # JWT Token lifecycles & admin registrations
│   │   ├── cars/              # Inventory endpoints & technical specs models
│   │   ├── bookings/          # Luxury reservation scheduling & agents assignments
│   │   ├── leads/             # Client interest pipelines & status tracking
│   │   ├── media/             # Local upload serving or Cloudinary integrations
│   │   ├── notifications/     # Server push notification alerts logic
│   │   ├── workflows/         # Automation workflows triggers and rules engine
│   │   ├── ai/                # AI Recommendation engine and LLM integration
│   │   └── search/            # High-speed index queries and keyword searches
│   ├── services/              # Cross-module shared transactional logic
│   └── socket/                # Socket.IO room handling and connection listeners
└── docker-compose.yml         # Dev-ready docker stack (Postgres + Redis)
```

---

## 🚦 Quickstart Guide (Local Development)

Follow these instructions to run the UltraDrive Backend locally on your machine.

### 1. Prerequisites
Ensure you have the following installed on your operating system:
- **Node.js** (v20.0.0 or higher recommended)
- **Docker & Docker Compose** (for automated database and caching engines setup)
- **Git**

---

### 2. Environment Configuration
Create a local configuration file `.env` based on the provided template:
```bash
cp .env.example .env
```
Open `.env` and fill in your local credentials. For basic Dockerized local development, use the following:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://asithalakmal@localhost:5432/ultradrive?schema=public"
JWT_SECRET="super_secure_ultradrive_jwt_core_access_secret_phrase"
JWT_REFRESH_SECRET="super_secure_ultradrive_jwt_core_refresh_secret_phrase"
REDIS_URL="redis://localhost:6379"
```

---

### 3. Start Database and Cache (Docker Compose)
Spin up the local PostgreSQL database server and Redis caching cluster container services:
```bash
docker compose up -d postgres redis
```

---

### 4. Install Dependencies & Build
Install all project dev and production dependencies:
```bash
npm install
```

---

### 5. Database Schema Generation & Seeding
Prepare and generate Prisma's TypeScript Client, run PostgreSQL migrations, and seed initial database entries:
```bash
# Generate the type-safe Prisma client
npm run db:generate

# Execute structural migrations on PostgreSQL
npm run db:migrate

# Seed database with default admins, luxury supercars, and mock schedules
npx prisma db seed
```

---

### 6. Run Application dev-server
Run the dev-server under automatic file reload via `nodemon`:
```bash
npm run dev
```
The server will boot up and expose the following addresses:
- **REST API:** [http://localhost:5000](http://localhost:5000)
- **Live Health-Check:** [http://localhost:5000/health](http://localhost:5000/health)
- **Real-Time Sockets:** Listening on port `5000`

To inspect database records through a GUI, start Prisma Studio:
```bash
npm run db:studio
```

---

## 🐳 Running inside fully Dockerized Containers

For quick production simulation, the entire stack (PostgreSQL, Redis, Backend, and Frontend) can be initialized together using Docker Compose:

```bash
# Build & run all stack containers in background mode
docker compose up -d --build

# Inspect standard log feeds for the backend container
docker logs -f ultradrive-backend
```

To stop the containers and purge the local network assets:
```bash
docker compose down -v
```

---

## 👥 Seed Account Credentials

The default seeding configuration registers three administrator profiles with distinct permission matrix roles. Use these credentials on the client to log in:

| Email | Password | Role Scope | System Permission |
| :--- | :--- | :--- | :--- |
| **`admin@ultradrive.com`** | `admin123` | **`admin`** | Full Read, Write, Delete, Audit, and Role Settings |
| **`editor@ultradrive.com`** | `editor123` | **`editor`** | Write/Edit inventory, bookings, and media uploads |
| **`viewer@ultradrive.com`** | `viewer123` | **`viewer`** | Read-only permissions across platform insights |

---

## 📡 API Endpoint Reference Guide

All REST API endpoints are prefix-nested under `/api`. Multi-tenant requests should include the tenant organization slug header `X-Tenant-Slug` if applicable.

### 👤 Authentication Modules (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/auth/register` | Register a new showroom administrator | None |
| **`POST`** | `/api/auth/login` | Log in and receive JWT HTTP-Only cookies | None |
| **`POST`** | `/api/auth/refresh` | Force refresh access tokens with refresh tokens | None |
| **`POST`** | `/api/auth/logout` | Revoke session and clear HTTP-Only cookies | None |

### 🚗 Inventory Modules (`/api/cars`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/cars` | Retrieve a list of supercars (supports filters) | None |
| **`GET`** | `/api/cars/:slug`| Fetch single vehicle specification details | None |
| **`POST`** | `/api/cars` | Append a new supercar listing | `editor` / `admin` |
| **`PUT`** | `/api/cars/:id` | Modify an existing supercar specifications | `editor` / `admin` |
| **`DELETE`**| `/api/cars/:id` | Wipe supercar listing out of databases | `admin` |

### 📅 Booking Schedules (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/bookings` | File a VIP showroom reservation appointment | None |
| **`GET`** | `/api/bookings` | Retrieve lists of schedules booked | `viewer` / `admin`|
| **`PATCH`**| `/api/bookings/:id`| Update status state (pending/confirmed) | `editor` / `admin` |

### 📈 Leads Funnel (`/api/leads`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/leads` | Create a new lead from interest form | None |
| **`GET`** | `/api/leads` | List user interest leads | `viewer` / `admin` |
| **`PATCH`**| `/api/leads/:id` | Update lead qualification state | `editor` / `admin` |

### 🖼️ Media Engine (`/api/media`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/media/upload` | Upload binary image assets (`multer`) | `editor` / `admin` |
| **`DELETE`**| `/api/media/:id` | Delete media assets from system cache | `admin` |

### 📊 System Audit & Diagnostics (`/api/audit`, `/api/analytics`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/audit` | Fetch centralized server security logs | `admin` |
| **`GET`** | `/api/analytics` | Fetch metrics and event insights charts data | `viewer` / `admin` |

---

## 🔒 Production Hardening Best Practices

When transitioning the UltraDrive Backend api service to a production deployment (such as Railway, Render, AWS, or GCP), implement these core measures:

1. **Production Flagging:** Verify `NODE_ENV=production` is active to disable verbose stack logs and allow optimized transpiled JS.
2. **Secrets Rotation:** Generate long, cryptographically random strings for both `JWT_SECRET` and `JWT_REFRESH_SECRET` using safe cryptographic utilities:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **CORS Restrictions:** Restrict `ALLOWED_ORIGINS` strictly to your production Next.js frontend application URL in `.env` (no wildcards `*`).
4. **Rate Limit Throttling:** Tune the rate-limiting windows (`rateLimit`) under `app.ts` to accommodate your anticipated maximum client load.
5. **Database Pools:** Configure robust connection pools within the `DATABASE_URL` parameter to avoid database exhaustion under load spikes.

---

## 📝 License

This project is open-source software licensed under the [MIT License](LICENSE).
