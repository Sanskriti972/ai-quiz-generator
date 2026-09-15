"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Quiz = {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
};

type Attempt = {
  id: string;
  score: number;
  total: number;
  answers: Record<string, string> | null;
  createdAt: string;
  quiz: Quiz;
};

export default function PerformancePage() {
  const router = useRouter();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        setLoading(true);
        setError("");

        // Check authentication
        const authResponse = await fetch("/api/me");

        if (!authResponse.ok) {
          router.replace("/login");
          return;
        }

        // Fetch all attempts
        const response = await fetch("/api/attempts");

        if (!response.ok) {
          throw new Error("Failed to fetch performance data.");
        }

        const data = await response.json();

        setAttempts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Performance error:", err);
        setError("Failed to load performance data.");
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [router]);

  const totalAttempts = attempts.length;

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((sum, attempt) => {
            if (attempt.total === 0) {
              return sum;
            }

            return sum + (attempt.score / attempt.total) * 100;
          }, 0) / totalAttempts
        )
      : 0;

  const bestScore =
    totalAttempts > 0
      ? Math.max(
          ...attempts.map((attempt) => {
            if (attempt.total === 0) {
              return 0;
            }

            return Math.round((attempt.score / attempt.total) * 100);
          })
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-indigo-400 hover:text-indigo-300 font-medium mb-5"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-white">
          Performance
        </h1>

        <p className="text-slate-400 mt-2">
          Track your quiz performance and review your attempts.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-8">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            TOTAL ATTEMPTS
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : totalAttempts}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            AVERAGE SCORE
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : `${averageScore}%`}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            BEST SCORE
          </p>

          <p className="text-4xl font-bold text-white mt-3">
            {loading ? "..." : `${bestScore}%`}
          </p>
        </div>
      </div>

      {/* Performance List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            Quiz Performance
          </h2>

          <p className="text-slate-400 mt-1">
            Your scores across all quiz attempts.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

            <p className="text-slate-400 mt-4">
              Loading performance...
            </p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 mb-5">
              You haven't attempted any quizzes yet.
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const percentage =
                attempt.total > 0
                  ? Math.round(
                      (attempt.score / attempt.total) * 100
                    )
                  : 0;

              const formattedDate = new Date(
                attempt.createdAt
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={attempt.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                >
                  {/* Quiz Information */}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">
                      {attempt.quiz.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">
                        {attempt.quiz.topic}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                        {attempt.quiz.difficulty}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {attempt.score}/{attempt.total}
                      </p>

                      <p
                        className={`text-sm font-semibold ${
                          percentage >= 80
                            ? "text-green-400"
                            : percentage >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {percentage}%
                      </p>
                    </div>

                    {/* Details */}
                    <button
                      onClick={() =>
                        router.push(`/performance/${attempt.id}`)
                      }
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}