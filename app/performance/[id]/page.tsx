"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trophy,
} from "lucide-react";

type Question = {
  id: string;
  text: string;
  options: string | null;
  correctAnswer: string;
  explanation: string | null;
};

type Quiz = {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  questions: Question[];
};

type Attempt = {
  id: string;
  score: number;
  total: number;
  answers: Record<string, string>;
  createdAt: string;
  quiz: Quiz;
};

export default function PerformancePage() {
  const params = useParams();
  const router = useRouter();

  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPerformance() {
      try {
        const meResponse = await fetch("/api/me");

        if (!meResponse.ok) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `/api/attempts?attemptId=${attemptId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load performance");
          return;
        }

        setAttempt(data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading performance.");
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadPerformance();
    }
  }, [attemptId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">
            Loading your performance...
          </p>
        </div>
      </main>
    );
  }

  if (error || !attempt) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Unable to load performance
          </h1>

          <p className="text-slate-500 mb-6">
            {error || "Attempt not found."}
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const percentage =
    attempt.total > 0
      ? Math.round((attempt.score / attempt.total) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600 mb-2">
            Performance Report
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            {attempt.quiz.title}
          </h1>

          <p className="text-slate-500 mt-2">
            {attempt.quiz.topic} · {attempt.quiz.difficulty}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-indigo-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Your Score
                </p>

                <p className="text-3xl font-bold text-slate-900">
                  {attempt.score} / {attempt.total}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-slate-500">
                Accuracy
              </p>

              <p className="text-3xl font-bold text-indigo-600">
                {percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {attempt.quiz.questions.map((question, index) => {
            const userAnswer = attempt.answers?.[question.id];
            const isCorrect =
              userAnswer === question.correctAnswer;

            let options: string[] = [];

            try {
              options = question.options
                ? JSON.parse(question.options)
                : [];
            } catch {
              options = [];
            }

            return (
              <div
                key={question.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Question Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start gap-4">

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isCorrect
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-slate-500 mb-1">
                        Question {index + 1}
                      </p>

                      <h2 className="text-lg font-semibold text-slate-900">
                        {question.text}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                <div className="p-6 space-y-4">

                  {/* User Answer */}
                  <div
                    className={`rounded-xl p-4 border ${
                      isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      Your Answer
                    </p>

                    <p
                      className={`font-semibold ${
                        isCorrect
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {userAnswer || "Not answered"}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  {!isCorrect && (
                    <div className="rounded-xl p-4 border border-green-200 bg-green-50">
                      <p className="text-sm font-medium text-slate-500 mb-1">
                        Correct Answer
                      </p>

                      <p className="font-semibold text-green-700">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Explanation
                    </p>

                    <p className="text-slate-600 leading-relaxed">
                      {question.explanation ||
                        "No explanation is available for this question."}
                    </p>
                  </div>

                  {/* Options */}
                  {options.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        Options
                      </p>

                      <div className="space-y-2">
                        {options.map((option, optionIndex) => {
                          const isUserAnswer =
                            option === userAnswer;

                          const isCorrectOption =
                            option === question.correctAnswer;

                          return (
                            <div
                              key={optionIndex}
                              className={`rounded-lg border p-3 text-sm ${
                                isCorrectOption
                                  ? "border-green-300 bg-green-50 text-green-800"
                                  : isUserAnswer
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{option}</span>

                                {isCorrectOption && (
                                  <span className="text-xs font-semibold text-green-700">
                                    Correct
                                  </span>
                                )}

                                {isUserAnswer &&
                                  !isCorrectOption && (
                                    <span className="text-xs font-semibold text-red-700">
                                      Your choice
                                    </span>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() =>
              router.push(`/quiz/${attempt.quiz.id}`)
            }
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </main>
  );
}