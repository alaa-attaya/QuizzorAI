import { create } from "zustand";

export type Topic = {
  id: string;
  name: string;
  description?: string | null;
  is_deleted: boolean;
  created_by: string;
  subject_id: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type TopicsState = {
  topics: Record<string, Topic[]>; // key = subjectId
  totalTopics: number;
  setTopics: (subjectId: string, list: Topic[]) => void;
  setAllTopics: (map: Record<string, Topic[]>) => void; // NEW
  addTopic: (topic: Topic) => void;
  updateTopic: (topic: Topic) => void;
  removeTopic: (topic: Topic) => void; // soft delete
  clearTopics: () => void;
  topicsBySubject: (subjectId: string) => Topic[];
};

const sortByName = (list: Topic[]) =>
  list.slice().sort((a, b) => a.name.localeCompare(b.name));

const EMPTY_TOPICS: Topic[] = [];

export const useTopicsStore = create<TopicsState>((set, get) => ({
  topics: {},
  totalTopics: 0,

  clearTopics: () => set({ topics: {}, totalTopics: 0 }),

  // Replace topics for a single subject (keeps functional set)
  setTopics: (subjectId, list) => {
    set((state) => {
      const updatedTopics = {
        ...state.topics,
        [subjectId]: sortByName(
          list.filter(
            (t, index, self) => self.findIndex((x) => x.id === t.id) === index
          )
        ),
      };
      return {
        topics: updatedTopics,
        totalTopics: Object.values(updatedTopics).flat().length,
      };
    });
  },

  // NEW: set entire topics map in one update (atomic)
  setAllTopics: (map) => {
    set(() => {
      // normalize: dedupe + sort each list
      const normalized: Record<string, Topic[]> = {};
      Object.entries(map).forEach(([subjectId, list]) => {
        normalized[subjectId] = sortByName(
          list.filter(
            (t, index, self) => self.findIndex((x) => x.id === t.id) === index
          )
        );
      });

      return {
        topics: normalized,
        totalTopics: Object.values(normalized).flat().length,
      };
    });
  },

  addTopic: (topic) => {
    set((state) => {
      const existing = state.topics[topic.subject_id] || [];
      const updated = sortByName([
        topic,
        ...existing.filter((t) => t.id !== topic.id),
      ]);
      const updatedTopics = { ...state.topics, [topic.subject_id]: updated };
      return {
        topics: updatedTopics,
        totalTopics: Object.values(updatedTopics).flat().length,
      };
    });
  },

  updateTopic: (topic) => {
    set((state) => {
      const existing = state.topics[topic.subject_id] || [];
      const updated = sortByName(
        existing.map((t) => (t.id === topic.id ? { ...t, ...topic } : t))
      );
      const updatedTopics = { ...state.topics, [topic.subject_id]: updated };
      return {
        topics: updatedTopics,
        totalTopics: Object.values(updatedTopics).flat().length,
      };
    });
  },

  removeTopic: (topic) => {
    set((state) => {
      const existing = state.topics[topic.subject_id] || [];
      const updated = sortByName(
        existing
          .map((t) =>
            t.id === topic.id
              ? { ...t, is_deleted: true, deleted_at: new Date().toISOString() }
              : t
          )
          .filter((t) => !t.is_deleted)
      );
      const updatedTopics = { ...state.topics, [topic.subject_id]: updated };
      return {
        topics: updatedTopics,
        totalTopics: Object.values(updatedTopics).flat().length,
      };
    });
  },

  topicsBySubject: (subjectId) => get().topics[subjectId] || EMPTY_TOPICS,
}));
