import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'QuizAI - Adaptive AI Quiz Generator',
  description: 'Generate custom quizzes and master your weak areas with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
