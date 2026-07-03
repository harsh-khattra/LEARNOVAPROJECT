import { useEffect, useState } from 'react';
import { SupabaseClient } from '../../Helper/Supabase';
import type{ Question } from './types';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import styles from './DiscussionModule.module.css';

export default function DiscussionModule() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    // The `answers(count)` join asks PostgREST to return how many
    // answers each question has, in a single round trip.
    const { data, error: fetchError } = await SupabaseClient
      .from('questions')
      .select('*, answers(count)')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      answer_count: row.answers?.[0]?.count ?? 0,
    })) as Question[];

    setQuestions(normalized);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();

    // Optional: live updates when someone else posts a question.
    // Requires realtime to be enabled on `public.questions` (see schema.sql).
    const channel = SupabaseClient
      .channel('questions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'questions' },
        (payload) => {
          setQuestions((prev) => {
            if (prev.some((q) => q.id === payload.new.id)) return prev;
            return [{ ...(payload.new as Question), answer_count: 0 }, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      SupabaseClient.removeChannel(channel);
    };
  }, []);

  const handleQuestionCreated = (question: Question) => {
    setQuestions((prev) => [question, ...prev]);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Discussion</h1>
        <p className={styles.subheading}>
          Ask doubts, discuss concepts, and connect with peers.
        </p>
      </header>

      <QuestionForm onCreated={handleQuestionCreated} />
      <QuestionList questions={questions} loading={loading} error={error} />
    </section>
  );
}