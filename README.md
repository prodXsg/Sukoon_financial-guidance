# Sukoon - Financial Decision Guidance

A premium financial assistant app that helps users make confident purchase decisions with AI-powered insights, multi-factor analysis, and expert guidance.

## Features

- **Personalized Decision Guidance**: Simulates purchase decisions against income, monthly expenses, EMIs, and personal priorities (Stay comfortable, Be flexible, Think ahead).
- **Sukoon Smart Checks**: Multi-factor financial model checks including savings rate, emergency fund safety, recurring ownership costs, and debt ratios.
- **Smarter Alternatives**: Strategic recommendations such as lower-cost alternatives, waiting periods, split payments, or category substitutes.
- **Expert Financial Advisory**: Connect with specialized financial advisors for personalized advice and booking sessions.
- **Decision History**: Track and review past financial decisions locally.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast modern bundling
- **Tailwind CSS**
- **Motion** (Framer Motion) for fluid interactions
- **Lucide Icons**
- **Google GenAI SDK** (`@google/genai`) for Gemini AI analysis

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or `http://localhost:5173`).

### 5. Build for production

```bash
npm run build
```
