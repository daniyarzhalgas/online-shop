# ShopRec — Product Recommendation Platform

ShopRec is a full-stack e-commerce recommendation platform that uses user-based collaborative filtering to deliver personalized product recommendations. It combines a Spring Boot backend with a React frontend, backed by MongoDB for persistence and Redis for caching.

---

## Features

- JWT-based authentication with logout blacklisting via Redis
- Product catalog with full-text search and category filtering
- User interaction tracking (views, cart adds, purchases, ratings)
- Personalized recommendations via collaborative filtering (cosine similarity)
- Content-based similar-product recommendations (public)
- Cold-start fallback: top-rated products for new users
- Admin panel: user management, product CRUD, data seeding
- Analytics endpoints: platform overview and popular products
- Redis caching: recommendations (1h TTL), products (10 min TTL)

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Java 17, Spring Boot 4.1.2, Gradle 8   |
| Database   | MongoDB 7 (database: `shopdb`)          |
| Cache      | Redis 7                                 |
| Auth       | JWT (HS256, 24h TTL)                    |
| Frontend   | React 18, Vite 5, Tailwind CSS v4       |
| Charts     | Recharts, Lucide React                  |

---

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
git clone <repo-url>
cd advanced-db
docker compose up --build
```

Services started:
- Backend: http://localhost:8080
- Frontend: http://localhost:5173
- MongoDB: localhost:27017
- Redis: localhost:6379

### Option 2: Local Development

**Prerequisites:** Java 17+, Node 18+, MongoDB 7, Redis 7, Gradle 8

**Backend**

```bash
cd backend
./gradlew bootRun
```

The backend starts on port **8080**.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on port **5173**.

**Environment variables (backend)**

```
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/shopdb
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
JWT_SECRET=<your-secret-key>
```

---

## Test Accounts

Seed the database with test data before using these accounts:

```bash
# Seed 100 users with 5 interactions each
curl -X POST "http://localhost:8080/api/admin/seed?users=100&interactionsPerUser=5"
```

| Role  | Username  | Password   |
|-------|-----------|------------|
| ADMIN | admin     | admin123   |
| USER  | user1     | password1  |

To clean up seeded data:

```bash
curl -X DELETE http://localhost:8080/api/admin/seed/cleanup
```

---

## Project Structure

```
advanced-db/
├── backend/                # Spring Boot application
│   ├── src/main/java/
│   │   └── com/shoprec/
│   │       ├── controller/ # REST controllers
│   │       ├── service/    # Business logic + recommendation engine
│   │       ├── repository/ # MongoDB repositories
│   │       ├── model/      # Domain entities
│   │       ├── dto/        # Request/response DTOs
│   │       └── config/     # Security, Redis, MongoDB config
│   └── build.gradle
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks
│   │   └── api/            # API client functions
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── RECOMMENDATION_ALGORITHM.md
└── PERFORMANCE_REPORT.md
```

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, component overview, data flow
- [DATABASE.md](./DATABASE.md) — MongoDB collections, indexes, Redis key schema
- [API.md](./API.md) — All REST endpoints with curl examples
- [RECOMMENDATION_ALGORITHM.md](./RECOMMENDATION_ALGORITHM.md) — Collaborative filtering deep-dive
- [PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md) — Benchmark results and optimization analysis
