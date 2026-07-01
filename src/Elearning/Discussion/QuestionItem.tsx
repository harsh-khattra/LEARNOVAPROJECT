import { useState } from 'react';
import { SupabaseClient } from '../../Helper/Supabase';
import type { Answer, Question } from './types';
import AnswerForm from './AnswerForm';
import styles from './QuestionItem.module.css';

interface QuestionItemProps {
  question: Question;
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let value = seconds;
  for (const [limit, unit] of units) {
    if (value < limit) {
      const rounded = Math.max(1, Math.floor(value));
      return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`;
    }
    value = value / limit;
  }
  return 'just now';
}

export default function QuestionItem({ question }: QuestionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [answerCount, setAnswerCount] = useState(question.answer_count ?? 0);

  const loadAnswers = async () => {
    if (answers !== null) return; // already loaded
    setLoadingAnswers(true);
    const { data, error } = await SupabaseClient
      .from('answers')
      .select('*')
      .eq('question_id', question.id)
      .order('created_at', { ascending: true });
    setLoadingAnswers(false);
    if (!error && data) {
      setAnswers(data as Answer[]);
      setAnswerCount(data.length);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadAnswers();
  };

  const handleAnswerCreated = (answer: Answer) => {
    setAnswers((prev) => (prev ? [...prev, answer] : [answer]));
    setAnswerCount((prev) => prev + 1);
  };

  return (
    <li className={styles.card}>
      <button className={styles.questionHeader} onClick={handleToggle} aria-expanded={expanded}>
        <div className={styles.questionMain}>
          <h3 className={styles.title}>{question.title}</h3>
          {question.body && <p className={styles.body}>{question.body}</p>}
          <div className={styles.meta}>
            <span>{question.author_name}</span>
            <span aria-hidden="true">·</span>
            <span>{timeAgo(question.created_at)}</span>
          </div>
        </div>
        <div className={styles.answerBadge}>
          <span className={styles.answerCount}>{answerCount}</span>
          <span className={styles.answerLabel}>{answerCount === 1 ? 'answer' : 'answers'}</span>
        </div>
      </button>

      {expanded && (
        <div className={styles.expandedSection}>
          {loadingAnswers && <p className={styles.muted}>Loading answers…</p>}

          {!loadingAnswers && answers && answers.length === 0 && (
            <p className={styles.muted}>No answers yet. Be the first to help.</p>
          )}

          {!loadingAnswers && answers && answers.length > 0 && (
            <ul className={styles.answerList}>
              {answers.map((answer) => (
                <li key={answer.id} className={styles.answerItem}>
                  <p className={styles.answerBody}>{answer.body}</p>
                  <div className={styles.meta}>
                    <span>{answer.author_name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{timeAgo(answer.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AnswerForm questionId={question.id} onCreated={handleAnswerCreated} />
        </div>
      )}
    </li>
  );
}