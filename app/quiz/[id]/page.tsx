"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  type: string;
  options: string[];
  explanation?: string;
  topic?: string;
};

type Quiz = {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  questions: Question[];
};

type AnswerFeedback = {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
};

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();

  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const [feedback, setFeedback] = useState<
    Record<string, AnswerFeedback>
  >({});

  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;

    const checkAuthAndFetchQuiz = async () => {
      try {
        setLoading(true);
        setError("");

        // Check if user is logged in
        const authResponse = await fetch("/api/me");

        if (!authResponse.ok) {
          router.replace("/login");
          return;
        }

        // Fetch quiz
        const response = await fetch(`/api/quiz/${quizId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch quiz");
        }

        const data = await response.json();

        const questions = Array.isArray(data.questions)
          ? data.questions.map((question: any) => {
              let parsedOptions: string[] = [];

              try {
                parsedOptions =
                  typeof question.options === "string"
                    ? JSON.parse(question.options)
                    : Array.isArray(question.options)
                    ? question.options
                    : [];
              } catch {
                parsedOptions = [];
              }

              return {
                ...question,
                options: parsedOptions,
              };
            })
          : [];

        setQuiz({
          ...data,
          questions,
        });
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchQuiz();
  }, [quizId, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-400">Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">
          Quiz not found
        </h1>

        <p className="text-slate-400">
          {error || "Unable to load this quiz."}
        </p>
      </div>
    );
  }

  const questions = Array.isArray(quiz.questions)
    ? quiz.questions
    : [];

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">
          No questions available
        </h1>

        <p className="text-slate-400">
          This quiz does not contain any questions yet.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const selectedAnswer = selectedAnswers[currentQuestion.id];

  const currentFeedback = feedback[currentQuestion.id];

  // Check answer with the server
  const handleAnswer = async (answer: string) => {
    // Don't allow another answer after one has already been selected
    if (submitting || checkingAnswer || selectedAnswer) {
      return;
    }

    try {
      setCheckingAnswer(true);

      // Store selected answer
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));

      // Ask server whether answer is correct
      const response = await fetch(
        `/api/quiz/${quiz.id}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            selectedAnswer: answer,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Failed to check answer"
        );
      }

      const data: AnswerFeedback = await response.json();

      setFeedback((prev) => ({
        ...prev,
        [currentQuestion.id]: data,
      }));
    } catch (error) {
      console.error("Error checking answer:", error);

      // Remove selected answer if server check failed
      setSelectedAnswers((prev) => {
        const updated = { ...prev };
        delete updated[currentQuestion.id];
        return updated;
      });

      alert(
        error instanceof Error
          ? error.message
          : "Failed to check answer."
      );
    } finally {
      setCheckingAnswer(false);
    }
  };

  const handleNext = () => {
    if (submitting || checkingAnswer) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (submitting || checkingAnswer) return;

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting || checkingAnswer) return;

    try {
      setSubmitting(true);

      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: selectedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Failed to save quiz attempt"
        );
      }

      const attempt = await response.json();

      console.log("Attempt saved successfully:", attempt);

      router.push(
        `/results/${quiz.id}?attemptId=${attempt.attemptId}`
      );
    } catch (error) {
      console.error("Error saving attempt:", error);

      setSubmitting(false);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save quiz attempt."
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {quiz.title}
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              {quiz.topic} • {quiz.difficulty}
            </p>
          </div>

          <div className="text-sm text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{
              width: `${
                ((currentIndex + 1) / questions.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-indigo-400 font-semibold mb-3">
            Question {currentIndex + 1}
          </p>

          <h2 className="text-xl font-semibold text-white leading-relaxed">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;

            const isCorrect =
              currentFeedback?.correctAnswer === option;

            let optionStyle =
              "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800";

            if (currentFeedback) {
              if (isCorrect) {
                optionStyle =
                  "border-green-500 bg-green-500/10 text-green-300";
              } else if (isSelected && !currentFeedback.correct) {
                optionStyle =
                  "border-red-500 bg-red-500/10 text-red-300";
              } else {
                optionStyle =
                  "border-slate-700 bg-slate-800/40 text-slate-500";
              }
            } else if (isSelected) {
              optionStyle =
                "border-indigo-500 bg-indigo-500/10 text-white";
            }

            let letterStyle =
              "bg-slate-700 text-slate-300";

            if (currentFeedback && isCorrect) {
              letterStyle =
                "bg-green-600 text-white";
            } else if (
              currentFeedback &&
              isSelected &&
              !currentFeedback.correct
            ) {
              letterStyle =
                "bg-red-600 text-white";
            } else if (isSelected) {
              letterStyle =
                "bg-indigo-600 text-white";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={
                  submitting ||
                  checkingAnswer ||
                  !!selectedAnswer
                }
                className={`w-full text-left p-4 rounded-xl border transition-all ${optionStyle} disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-semibold ${letterStyle}`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span>{option}</span>

                  {currentFeedback && isCorrect && (
                    <span className="ml-auto text-green-400 text-lg">
                      ✓
                    </span>
                  )}

                  {currentFeedback &&
                    isSelected &&
                    !currentFeedback.correct && (
                      <span className="ml-auto text-red-400 text-lg">
                        ✕
                      </span>
                    )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer feedback */}
        {currentFeedback && (
          <div
            className={`mt-6 rounded-xl border p-5 ${
              currentFeedback.correct
                ? "border-green-500/30 bg-green-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xl ${
                  currentFeedback.correct
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {currentFeedback.correct ? "✓" : "✕"}
              </span>

              <h3
                className={`font-semibold ${
                  currentFeedback.correct
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {currentFeedback.correct
                  ? "Correct!"
                  : "Incorrect"}
              </h3>
            </div>

            {!currentFeedback.correct && (
              <p className="text-sm text-slate-300 mb-3">
                <span className="font-semibold text-white">
                  Correct answer:
                </span>{" "}
                {currentFeedback.correctAnswer}
              </p>
            )}

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">
                Explanation
              </p>

              <p className="text-sm text-slate-300 leading-relaxed">
                {currentFeedback.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Checking answer */}
        {checkingAnswer && (
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
            Checking your answer...
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={
              currentIndex === 0 ||
              submitting ||
              checkingAnswer
            }
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                checkingAnswer ||
                !selectedAnswer
              }
              className="min-w-[160px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </span>
              ) : (
                "Submit Quiz"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                submitting ||
                checkingAnswer ||
                !selectedAnswer
              }
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Submission Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />

            <h2 className="text-xl font-semibold text-white">
              Submitting your quiz...
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Calculating your score and saving your result.
            </p>

            <p className="mt-5 text-xs text-slate-500">
              Please wait. Do not refresh or close this page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}