# ORVEXA CRM — Supabase PostgreSQL & Auth Migration Guide

This guide details the complete migration of ORVEXA CRM to **Supabase PostgreSQL** and **Supabase Auth** for enterprise multi-tenancy, persistent database storage, and full Vercel serverless deployment.

---

## 1. Environment Variables Configuration

In your **Vercel Project Settings** (`Settings` -> `Environment Variables`) and in local `.env`:

| Variable Name | Environment | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Production & Preview | Supabase Project URL (Client) | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Production & Preview | Supabase Anon Public Key (Client) | `eyJhbGciOiJIUzI1Ni...` |
| `SUPABASE_URL` | Production & Preview | Supabase Project URL (Server-side) | `https://xyzproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Production & Preview | Supabase Anon Public Key (Server) | `eyJhbGciOiJIUzI1Ni...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | Supabase Service Role Secret Key | `eyJhbGciOiJIUzI1Ni...` |
| `GEMINI_API_KEY` | Production (Secret) | Optional: AI Co-Pilot query endpoint | `AIzaSy...` |

> ⚠️ **Security Guarantee**: `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** and is NEVER exposed to the frontend browser bundle.

---

## 2. Apply the Database Schema in Supabase

1. Log in to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select or create your project.
3. In the left navigation, go to **SQL Editor**.
4. Open `/supabase/migrations/001_initial_schema.sql` from this repository.
5. Paste the entire script into the SQL Editor and click **Run**.
   - This creates all normalized tables: `companies`, `profiles`, `leads`, `customers`, `deals`, `products`, `invoices`, `payments`, `tasks`, `follow_ups`, `appointments`, `activities`, `documents`, `communications`, `notifications`, and `company_settings`.
   - It enables **Row Level Security (RLS)** on all tables for strict company isolation.
   - It creates the `handle_new_user` trigger that automatically provisions a profile in `public.profiles` whenever an `auth.users` user is registered.

6. Next, open `/supabase/seed.sql` and run it in the SQL Editor.
   - This seeds the primary company workspace, default pipeline stages, products, customers, leads, deals, and tasks.

---

## 3. Provisioning Users in Supabase Auth

To create users with ORVEXA roles in Supabase:

### Option A: Using the Supabase Dashboard
1. In Supabase Dashboard, go to **Authentication** -> **Users** -> **Add User**.
2. Create user with Email & Password (e.g. `zubair669262@gmail.com`).
3. Under **User Metadata**, provide the JSON:
   ```json
   {
     "name": "Zubair",
     "role": "super_admin",
     "title": "Senior Manager",
     "department": "Executive Admin"
   }
   ```
4. The database trigger `on_auth_user_created` will automatically link the user to the company workspace and assign their role.

### Option B: Using SQL in Supabase SQL Editor
You can run:
```sql
-- Create user directly in auth.users and public.profiles
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'zubair669262@gmail.com',
  crypt('YourSecurePassword2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Zubair","role":"super_admin","title":"Senior Manager","department":"Executive Admin"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
```

---

## 4. Multi-Tenancy and Row Level Security (RLS) Architecture

Every record in the ORVEXA database contains a foreign key to `company_id`.

The helper function:
```sql
CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```
guarantees that:
1. A user from Company A **cannot read, write, or alter** records belonging to Company B.
2. Authorization is enforced directly by PostgreSQL at the database level, preventing bypasses even if a client manipulated the request payload.

---

## 5. Verification Checklist

1. **Cold Start & Reboot Safety**:
   - Vercel functions make zero local disk writes (`fs.writeFileSync`). No `EROFS` crashes occur.
2. **Session Persistence**:
   - Authentication sessions are managed directly by Supabase's secure token refresh protocol and stored client-side in browser storage.
3. **Data Persistence**:
   - Newly created Leads, Customers, Deals, Invoices, and Tasks are stored directly in Supabase PostgreSQL tables and survive page refreshes, lambda cold starts, and container recycling.
