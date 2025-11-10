# Questify - AI-Powered Quiz Generator

Questify is a gamified learning platform that uses AI to generate quizzes from educational documents (PDF, DOCX, PPTX).

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Hugging Face API Key

To use the AI quiz generation feature, you need a Hugging Face API key:

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token (read access is sufficient)
3. Create a `.env` file in the `Questify` directory:
   ```
   VITE_HUGGINGFACE_API_KEY=your_api_key_here
   ```
4. Replace `your_api_key_here` with your actual API key

### 3. Run the Development Server
```bash
npm run dev
```

## Features

- Upload PDF, DOCX, or PPTX files
- AI-powered quiz generation using Google Flan-T5-Base model
- Pixel-art style quiz interface
- Progress tracking
- Firebase integration for data persistence

## Tech Stack

- React + TypeScript + Vite
- Firebase (Authentication & Firestore)
- Hugging Face Inference API (Google Flan-T5-Base)
- PDF.js for PDF parsing
- Mammoth for DOCX parsing

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
