import { GoogleGenAI } from "@google/genai";
import { getCurrentUser } from "@/lib/get-current-user";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const {
      topic,
      difficulty = "Medium",
      numberOfQuestions = 5,
      pdfText,
    } = body;

    if (!topic && !pdfText) {
      return Response.json(
        { error: "Topic or PDF text is required" },
        { status: 400 }
      );
    }

    const source = pdfText || topic;

    const prompt = `
Generate ${numberOfQuestions} multiple-choice quiz questions.

Subject:
${source}

Difficulty:
${difficulty}

Requirements:
- Generate exactly ${numberOfQuestions} questions.
- Each question must have exactly 4 options.
- There must be exactly one correct answer.
- Questions must be based only on the provided subject/study material.
- Include a short explanation for the correct answer.
- Return only valid JSON.
`;

    console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                  },
                  type: {
                    type: "string",
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  correctAnswer: {
                    type: "string",
                  },
                  explanation: {
                    type: "string",
                  },
                  topic: {
                    type: "string",
                  },
                },
                required: [
                  "text",
                  "type",
                  "options",
                  "correctAnswer",
                  "explanation",
                  "topic",
                ],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    console.log("Gemini response received.");

    if (!response.text) {
      return Response.json(
        { error: "Gemini returned an empty response" },
        { status: 500 }
      );
    }

    const data = JSON.parse(response.text);

    return Response.json(data);
  } catch (error) {
    console.error("Gemini quiz generation error:", error);

    return Response.json(
      {
        error: "Failed to generate quiz questions",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}