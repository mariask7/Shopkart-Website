# ShopKart

ShopKart is a fashion, beauty, and lifestyle shopping website. It has a React storefront, a Spring Boot REST API, and a MySQL database. The storefront can load products from the ShopKart API and falls back to the DummyJSON product API if the local API is unavailable or returns no products.

## Features

- Browse products across all categories or filter by category.
- Search product names and descriptions.
- Open product details, view images, and see price and stock information.
- Add products to a cart, change quantities, and remove items.
- Toggle a wishlist for the current page session.
- Register and sign in using email and password.
- View promotional banners and responsive product cards.

### Current limitations

- The cart and wishlist are held in browser memory; they are not saved to the account or database and are cleared when the page state is lost.
- The checkout buttons are visual only. There is no order placement or payment flow.
- The SQL schema includes `orders`, `order_items`, and `cart_items`, but the backend does not yet provide order or persistent-cart APIs.
- Product catalog records are imported from DummyJSON on backend startup. Product images are external URLs from that catalog.
- Product reads are public. Creating, updating, or deleting products requires a valid JWT, but there is not yet a separate administrator role or product-management screen.

## Technology and resources

| Area | Technologies and resources |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, Bootstrap 5, Axios, CSS |
| Backend | Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA, Spring Security, Bean Validation |
| Authentication | JSON Web Tokens (JJWT) and BCrypt password hashing |
| Database | MySQL; MySQL Connector/J |
| Product catalog | DummyJSON API (`https://dummyjson.com`) |
| Build and checks | npm scripts, Oxlint, Maven |

## Project layout

```text
ShopKart/
├── database.sql                  # MySQL schema for the ShopKart database
├── docker-compose.yml            # Frontend, backend, and MySQL deployment
├── .env.example                  # Placeholder environment settings
├── .gitignore                    # Repository-wide generated-file and secret exclusions
└── shopkart/
    ├── README.md                 # This guide
    ├── DATABASE_API_GUIDE.md     # Database and API walkthrough
    ├── package.json              # Frontend dependencies and scripts
    ├── vite.config.js            # Vite configuration and local /api proxy
    ├── Dockerfile                # Vite build and NGINX static web server
    ├── nginx.conf                # SPA fallback and backend API reverse proxy
    ├── public/                   # Public static assets
    ├── src/
    │   ├── App.jsx               # Storefront, catalog, search, cart, and auth state
    │   ├── AuthPage.jsx          # Registration and login pages
    │   ├── ProductCard.jsx       # Product listing card
    │   ├── ProductDetails.jsx    # Product details dialog
    │   ├── Cart.jsx              # In-memory shopping cart
    │   ├── App.css               # Storefront styles
    │   ├── index.css             # Base styles
    │   └── assets/               # Images and starter assets
    └── backend/
        ├── pom.xml               # Java dependencies and Maven build
        ├── Dockerfile             # Java 21 Spring Boot container
        └── src/main/
            ├── java/com/shopkart/backend/
            │   ├── AuthController.java
            │   ├── ProductController.java
            │   ├── CatalogImportRunner.java
            │   ├── SecurityConfig.java
            │   ├── JwtService.java
            │   ├── JwtAuthenticationFilter.java
            │   ├── User.java, Category.java, Product.java
            │   └── *Repository.java
            └── resources/
                └── application.properties
```

The database script is one directory above the frontend/backend project folder. It defines `users`, `categories`, `products`, `orders`, `cart_items`, and `order_items`. The JPA entities currently used by the backend are `User`, `Category`, and `Product`; Hibernate updates the entity-backed tables at startup.

## Prerequisites

- Node.js and npm
- Java 21
- Maven
- MySQL Server

## Local setup

### 1. Create the database

Run [`../database.sql`](../database.sql) in MySQL Workbench, or create the database manually:

```sql
CREATE DATABASE IF NOT EXISTS shopkart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The backend connects to `shopkart` on `localhost:3306` by default. Set the database connection variables if your local setup differs.

### 2. Start the backend

In PowerShell, from the `shopkart` directory:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/shopkart?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-MySQL-password"
$env:JWT_SECRET = "replace-with-a-private-secret-of-at-least-32-characters"
Set-Location .\backend
mvn spring-boot:run
```

Use your own MySQL credentials. If your MySQL account has no password, omit the `DB_PASSWORD` assignment. The API listens on `http://localhost:8080`.

On startup, the backend imports supported product categories from DummyJSON if the catalog has not already been imported. The import can be disabled with:

```powershell
$env:SHOPKART_CATALOG_IMPORT_ON_START = "false"
```

The configuration property is `shopkart.catalog.import-on-start`; Spring Boot maps it from the environment variable above.

### 3. Start the frontend

