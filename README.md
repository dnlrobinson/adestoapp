# Adesto.ai

This is a code bundle for Adesto. The original thought process is located at https://www.figma.com/design/zer9Ds5VudQCZDP0HXvYMH/spacesV1.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with Realtime)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Auth**: Supabase Auth

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Migrations

Apply the SQL migrations in `supabase/migrations/` to your Supabase project:
- `2025-01-01-realtime-optimizations.sql` - Adds triggers for atomic member counts and performance indexes

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Welcome/landing page
│   ├── explore/           # Explore spaces
│   ├── space/[spaceId]/   # Space detail and admin
│   ├── create/            # Create new space
│   ├── profile/           # User profile and edit
│   └── onboarding/        # User onboarding
├── components/            # Shared components
│   ├── AuthProvider.tsx   # Auth context and state
│   ├── BottomNav.tsx      # Mobile navigation
│   ├── Avatar.tsx         # User avatar
│   └── ui/               # Radix UI components
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # Shared TypeScript types
└── types/
    └── database.types.ts  # Supabase generated types
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
