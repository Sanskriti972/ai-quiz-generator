"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Shield, Target } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Profile auth error:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">
        Profile & Performance
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-indigo-500">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            {user.name}
          </h2>

          <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
            <Mail className="w-4 h-4" /> {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-md font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Strong Topics
          </h3>

          <p className="text-slate-400 text-sm">
            Your strong topics will appear here as you complete more quizzes.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-md font-bold text-rose-400 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Weak Topics
          </h3>

          <p className="text-slate-400 text-sm">
            AI-targeted weak topics will appear here based on your quiz
            performance.
          </p>
        </div>
      </div>
    </div>
  );
}