Open another PowerShell terminal in the `shopkart` directory:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite (normally `http://localhost:5173`). Vite forwards `/api` requests to `http://localhost:8080`.

## Configuration

Backend configuration is in `backend/src/main/resources/application.properties`. Environment variables take precedence over local defaults:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | JDBC connection URL; defaults to the local `shopkart` database |
| `DB_USERNAME` | MySQL username; defaults to `root` |
| `DB_PASSWORD` | MySQL password; provide it through the environment |
| `JWT_SECRET` | Private JWT signing secret; set a strong secret of at least 32 characters outside local development |
| `JWT_EXPIRATION_MS` | JWT lifetime in milliseconds; defaults to one hour |
| `SHOPKART_CATALOG_IMPORT_ON_START` | Set to `false` to disable the startup catalog import |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of exact frontend origins allowed by the backend |
| `VITE_API_URL` | Frontend API base URL; defaults to `/api` |

`JWT_SECRET` must be set; the backend intentionally has no checked-in signing-key fallback. Do not commit real database passwords or JWT secrets.

## API endpoints

The backend exposes:

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Backend status response |
| `GET` | `/api/products?limit=0` | Public | List products; `limit=0` returns all |
| `GET` | `/api/products/{id}` | Public | Get one product |
| `GET` | `/api/products/search?q=cream` | Public | Search product names and descriptions |
| `GET` | `/api/products/category/{category}` | Public | List products by category name/slug |
| `POST` | `/api/products` | JWT required | Create a product; returns `201 Created` |
| `PUT` | `/api/products/{id}` | JWT required | Replace a product's editable fields |
| `DELETE` | `/api/products/{id}` | JWT required | Delete a product; returns `204 No Content` |
| `POST` | `/api/auth/register` | Public | Create an account and return a JWT |
| `POST` | `/api/auth/login` | Public | Sign in and return a JWT |
| `GET` | `/api/auth/me` | JWT required | Get the signed-in user's profile |

Example category paths include `/api/products/category/beauty` and `/api/products/category/womens-dresses`. The browser stores the returned JWT in local storage and sends it to authenticated API requests.

Product create/update requests use this JSON shape. `category` must match an existing category name:

```json
{
  "name": "Daily Moisturizer",
  "description": "A lightweight moisturizer.",
  "price": 799.00,
  "imageUrl": "https://example.com/moisturizer.png",
  "stockQuantity": 25,
  "category": "beauty"
}
```

Validation errors and unknown categories return `400 Bad Request`, missing product IDs return `404 Not Found`, unauthenticated write requests return `401 Unauthorized`, and a delete blocked by related database records returns `409 Conflict`. No UI for product administration is included; use the REST API with a JWT.

## Build and checks

Run from `shopkart`:

```powershell
npm run lint
npm run build
```

Run the backend tests/build from `shopkart/backend`:

```powershell
mvn test
mvn package
```

The frontend production output is written to `shopkart/dist`. Maven creates the executable Spring Boot JAR under `shopkart/backend/target`.

## Docker Compose deployment

Docker Desktop (or Docker Engine with the Compose plugin) is required. From the repository root, copy the placeholder environment file and edit it:

```powershell
Copy-Item .env.example .env
```

Replace the example database passwords and JWT secret in `.env` with private values. The JWT secret must be at least 32 characters. Then start all services:

```powershell
docker compose up --build
```

Open `http://localhost:8080`. NGINX serves the React build and forwards `/api` requests to Spring Boot. The backend connects to the `mysql` Compose service; MySQL is not published on a host port. Startup waits for MySQL and backend health checks, and MySQL data is stored in the named `shopkart_mysql_data` volume.

Use `docker compose down` to stop and remove containers while keeping database data. To permanently remove the database volume as well, use `docker compose down --volumes`; this deletes the stored database data. The SQL initialization script runs only when the MySQL volume is first created.

For a separately hosted frontend/API, set `CORS_ALLOWED_ORIGINS` to the exact frontend origin(s), separated by commas. The Vite `/api` proxy is for local development; the Docker deployment uses NGINX as a same-origin reverse proxy. Set `VITE_API_URL` at frontend build time only when using a different API routing arrangement.

## GitHub setup

The current workspace is not yet a Git repository. From the repository root, initialize it and create a first commit:

```powershell
git init -b main
git add .
git commit -m "Prepare ShopKart for deployment"
```

Create an empty GitHub repository, then add its URL and push:

```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

The root `.gitignore` excludes build output, dependencies, IDE files, and real `.env` files while allowing `.env.example` to be tracked. Review `git status` before committing, and never add database passwords or private signing keys.

For a more detailed database walkthrough and example product queries, see [`DATABASE_API_GUIDE.md`](DATABASE_API_GUIDE.md).
