import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Import worker URL in a Vite-friendly way
// Vite will copy the worker file and return a URL string
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite url import
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

// Configure PDF.js worker using the bundled worker URL
GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface QuizQuestion {
  question: string;
  answer: string;
  id: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  sourceFile: string;
  createdAt: Date;
}

/**
 * Extract text from PDF file using pdfjs-dist (browser-compatible)
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from PPTX file (basic implementation)
 * Note: PPTX is more complex, this is a simplified version
 */
async function extractTextFromPPTX(file: File): Promise<string> {
  // For PPTX, we'll use a simple approach with JSZip
  // This is a basic implementation - for production, consider using a dedicated library
  const JSZip = (await import("jszip")).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let text = "";
  const slideFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
  );

  for (const fileName of slideFiles.slice(0, 10)) {
    // Limit to first 10 slides
    const file = zip.files[fileName];
    if (file) {
      const content = await file.async("string");
      // Simple regex to extract text from XML (basic implementation)
      const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches) {
        textMatches.forEach((match) => {
          const textContent = match.replace(/<[^>]*>/g, "");
          text += textContent + " ";
        });
      }
    }
  }

  return text.trim();
}

/**
 * Extract text from uploaded file based on file type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  switch (fileExtension) {
    case "pdf":
      return await extractTextFromPDF(file);
    case "docx":
      return await extractTextFromDOCX(file);
    case "pptx":
      return await extractTextFromPPTX(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

/**
 * Generate quiz questions using AI
 * Uses Hugging Face's router with OpenAI-compatible format
 */
async function generateQuizWithAI(
  text: string,
  fileName: string
): Promise<GeneratedQuiz> {
  // Truncate text if too long (most free APIs have token limits)
  const maxLength = 2000;
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  const prompt = `Based on the following educational content, generate exactly 10 quiz questions with answers.

Content:
${truncatedText}

You must respond ONLY with valid JSON in this exact format (no additional text):
{
  "questions": [
    {"question": "Question 1 text here?", "answer": "Answer 1 here"},
    {"question": "Question 2 text here?", "answer": "Answer 2 here"}
  ]
}

Generate diverse questions covering key concepts. Make sure all questions are clear and answers are concise.`;

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Hugging Face API key is required. Please set VITE_HUGGINGFACE_API_KEY in your .env file."
    );
  }

  try {
    // Use Hugging Face router with OpenAI-compatible format
    const isDev = import.meta.env.DEV;
    
    let apiUrl: string;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (isDev) {
      // In development, use the proxy
      apiUrl = "/api/huggingface/v1/chat/completions";
      headers["X-HuggingFace-API-Key"] = apiKey;
    } else {
      // In production, use the router endpoint
      apiUrl = "https://router.huggingface.co/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;

      if (response.status === 401) {
        errorMessage =
          "Invalid or missing Hugging Face API key. Please check your VITE_HUGGINGFACE_API_KEY.";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (response.status === 503) {
        errorMessage = "Model is loading. Please wait a moment and try again.";
      }

      throw new Error(`${errorMessage}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract content from OpenAI-compatible response
    let generatedText = "";
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content;
    }

    // Try to extract JSON from the response
    if (generatedText) {
      // Remove markdown code blocks if present
      generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const quizData = JSON.parse(jsonMatch[0]);

          if (quizData.questions && Array.isArray(quizData.questions)) {
            const questions: QuizQuestion[] = quizData.questions
              .slice(0, 10)
              .map((q: any, index: number) => ({
                question: q.question || `Question ${index + 1}`,
                answer: q.answer || "",
                id: `q${index + 1}`,
              }))
              .filter((q: QuizQuestion) => q.question && q.answer);

            if (questions.length > 0) {
              return {
                id: `quiz_${Date.now()}`,
                title: fileName.replace(/\.[^/.]+$/, ""),
                questions,
                sourceFile: fileName,
                createdAt: new Date(),
              };
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse AI response as JSON:", parseError);
          console.log("Response was:", generatedText);
          throw new Error(
            "AI generated invalid response format. Please try again."
          );
        }
      }
    }

    throw new Error(
      "AI did not generate valid quiz questions. Please try again."
    );
  } catch (error: any) {
    console.error("AI generation failed:", error);
    throw error;
  }
}

/**
 * Main function to generate quiz from uploaded file
 */
export async function generateQuizFromFile(
  file: File
): Promise<GeneratedQuiz> {
  try {
    // Extract text from file
    const extractedText = await extractTextFromFile(file);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "File appears to be empty or could not extract sufficient text"
      );
    }

    // Generate quiz using AI
    const quiz = await generateQuizWithAI(extractedText, file.name);

    return quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}