import { SupabaseClient } from '../../../Helper/Supabase';

export type CourseStatus = 'draft' | 'pending' | 'published';
export type ContentType = 'video' | 'youtube' | 'pdf';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  status: CourseStatus;
  created_by: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    id: string;
    role: string;
  };
  
}

export interface CreateCourseInput {
  title: string;
  description: string;
  category: string;
  thumbnail_file: File | null;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  contents?: ContentAsset[];
}
export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  courses?: {
    title: string;
    description: string;
    thumbnail_url: string | null;
    category: string;
    status: string;
  };
}

export interface LearningHistoryItem {
  id: string;
  user_id: string;
  course_id: string;
  content_id: string;
  viewed_at: string;
  contents?: {
    title: string;
    content_type: ContentType;
  };
  courses?: {
    title: string;
  };
}

export interface ContentAsset {
  id: string;
  chapter_id: string;
  title: string;
  content_type: ContentType;
  content_url: string;
  order_index: number;
  created_at: string;
}

export const lmsService = {
  // ==========================================
  // MODULE 2: COURSE MANAGEMENT ACTIONS
  // ==========================================
  async fetchAllCourses() {
    const { data, error } = await SupabaseClient
      .from('courses')
      .select('*, profiles:teacher_id(id, email)') // Correct structural link join
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createCourse(course: { title: string; description: string; category: string; teacherId: string; file?: File | null }) {
    let thumbnailUrl = null;
    if (course.file) {
      thumbnailUrl = await this.uploadStorageAsset(course.file, 'course-thumbnails');
    }

    const { data, error } = await SupabaseClient
      .from('courses')
      .insert([{
        title: course.title,
        description: course.description,
        category: course.category,
        teacher_id: course.teacherId,
        status: 'draft'
      }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateCourseStatus(courseId: string, status: 'draft' | 'pending' | 'published') {
    const { data, error } = await SupabaseClient
      .from('courses')
      .update({ status })
      .eq('id', courseId)
      .select().single();
    if (error) throw error;
    return data;
  },

  async deleteCourse(courseId: string) {
    const { error } = await SupabaseClient.from('courses').delete().eq('id', courseId);
    if (error) throw error;
  },

  // ==========================================
  // MODULE 3: CONTENT & ACCORDION MANAGEMENT
  // ==========================================
  async fetchCourseSyllabus(courseId: string) {
    const { data, error } = await SupabaseClient
      .from('chapters')
      .select('*, contents(*)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  async addChapter(courseId: string, title: string, orderIndex: number) {
    const { data, error } = await SupabaseClient
      .from('chapters')
      .insert([{ course_id: courseId, title, order_index: orderIndex }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async addContentAsset(params: { chapterId: string; title: string; type: 'video' | 'youtube' | 'pdf'; payload: string | File }) {
    let finalUrl = '';
    if (typeof params.payload === 'string') {
      finalUrl = params.payload; // YouTube link string
    } else {
      const bucket = params.type === 'video' ? 'course-videos' : 'course-pdfs';
      finalUrl = await this.uploadStorageAsset(params.payload, bucket);
    }

    const { data, error } = await SupabaseClient
      .from('contents')
      .insert([{
        chapter_id: params.chapterId,
        title: params.title,
        content_type: params.type,
        content_url: finalUrl
      }])
      .select().single();
    if (error) throw error;
    return data;
  },

  // Storage Pipeline Helper Method
  async uploadStorageAsset(file: File, bucket: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}_${Date.now()}.${fileExt}`;
    const { error } = await SupabaseClient.storage.from(bucket).upload(path, file);
    if (error) throw error;

    return SupabaseClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  
};
