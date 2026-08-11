import { uploadFileToSupabase } from '../utils/lmsShared';
import { SupabaseClient } from '../../../Helper/Supabase'; 
import type { Course, CourseStatus, CreateCourseInput } from '../types/lms';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export interface ExtendedCreateCourseInput extends CreateCourseInput {
  youtube_playlist_id?: string;
}

export const lmsService = {

  // Fetch videos from YouTube Playlist
  async fetchVideosFromPlaylist(playlistUrl: string) {
    try {
      const regExp = /[&?]list=([^&]+)/;
      const match = playlistUrl.match(regExp);
      if (!match || !match[1]) {
        throw new Error("Invalid YouTube Playlist URL");
      }
      const playlistId = match[1];

      const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.items.map((item: any, index: number) => ({
        title: item.snippet.title,
        description: item.snippet.description || 'No description available for this video.', 
        type: 'youtube',
        content_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        order_index: index,
        status: 'draft'
      }));
    } catch (error) {
      console.error("Error fetching playlist from YouTube:", error);
      throw error;
    }
  },

  async fetchAllCourses(): Promise<Course[]> {
    const { data, error } = await SupabaseClient
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Course[];
  },

  async fetchCourses(_filter?: string) {
    const { data, error } = await SupabaseClient
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        category,
        status,
        created_at,
        created_by,
        youtube_playlist_id,
        chapters (
          id,
          title,
          contents (
            id,
            title,
            content_url,
            type,
            status,
            description
          )
        )
      `)
      .eq('status', 'published');

    if (error) {
      console.error("Supabase relational query failed:", error);
      throw error;
    }
    return data;
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
    const fileName = `${Math.random()}_${Date.now()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    const { error: uploadError } = await SupabaseClient.storage
      .from('thumbnails') 
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = SupabaseClient.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async createCourse(input: ExtendedCreateCourseInput, userId: string): Promise<Course> {
    let publicThumbnailUrl = null;

    if (input.thumbnail_file) {
      publicThumbnailUrl = await uploadFileToSupabase(
        'lms-assets',       // Bucket Name
        'course-covers',    // Folder Name inside bucket
        input.thumbnail_file
      );
    }

    const { data, error } = await SupabaseClient
      .from('courses')
      .insert([
        {
          title: input.title,
          description: input.description,
          category: input.category,
          thumbnail_url: publicThumbnailUrl, 
          status: 'draft', 
          created_by: userId,
          youtube_playlist_id: input.youtube_playlist_id || null
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

  // 🛠️ SAFE CASCADING DELETE: Deletes enrollments, contents, and chapters first to prevent foreign key errors (23503)
async deleteCourse(courseId: string): Promise<void> {
  try {
    // 1. Delete student watch sessions for this course
    const { error: watchError } = await SupabaseClient
      .from('watch_sessions')
      .delete()
      .eq('course_id', courseId);
    if (watchError) console.warn("watch_sessions cleanup warning:", watchError);

    // 2. Delete student enrollments
    const { error: enrollError } = await SupabaseClient
      .from('course_enrollment')
      .delete()
      .eq('course_id', courseId);
    if (enrollError) console.warn("Enrollment cleanup warning:", enrollError);

    // 3. Fetch chapter IDs linked to this course
    const { data: chapters } = await SupabaseClient
      .from('chapters')
      .select('id')
      .eq('course_id', courseId);

    // 4. Delete contents inside those chapters
    if (chapters && chapters.length > 0) {
      const chapterIds = chapters.map(ch => ch.id);
      await SupabaseClient
        .from('contents')
        .delete()
        .in('chapter_id', chapterIds);
    }

    // 5. Delete chapters
    await SupabaseClient
      .from('chapters')
      .delete()
      .eq('course_id', courseId);

    // 6. Remove thumbnail image from bucket
    const { data: courseData } = await SupabaseClient
      .from('courses')
      .select('thumbnail_url')
      .eq('id', courseId)
      .single();

    if (courseData?.thumbnail_url) {
      const urlParts = courseData.thumbnail_url.split('/lms-assets/');
      if (urlParts.length > 1) {
        await SupabaseClient.storage.from('lms-assets').remove([urlParts[1]]);
      }
    }
    // Add this cleanup step inside lmsService.ts -> deleteCourse()
const { error: certError } = await SupabaseClient
  .from('certificates')
  .delete()
  .eq('course_id', courseId);

if (certError) console.warn("Certificates cleanup warning:", certError);

    // 7. Finally delete the parent course record
    const { error: deleteError } = await SupabaseClient
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) throw deleteError;

  } catch (error) {
    console.error("Error in clean cascading delete operation:", error);
    throw error;
  }
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

  async addContentAsset(inputData: any) {
    const chapterId = inputData.chapterId;
    const title = inputData.title;
    const type = inputData.type;
    const payload = inputData.payload;
    const currentStatus = inputData.assetStatus || inputData.status || 'draft';

    const { data, error } = await SupabaseClient
      .from('contents')
      .insert([
        {
          chapter_id: chapterId,
          title: title,
          type: type,
          content_url: payload, 
          status: currentStatus
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  async fetchPendingAssets() {
    const { data, error } = await SupabaseClient
      .from('contents') 
      .select(`
        *,
        chapters (
          id,
          title,
          courses (
            id,
            title,
            thumbnail_url
          )
        )
      `) 
      .eq('status', 'pending');

    if (error) throw error;
    return data;
  },
  
  async updateContentAsset(assetId: string, updates: any) {
    const updatedStatus = updates.assetStatus || updates.status;

    const { data, error } = await SupabaseClient
      .from('contents')
      .update({
        title: updates.title,
        type: updates.type,
        content_url: updates.payload,
        status: updatedStatus 
      })
      .eq('id', assetId)
      .select();

    if (error) throw error;
    return data;
  },

  async fetchEmployeeEnrollments(employeeId: string) {
    const { data, error } = await SupabaseClient
      .from('course_enrollment')
      .select('*')
      .eq('employee_id', employeeId);

    if (error) throw error;
    return data?.map(item => item.course_id) ?? [];
  },

  async enrollEmployeeInCourse(employeeId: string, courseId: string) {
    const { data, error } = await SupabaseClient
      .from('course_enrollment')
      .insert([
        {
          employee_id: employeeId,
          course_id: courseId,
          progress_percentage: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContent(assetId: string, updates: any) {
    const { data, error } = await SupabaseClient
      .from('contents')
      .update({
        title: updates.title,
        type: updates.type,
        content_url: updates.payload,
        status: updates.status
      })
      .eq('id', assetId);

    if (error) throw error;
    return data;
  },

  async deleteContentAsset(assetId: string) {
    const { error } = await SupabaseClient
      .from('contents')
      .delete()
      .eq('id', assetId);
    if (error) throw error;
  },

  async deleteChapter(chapterId: string) {
    const { error } = await SupabaseClient
      .from('chapters')
      .delete()
      .eq('id', chapterId);
    if (error) throw error;
  },

  async updateChapter(chapterId: string, updates: { title: string }) {
    const { data, error } = await SupabaseClient
      .from('chapters')
      .update({ title: updates.title })
      .eq('id', chapterId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async publishCourseAndSubmitAllVideos(courseId: string): Promise<void> {
    try {
      const { data: chapters, error: chapterError } = await SupabaseClient
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);

      if (chapterError) throw chapterError;

      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(ch => ch.id);
        const { error: contentError } = await SupabaseClient
          .from('contents')
          .update({ status: 'pending' })
          .in('chapter_id', chapterIds)
          .eq('status', 'draft');

        if (contentError) throw contentError;
      }

      const { error: courseError } = await SupabaseClient
        .from('courses')
        .update({ 
          status: 'published', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', courseId);

      if (courseError) throw courseError;
    } catch (error) {
      console.error("Error in bulk publishing operation:", error);
      throw error;
    }
  }
};