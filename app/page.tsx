import Link from 'next/link';
import { Brain, Sparkles, Target, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Hero Header */}
      <header className="border-b border-slate-800 py-4 px-6 max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-400">
          <Brain className="w-8 h-8 text-indigo-500" />
          <span>QuizAI</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition">Log in</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">Sign Up</Link>
        </div>
      </header>

      {/* Main Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" /> Next-Gen Adaptive Learning
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
          Turn any document or topic into smart quizzes in seconds.
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10">
          Upload PDFs, paste notes, or type a topic. Our AI pinpoints your weak areas and creates custom, targeted follow-up quizzes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition shadow-lg shadow-indigo-600/25">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-8 py-4 rounded-xl text-lg font-semibold transition">
            View Demo Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
          <Sparkles className="w-10 h-10 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Multiple Input Modes</h3>
          <p className="text-slate-400">Generate quizzes from PDFs, raw text, or broad topics with full control over difficulty and question types.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
          <Target className="w-10 h-10 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Adaptive Weak-Spot Targeting</h3>
          <p className="text-slate-400">Our engine breaks down your performance topic by topic and lets you generate instant quizzes targeting weak areas.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
          <BarChart3 className="w-10 h-10 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Deep Explanations & Analytics</h3>
          <p className="text-slate-400">Get rich post-quiz breakdowns comparing user answers with correct answers alongside AI reasoning.</p>
        </div>
      </section>
    </div>
  );
}