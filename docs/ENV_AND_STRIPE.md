# Environment & Stripe (Premium) Setup

This doc covers environment variables for **clario-mobile** and how Premium/Stripe fits in.

---

## Mobile app environment variables

The mobile app only needs one URL to talk to the backend.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Base URL of the **clario-web** API (e.g. `http://localhost:3000` or `https://yourdomain.com`). |

### Setup

1. Copy `.env.example` to `.env` in the project root.
2. Set `EXPO_PUBLIC_API_URL`:
   - **Local:** Point to where clario-web runs (e.g. `http://localhost:3000` if web runs on port 3000).
   - **Production:** Your deployed clario-web URL (HTTPS).
3. Restart the Expo dev server after changing env (`npx expo start`).

Expo injects `EXPO_PUBLIC_*` at build time via `app.config.js` → `extra` → `utils/env.ts`.

---

## Premium / Stripe: where it runs

Stripe (checkout, webhooks, billing portal) is implemented in **clario-web**, not in this repo.

- The mobile app only calls:
  - `POST /api/checkout` with `{ plan: 'monthly' \| 'annual' }` → returns `{ url }` (Stripe Checkout).
  - `POST /api/premium/portal` → returns `{ url }` (Stripe Billing Portal).
- All Stripe keys, price IDs, webhook secret, and Supabase role key live in **clario-web** `.env.local` (or production env).

So for Premium to work:

1. **clario-web** must be running and reachable at `EXPO_PUBLIC_API_URL`.
2. **clario-web** must have Stripe and webhook configured (see below).

---

## Stripe setup (on clario-web)

Do this in the **clario-web** project. The mobile app has no Stripe keys.

### 1. Dependencies (clario-web)

```bash
cd path/to/clario-web
npm install stripe @stripe/stripe-js
```

### 2. Stripe Dashboard

- **API keys:** Developers → API keys → Secret key (`sk_...`) and Publishable key (`pk_...`) if needed.
- **Products & prices:**
  - Premium Monthly: $20/month → copy **Price ID** (`price_...`).
  - Premium Annual: $192/year → copy **Price ID** (`price_...`).
- **Webhooks:** Developers → Webhooks → Add endpoint:
  - URL: `https://yourdomain.com/api/webhooks/stripe` (or for local: use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward to `localhost:3000/api/webhooks/stripe`).
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
  - Copy the **Signing secret** (`whsec_...`).

### 3. Environment variables (clario-web)

In **clario-web** `.env.local` (or production env):

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redirects (checkout success/cancel)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Webhook needs to update users (is_premium, subscription_*)
NEXT_PUBLIC_SUPABASE_ROLE_KEY=eyJ...   # Supabase Dashboard → Settings → API → role key (not anon)
```

### 4. Database (clario-web / Supabase)

Run migrations that add:

- `is_premium` on `users`
- `subscription_id`, `subscription_plan`, `subscription_status` on `users`

(e.g. `011_add_is_premium_to_users.sql`, `012_add_subscription_fields_to_users.sql`.)

### 5. Testing from the mobile app

1. Start **clario-web** (e.g. `npm run dev`) and ensure it has the env above.
2. Set **clario-mobile** `EXPO_PUBLIC_API_URL` to that web URL (e.g. `http://localhost:3000`).  
   For a physical device, use your machine’s LAN IP (e.g. `http://192.168.1.x:3000`) or a tunnel.
3. In the app, open Premium, pick a plan, and complete checkout with test card `4242 4242 4242 4242`.
4. For webhooks locally: in clario-web folder run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and put the printed signing secret in clario-web `STRIPE_WEBHOOK_SECRET`.

---

## Security

- Do **not** commit `.env` or `.env.local` (they should be in `.gitignore`).
- Stripe secret key and webhook secret must only live on the **server** (clario-web), never in the mobile app.
- The mobile app uses the backend URL and auth tokens only; it never sees Stripe keys.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| "Network request failed" or API errors | `EXPO_PUBLIC_API_URL` correct? Backend running? For device, use LAN IP or tunnel. |
| Checkout opens then fails | Backend logs; Stripe keys and price IDs in clario-web env. |
| Payment succeeds but user not premium | clario-web: webhook secret, Supabase role key, migrations applied; Stripe Dashboard → Webhooks → delivery logs. |

For full Stripe troubleshooting (webhook signatures, DB updates, etc.), see **clario-web** Stripe/docs.
