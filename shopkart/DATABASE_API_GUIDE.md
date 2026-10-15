# ShopKart Database and API Guide

## 1. Requirements

Install MySQL Server, Java 21, Maven, and Node.js. The MySQL database must be named `shopkart`.

If the database does not exist yet, run this in MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS shopkart;
```

The Spring Boot backend maps the `categories` and `products` tables and creates or updates those tables on startup. Your other ERD tables can remain in the database. On first startup, the backend imports supported products, categories, and thumbnail URLs into MySQL. Prices are stored in Indian rupees.

Set a private `JWT_SECRET` of at least 32 characters before starting the backend. Database and signing credentials should be supplied through environment variables, not committed to source control.

## 2. Verify Imported Products

Start the backend as described below. After it logs that the catalog was imported, run this in MySQL Workbench to verify the product image URLs are stored in the database:

```sql
SELECT p.id, p.name, p.image_url, c.name AS category
FROM products p
JOIN categories c ON c.id = p.category_id;
```

If the earlier test product `Sample Moisturizer` is still in the database and you want to remove it, run:

```sql
DELETE FROM products WHERE name = 'Sample Moisturizer';
```

## 3. Start the Backend

Open a terminal in the `backend` folder. In PowerShell, set the MySQL credentials for that terminal and start Spring Boot:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-MySQL-password"
$env:JWT_SECRET = "replace-with-a-private-secret-of-at-least-32-characters"
mvn spring-boot:run
```

Replace the example values with your own. Do not save real credentials in the project. If your MySQL root account has no password, omit the `DB_PASSWORD` line. The backend listens on `http://localhost:8080`.

## 4. Start the Frontend

Open a second terminal in the project folder and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Vite forwards `/api` requests to the Spring Boot backend on port `8080`; React reads the imported products and their saved image URLs from MySQL through that API.

## 5. API Endpoints

- `GET http://localhost:8080/api/products?limit=0` - list all products
- `GET http://localhost:8080/api/products/1` - get a product by ID
- `GET http://localhost:8080/api/products/search?q=cream` - search product names and descriptions
- `GET http://localhost:8080/api/products/category/beauty` - list products in a category
- `POST http://localhost:8080/api/products` - create a product (JWT required)
- `PUT http://localhost:8080/api/products/1` - update a product (JWT required)
- `DELETE http://localhost:8080/api/products/1` - delete a product (JWT required)
- `POST http://localhost:8080/api/auth/register` and `/api/auth/login` - create an account or sign in
- `GET http://localhost:8080/api/auth/me` - get the authenticated profile

Register or log in to receive a JWT, then send it on product write requests as `Authorization: Bearer <token>`. Product create/update JSON fields are `name`, `description`, `price`, `imageUrl`, `stockQuantity`, and `category`; the category must already exist. The category endpoint expects a category slug, such as `beauty` or `womens-dresses`, in the URL. The JSON response is adapted to the frontend. Product images come from the MySQL `image_url` column. The shopping cart is stored in frontend state and is not saved to MySQL.

## 6. Screenshots for a Word Report

Capture these after running the app, and give each a figure number and caption:

1. The ER diagram provided for ShopKart.
2. MySQL Workbench showing the `shopkart` schema and its tables.
3. The SQL query result showing the sample product joined with its category.
4. The API JSON response for `GET /api/products?limit=0` in a browser or Postman.
5. The ShopKart frontend showing the product loaded from MySQL.
6. Optionally, the frontend search/category result and its matching API response.

Do not include screenshots that reveal your MySQL password or other credentials.
