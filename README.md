### PicPerfect

Images gallery explorer built with Next.js 15, Firebase (Firestore + Storage), and Genkit (Gemini). Upload images from your computer or a URL; tags are generated server‑side and saved for fast search.

## Features

- **Upload**: Local file or image URL (PNG/JPEG, up to 2MB)
- **Auto‑tagging (AI)**: Tags generated via Genkit + Google AI
- **Realtime gallery**: Images stream from Firestore
- **Search**: Filter by name or tag

## Stack

- Next.js 15, React 18, TypeScript, Tailwind
- Firebase Web SDK: Firestore, Storage
- Genkit with `@genkit-ai/googleai` (Gemini 2.0 Flash)

## Prerequisites

- Node.js 18+
- Firebase project with Firestore and Storage enabled
- Google AI API key (for Gemini via Genkit)

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` in the project root

```bash
# Firebase (from your Web App config)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Genkit / Google AI
GEMINI_API_KEY=...

# Optional basic auth gate for the whole site
BASIC_AUTH_USER=
BASIC_AUTH_PASSWORD=
```

3. Firebase services

- Enable Firestore (Native mode) and Cloud Storage in the Firebase Console.
- For local development, use permissive rules or the Firebase Emulator Suite. For production, lock down rules and add proper auth.

## Run

```bash
# Next.js dev server
npm run dev   # http://localhost:9002

# Genkit dev (flows + local dashboard)
npm run genkit:dev
```

## Usage

- Click "Upload Image" → choose a file or load from a URL → optionally rename → "Upload & Tag".
- The app uploads to Firebase Storage, generates tags on the server, and writes a document into the `images` collection.
- Use the search box to filter by filename or tags.

## Notes

- Optional basic auth is enforced only if `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set.
- Remote image domains allowed by Next.js are configured in `next.config.ts`.
