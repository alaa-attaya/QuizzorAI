import { create } from "zustand";

export type Subject = {
  id: string;
  name: string;
  description?: string | null;
  is_deleted: boolean;
  created_by: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type SubjectsState = {
  subjects: Subject[];
  setSubjects: (list: Subject[]) => void;
  addSubject: (sub: Subject) => void;
  updateSubject: (sub: Subject) => void;
  removeSubject: (id: string) => void; // soft-delete
  activeSubjects: () => Subject[];
};

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  setSubjects: (list) => set({ subjects: list }),
  addSubject: (sub) => set((state) => ({ subjects: [sub, ...state.subjects] })),
  updateSubject: (sub) =>
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === sub.id ? { ...s, ...sub } : s
      ),
    })),
  removeSubject: (id) =>
    set((state) => ({
      subjects: state.subjects
        .map((s) =>
          s.id === id
            ? { ...s, is_deleted: true, deleted_at: new Date().toISOString() }
            : s
        )
        .filter((s) => !s.is_deleted), // remove deleted from active list
    })),
  activeSubjects: () => get().subjects.filter((s) => !s.is_deleted),
}));
