import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, difficulty, numberOfQuestions } = await request.json();

    if (!topic) {
      return Response.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const count = numberOfQuestions || 5;

    const prompt = `
Generate ${count} multiple-choice quiz questions about "${topic}".

Difficulty: ${difficulty || "Medium"}

Requirements:
- Each question must have exactly 4 options.
- There must be exactly one correct answer.
- Questions should be educational and factually accurate.
- Match the requested difficulty.
- Include a short explanation for the correct answer.
- Return ONLY the requested JSON structure.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Gemini returned an empty response");
    }

    const data = JSON.parse(responseText);

    return Response.json(data);
  } catch (error) {
    console.error("Gemini quiz generation error:", error);

    return Response.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}