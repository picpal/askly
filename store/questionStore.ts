import { create } from 'zustand';
import type { Question } from '@/lib/types';

interface QuestionState {
  questions: Question[];
  sortBy: 'latest' | 'popular';
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  setSortBy: (sort: 'latest' | 'popular') => void;
}

export const useQuestionStore = create<QuestionState>((set) => ({
  questions: [],
  sortBy: 'latest',
  setQuestions: (questions) => set({ questions }),
  addQuestion: (question) =>
    set((state) => ({ questions: [question, ...state.questions] })),
  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),
  setSortBy: (sortBy) => set({ sortBy }),
}));
