"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";

type Attempt = {
  id: string;
  score: number;
  total: number;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const quizId = params.id as string;
  const attemptId = searchParams.get("attemptId");

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!quizId || !attemptId) return;

    const loadResults = async () => {
      try {
        setLoading(true);

        // Check if user is logged in
        const authResponse = await fetch("/api/me");

        if (!authResponse.ok) {
          router.replace("/login");
          return;
        }

        // Check if quiz belongs to logged-in user
        const quizResponse = await fetch(`/api/quiz/${quizId}`);

        if (!quizResponse.ok) {
          router.replace("/dashboard");
          return;
        }

        // Fetch the actual attempt
        const attemptResponse = await fetch(
          `/api/attempts?attemptId=${attemptId}`
        );

        if (!attemptResponse.ok) {
          throw new Error("Failed to fetch attempt");
        }

        const attemptData = await attemptResponse.json();

        console.log("Attempt data:", attemptData);

        setAttempt(attemptData);
        setAuthorized(true);
      } catch (error) {
        console.error("Results loading error:", error);
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId, attemptId, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-400">Loading results...</p>
      </div>
    );
  }

  if (!authorized || !attempt) {
    return null;
  }

  const score = attempt.score;
  const total = attempt.total;

  const percentage =
    total > 0 ? Math.round((score / total) * 100) : 0;

  const getMessage = () => {
    if (percentage >= 80) {
      return "Excellent work! 🔥";
    }

    if (percentage >= 60) {
      return "Good job! Keep improving.";
    }

    if (percentage >= 40) {
      return "Not bad! A little more practice will help.";
    }

    return "Keep practicing. You’ll get better!";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center">
        <p className="text-sm text-indigo-400 font-semibold uppercase tracking-wide mb-3">
          Quiz Completed
        </p>

        <h1 className="text-4xl font-bold text-white mb-4">
          Your Results
        </h1>

        <p className="text-slate-400 mb-10">
          {getMessage()}
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <p className="text-slate-400 text-sm mb-3">
            Your Score
          </p>

          <div className="text-6xl font-bold text-white mb-3">
            {score} / {total}
          </div>

          <p className="text-2xl font-semibold text-indigo-400">
            {percentage}%
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/quiz/${quizId}`)}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
          >
            Retake Quiz
          </button>

          <button
            onClick={() => router.push("/create-quiz")}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition"
          >
            Create New Quiz
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}