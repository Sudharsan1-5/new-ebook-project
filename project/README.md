# AI-Powered eBook Generator

A complete web application for generating professional eBooks using AI. Create entire books with AI-generated content and covers, then export them for selling on platforms like Etsy, Whop, Gumroad, or Amazon KDP.

## Features

### Core Functionality

- **User Authentication**: Email/password and Google OAuth sign-in via Supabase
- **AI Content Generation**: Create full eBook manuscripts using Mistral AI
- **AI Cover Design**: Generate professional book covers using Stability AI
- **Multiple Templates**: Choose from 3 professionally designed formatting styles
- **Export Options**: Export as PDF (with clickable table of contents) or EPUB (reflowable text)
- **Project Management**: Dashboard to manage all your eBook projects

### Wizard-Based Creation Flow

1. **Book Details**: Enter topic, audience, and tone
2. **Title Generation**: AI suggests 5 titles or create your own
3. **Chapter Outline**: Review and edit the chapter structure
4. **Content Generation**: AI writes full content for each chapter
5. **Template Selection**: Choose formatting style
6. **Cover Design**: Generate AI covers (with API key)
7. **Export**: Download PDF or EPUB files

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **AI Services**:
  - Mistral AI for content generation
  - Stability AI for cover images
- **Export**: jsPDF (PDF) + JSZip (EPUB)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

You'll need API keys from:
- [Mistral AI](https://console.mistral.ai) - Free tier available
- [Stability AI](https://platform.stability.ai) - Free tier available

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (already set in `.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── TextArea.tsx
│   ├── Modal.tsx
│   └── EBookWizard.tsx # Main wizard component
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/                # Core services
│   ├── supabase.ts     # Supabase client
│   ├── mistral.ts      # Mistral AI service
│   ├── stabilityai.ts  # Stability AI service
│   ├── export-pdf.ts   # PDF export
│   ├── export-epub.ts  # EPUB export
│   └── templates.ts    # Formatting templates
├── pages/              # Main pages
│   ├── Login.tsx
│   ├── SignUp.tsx
│   └── Dashboard.tsx
├── types/              # TypeScript types
│   └── index.ts
└── App.tsx             # Main app component
```

## Usage

### Creating Your First eBook

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Start Wizard**: Click "Create New eBook" on the dashboard
3. **Enter Details**: Provide your book topic, target audience, and tone
4. **Add API Keys**: Enter your Mistral and Stability AI keys (optional for demo)
5. **Follow the Wizard**: The app guides you through each step
6. **Export**: Download your finished eBook as PDF or EPUB

### API Integration

The wizard includes fields for your API keys. These are used client-side and not stored on the server.

**Mistral AI** powers:
- Title generation (5 suggestions)
- Chapter outline creation
- Full chapter content writing

**Stability AI** powers:
- Professional cover image generation
- Multiple style options (minimal, artistic, professional)

## Export Formats

### PDF Export
- Includes cover page with title and metadata
- Clickable table of contents with page numbers
- Formatted chapters with consistent styling
- Optional watermark for free tier users
- Ready for Etsy, Whop, and Gumroad

### EPUB Export
- Reflowable text for e-readers
- Proper EPUB 3.0 structure
- Embedded styles and metadata
- Navigation document with TOC
- Optimized for Amazon KDP

## Templates

### Minimal Professional
- Clean Georgia serif font
- Ample white space
- Professional margins
- Ideal for business books

### Creative Journal
- Artistic Palatino font
- Vibrant accent colors
- Generous spacing
- Perfect for creative content

### Elegant Typography
- Sophisticated Times font
- Balanced layout
- Refined details
- Suited for literary works

## Monetization (Future)

The application is designed to support subscription tiers:

- **Free**: 1 eBook with watermark
- **Basic ($9/mo)**: 5 eBooks, no watermark
- **Pro ($29/mo)**: Unlimited eBooks, premium features

Integration ready for:
- Stripe payment processing
- Whop subscription management
- Usage tracking and limits

## Database Schema

The app is designed to work with Supabase with the following tables:

- `users` - User profiles and subscription info
- `ebooks` - eBook project metadata
- `chapters` - Chapter content and structure
- `covers` - Cover design data
- `subscriptions` - Payment and plan tracking

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

### Environment Variables

Required variables in `.env`:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Notes

### Current Implementation Status

This MVP includes:
- ✅ Complete authentication system
- ✅ Full wizard UI with all steps
- ✅ API service integrations (Mistral, Stability AI)
- ✅ PDF/EPUB export engines
- ✅ Dashboard and project management
- ✅ Template system
- ⏳ Database persistence (requires Supabase setup)
- ⏳ Payment integration (structure ready)

### Next Steps for Production

1. Set up Supabase database tables
2. Implement data persistence in wizard
3. Add Stripe/Whop payment integration
4. Enable actual API calls (currently using mock data in demo)
5. Add image upload for custom covers
6. Implement project editing functionality
7. Add export history and download management

## License

This project is built for educational and commercial use.

## Support

For issues, questions, or feature requests, please refer to the codebase documentation or contact support.

---

**Built with modern web technologies for creating professional eBooks at scale.**
