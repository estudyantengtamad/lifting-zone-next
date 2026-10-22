# Lifting Zone Obrero — Supabase Database

This directory contains the database definition for **Lifting Zone Obrero** on **Supabase**.

## Tech Stack
- **Database**: PostgreSQL (Supabase)
- **Security**: Row Level Security (RLS) policies
- **Types**: Strongly typed TypeScript definitions in `types.ts`

## Files
- [`schema.sql`](./schema.sql): Complete database DDL defining `products`, `coupons`, `orders`, `order_items`, `batch_verifications`, and `wishlists` tables, indexes, and RLS policies.
- [`seed.sql`](./seed.sql): Initial data insertion including authentic supplements (RAW Nutrition, Applied Nutrition, Ghost), commercial gym machines (Hammer Strength, Inzer), promo vouchers (`LIFTZONE10`, `CHALK15`, `OBRERO20`), and laboratory batch certifications.
- [`types.ts`](./types.ts): TypeScript interface `Database` matching Supabase schema.

## Quick Setup Instructions
1. Go to your [Supabase Dashboard](https://app.supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and run [`schema.sql`](./schema.sql).
4. Paste and run [`seed.sql`](./seed.sql).
5. Copy your **Project URL** and **anon public key** from `Project Settings > API`.
6. Add them to your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # optional for backend admin tasks
   ```
