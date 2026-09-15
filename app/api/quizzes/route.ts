import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: user.id,
      },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            explanation: true,
            topic: true,
            codeSnippet: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(quizzes);
  } catch (error) {
    console.error("QUIZ FETCH ERROR:", error);

    return Response.json(
      {
        error: "Failed to fetch quizzes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      difficulty,
      topic,
      questions,
    } = body;

    if (
      !title ||
      !difficulty ||
      !topic ||
      !questions ||
      !Array.isArray(questions)
    ) {
      return Response.json(
        {
          error: "Missing or invalid quiz data",
        },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return Response.json(
        {
          error: "At least one question is required",
        },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        difficulty,
        topic,
        userId: user.id,
        questions: {
          create: questions.map((question) => ({
            text: question.text,
            type: question.type,
            options: question.options
              ? JSON.stringify(question.options)
              : null,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || null,
            topic: question.topic || null,
            codeSnippet: question.codeSnippet || null,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return Response.json(quiz, { status: 201 });
  } catch (error) {
    console.error("QUIZ CREATE ERROR:", error);

    return Response.json(
      {
        error: "Failed to create quiz",
      },
      { status: 500 }
    );
  }
}