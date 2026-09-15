import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is logged in
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get quiz ID from URL
    const { id: quizId } = await params;

    // Get data sent from frontend
    const body = await request.json();

    const { questionId, selectedAnswer } = body;

    if (!questionId || typeof selectedAnswer !== "string") {
      return Response.json(
        {
          error: "Question ID and selected answer are required",
        },
        { status: 400 }
      );
    }

    // Make sure this quiz belongs to the logged-in user
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: user.id,
      },
      include: {
        questions: {
          where: {
            id: questionId,
          },
          select: {
            id: true,
            correctAnswer: true,
            explanation: true,
          },
        },
      },
    });

    if (!quiz) {
      return Response.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    const question = quiz.questions[0];

    if (!question) {
      return Response.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check the answer on the SERVER
    const isCorrect = selectedAnswer === question.correctAnswer;

    return Response.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation:
        question.explanation ||
        "No explanation is available for this question.",
    });
  } catch (error) {
    console.error("ANSWER CHECK ERROR:", error);

    return Response.json(
      {
        error: "Failed to check answer",
      },
      { status: 500 }
    );
  }
}