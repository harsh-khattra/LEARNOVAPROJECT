import type{ Question } from './types';
import QuestionItem from './QuestionItem';
import styles from './QuestionList.module.css';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  error: string | null;
}

export default function QuestionList({ questions, loading, error }: QuestionListProps) {
  if (loading) {
    return <p className={styles.status}>Loading questions…</p>;
  }

  if (error) {
    return <p className={styles.statusError}>Couldn't load questions: {error}</p>;
  }

  if (questions.length === 0) {
    return <p className={styles.status}>No questions yet. Ask the first one above.</p>;
  }

  return (
    <ul className={styles.list}>
      {questions.map((question) => (
        <QuestionItem key={question.id} question={question} />
      ))}
    </ul>
  );
}