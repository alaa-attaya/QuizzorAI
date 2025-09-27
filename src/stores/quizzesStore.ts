import { create } from "zustand";

export type Quiz = {
  id: string;
  topic_id: string;
  title: string;
  description?: string | null;
  is_deleted: boolean;
  created_by: string;
  is_public?: boolean;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type QuizzesState = {
  quizzes: Record<string, Quiz[]>; // key = topicId
  totalQuizzes: number;
  setQuizzes: (topicId: string, list: Quiz[]) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (quiz: Quiz) => void;
  removeQuiz: (quiz: Quiz) => void; // soft delete
  clearQuizzes: () => void;
  quizzesByTopic: (topicId: string) => Quiz[];
};

const sortByTitle = (list: Quiz[]) =>
  list.slice().sort((a, b) => a.title.localeCompare(b.title));

const EMPTY_QUIZZES: Quiz[] = [];

export const useQuizzesStore = create<QuizzesState>((set, get) => ({
  quizzes: {},
  totalQuizzes: 0,

  clearQuizzes: () => set({ quizzes: {}, totalQuizzes: 0 }),

  setQuizzes: (topicId, list) =>
    set((state) => {
      const updated = {
        ...state.quizzes,
        [topicId]: sortByTitle(
          list.filter(
            (q, i, self) => self.findIndex((x) => x.id === q.id) === i
          )
        ),
      };
      return {
        quizzes: updated,
        totalQuizzes: Object.values(updated).flat().length,
      };
    }),

  addQuiz: (quiz) =>
    set((state) => {
      const existing = state.quizzes[quiz.topic_id] || [];
      const updated = sortByTitle([
        quiz,
        ...existing.filter((q) => q.id !== quiz.id),
      ]);
      const quizzes = { ...state.quizzes, [quiz.topic_id]: updated };
      return { quizzes, totalQuizzes: Object.values(quizzes).flat().length };
    }),

  updateQuiz: (quiz) =>
    set((state) => {
      const existing = state.quizzes[quiz.topic_id] || [];
      const updated = sortByTitle(
        existing.map((q) => (q.id === quiz.id ? { ...q, ...quiz } : q))
      );
      const quizzes = { ...state.quizzes, [quiz.topic_id]: updated };
      return { quizzes, totalQuizzes: Object.values(quizzes).flat().length };
    }),

  removeQuiz: (quiz) =>
    set((state) => {
      const existing = state.quizzes[quiz.topic_id] || [];
      const updated = existing
        .map((q) =>
          q.id === quiz.id
            ? { ...q, is_deleted: true, deleted_at: new Date().toISOString() }
            : q
        )
        .filter((q) => !q.is_deleted);
      const quizzes = { ...state.quizzes, [quiz.topic_id]: updated };
      return { quizzes, totalQuizzes: Object.values(quizzes).flat().length };
    }),

  quizzesByTopic: (topicId) => get().quizzes[topicId] || EMPTY_QUIZZES,
}));
