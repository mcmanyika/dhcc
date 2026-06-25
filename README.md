# DHCC — Membership & Community Management Platform

A full-stack membership and community management platform for the Dallas Holistic Chamber of Commerce. Built with Next.js App Router, Tailwind CSS, Firebase, and Stripe.

## Features

- **Membership Registration** — Public application form with all required fields, saved to Firestore with `pending` status
- **Admin Dashboard** — View, search, filter, approve/reject, edit, delete members; export CSV
- **Stripe Integration** — One-time payments and recurring subscriptions via Checkout; webhook updates membership status
- **Event Management** — Create events, public registration, attendance tracking
- **Meeting Feedback** — Post-event feedback forms with admin analytics
- **Analytics Dashboard** — Stats cards for members, events, feedback, and revenue
- **Security** — Firestore security rules, admin route protection via Firebase Auth

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Firebase (Firestore + Auth)
- Stripe
- Lucide React icons

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password provider)
3. Create a **Firestore** database (Native mode)
4. Create users in Firebase Auth (Email/Password) for dashboard access
5. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### Firestore Collections

| Collection | Description |
|------------|-------------|
| `members` | Membership applications and member records |
| `events` | Chamber events |
| `events/{id}/registrations` | Event attendees (subcollection) |
| `feedback` | Post-event feedback responses |
| `payments` | Stripe payment records (written by webhook) |

All database reads and writes go through Next.js API routes using the Firebase Admin SDK. The client SDK is used only for admin authentication.

### 4. Stripe Setup

1. Create products and prices in the [Stripe Dashboard](https://dashboard.stripe.com)
2. Set price IDs in `.env.local` for each membership tier
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Listen for events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
5. For local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (members, events, feedback, stripe, admin)
│   ├── admin/            # Protected admin pages
│   ├── apply/            # Public membership form
│   ├── events/           # Public events & registration
│   ├── login/            # Admin login
│   └── payment/          # Stripe success/cancel pages
├── components/
│   ├── admin/            # Admin sidebar, guard
│   ├── forms/            # Membership, event, feedback forms
│   ├── layout/           # Header, footer
│   ├── providers/        # Auth provider
│   └── ui/               # Reusable UI components
├── lib/
│   ├── firebase/         # Client & admin SDK helpers
│   ├── auth.ts           # Admin verification
│   ├── csv.ts            # CSV export
│   ├── stripe.ts         # Stripe client
│   └── utils.ts          # Utilities
└── types/                # TypeScript types
firebase/
└── firestore.rules       # Firestore security rules
firebase.json             # Firebase CLI config (Firestore rules deploy)
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/apply` | Membership application form |
| `/events` | Public events listing |
| `/events/[id]` | Event detail & registration |
| `/events/[id]/feedback` | Post-event feedback form |
| `/login` | Admin login |
| `/admin` | Analytics dashboard |
| `/admin/members` | Member management |
| `/admin/events` | Event management |
| `/admin/events/[id]` | Event registrations |
| `/admin/feedback` | Feedback analytics |
| `/payment/success` | Stripe payment success |
| `/payment/cancel` | Stripe payment cancelled |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/members` | Public | Submit membership application |
| GET | `/api/members` | Admin | List members (search/filter) |
| PATCH | `/api/members/[id]` | Admin | Update member |
| DELETE | `/api/members/[id]` | Admin | Delete member |
| GET | `/api/members/export` | Admin | Export CSV |
| GET/POST | `/api/events` | Public/Admin | List/create events |
| POST | `/api/events/[id]/register` | Public | Register for event |
| POST | `/api/feedback` | Public | Submit feedback |
| POST | `/api/stripe/checkout` | Admin | Create Checkout session |
| POST | `/api/stripe/webhook` | Stripe | Payment webhooks |
| GET | `/api/admin/analytics` | Admin | Dashboard analytics |

## License

Private — Dallas Holistic Chamber of Commerce
