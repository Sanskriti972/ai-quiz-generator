// lib/mockData.ts

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'tf' | 'code';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  codeSnippet?: string;
}

export interface Quiz {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  questions: Question[];
}

export interface UserAttempt {
  quizId: string;
  score: number;
  total: number;
  date: string;
  answers: Record<string, string>; // questionId -> userSelectedAnswer
  topicBreakdown: Record<string, number>; // topic -> accuracy %
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  totalQuizzesTaken: number;
  avgScore: number;
  weakTopics: string[];
  strongTopics: string[];
}

export const mockUser: UserProfile = {
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  totalQuizzesTaken: 12,
  avgScore: 78,
  weakTopics: ["Normalization", "B-Trees", "ACID Isolation Levels"],
  strongTopics: ["SQL Queries", "Transactions", "Indexes"]
};

export const mockQuizzes: Record<string, Quiz> = {
  "dbms-101": {
    id: "dbms-101",
    title: "Database Management Systems",
    difficulty: "Medium",
    topic: "DBMS",
    questions: [
      {
        id: "q1",
        text: "Which SQL clause is used to filter group records after aggregation?",
        type: "mcq",
        options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
        correctAnswer: "HAVING",
        explanation: "The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions.",
        topic: "SQL"
      },
      {
        id: "q2",
        text: "A table is in 2NF if it is in 1NF and all non-key attributes are fully functionally dependent on the primary key.",
        type: "tf",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "2NF eliminates partial dependency. Every non-prime attribute must depend entirely on the candidate key.",
        topic: "Normalization"
      },
      {
        id: "q3",
        text: "What will be the output of the following query if the table is empty?",
        type: "code",
        codeSnippet: "SELECT COUNT(*) FROM Users WHERE age > 30;",
        options: ["0", "NULL", "Error", "Undefined"],
        correctAnswer: "0",
        explanation: "COUNT(*) returns 0 when no rows match the predicate, unlike other aggregates which return NULL.",
        topic: "SQL"
      }
    ]
  }
};

export const mockHistory: UserAttempt[] = [
  {
    quizId: "dbms-101",
    score: 2,
    total: 3,
    date: "2026-03-08",
    answers: {
      q1: "HAVING",
      q2: "False", // Wrong answer to trigger adaptive suggestion
      q3: "0"
    },
    topicBreakdown: {
      "SQL": 100,
      "Normalization": 0,
      "Transactions": 90
    }
  }
];