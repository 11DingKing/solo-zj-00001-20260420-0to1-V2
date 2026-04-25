export type QuestionType = 'single_choice' | 'multiple_choice' | 'text';

export interface Option {
  id?: string;
  text: string;
  order: number;
}

export interface Question {
  id?: string;
  type: QuestionType;
  text: string;
  is_required: boolean;
  order: number;
  options?: Option[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  max_submissions?: number;
  is_published: boolean;
  created_at: string;
  questions?: Question[];
  submission_count: number;
}

export interface SurveyCreate {
  title: string;
  description?: string;
  deadline?: string;
  max_submissions?: number;
  questions: Question[];
}

export interface SurveyUpdate {
  title?: string;
  description?: string;
  deadline?: string;
  max_submissions?: number;
  is_published?: boolean;
}

export interface AnswerSubmit {
  question_id: string;
  text?: string;
  option_ids?: string[];
}

export interface SubmissionCreate {
  survey_id: string;
  answers: AnswerSubmit[];
}

export interface OptionStats {
  option_id: string;
  option_text: string;
  count: number;
  percentage: number;
}

export interface SingleChoiceStats {
  question_id: string;
  question_text: string;
  type: 'single_choice';
  options: OptionStats[];
}

export interface MultipleChoiceStats {
  question_id: string;
  question_text: string;
  type: 'multiple_choice';
  options: OptionStats[];
}

export interface TextStats {
  question_id: string;
  question_text: string;
  type: 'text';
  answers: string[];
}

export type QuestionStats = SingleChoiceStats | MultipleChoiceStats | TextStats;

export interface SurveyStats {
  survey_id: string;
  survey_title: string;
  total_submissions: number;
  stats: QuestionStats[];
}
