# HotelHub PMS (Property Blueprint)

This is the **HotelHub PMS** front-end built with:

- Vite
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (data)
- ElevenLabs Conversational AI (voice reservation agent)

## Getting started

1. Install dependencies:

```bash
npm install
```
riables (prefixed with `VITE_`).

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_ELEVENLABS_AGENT_ID`
- `VITE_ELEVENLABS_API_KEY`

3. Start the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Lint

## ElevenLabs voice reservations

- Setup guide: `ELEVENLABS_SETUP.md`
- Troubleshooting: `ELEVENLABS_TROUBLESHOOTING.md`
- Flow: `RESERVATION_FLOW.md`

## Notes

- `VITE_*` variables are exposed to the browser.
- Do not commit real API keys to public repositories.
