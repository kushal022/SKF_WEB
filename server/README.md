# SKF Stainless Steel Furniture - Backend Database Foundation

This service manages the core API and database layer for the SKF Stainless Steel Furniture platform.

## Tech Stack
- **Runtime & Framework**: Node.js + Express
- **Database**: MySQL 8+ (InnoDB, `utf8mb4`)
- **Query Builder & ORM**: Knex.js + Objection.js
- **Authentication**: JWT + HttpOnly refresh-token cookie
- **Media**: Cloudinary (integrated in later phases)

---

## Database Architecture & Design Rules

Strict adherence to the approved **SKF Furniture Database Master Design** is required:

1. **MySQL 8+ Engine & Character Set**:
   - Engine: `InnoDB`
   - Default character set: `utf8mb4`
   - Default collation: `utf8mb4_unicode_ci` or `utf8mb4_0900_ai_ci`
2. **Primary Identifiers**:
   - **Internal IDs**: `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` (used for fast indexing, relationships, and foreign keys).
   - **Public IDs**: `CHAR(36)` UUID (exposed to frontend clients and APIs).
3. **Timestamps**:
   - Use `DATETIME` for `created_at`, `updated_at`, and domain timestamps.
4. **Foreign Keys**:
   - Must be explicitly defined with `ON DELETE` / `ON UPDATE` referential actions.
5. **Indexes**:
   - Applied intentionally on foreign keys, search fields, status flags, and unique constraints.
6. **No Unsupported ORMs**:
   - **Do NOT use Prisma or Sequelize**. Knex and Objection.js are the official tools.
7. **Incremental Migrations**:
   - Do NOT create all tables at once. Migrations must follow the step-by-step master roadmap.

---

## 1. How to Create the MySQL Database

Ensure MySQL 8+ is installed and the service is running. Open your MySQL client or CLI:

```sql
-- Connect to MySQL as an administrator:
-- mysql -u root -p

-- Create the database with utf8mb4 character set:
CREATE DATABASE IF NOT EXISTS skf_furniture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Optional: Create a dedicated user for the application:
CREATE USER IF NOT EXISTS 'skf_user'@'localhost' IDENTIFIED BY 'StrongPasswordHere!';
GRANT ALL PRIVILEGES ON skf_furniture.* TO 'skf_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. How to Configure `.env`

Copy the sample environment file and provide your local credentials:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your MySQL connection credentials:

```env
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skf_furniture

JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters
```

---

## 3. Database Connection Test

Test if the backend can connect to your MySQL database:

```bash
npm run db:test
```

Expected output:
- Success: `Database connected successfully`
- Failure: `Database connection failed` along with error details.

When starting the backend with `npm start` or `npm run dev`, the connection test runs automatically on startup.

---

## 4. How to Manage Migrations

All migration commands use the Knex CLI configured with `knexfile.js`.

### Check Migration Status
Check which migrations have been applied and which are pending:
```bash
npm run db:status
```

### Run Migrations
Apply all pending migrations to the latest state:
```bash
npm run db:migrate
```

### Rollback Migrations
Rollback the last batch of migrations:
```bash
npm run db:rollback
```

### Create a New Migration File
Generate a new migration file inside `src/db/migrations/`:
```bash
npm run db:make migration_name
```

---

## Directory Structure

```
server/
├── knexfile.js              # Knex configuration (reads .env, MySQL2, pooling)
├── package.json             # Scripts & dependencies
├── .env.example             # Template for environment variables
├── .env                     # Local environment variables (gitignored)
├── .gitignore               # Git ignored patterns
└── src/
    ├── app.js               # Express application configuration
    ├── server.js            # Server entrypoint with DB connection verification
    ├── config/              # Centralized configuration loaders
    ├── controllers/         # HTTP route controllers
    ├── db/
    │   ├── index.js         # Objection.js Model initialization & exports
    │   ├── knex.js          # Knex instance initialization & export
    │   ├── test-connection.js # DB connection test script
    │   ├── migrations/      # Knex database migrations
    │   └── seeds/           # Database seeders
    ├── middlewares/         # Express middlewares (auth, validation, errors)
    ├── models/              # Objection.js models
    ├── routes/              # Express API route definitions
    ├── services/            # Business logic layer
    ├── utils/               # Helper utilities & loggers
    └── validators/          # Request validation schemas
```
