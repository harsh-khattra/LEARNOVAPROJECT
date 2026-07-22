import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { SupabaseClient } from '../../Helper/Supabase';
import type{ Question } from './types';
import styles from './QuestionForm.module.css';

interface QuestionFormProps {
  onCreated: (question: Question) => void;
}

export default function QuestionForm({ onCreated }: QuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setBody('');
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Give your question a title (at least 3 characters).');
      return;
    }
    if (authorName.trim().length === 0) {
      setError('Add your name so others know who asked.');
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await SupabaseClient
      .from('questions')
      .insert({
        title: title.trim(),
        body: body.trim() || null,
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
      onCreated({ ...(data as Question), answer_count: 0 });
      resetForm();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Raise a question</h2>

      <label className={styles.label} htmlFor="author_name">
        Your name
      </label>
      <input
        id="author_name"
        className={styles.input}
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="e.g. Priya Sharma"
        maxLength={80}
      />

      <label className={styles.label} htmlFor="title">
        Question title
      </label>
      <input
        id="title"
        className={styles.input}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to ask?"
        maxLength={200}
      />

      <label className={styles.label} htmlFor="body">
        Details (optional)
      </label>
      <textarea
        id="body"
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add any context that helps others answer."
        rows={4}
        maxLength={5000}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitButton} type="submit" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post question'}
      </button>
    </form>
  );
}