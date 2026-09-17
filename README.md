# The Reality Check

A personal, mini project for getting AI-powered resume feedback before you hit submit on a job application. Upload a resume against a specific job posting and get back an ATS compatibility score plus a section-by-section breakdown (tone & style, content, structure, skills).

This is a small side project, not a production app — built largely to experiment with [Puter.js](https://puter.com), which provides serverless auth, file storage, a key-value store, and AI access directly from the browser, so the whole app runs without a custom backend or database.

## Tech stack

- [React Router](https://reactrouter.com/) (framework mode) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Puter.js](https://puter.com) for auth, file storage, key-value storage, and AI-driven resume analysis
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) for rendering resume PDFs to preview images

## Features

- Sign in and upload a resume (PDF) alongside a target company, job title, and job description
- AI-generated ATS compatibility score and section-by-section feedback (tone & style, content, structure, skills)
- Dashboard listing past submissions with their scores (no application-status workflow — no "accepted"/"rejected" tracking)
- Delete individual applications or clear everything

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

---

Built with React Router + Puter.js.
