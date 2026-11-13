# Assignment #6 — NoSQL Recommendation Platform: Online Store

**Course:** Advanced Databases  
**Stack:** Java 17 · Spring Boot 4 · MongoDB · Redis · JWT

---

## Table of Contents

1. [Goals and Objectives](#1-goals-and-objectives)
2. [Project Proposal](#2-project-proposal)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Modeling](#4-data-modeling)
5. [Setup and Running](#5-setup-and-running)
6. [API Documentation](#6-api-documentation)
7. [Test Data](#7-test-data)
8. [References](#8-references)

---

## 1. Goals and Objectives

**Goal:** Design and implement the data layer and backend for a NoSQL-based recommendation platform for an online store.

**Objectives:**
- Apply NoSQL database principles (MongoDB, Redis) to store and retrieve user data and product information.
- Design a data model for users, products, and interactions optimized for common query patterns.
- Implement a secure REST API with JWT authentication.
- Demonstrate the role of Redis as a caching and session management layer alongside MongoDB.

---

## 2. Project Proposal

### 2.1 Subject Area

The platform is an **online store** where:

| Role | Description |
|---|---|
| **Users** | Registered customers who browse and purchase products |
| **Items** | Products with name, description, category, price, brand, and stock |
| **Interactions** | Views, ratings (1–5 stars), purchases, add-to-cart events |

### 2.2 Chosen NoSQL Databases

| Database | Purpose | Why |
|---|---|---|
| **MongoDB** | Primary data store (users, products, interactions) | Flexible document model fits varied product attributes; rich query support with indexes |
| **Redis** | Cache + token blacklist | Sub-millisecond reads for hot products; instant JWT logout via key blacklisting |

### 2.3 Recommendation Algorithm (Planned)

The final project will implement a **hybrid recommendation algorithm**:

1. **Collaborative Filtering** — find users with similar interaction histories and recommend what they purchased/rated highly.
2. **Content-Based Filtering** — recommend products in the same category or with matching tags as items the user has interacted with.
3. **Popularity Fallback** — for new users (cold start), recommend top-rated or most-purchased items.

MongoDB aggregation pipelines will power the collaborative signal; Redis sorted sets will cache the top-N recommendations per user.

### 2.4 Relevance to the Dissertation

The dissertation research focuses on **data-driven personalization in e-commerce systems** — specifically, how the architecture of the data layer influences the responsiveness and accuracy of recommendation engines at scale.

This platform serves as a practical testbed for the research hypothesis: *a hybrid NoSQL architecture (document store + in-memory cache) outperforms a single-database approach in recommendation latency without sacrificing recommendation quality.*

Concretely, the platform contributes to the dissertation in three ways:

**First**, the MongoDB schema designed here — with embedded interaction history and denormalized product attributes — reflects the access pattern assumptions from the literature review. Measuring real query times against this schema will produce empirical data for the dissertation's performance comparison chapter.

**Second**, the Redis caching layer provides a controlled variable: by toggling caching on and off, the dissertation can quantify exactly how much of the recommendation response time is attributable to cold database reads versus in-memory retrieval. This is a key experimental dimension in the research plan.

**Third**, the interaction model (VIEW, RATING, PURCHASE, ADD_TO_CART) captures implicit and explicit feedback signals that the recommendation algorithm chapter relies on. The seeded synthetic dataset gives a reproducible baseline for algorithm evaluation (precision@k, recall@k, NDCG).

In summary, every architectural decision in this assignment — from the choice of MongoDB over a relational store to the Redis blacklist for stateless JWT management — is motivated by the requirements of the dissertation's experimental design and will be cited in the implementation chapter.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client (HTTP)                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Spring Boot API                        │
│                                                          │
│  AuthController  ProductController  InteractionController│
│       │                │                    │            │
│  AuthService      ProductService    InteractionService   │
│       │                │                    │            │
│  JwtFilter ◄──► Redis (token blacklist)     │            │
│                   Redis (product cache)     │            │
│                        │                    │            │
│            UserRepo  ProductRepo  InteractionRepo        │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │       MongoDB        │
              │  users │ products    │
              │        │ interactions│
              └─────────────────────┘
```

**Request flow:**
1. Client sends request with `Authorization: Bearer <token>`.
2. `JwtFilter` validates the token and checks Redis for blacklisted tokens.
3. Controller delegates to the Service layer.
4. `ProductService` checks Redis cache before hitting MongoDB.
5. Response returned as JSON.

---

## 4. Data Modeling

### 4.1 Collections

#### `users`
```json
{
  "_id": "ObjectId",
  "username": "daniyar",
  "email": "daniyar@shop.kz",
  "password": "<bcrypt hash>",
  "firstName": "Daniyar",
  "lastName": "Zhalgasbekov",
  "phone": "+7 701 234 5678",
  "address": {
    "street": "Abay 10",
    "city": "Almaty",
    "country": "Kazakhstan",
    "zipCode": "050000"
  },
  "role": "USER",
  "createdAt": "2026-11-06T10:00:00",
  "updatedAt": "2026-11-06T10:00:00"
}
```

**Indexes:**
- `username` — unique index (login lookups)
- `email` — unique index (registration check)

#### `products`
```json
{
  "_id": "ObjectId",
  "name": "iPhone 15 Pro",
  "description": "Apple flagship smartphone with titanium frame",
  "category": "Electronics",
  "price": 849.99,
  "stock": 50,
  "brand": "Apple",
  "tags": ["phone", "apple", "smartphone"],
  "averageRating": 4.8,
  "totalRatings": 120,
  "createdAt": "2026-11-06T10:00:00",
  "updatedAt": "2026-11-06T10:00:00"
}
```

**Indexes:**
- `category` — index (filter by category)
- `name`, `description` — text index (full-text search)

#### `interactions`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId ref",
  "productId": "ObjectId ref",
  "type": "RATING",
  "rating": 5.0,
  "createdAt": "2026-11-06T10:05:00"
}
```

**Indexes:**
- `userId` — index (user history queries)
- `productId` — index (product interaction queries)

### 4.2 Trade-off Analysis

| Approach | Pro | Con | Decision |
|---|---|---|---|
| **Embed interactions in User** | One read for full user history | Document size grows unboundedly with interactions | Rejected — interactions are a separate collection |
| **Embed interactions in Product** | Easy "who viewed this" aggregation | Same unbounded growth problem | Rejected |
| **Separate `interactions` collection** | Scales independently, flexible queries | Requires joins (lookups) | **Chosen** |
| **Reference vs. embed address** | — | — | Address embedded in User — it's always read together with the profile |
| **Normalize category to collection** | Consistency | Extra lookup on every product read | Rejected — category stored as string field with index |

### 4.3 Redis Usage

| Key pattern | Value | TTL | Purpose |
|---|---|---|---|
| `product:<id>` | JSON string | 10 min | Product cache — avoids repeat MongoDB reads for hot items |
| `blacklist:<token>` | `"true"` | 24 h | Invalidates JWT on logout without storing session server-side |

---

## 5. Setup and Running

### Prerequisites

| Tool | Version |
|---|---|
| Java | 17+ |
| MongoDB | 6+ (running on `localhost:27017`) |
| Redis | 7+ (running on `localhost:6379`) |
| Gradle | 8+ (or use `./gradlew`) |

### Start MongoDB and Redis

**MongoDB:**
```bash
mongod --dbpath /data/db
```

**Redis:**
```bash
redis-server
```

### Run the application

```bash
./gradlew bootRun
```

The server starts on **http://localhost:8080**.

On first startup, `DataSeeder` automatically populates the database with:
- 3 users (admin, daniyar, aizat)
- 10 products across 6 categories
- 10 interactions

### Configuration

Edit `src/main/resources/application.properties` to change defaults:

```properties
# MongoDB connection
spring.data.mongodb.uri=mongodb://localhost:27017/shopdb

# Redis connection
spring.data.redis.host=localhost
spring.data.redis.port=6379

# JWT settings
app.jwt.secret=shopdb-super-secret-key-must-be-at-least-32-chars-long
app.jwt.expiration=86400000   # 24 hours in ms

# Server port
server.port=8080
```

---

## 6. API Documentation

Base URL: `http://localhost:8080`

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

---

### 6.1 Authentication

#### POST `/api/auth/register`

Register a new user.

**Request body:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+7 700 000 0000"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "john",
  "email": "john@example.com"
}
```

**Error `400`:**
```json
{ "error": "Username already taken" }
```

---

#### POST `/api/auth/login`

Login with existing credentials.

**Request body:**
```json
{
  "username": "daniyar",
  "password": "password123"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "daniyar",
  "email": "daniyar@shop.kz"
}
```

**Error `401`:**
```json
{ "error": "Invalid username or password" }
```

---

#### POST `/api/auth/logout`

Invalidate the current JWT token (adds it to Redis blacklist).

**Headers:** `Authorization: Bearer <token>`  
**Response:** `200 OK` (no body)

---

### 6.2 Products

#### GET `/api/products`

Get all products. Optionally filter by category.

**Query params:**

| Param | Required | Example |
|---|---|---|
| `category` | No | `Electronics` |

**Response `200 OK`:**
```json
[
  {
    "id": "6748a1b2c3d4e5f6a7b8c9d0",
    "name": "iPhone 15 Pro",
    "description": "Apple flagship smartphone with titanium frame",
    "category": "Electronics",
    "price": 849.99,
    "stock": 50,
    "brand": "Apple",
    "tags": ["phone", "apple", "smartphone"],
    "averageRating": 4.8,
    "totalRatings": 120,
    "createdAt": "2026-11-06T10:00:00"
  }
]
```

---

#### GET `/api/products/search`

Search products by keyword across name, description, brand, and category.

**Query params:**

| Param | Required | Example |
|---|---|---|
| `q` | Yes | `apple` |
| `category` | No | `Laptops` |

**Example:** `GET /api/products/search?q=apple&category=Laptops`

**Response `200 OK`:**
```json
[
  {
    "id": "...",
    "name": "MacBook Air M3",
    "category": "Laptops",
    "price": 1299.99,
    ...
  }
]
```

---

#### GET `/api/products/{id}`

Get a single product by ID. Result is cached in Redis for 10 minutes.

**Response `200 OK`:**
```json
{
  "id": "6748a1b2c3d4e5f6a7b8c9d0",
  "name": "iPhone 15 Pro",
  "price": 849.99,
  ...
}
```

**Error `400`:**
```json
{ "error": "Product not found: 6748a1b2c3d4e5f6a7b8c9d0" }
```

---

#### POST `/api/products` *(ADMIN only)*

Create a new product.

**Headers:** `Authorization: Bearer <admin-token>`

**Request body:**
```json
{
  "name": "iPad Pro 13",
  "description": "Apple tablet with M4 chip",
  "category": "Electronics",
  "price": 1099.99,
  "stock": 40,
  "brand": "Apple",
  "tags": ["tablet", "apple", "ipad"]
}
```

**Response `201 Created`:**
```json
{
  "id": "6748a1b2c3d4e5f6a7b8c9d1",
  "name": "iPad Pro 13",
  ...
}
```

---

#### PUT `/api/products/{id}` *(ADMIN only)*

Update an existing product. Invalidates the Redis cache for that product.

**Request body:** same as POST `/api/products`  
**Response `200 OK`:** updated product object

---

#### DELETE `/api/products/{id}` *(ADMIN only)*

Delete a product and remove it from Redis cache.

**Response:** `204 No Content`

---

### 6.3 Interactions

#### POST `/api/interactions`

Record a user interaction with a product. If type is `RATING`, the product's `averageRating` is recalculated automatically.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "productId": "6748a1b2c3d4e5f6a7b8c9d0",
  "type": "RATING",
  "rating": 5.0
}
```

Supported `type` values: `VIEW`, `RATING`, `PURCHASE`, `ADD_TO_CART`

`rating` is required only when `type` is `RATING` (must be between 1 and 5).

**Response `200 OK`:**
```json
{
  "id": "6748a2c3d4e5f6a7b8c9d0e1",
  "userId": "6748a0a1b2c3d4e5f6a7b8c9",
  "productId": "6748a1b2c3d4e5f6a7b8c9d0",
  "type": "RATING",
  "rating": 5.0,
  "createdAt": "2026-11-06T11:00:00"
}
```

---

#### GET `/api/interactions/history`

Get the current user's full interaction history, ordered newest first.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**
```json
[
  {
    "id": "...",
    "userId": "...",
    "productId": "...",
    "type": "PURCHASE",
    "rating": null,
    "createdAt": "2026-11-06T11:00:00"
  },
  {
    "id": "...",
    "type": "VIEW",
    "createdAt": "2026-11-06T10:55:00"
  }
]
```

---

### 6.4 Users

#### GET `/api/users/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**
```json
{
  "id": "6748a0a1b2c3d4e5f6a7b8c9",
  "username": "daniyar",
  "email": "daniyar@shop.kz",
  "firstName": "Daniyar",
  "lastName": "Zhalgasbekov",
  "phone": "+7 701 234 5678",
  "address": null,
  "role": "USER",
  "createdAt": "2026-11-06T10:00:00"
}
```

---

#### GET `/api/users/{id}`

Get a user by ID.

**Response `200 OK`:** user object (same structure as above)

---

#### PUT `/api/users/{id}`

Update a user's profile fields (firstName, lastName, phone, address).

**Request body:**
```json
{
  "firstName": "Daniyar",
  "lastName": "Zhalgasbekov",
  "phone": "+7 701 999 8888",
  "address": {
    "street": "Abay 10",
    "city": "Almaty",
    "country": "Kazakhstan",
    "zipCode": "050000"
  }
}
```

**Response `200 OK`:** updated user object

---

## 7. Test Data

Seeded automatically on first startup.

### Users

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `daniyar` | `password123` | USER |
| `aizat` | `password123` | USER |

### Products

| Name | Category | Price |
|---|---|---|
| iPhone 15 Pro | Electronics | $849.99 |
| Samsung Galaxy S24 | Electronics | $799.99 |
| MacBook Air M3 | Laptops | $1299.99 |
| Dell XPS 15 | Laptops | $1199.99 |
| Sony WH-1000XM5 | Audio | $349.99 |
| AirPods Pro 2 | Audio | $249.99 |
| Nike Air Max 270 | Footwear | $129.99 |
| Adidas Ultraboost 23 | Footwear | $149.99 |
| Samsung QLED 4K 55" | TV | $699.99 |
| PlayStation 5 | Gaming | $499.99 |

### Interactions

| User | Product | Type | Rating |
|---|---|---|---|
| daniyar | iPhone 15 Pro | VIEW | — |
| daniyar | iPhone 15 Pro | RATING | 5.0 |
| daniyar | MacBook Air M3 | PURCHASE | — |
| daniyar | Sony WH-1000XM5 | VIEW | — |
| daniyar | PlayStation 5 | ADD_TO_CART | — |
| aizat | Samsung Galaxy S24 | VIEW | — |
| aizat | AirPods Pro 2 | PURCHASE | — |
| aizat | Nike Air Max 270 | RATING | 4.0 |
| aizat | Samsung QLED 4K 55" | VIEW | — |
| admin | Dell XPS 15 | VIEW | — |

---

## 8. References

1. MongoDB Documentation — Data Modeling Introduction. https://www.mongodb.com/docs/manual/core/data-modeling-introduction/
2. Redis Documentation — Strings and Key Expiry. https://redis.io/docs/data-types/strings/
3. Spring Data MongoDB Reference. https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/
4. Spring Data Redis Reference. https://docs.spring.io/spring-data/redis/docs/current/reference/html/
5. Spring Security — JWT Authentication. https://docs.spring.io/spring-security/reference/
6. JJWT Library — JSON Web Tokens for Java. https://github.com/jwtk/jjwt
7. Ricci, F., Rokach, L., Shapira, B. (2022). *Recommender Systems Handbook*. Springer.
8. Sadalage, P. J., Fowler, M. (2012). *NoSQL Distilled*. Addison-Wesley.
