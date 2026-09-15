"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";

type Attempt = {
  id: string;
  score: number;
  total: number;
  createdAt: string;
  quizId: string;
  quiz: {
    title: string;
    topic: string;
    difficulty: string;
  };
};

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/attempts");

        if (!response.ok) {
          throw new Error("Failed to fetch quiz history");
        }

        const data = await response.json();

        setAttempts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("History error:", err);
        setError("Failed to load quiz history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <History className="w-8 h-8 text-indigo-400" />

        <h1 className="text-3xl font-bold text-white">
          Quiz History
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <p className="text-slate-400">
              Loading quiz history...
            </p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 mb-5">
              You haven't attempted any quizzes yet.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
            >
              Take a Quiz
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 bg-slate-950/50">
                  <th className="p-4">Quiz</th>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800 text-sm">
                {attempts.map((attempt) => {
                  const percentage = Math.round(
                    (attempt.score / attempt.total) * 100
                  );

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="p-4 font-semibold text-white">
                        {attempt.quiz.title}
                      </td>

                      <td className="p-4 text-slate-400">
                        {attempt.quiz.topic}
                      </td>

                      <td className="p-4 text-slate-400">
                        {new Date(
                          attempt.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4 font-bold text-emerald-400">
                        {attempt.score} / {attempt.total} (
                        {percentage}%)
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/results/${attempt.quizId}?score=${attempt.score}&total=${attempt.total}`}
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View Details
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}