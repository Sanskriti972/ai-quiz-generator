"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  type: string;
  options: string;
  correctAnswer: string;
  explanation?: string;
  topic?: string;
};

type Quiz = {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  createdAt: string;
  questions: Question[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuthAndFetchQuizzes = async () => {
      try {
        setLoading(true);

        const authResponse = await fetch("/api/me");

        if (!authResponse.ok) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/quizzes");

        if (!response.ok) {
          throw new Error("Failed to fetch quizzes");
        }

        const data = await response.json();

        setQuizzes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchQuizzes();
  }, [router]);

  const totalQuizzes = quizzes.length;

  const totalQuestions = quizzes.reduce(
    (total, quiz) => total + quiz.questions.length,
    0
  );

  const topics = new Set(
    quizzes.map((quiz) => quiz.topic).filter(Boolean)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back! 👋
            </h1>

            <p className="text-slate-400 mt-2">
              Here is an overview of your quiz activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/create-quiz")}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
            >
              + Generate New Quiz
            </button>

            <button
              onClick={() => router.push("/performance")}
              className="px-6 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition"
            >
              Performance
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            QUIZZES GENERATED
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : totalQuizzes}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            TOTAL QUESTIONS
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : totalQuestions}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            TOPICS
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : topics.size}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-8">
          {error}
        </div>
      )}

      {/* Recent Quizzes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Your Quizzes
            </h2>

            <p className="text-slate-400 mt-1">
              Quizzes generated and stored in your database.
            </p>
          </div>

          <button
            onClick={() => router.push("/history")}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View History →
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 py-8 text-center">
            Loading quizzes...
          </p>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 mb-5">
              You haven't created any quizzes yet.
            </p>

            <button
              onClick={() => router.push("/create-quiz")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
            >
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {quiz.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">
                      {quiz.topic}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                      {quiz.difficulty}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                      {quiz.questions.length} questions
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/quiz/${quiz.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
                >
                  Take Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}