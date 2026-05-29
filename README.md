# Club Bites — Group Food Ordering

Next.js App Router app for club/group food ordering with Neon PostgreSQL, Tailwind CSS, and shadcn-style UI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with your Neon connection string:

```
DATABASE_URL=postgresql://...
```

3. Initialize the database (optional — also runs automatically on first page load):

```bash
npm run db:init
```

4. Start the dev server:

```bash
npm run dev
```

## Routes

| Route                | Description                                     |
| -------------------- | ----------------------------------------------- |
| `/`                  | Customer menu — product cards, cart, like/share |
| `/order`             | Order form with options for kimchi/stew items   |
| `/order/success?id=` | Order confirmation                              |
| `/admin`             | Admin dashboard (redirects to orders)           |
| `/admin/users`       | User CRUD + CSV export                          |
| `/admin/products`    | Product CRUD + CSV export                       |
| `/admin/orders`      | Order management + status + CSV export          |

## Deploy on Vercel

1. Push to GitHub and import the project in Vercel.
2. Add `DATABASE_URL` in Project Settings → Environment Variables.
3. Deploy..

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Neon PostgreSQL (`@neondatabase/serverless`)
- Server Actions for all data mutations
- Tailwind CSS v4 + Radix UI components
