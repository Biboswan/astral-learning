# Astral Digital Lessons

A Next.js application that uses AI to generate interactive educational lessons with TypeScript validation and transpilation. Perfect for creating dynamic, type-safe educational content.

## Features

- 🤖 **AI-Powered Lesson Generation**: Uses OpenAI GPT-4o-mini to generate engaging lesson content
- 🎨 **AI Image Generation**: Uses DALL-E 3 to generate custom images for lesson content
- 📝 **TypeScript Validation**: Validates and transpiles TypeScript lesson code to JavaScript using the TypeScript compiler API
- 📚 **Multiple Content Types**: Supports explanation blocks, interactive quizzes, code examples, and images
- 🎯 **Interactive Quizzes**: Built-in quiz component with scoring, explanations, and progress tracking
- 🔄 **Real-time Updates**: Supabase real-time subscriptions for live lesson status updates
- 💾 **Database Storage**: Stores TypeScript and JavaScript code in Supabase with visual assets
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- ☁️ **Serverless Ready**: Optimized for Vercel deployment with proper file tracing

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase
- **AI**: OpenAI GPT-4o-mini via Vercel AI SDK
- **Type Checking**: TypeScript Compiler API
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: Supabase Auth with SSR

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate-lesson/    # AI lesson generation endpoint
│   │   ├── generate-visual/    # AI image generation endpoint
│   │   └── lessons/             # CRUD operations for lessons
│   ├── lessons/
│   │   └── [id]/                # Individual lesson viewer
│   └── page.tsx                 # Home page with lesson generation
├── components/
│   ├── InteractiveQuiz.tsx      # Interactive quiz component
│   └── LessonsTable.tsx         # Lessons listing table
├── lib/
│   ├── supabase/                # Supabase client configuration
│   ├── types/                   # TypeScript types
│   └── validateAndTranspile.ts  # TypeScript validation & transpilation
├── supabase/
│   └── migrations/              # Database migrations
└── components/ui/               # shadcn/ui components
```

## How It Works

1. **Lesson Creation**: Users enter a lesson outline on the homepage
2. **Database Insert**: A lesson record is created with "generating" status
3. **AI Generation**: OpenAI generates TypeScript code following the `GeneratedLessonContent` interface
4. **Validation**: The TypeScript code is validated and transpiled to JavaScript
5. **Retry Logic**: If validation fails, the AI retries up to 5 times with feedback
6. **Visual Generation**: DALL-E 3 generates images based on visual descriptions in the lesson content
7. **Storage**: TypeScript code, JavaScript code, and visual assets are stored in Supabase
8. **Display**: Lessons are rendered with interactive components and generated images

## Content Types

Lessons can contain the following block types:

- **ExplanationBlock**: Text content with optional heading and AI-generated SVG diagrams
- **QuizBlock**: Interactive quizzes with multiple choice questions
- **CodeBlock**: Code examples in TypeScript, JavaScript, or Python
- **ImageBlock**: AI-generated images with generation prompts

Each visual is stored with its block_id and base64 image data for efficient retrieval and display.

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase account and project
- An OpenAI API key

### Installation

1. Clone the repository:

   ```bash
git clone <your-repo-url>
cd astral-digital-lessons
   ```

2. Install dependencies:

   ```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:

Run the migrations in your Supabase SQL editor (in order):

   ```bash
# 001_create_lessons_table.sql - Creates the lessons table
# 002_add_js_code_column.sql - Adds js_code column
# 003_add_visuals_column.sql - Adds visuals array column
# 004_add_generated_content_status.sql - Adds new status values
```

5. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### TypeScript Compiler Options

The app uses the TypeScript Compiler API for validation. The configuration is in `lib/validateAndTranspile.ts` and includes:

- ES2017 target
- Strict type checking
- ESNext modules
- Bundler module resolution

### Vercel Deployment

The `next.config.ts` includes output file tracing for TypeScript library files to ensure proper serverless function operation on Vercel:

```typescript
outputFileTracingIncludes: {
  '/api/generate-lesson': [
    'node_modules/typescript/lib/lib.d.ts',
    'node_modules/typescript/lib/lib.es5.d.ts',
    'node_modules/typescript/lib/lib.esnext.d.ts',
  ],
}
```

## Database Schema

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  outline TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'generated_content', 'generated', 'failed')),
  ts_code TEXT,
  js_code TEXT,
  visuals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Visuals Structure

The `visuals` column stores an array of visual objects:

```typescript
type Visual = {
  block_id: number;
  imageData: string;  // Base64 encoded image data
  type?: string;      // Media type (e.g., "image/png")
}
```

### Status Values

- `generating`: Lesson content is being generated
- `generated_content`: Content generated, awaiting visual generation
- `generated`: Fully complete with all visuals
- `failed`: Generation failed

## API Endpoints

### POST `/api/lessons`

Creates a new lesson with "generating" status and triggers async generation.

**Request:**
```json
{
  "outline": "Introduction to JavaScript functions"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Introduction...",
  "outline": "...",
  "status": "generating",
  "created_at": "..."
}
```

### POST `/api/generate-lesson`

Generates lesson content using AI (called asynchronously).

**Request:**
```json
{
  "lesson_id": "uuid",
  "outline": "Lesson outline"
}
```

Uses retry logic to ensure valid TypeScript code generation.

### POST `/api/generate-visual`

Generates AI images for lesson content using DALL-E 3.

**Request:**
```json
{
  "lesson_id": "uuid",
  "js_code": "const lesson = {...};"
}
```

**Response:**
```json
{
  "message": "Visuals generated",
  "count": 3,
  "failedCount": 0
}
```

Generates images based on visual generation prompts in the lesson blocks. Handles partial failures gracefully by returning successful generations and marking lessons as failed only if all images fail.

## Development

### Type Safety

The app enforces strict TypeScript validation on generated content:

- Uses the `GeneratedLessonContent` interface for type checking
- Validates TypeScript syntax before transpilation
- Transpiles to ES2017 compatible JavaScript

### Real-time Updates

Uses Supabase real-time subscriptions to update lesson status without page refresh:

```typescript
supabase
  .channel('public:lessons')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lessons' }, callback)
  .subscribe();
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure TypeScript validation passes
5. Submit a pull request

## License

This project is private and proprietary.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- AI integration via [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
