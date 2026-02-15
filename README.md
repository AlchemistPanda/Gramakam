# Gramakam — A Celebration of Theatre and Culture

> Annual theatre and cultural festival website, built with Next.js, Tailwind CSS, Framer Motion, and Firebase.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-10-orange)

## About Gramakam

Gramakam is an annual theatre and cultural festival held in **Velur, Thrissur, Kerala**, organised by **Gramakam Cultural Academy**. The festival celebrates theatre, literature, art, and community participation — bringing together artists and audiences in a vibrant celebration of creative expression.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | Frontend framework, SSR, routing |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling (earth tones, maroon, cream palette) |
| **Framer Motion** | Animations & transitions |
| **Firebase** | Auth, Firestore, Storage |
| **Lucide React** | Icons |
| **Vercel** | Deployment |

## Pages

| Route | Description |
|---|---|
| `/` | Home — Hero, Countdown, About, Carousel, Quick Links |
| `/gallery` | Gallery — Filterable grid with lightbox |
| `/feed` | Current Feed — Dynamic post cards |
| `/contact` | Contact — Form + Location + Socials |
| `/merchandise` | Merchandise — Product cards + Pre-book form |
| `/admin` | Admin Portal — Secure dashboard (login required) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Create your .env.local file with Firebase config
# (see .env.local for required variables)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Cloud Firestore**
4. Enable **Cloud Storage**
5. Copy your config values to `.env.local`

### Firestore Collections

| Collection | Purpose |
|---|---|
| `gallery` | Gallery images/videos |
| `posts` | Feed posts |
| `contacts` | Contact form submissions |
| `prebooks` | Merchandise pre-bookings |
| `config` | Site configuration (countdown date, etc.) |

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with Navbar & Footer
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles & Tailwind config
│   ├── gallery/page.tsx    # Gallery page
│   ├── feed/page.tsx       # Current Feed page
│   ├── contact/page.tsx    # Contact page
│   ├── merchandise/page.tsx# Merchandise page
│   └── admin/
│       ├── layout.tsx      # Admin layout (noindex)
│       └── page.tsx        # Admin login & dashboard
├── components/
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Site footer
│   ├── Countdown.tsx       # Live countdown timer
│   ├── Carousel.tsx        # Image carousel
│   ├── AnimatedSection.tsx # Scroll animation wrapper
│   ├── GalleryGrid.tsx     # Gallery grid with filter & lightbox
│   ├── PostCard.tsx        # Feed post card
│   └── admin/
│       └── AdminDashboard.tsx # Admin dashboard panels
├── lib/
│   ├── firebase.ts         # Firebase initialization
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript type definitions
└── public/
    └── images/             # Placeholder image directory
```

## Design

- **Palette:** Deep maroon (#800020), black, cream (#FFF8DC), earth tones, white
- **Typography:** Playfair Display (headings), Inter (body)
- **Animations:** Subtle fade-in on scroll, smooth hover transitions
- **Mobile-first** responsive design

## Deployment

This project is compatible with **Vercel** free tier:

```bash
npm i -g vercel
vercel
```

## Phase 1 Status

- [x] Home page (Hero, Countdown, About, Carousel, Quick Links)
- [x] Gallery page (Grid, Filters, Lightbox)
- [x] Feed page (Dynamic post cards)
- [x] Contact page (Form, Location, Socials)
- [x] Merchandise page (Products, Pre-book form)
- [x] Admin portal (Login, Dashboard shell)
- [x] Responsive design
- [x] SEO metadata
- [ ] Firebase integration (Auth, Firestore, Storage)
- [ ] Real image assets
- [ ] Vercel deployment

## License

This project is proprietary to Gramakam Cultural Academy / Gramakam Festival.
