"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Type,
  HelpCircle,
  Upload,
  Sparkles,
  Code,
  CheckSquare,
  ChevronDown,
  FileUp,
} from "lucide-react";

function CreateQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"topic" | "text" | "pdf">("topic");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [difficulty, setDifficulty] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium");

  const [numQuestions, setNumQuestions] = useState(5);

  const [questionTypes, setQuestionTypes] = useState<string[]>([
    "mcq",
    "tf",
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const prefilledTopic = searchParams.get("topic");

        if (prefilledTopic) {
          setTopic(prefilledTopic);
          setMode("topic");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const toggleType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      let sourceText = "";
      let quizTopic = "";


      if (mode === "topic") {
        if (!topic.trim()) {
          alert("Please enter a topic.");
          setLoading(false);
          return;
        }

        sourceText = topic.trim();
        quizTopic = topic.trim();
      }


      if (mode === "text") {
        if (!text.trim()) {
          alert("Please enter some study material.");
          setLoading(false);
          return;
        }

        sourceText = text.trim();
        quizTopic = "Study Material";
      }

      if (mode === "pdf") {
        if (!pdfFile) {
          alert("Please select a PDF file.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", pdfFile);

        console.log("Uploading PDF...");

        const pdfResponse = await fetch("/api/pdf", {
          method: "POST",
          body: formData,
        });

        const pdfData = await pdfResponse.json();

        if (!pdfResponse.ok) {
          throw new Error(
            pdfData?.error || "Failed to extract text from PDF."
          );
        }

        if (!pdfData.text || !pdfData.text.trim()) {
          throw new Error("No text could be extracted from the PDF.");
        }

        sourceText = pdfData.text;

        quizTopic = pdfFile.name
          .replace(".pdf", "")
          .replace(/[_-]+/g, " ")
          .trim();

        console.log("PDF text extracted successfully.");
      }

      // --------------------------------
      // GENERATE QUIZ USING GEMINI
      // --------------------------------
      console.log("Sending study material to Gemini...");

      const generateResponse = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: quizTopic,
          pdfText: sourceText,
          difficulty,
          numberOfQuestions: numQuestions,
          questionTypes,
        }),
      });

      const generatedData = await generateResponse.json();

      if (!generateResponse.ok) {
        throw new Error(
          generatedData?.error || "Failed to generate quiz questions."
        );
      }

      console.log("Generated questions:", generatedData);

      if (
        !generatedData.questions ||
        !Array.isArray(generatedData.questions) ||
        generatedData.questions.length === 0
      ) {
        throw new Error("Gemini did not return any questions.");
      }

      // --------------------------------
      // SAVE QUIZ TO DATABASE
      // --------------------------------
      console.log("Saving quiz...");

      const saveResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${quizTopic} Quiz`,
          difficulty,
          topic: quizTopic,
          questions: generatedData.questions,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData?.error || "Failed to save quiz.");
      }

      console.log("Quiz saved:", saveData);

      // --------------------------------
      // OPEN QUIZ
      // --------------------------------
      router.push(`/quiz/${saveData.id}`);
    } catch (error) {
      console.error("Error generating quiz:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
            <Sparkles className="h-4 w-4" />
            AI Quiz Generator
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create a Quiz
          </h1>

          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Generate an AI-powered quiz from a topic, your study material, or
            a PDF.
          </p>
        </div>

        <form onSubmit={handleGenerate}>
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Source Section */}
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Choose your source
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose how you want QuizAI to create your questions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Topic */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setMode("topic")}
                  className={`group rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                    mode === "topic"
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                      mode === "topic"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                    }`}
                  >
                    <Type className="h-5 w-5" />
                  </div>

                  <h3 className="font-semibold text-slate-900">Topic</h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Generate questions from a topic.
                  </p>

                  {mode === "topic" && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-600">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Selected
                    </div>
                  )}
                </button>

                {/* Text */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setMode("text")}
                  className={`group rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                    mode === "text"
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                      mode === "text"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>

                  <h3 className="font-semibold text-slate-900">Text</h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Generate questions from provided text.
                  </p>

                  {mode === "text" && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-600">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Selected
                    </div>
                  )}
                </button>

                {/* PDF */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setMode("pdf")}
                  className={`group rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                    mode === "pdf"
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                      mode === "pdf"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                  </div>

                  <h3 className="font-semibold text-slate-900">PDF</h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Generate questions from a PDF.
                  </p>

                  {mode === "pdf" && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-600">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Selected
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Form Settings */}
            <div className="p-6 sm:p-8">
              {/* Dynamic Source Input */}
              <div className="mb-8">
                {mode === "topic" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Topic
                    </label>

                    <div className="relative">
                      <Type className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. DBMS, Java, Operating Systems"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Enter any academic topic you want to practice.
                    </p>
                  </div>
                )}

                {mode === "text" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Study Material
                    </label>

                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your study material here..."
                      rows={8}
                      disabled={loading}
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Paste notes, textbook content, or any study material.
                    </p>
                  </div>
                )}

                {mode === "pdf" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Upload PDF
                    </label>

                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-purple-300 hover:bg-purple-50/30">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                        <FileUp className="h-6 w-6 text-purple-600" />
                      </div>

                      <h3 className="font-semibold text-slate-900">
                        Upload your study material
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Select a PDF file to generate questions from it.
                      </p>

                      <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm ring-1 ring-inset ring-purple-200 transition hover:bg-purple-50">
                        <Upload className="h-4 w-4" />
                        Choose PDF
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={loading}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPdfFile(file);
                          }}
                          className="hidden"
                        />
                      </label>

                      {pdfFile && (
                        <div className="mx-auto mt-5 flex max-w-md items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-left">
                          <FileText className="h-5 w-5 shrink-0 text-purple-600" />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-purple-800">
                              {pdfFile.name}
                            </p>

                            <p className="mt-0.5 text-xs text-purple-600">
                              PDF selected successfully
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Difficulty */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Difficulty
                  </label>

                  <div className="relative">
                    <select
                      value={difficulty}
                      disabled={loading}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value as "Easy" | "Medium" | "Hard"
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Number of Questions
                  </label>

                  <div className="relative">
                    <select
                      value={numQuestions}
                      disabled={loading}
                      onChange={(e) =>
                        setNumQuestions(Number(e.target.value))
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div className="mt-8">
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Question Types
                  </label>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose the types of questions you want in your quiz.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* MCQ */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => toggleType("mcq")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      questionTypes.includes("mcq")
                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-slate-300 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50/40"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Multiple Choice
                  </button>

                  {/* True / False */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => toggleType("tf")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      questionTypes.includes("tf")
                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-slate-300 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50/40"
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    True / False
                  </button>

                  
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8 border-t border-slate-200 pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Quiz
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-slate-500">
                  QuizAI will analyze your content and generate questions using
                  AI.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Generation Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
            </div>

            <h2 className="text-xl font-semibold text-white">
              Generating your quiz...
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {mode === "pdf"
                ? "Reading your PDF and creating questions with AI."
                : "Creating questions based on your study material."}
            </p>

            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
            </div>

            <p className="mt-4 text-xs text-slate-500">
              This may take a few seconds. Please don’t close or refresh the
              page.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
              <p className="mt-4 text-sm text-slate-500">
                Loading quiz generator...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <CreateQuizContent />
    </Suspense>
  );
}