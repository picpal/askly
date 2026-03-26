export interface Session {
  id: string;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  role: 'super_admin' | 'admin' | 'participant';
}

export interface Question {
  id: string;
  sessionId: string;
  authorId: string;
  authorNickname: string;
  content: string;
  isPrivate: boolean;
  thumbCount: number;
  isPinned: boolean;
  createdAt: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  source: 'manual' | 'ai_assisted';
  showAiBadge: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AIDraft {
  id: string;
  questionId: string;
  content?: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  model?: string;
  errorMsg?: string;
  createdAt: string;
}
