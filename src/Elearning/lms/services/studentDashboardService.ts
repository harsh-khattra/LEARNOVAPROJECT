
import { SupabaseClient } from '../../../Helper/Supabase'; 
import type { Course, CourseStatus, CreateCourseInput } from '../types/lms';
// import msRoutes from '../routes/lmsRoutes';

export const lmsService = {

  async fetchCourses(role: CourseStatus | 'all' = 'all'): Promise<Course[]> {
    let query = SupabaseClient
      .from('courses')
      .select('*'); 
    
    if (role !== 'all') {
      query = query.eq('status', role);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Course[];
  },

  async fetchTeacherCourses(teacherId: string): Promise<Course[]> {
    const { data, error } = await SupabaseClient
      .from('courses')
      .select('*') 
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Course[];
  },
async uploadThumbnail(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    // Unique string file naming sequence
    const fileName = `${crypto.randomUUID()}.${fileExt}`; 

    
    const { error: uploadError } = await SupabaseClient.storage
      .from('thumbnails') 
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Fetch the clean public asset layout URL
    const { data } = SupabaseClient.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
 

  async createCourse(input: CreateCourseInput, userId: string): Promise<Course> {
    let thumbnail_url = null;

    if (input.thumbnail_file) {
      thumbnail_url = await this.uploadThumbnail(input.thumbnail_file);
    }

    const { data, error } = await SupabaseClient
      .from('courses')
      .insert([
        {
          title: input.title,
          description: input.description,
          category: input.category,
          thumbnail_url,
          status: 'draft', 
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  },

  async updateCourseStatus(courseId: string, status: CourseStatus): Promise<void> {
    const { error } = await SupabaseClient
      .from('courses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', courseId);

    if (error) throw error;
  },

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await SupabaseClient
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
  },


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
      finalUrl = params.payload;
    } else {
      const bucket = params.type === 'video' ? 'course-videos' : 'course-pdfs';
      
      const fileExt = params.payload.name.split('.').pop();
      const path = `assets/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await SupabaseClient.storage.from(bucket).upload(path, params.payload);
      if (uploadError) throw uploadError;

      finalUrl = SupabaseClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
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
  }
};