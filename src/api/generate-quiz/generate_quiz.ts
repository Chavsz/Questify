import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
// Import worker URL in a Vite-friendly way
// Vite will copy the worker file and return a URL string
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite url import
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

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
  
  let fullText = '';
  
  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
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
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  let text = '';
  const slideFiles = Object.keys(zip.files).filter(name => 
    name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
  );
  
  for (const fileName of slideFiles.slice(0, 10)) { // Limit to first 10 slides
    const file = zip.files[fileName];
    if (file) {
      const content = await file.async('string');
      // Simple regex to extract text from XML (basic implementation)
      const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches) {
        textMatches.forEach(match => {
          const textContent = match.replace(/<[^>]*>/g, '');
          text += textContent + ' ';
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
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromDOCX(file);
    case 'pptx':
      return await extractTextFromPPTX(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

/**
 * Generate quiz questions using AI
 * Uses a free AI API or falls back to pattern-based generation
 */
async function generateQuizWithAI(text: string, fileName: string): Promise<GeneratedQuiz> {
  // Truncate text if too long (most free APIs have token limits)
  const maxLength = 2000;
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...' 
    : text;

  const prompt = `Based on the following educational content, generate 10 quiz questions with answers. 
For each question, provide a clear question and the correct answer.

Content:
${truncatedText}

Format as JSON:
{
  "questions": [
    {"question": "Question text", "answer": "Answer text"}
  ]
}

Generate diverse questions covering key concepts.`;

  try {
    // Try using Hugging Face Inference API (free tier, may require API key for some models)
    // Using a smaller, faster model
    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      let generatedText = '';
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        generatedText = data[0].generated_text;
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      } else if (typeof data === 'string') {
        generatedText = data;
      }

      // Try to extract JSON from the response
      if (generatedText) {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const quizData = JSON.parse(jsonMatch[0]);
            
            if (quizData.questions && Array.isArray(quizData.questions)) {
              const questions: QuizQuestion[] = quizData.questions
                .slice(0, 10)
                .map((q: any, index: number) => ({
                  question: q.question || `Question ${index + 1}`,
                  answer: q.answer || '',
                  id: `q${index + 1}`
                }))
                .filter((q: QuizQuestion) => q.question && q.answer);

              if (questions.length > 0) {
                return {
                  id: `quiz_${Date.now()}`,
                  title: fileName.replace(/\.[^/.]+$/, ''),
                  questions,
                  sourceFile: fileName,
                  createdAt: new Date()
                };
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse AI response as JSON:', parseError);
          }
        }
      }
    }
  } catch (error) {
    console.warn('AI generation failed, using fallback:', error);
  }

  // Fallback: Generate simple questions from text
  return generateFallbackQuiz(text, fileName);
}

/**
 * Fallback quiz generation using simple text analysis
 */
function generateFallbackQuiz(text: string, fileName: string): GeneratedQuiz {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.length > 20);
  const questions: QuizQuestion[] = [];
  
  // Generate questions from key sentences
  const numQuestions = Math.min(10, Math.floor(sentences.length / 2));
  
  for (let i = 0; i < numQuestions && i * 2 < sentences.length; i++) {
    const sentence = sentences[i * 2];
    const words = sentence.split(' ');
    
    if (words.length > 5) {
      // Create a fill-in-the-blank or definition question
      const keyWord = words[Math.floor(words.length / 2)];
      const question = sentence.replace(keyWord, '_____');
      
      questions.push({
        id: `q${i + 1}`,
        question: question || `What is mentioned about: ${words.slice(0, 3).join(' ')}?`,
        answer: keyWord || 'Answer not available'
      });
    }
  }

  // If we don't have enough questions, add generic ones
  while (questions.length < 5) {
    questions.push({
      id: `q${questions.length + 1}`,
      question: `Question ${questions.length + 1} about the content`,
      answer: 'Please review the material'
    });
  }

  return {
    id: `quiz_${Date.now()}`,
    title: fileName.replace(/\.[^/.]+$/, ''),
    questions,
    sourceFile: fileName,
    createdAt: new Date()
  };
}

/**
 * Main function to generate quiz from uploaded file
 */
export async function generateQuizFromFile(file: File): Promise<GeneratedQuiz> {
  try {
    // Extract text from file
    const extractedText = await extractTextFromFile(file);
    
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('File appears to be empty or could not extract sufficient text');
    }

    // Generate quiz using AI
    const quiz = await generateQuizWithAI(extractedText, file.name);
    
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}
