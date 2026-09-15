import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get("attemptId");

    // Return one specific attempt
    if (attemptId) {
      const attempt = await prisma.attempt.findFirst({
        where: {
          id: attemptId,
          userId: user.id,
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              topic: true,
              questions: {
                select: {
                  id: true,
                  text: true,
                  options: true,
                  correctAnswer: true,
                  explanation: true,               
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        return Response.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }

      return Response.json(attempt);
    }

    // Return all attempts belonging to the logged-in user
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topic: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(attempts);
  } catch (error) {
    console.error("ATTEMPTS FETCH ERROR:", error);

    return Response.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { quizId, answers } = body;

    if (
      !quizId ||
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return Response.json(
        { error: "Quiz ID and answers are required" },
        { status: 400 }
      );
    }

    // Only allow the owner of the quiz to submit an attempt
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: user.id,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return Response.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Calculate score on the server
    let score = 0;

    for (const question of quiz.questions) {
      const selectedAnswer = answers[question.id];

      if (
        typeof selectedAnswer === "string" &&
        selectedAnswer === question.correctAnswer
      ) {
        score++;
      }
    }

    const total = quiz.questions.length;

    const attempt = await prisma.attempt.create({
      data: {
        score,
        total,
        answers,
        userId: user.id,
        quizId,
      },
    });

    return Response.json(
      {
        attemptId: attempt.id,
        score: attempt.score,
        total: attempt.total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ATTEMPT CREATE ERROR:", error);

    return Response.json(
      { error: "Failed to save attempt" },
      { status: 500 }
    );
  }
}