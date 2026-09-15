import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(
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

    const { id } = await params;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
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
    });

    if (!quiz) {
      return Response.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return Response.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);

    return Response.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}