import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);

    return Response.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        difficulty: data.difficulty,
        topic: data.topic,
        userId: data.userId,

        questions: {
          create:
            data.questions?.map((question: any) => ({
              text: question.text,
              type: question.type,
              options: question.options
                ? JSON.stringify(question.options)
                : null,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || null,
              topic: question.topic || null,
              codeSnippet: question.codeSnippet || null,
            })) || [],
        },
      },

      include: {
        questions: true,
      },
    });

    return Response.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);

    return Response.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}