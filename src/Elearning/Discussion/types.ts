export interface Question {
  id: string;
  title: string;
  body: string | null;
  author_name: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  // populated client-side from the answers(count) join
  answer_count?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  body: string;
  author_name: string;
  user_id: string | null;
  created_at: string;
}