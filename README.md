## Public assets

Placeholders exist for homepage downloads:

- `public/docs/*.pdf`
- `public/calendar/event.ics`
- `public/images/og-image.jpg`
- `public/images/twitter-image.jpg`

Replace with real assets when available.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run test:ics` - Validate `public/calendar/event.ics` format and dates
- `npm run test:qa` - Automated QA: checks in-page anchors/ids and presence of required public docs + ICS
- `npm run test:downloads` - Smoke test that downloads (PDFs + ICS) return 200 from a running server

## Environment

Set the following server-side environment variables:

- `DATABASE_URL`: Postgres connection string
- `GEMINI_API_KEY`: Google Generative Language API key used for chat replies, summaries and admin recommendations
- `BREVO_API_KEY`: Brevo (Sendinblue) transactional email API key
- `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME` (optional): default sender
- `SUPER_ADMIN_EMAIL`: email that should be ensured as super admin at setup

## Admin setup

- POST `/api/admin/setup` initializes required tables (`users`, `user_status_changes`, `documents`) and ensures the super admin flag.
- Admin Analytics pages provide: traffic charts, chat summaries, and AI recommendations.

## New features

- Partnership application page: `/partnership-application` with `PartnershipForm` posting to `/api/partnership-application` and notifying admin via email.
- Admin Follow-ups: `/admin/follow-ups` shows recent chat summaries, lets admins open AI recommendations, mark items completed, and set local reminders.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
