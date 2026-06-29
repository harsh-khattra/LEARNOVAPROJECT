import { useState } from 'react';
import type{ Answer } from './types';
import type { SubmitEvent } from 'react';
import { SupabaseClient } from '../../Helper/Supabase';
import styles from './AnswerForm.module.css';

interface AnswerFormProps {
  questionId: string;
  onCreated: (answer: Answer) => void;
}

export default function AnswerForm({ questionId, onCreated }: AnswerFormProps) {
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (body.trim().length === 0) {
      setError('Write an answer before posting.');
      return;
    }
    if (authorName.trim().length === 0) {
      setError('Add your name so others know who answered.');
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await SupabaseClient
      .from('answers')
      .insert({
        question_id: questionId,
        body: body.trim(),
        author_name: authorName.trim(),
      })
      .select()
      .single();
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      onCreated(data as Answer);
      setBody('');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.nameInput}
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name"
          maxLength={80}
        />
      </div>
      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your answer…"
        rows={3}
        maxLength={5000}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.submitButton} type="submit" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post answer'}
      </button>
    </form>
  );
}