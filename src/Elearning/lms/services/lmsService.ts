import { uploadFileToSupabase } from '../utils/lmsShared';
import { SupabaseClient } from '../../../Helper/Supabase'; 
import type { Course, CourseStatus, CreateCourseInput } from '../types/lms';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export const lmsService = {

  //  NEW: YouTube API v3 Playlist Fetcher Method
  async fetchVideosFromPlaylist(playlistUrl: string) {
    try {
      // 1. URL se Playlist ID nikalna
      const regExp = /[&?]list=([^&]+)/;
      const match = playlistUrl.match(regExp);
      if (!match || !match[1]) {
        throw new Error("Invalid YouTube Playlist URL");
      }
      const playlistId = match[1];

      // 2. YouTube API ko hit karna saari videos ke liye
      const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // 3. Data ko map karna humare table format ke mutabik
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

async fetchCourses(filter?: string) {
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
    
  //   const { data, error } = await query.order('created_at', { ascending: false });
  //   if (error) throw error;
  //   return data as Course[];
  // },

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

  //  Single clean createCourse method using shared storage helper
  async createCourse(input: CreateCourseInput, userId: string): Promise<Course> {
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
          created_by: userId, // Matching your DB column identity schema
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
    try {
      // 1. Pehle course ka thumbnail URL nikalen taaki storage se image delete ho sake
      const { data: courseData } = await SupabaseClient
        .from('courses')
        .select('thumbnail_url')
        .eq('id', courseId)
        .single();

      if (courseData?.thumbnail_url) {
        const urlParts = courseData.thumbnail_url.split('/lms-assets/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          // Storage se file saaf karein
          await SupabaseClient.storage.from('lms-assets').remove([filePath]);
        }
      }

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

// 🔄 1. Add Content Asset Method (Fixed Deprecation & Supports Frontend Keys)
  async addContentAsset(inputData: any) {
    // Frontend se chahe 'status' aaye ya 'assetStatus', dono ko handle karega safely
    const chapterId = inputData.chapterId;
    const title = inputData.title;
    const type = inputData.type;
    const payload = inputData.payload;
    const currentStatus = inputData.assetStatus || inputData.status || 'draft';

    console.log("📥 lmsService received content status to save:", currentStatus);

    const { data, error } = await SupabaseClient
      .from('contents')
      .insert([
        {
          chapter_id: chapterId,
          title: title,
          type: type,
          content_url: payload, 
          status: currentStatus // 🔥 Database ke 'status' column me secure value save hogi
        }
      ])
      .select();

    if (error) {
      console.error("❌ Error inside addContentAsset:", error);
      throw error;
    }
    return data;
  },

  // 🛡️ 2. Fetch Pending Assets for Admin (Fixed window.status error)
  async fetchPendingAssets() {
    console.log(" Fetching all pending verification assets from DB...");
    
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

    if (error) {
      console.error("Error fetching pending assets:", error);
      throw error;
    }

    // Safely logging fetched data instead of naked 'status' keyword
    console.log(` Successfully fetched ${data?.length || 0} pending assets for admin desk.`);
    return data;
  },
  
 async updateContentAsset(assetId: string, updates: any) {
    const updatedStatus = updates.assetStatus || updates.status;

    console.log(` Supabase executing update for ID (${assetId}) with status:`, updatedStatus);

    const { data, error } = await SupabaseClient
      .from('contents')
      .update({
        title: updates.title,
        type: updates.type,
        content_url: updates.payload,
        status: updatedStatus 
      })
      .eq('id', assetId)
      .select(); //  YEH ZAROORI HAI! Iske bina Supabase updated data return nahi karta.

    if (error) {
      console.error(" Supabase Update Error:", error);
      throw error;
    }

    //  BREAKPOINT LOG: Check karenge database ne sach me badla ya nahi
    console.log("Database ka live return data:", data);

    if (!data || data.length === 0) {
      console.warn(" WARNING: Database me 0 rows update hui! Id nahi mili ya RLS ne block kiya.");
    } else {
      console.log(" Successfully updated in DB row:", data[0]);
    }

    return data;
  },
  
async updateContent(assetId: string, updates: any) {
    const { data, error } = await SupabaseClient
      .from('contents')
      .update({
        title: updates.title,
        type: updates.type,
        content_url: updates.payload,
        status: updates.status //  Admin approve karega toh 'published' ho jayega
      })
      .eq('id', assetId);

    if (error) throw error;
    return data;
  },

  // 🗑️ Chapter aur Assets ke Delete functions bhi database connection ke liye add karein
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

  async publishCourseAndSubmitAllVideos(courseId: string): Promise<void> {
    try {
      console.log(` Bulk processing started for Course ID: ${courseId}`);

      // 1. Pehle is Course ke saare Chapters ki IDs nikalenge
      const { data: chapters, error: chapterError } = await SupabaseClient
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);

      if (chapterError) throw chapterError;

      // 2. Agar course mein chapters hain, toh unki saari DRAFT videos ko PENDING karenge
      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(ch => ch.id);
        
        console.log(` Found ${chapterIds.length} chapters. Updating internal draft videos...`);

        const { data: updatedVideos, error: contentError } = await SupabaseClient
          .from('contents')
          .update({ status: 'pending' })
          .in('chapter_id', chapterIds) // Un saare chapters ke andar
          .eq('status', 'draft')         // Sirf un videos ko jo abhi draft hain
          .select();

        if (contentError) throw contentError;
        console.log(` Successfully moved ${updatedVideos?.length || 0} videos to 'pending' for Admin review.`);
      }

      // 3. Last mein, Course ka status khud 'published' (ya 'pending') set karenge
      const { error: courseError } = await SupabaseClient
        .from('courses')
        .update({ 
          status: 'published', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', courseId);

      if (courseError) throw courseError;
      console.log(" Course and all internal assets synchronized successfully!");

    } catch (error) {
      console.error(" Error in bulk publishing operation:", error);
      throw error;
    }
  }
};