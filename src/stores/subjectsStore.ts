import { create } from "zustand";

export type Subject = {
  id: string;
  name: string;
  description?: string | null;
  is_deleted: boolean;
  is_public: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type SubjectsState = {
  subjects: Subject[];
  setSubjects: (list: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void; // soft delete
};

const sortByName = (list: Subject[]) =>
  list.slice().sort((a, b) => a.name.localeCompare(b.name));

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],

  setSubjects: (list) =>
    set({
      subjects: sortByName(
        list.filter(
          (s, index, self) => self.findIndex((x) => x.id === s.id) === index
        )
      ),
    }),

  addSubject: (subject) =>
    set((state) => ({
      subjects: sortByName([
        subject,
        ...state.subjects.filter((s) => s.id !== subject.id),
      ]),
    })),

  updateSubject: (subject) =>
    set((state) => ({
      subjects: sortByName(
        state.subjects.map((s) =>
          s.id === subject.id ? { ...s, ...subject } : s
        )
      ),
    })),

  removeSubject: (id) =>
    set((state) => ({
      subjects: sortByName(
        state.subjects
          .map((s) =>
            s.id === id
              ? { ...s, is_deleted: true, deleted_at: new Date().toISOString() }
              : s
          )
          .filter((s) => !s.is_deleted)
      ),
    })),
}));
