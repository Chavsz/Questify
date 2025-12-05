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

