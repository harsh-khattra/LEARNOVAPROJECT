import { supabase } from './Enrolledcourses';

/* ------------------------------------------------------------------ */
/*  ACTUAL watch_sessions table (confirmed from Supabase):             */
/*    id: int8 (auto)                                                   */
/*    student_id: uuid                                                  */
/*    course_id: uuid                                                   */
/*    lesson_id: text (nullable) -> maps to contents.id                 */
/*    seconds_watched: numeric                                          */
/*    watched_at: timestamptz                                           */
/* ------------------------------------------------------------------ */

export interface WatchSessionRow {
  id: number;
  student_id: string;
  course_id: string;
  lesson_id: string | null;
  seconds_watched: number;
  watched_at: string;
}

export interface LogWatchInput {
  studentId: string;
  courseId: string;
  lessonId: string | null;
  secondsWatched: number;
}

/**
 * Inserts a heartbeat row into watch_sessions.
 * Each call = one row (matches how Timespent.tsx reads the data —
 * it sums seconds_watched across many rows, not one row per session).
 */
export async function logWatchHeartbeat({
  studentId,
  courseId,
  lessonId,
  secondsWatched,
}: LogWatchInput): Promise<WatchSessionRow | null> {
  if (secondsWatched <= 0) return null;

  const { data, error } = await supabase
    .from('watch_sessions')
    .insert({
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      seconds_watched: secondsWatched,
      watched_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('logWatchHeartbeat error:', error.message);
    return null;
  }
  return data as WatchSessionRow;
}

/** Fetch the most recent watch row for this student+course, to resume playback. */
export async function getLastWatchPosition(
  studentId: string,
  courseId: string
): Promise<WatchSessionRow | null> {
  const { data, error } = await supabase
    .from('watch_sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .order('watched_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getLastWatchPosition error:', error.message);
    return null;
  }
  return data as WatchSessionRow | null;
}