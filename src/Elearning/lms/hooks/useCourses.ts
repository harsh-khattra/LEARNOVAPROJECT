import { useState, useEffect, useCallback } from 'react';
import { lmsService } from '../services/lmsService';
import type { Course, CourseStatus } from '../types/lms';

export function useCourses(filter: CourseStatus | 'all' = 'all', teacherId?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Course[];
      
      if (teacherId) {
        data = await lmsService.fetchTeacherCourses(teacherId);
      } else {
        data = await lmsService.fetchCourses(filter);
      }
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [filter, teacherId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return { courses, loading, error, refetch: loadCourses };
}