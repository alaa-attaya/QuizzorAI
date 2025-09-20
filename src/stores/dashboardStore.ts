// src/stores/dashboardStore.ts
import { create } from "zustand";

export type Stats = {
  subjects: number;
  topics: number;
  quizzes: number;
  averageScore: number | string;
};

type DashboardState = {
  stats: Stats;
  setStats: (s: Stats | ((prev: Stats) => Stats)) => void;
  resetStats: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: { subjects: 0, topics: 0, quizzes: 0, averageScore: "N/A" },
  setStats: (s) =>
    set((state) => ({ stats: typeof s === "function" ? s(state.stats) : s })),
  resetStats: () =>
    set({ stats: { subjects: 0, topics: 0, quizzes: 0, averageScore: "N/A" } }),
}));
