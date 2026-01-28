// DisposaPoll Type Definitions

export interface Env {
  DB: D1Database;
  MAGIC_LINKS: KVNamespace;
  ENVIRONMENT: string;
}

export type QuestionType = 'single' | 'multiple' | 'text' | 'rating';
export type MagicLinkMode = 'owner' | 'viewer' | 'taker';

export interface Question {
  id: string;
  pollId: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  orderIndex: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  lastAccessed: string;
  isLocked: boolean;
  totalParticipants: number;
  questions: Question[];
}

export interface MagicLinkData {
  pollId: string;
  mode: MagicLinkMode;
  createdAt: number;
}

export interface Participant {
  id: string;
  pollId: string;
  sessionId: string;
  joinedAt: string;
  submittedAt?: string;
  hasSubmitted: boolean;
}

export interface Answer {
  id: string;
  participantId: string;
  questionId: string;
  pollId: string;
  answerValue: AnswerValue;
  createdAt: string;
}

export interface AnswerValue {
  type: QuestionType;
  value: string | string[] | number;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  questions: {
    questionText: string;
    questionType: QuestionType;
    options?: string[];
  }[];
}

export interface SubmitResponseRequest {
  pollCode: string;
  sessionId: string;
  answers: {
    questionId: string;
    answerValue: AnswerValue;
  }[];
}

export interface PollResults {
  pollId: string;
  totalResponses: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  results: ResultData;
}

export interface ResultData {
  singleChoice?: {
    optionCounts: Record<string, number>;
    percentages: Record<string, number>;
  };
  multipleChoice?: {
    optionCounts: Record<string, number>;
  };
  text?: {
    responses: string[];
  };
  rating?: {
    average: number;
    distribution: Record<number, number>;
  };
}
