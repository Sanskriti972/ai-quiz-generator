import { GoogleGenAI } from "@google/genai";
import { getCurrentUser } from "@/lib/get-current-user";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    console.log("----------------------------------------");
    console.log("Starting quiz generation...");

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error: "Gemini API key is missing.",
        },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const {
      topic,
      difficulty = "Medium",
      numberOfQuestions = 5,
      pdfText,
      questionTypes = ["mcq", "tf"],
    } = body;

    console.log("User:", user);
    console.log("Difficulty:", difficulty);
    console.log("Number of questions:", numberOfQuestions);
    console.log("Question types:", questionTypes);
    console.log("Using PDF:", !!pdfText);

    if (!topic && !pdfText) {
      return Response.json(
        {
          error: "Topic or PDF text is required",
        },
        { status: 400 }
      );
    }

    const questionCount = Math.min(
      Math.max(Number(numberOfQuestions) || 5, 1),
      20
    );

    // Make sure questionTypes is a valid array
    const allowedTypes = ["mcq", "tf", "code"];

    const selectedTypes = Array.isArray(questionTypes)
      ? questionTypes.filter((type: string) =>
          allowedTypes.includes(type)
        )
      : ["mcq", "tf"];

    if (selectedTypes.length === 0) {
      return Response.json(
        {
          error: "Please select at least one question type.",
        },
        { status: 400 }
      );
    }

    // Limit extremely large PDF input.
    // This keeps generation responsive.
    const source = (pdfText || topic).slice(0, 60000);

    /*
     * Create a distribution of question types.
     *
     * Example:
     * 5 questions + ["mcq", "tf"]
     * → mcq, tf, mcq, tf, mcq
     *
     * 5 questions + ["tf"]
     * → tf, tf, tf, tf, tf
     */
    const typeDistribution = Array.from(
      { length: questionCount },
      (_, index) => selectedTypes[index % selectedTypes.length]
    );

    const distributionText = typeDistribution
      .map((type: string, index: number) => {
        return `Question ${index + 1}: ${type}`;
      })
      .join("\n");

    const prompt = `
Create exactly ${questionCount} quiz questions from the supplied study material.

Study material:
${source}

Difficulty: ${difficulty}

The user selected these question types:
${selectedTypes.join(", ")}

IMPORTANT:
Generate the question types according to this exact distribution:

${distributionText}

QUESTION TYPE RULES:

1. MCQ:
- type must be exactly "mcq"
- Exactly 4 options
- Exactly 1 correct answer
- Options should be meaningful and different from each other

2. TRUE/FALSE:
- type must be exactly "tf"
- Exactly 2 options
- The options MUST be exactly:
  "True"
  "False"
- correctAnswer MUST be exactly either "True" or "False"

3. CODE:
- type must be exactly "code"
- Use this only if code was selected
- The question should ask the user to identify the output, behavior, or correct code concept
- Provide exactly 4 options
- Exactly 1 correct answer

GENERAL RULES:
- Generate exactly ${questionCount} questions.
- Follow the requested question type for every question.
- Do not convert True/False questions into MCQs.
- Questions must be based only on the supplied study material.
- Give a short explanation for every answer.
- Keep questions concise.
- correctAnswer must exactly match one of the options.
- Return only JSON.
`;

    console.log("Sending request to Gemini...");
    console.log("Using model: gemini-3.5-flash-lite");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,

      config: {
        thinkingConfig: {
          thinkingLevel: "minimal",
        },

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
        {
          error: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    let data;

    try {
      data = JSON.parse(response.text);
    } catch {
      return Response.json(
        {
          error: "Gemini returned invalid JSON.",
        },
        { status: 500 }
      );
    }

    if (
      !data.questions ||
      !Array.isArray(data.questions) ||
      data.questions.length === 0
    ) {
      return Response.json(
        {
          error: "Gemini returned no quiz questions.",
        },
        { status: 500 }
      );
    }

    if (data.questions.length !== questionCount) {
      throw new Error(
        `Expected ${questionCount} questions but Gemini returned ${data.questions.length}.`
      );
    }

    // Validate generated questions
    for (let index = 0; index < data.questions.length; index++) {
      const question = data.questions[index];

      if (!question.text) {
        throw new Error(
          `Question ${index + 1}: question text is missing.`
        );
      }

      if (!question.type) {
        throw new Error(
          `Question ${index + 1}: question type is missing.`
        );
      }

      // Make sure Gemini followed the requested type
      if (question.type !== typeDistribution[index]) {
        throw new Error(
          `Question ${index + 1}: expected type "${typeDistribution[index]}" but received "${question.type}".`
        );
      }

      if (!Array.isArray(question.options)) {
        throw new Error(
          `Question ${index + 1}: options are missing.`
        );
      }

      // MCQ validation
      if (question.type === "mcq") {
        if (question.options.length !== 4) {
          throw new Error(
            `Question ${index + 1}: MCQ must have exactly 4 options.`
          );
        }
      }

      // True/False validation
      if (question.type === "tf") {
        if (question.options.length !== 2) {
          throw new Error(
            `Question ${index + 1}: True/False must have exactly 2 options.`
          );
        }

        if (
          !question.options.includes("True") ||
          !question.options.includes("False")
        ) {
          throw new Error(
            `Question ${index + 1}: True/False options must be exactly "True" and "False".`
          );
        }

        if (
          question.correctAnswer !== "True" &&
          question.correctAnswer !== "False"
        ) {
          throw new Error(
            `Question ${index + 1}: True/False correct answer must be "True" or "False".`
          );
        }
      }

      // Code validation
      if (question.type === "code") {
        if (question.options.length !== 4) {
          throw new Error(
            `Question ${index + 1}: Code question must have exactly 4 options.`
          );
        }
      }

      if (!question.correctAnswer) {
        throw new Error(
          `Question ${index + 1}: correct answer is missing.`
        );
      }

      if (!question.options.includes(question.correctAnswer)) {
        throw new Error(
          `Question ${index + 1}: correct answer does not match any option.`
        );
      }

      if (!question.explanation) {
        throw new Error(
          `Question ${index + 1}: explanation is missing.`
        );
      }
    }

    console.log(
      `Quiz generated successfully: ${data.questions.length} questions`
    );

    console.log("----------------------------------------");

    return Response.json(data);
  } catch (error) {
    console.error("----------------------------------------");
    console.error("GEMINI API ERROR");
    console.error("----------------------------------------");

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error("Message:", message);

    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }

    console.error("----------------------------------------");

    const isTemporaryError =
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("high demand");

    return Response.json(
      {
        error: isTemporaryError
          ? "Gemini is temporarily unavailable. Please try again in a moment."
          : "Failed to generate quiz questions.",
        details: message,
      },
      { status: 500 }
    );
  }
}