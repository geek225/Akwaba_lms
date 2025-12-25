
import { User, Course, Enrollment, ChatMessage, BlogPost, AccessCode, UserRole, Module } from '../types';
import { MOCK_USERS, MOCK_COURSES } from '../constants';
import { createClient } from '@supabase/supabase-js';

const USERS_KEY = 'akwaba_db_users_v4';
const COURSES_KEY = 'akwaba_db_courses_v4';
const ENROLLMENTS_KEY = 'akwaba_db_enrollments_v4';
const MESSAGES_KEY = 'akwaba_db_messages_v4';
const BLOG_KEY = 'akwaba_db_blog_v4';
const ACCESS_CODES_KEY = 'akwaba_db_codes_v4';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const storage = {
  // --- USERS ---
  getUsers: (): User[] => {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : MOCK_USERS;
    } catch (e) {
      console.error("Erreur lecture users:", e);
      return MOCK_USERS;
    }
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('storage_update'));
    
    if (supabase) {
      users.forEach(async (u) => {
        try {
          const { error } = await supabase.from('users').upsert({
            id: u.id,
            email: u.email,
            name: u.name,
            first_name: u.firstName,
            role: u.role,
            avatar: u.avatar,
            phone: u.phone,
            country: u.country,
            city: u.city,
            bio: u.bio
          });
          if (error) console.error("Erreur sync user Supabase:", u.name, error);
        } catch (e) {
          console.error("Exception sync user Supabase:", e);
        }
      });
    }
  },

  // --- COURSES ---
  getCourses: (): Course[] => {
    try {
      const stored = localStorage.getItem(COURSES_KEY);
      return stored ? JSON.parse(stored) : MOCK_COURSES;
    } catch (e) {
      console.error("Erreur lecture courses:", e);
      return MOCK_COURSES;
    }
  },
  saveCourses: async (courses: Course[]) => {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    window.dispatchEvent(new Event('storage_update'));

    if (supabase) {
      for (const c of courses) {
        try {
            // 1. Upsert Course
            const { error: courseError } = await supabase.from('courses').upsert({
                id: c.id,
                title: c.title,
                instructor_name: c.instructor,
                instructor_id: c.instructorId,
                thumbnail: c.thumbnail,
                category: c.category,
                description: c.description,
                is_draft: c.isDraft,
                created_at: c.createdAt
            });
            if (courseError) console.error("Erreur sync course:", c.title, courseError);

            // 2. Sync Modules (Delete old, Insert new for simplicity)
            // Note: In production, smarter diffing is better, but this ensures consistency
            if (c.modules && c.modules.length > 0) {
                // We don't delete immediately to avoid FK issues if ID changes, 
                // but usually we should clear previous modules for this course
                await supabase.from('modules').delete().eq('course_id', c.id);
                
                const modulesToInsert = c.modules.map(m => ({
                    id: m.id,
                    course_id: c.id,
                    title: m.title,
                    video_url: m.videoUrl,
                    video_type: m.videoType,
                    description: m.description,
                    quiz: m.quiz // JSONB handles array automatically
                }));
                
                const { error: modError } = await supabase.from('modules').insert(modulesToInsert);
                if (modError) console.error("Erreur sync modules:", c.title, modError);
            }
        } catch (e) {
            console.error("Exception sync course:", e);
        }
      }
    }
  },

  // --- ENROLLMENTS ---
  getEnrollments: (): Enrollment[] => {
    try {
      const stored = localStorage.getItem(ENROLLMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erreur lecture enrollments:", e);
      return [];
    }
  },
  saveEnrollments: (enrolls: Enrollment[]) => {
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrolls));
    window.dispatchEvent(new Event('storage_update'));

    if (supabase) {
        enrolls.forEach(async (e) => {
            const { error } = await supabase.from('enrollments').upsert({
                user_id: e.userId,
                course_id: e.courseId,
                enrolled_at: e.enrolledAt,
                progress: e.progress
            });
            if (error) console.error("Erreur sync enrollment:", error);
        });
    }
  },

  // --- MESSAGES ---
  getMessages: (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erreur lecture messages:", e);
      return [];
    }
  },
  saveMessages: (msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
      window.dispatchEvent(new Event('storage_update'));
      // Note: Realtime messages are handled separately in ChatWindow usually, 
      // but if we want to persist history here:
      // In a real app, messages are append-only to DB.
    } catch (e) {
      console.error("Erreur sauvegarde messages:", e);
    }
  },

  // --- BLOG ---
  getPosts: (): BlogPost[] => {
    const stored = localStorage.getItem(BLOG_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  savePosts: (posts: BlogPost[]) => {
    localStorage.setItem(BLOG_KEY, JSON.stringify(posts));
    window.dispatchEvent(new Event('storage_update'));

    if (supabase) {
        posts.forEach(async (p) => {
            const { error } = await supabase.from('blog_posts').upsert({
                id: p.id,
                title: p.title,
                excerpt: p.excerpt,
                content: p.content,
                author_id: p.authorId,
                author_name: p.authorName,
                cover_image: p.coverImage,
                is_published: p.isPublished,
                created_at: p.createdAt
            });
            if (error) console.error("Erreur sync blog:", error);
        });
    }
  },

  // --- ACCESS CODES ---
  getAccessCodes: (): AccessCode[] => {
    const stored = localStorage.getItem(ACCESS_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  saveAccessCodes: (codes: AccessCode[]) => {
    localStorage.setItem(ACCESS_CODES_KEY, JSON.stringify(codes));
    window.dispatchEvent(new Event('storage_update'));
    
    if (supabase) {
        codes.forEach(async (c) => {
            const { error } = await supabase.from('access_codes').upsert({
                code: c.code,
                role: c.role,
                is_used: c.isUsed,
                generated_by: c.generatedBy,
                created_at: c.createdAt
            });
            if (error) console.error("Erreur sync code:", error);
        });
    }
  },
  generateAccessCode: (role: UserRole, adminId: string): AccessCode => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = role === UserRole.ADMIN ? 'ADM-' : (role === UserRole.INSTRUCTOR ? 'INS-' : 'EDT-');
    code = prefix + code;

    const newCode: AccessCode = {
        code,
        role,
        isUsed: false,
        generatedBy: adminId,
        createdAt: new Date().toISOString()
    };

    const codes = storage.getAccessCodes();
    storage.saveAccessCodes([...codes, newCode]);
    return newCode;
  },
  validateAndUseCode: (code: string): UserRole | null => {
    const codes = storage.getAccessCodes();
    const foundIndex = codes.findIndex(c => c.code === code && !c.isUsed);
    
    if (foundIndex !== -1) {
        const updatedCodes = [...codes];
        updatedCodes[foundIndex].isUsed = true;
        storage.saveAccessCodes(updatedCodes);
        return updatedCodes[foundIndex].role;
    }
    return null;
  },

  // --- INITIALIZATION & SYNC ---
  init: async () => {
    // 1. Load defaults if empty
    if (!localStorage.getItem(COURSES_KEY)) storage.saveCourses(MOCK_COURSES);
    if (!localStorage.getItem(ENROLLMENTS_KEY)) {
      const mockEnrolls: Enrollment[] = [
        { userId: 'u1', courseId: 'c1', enrolledAt: new Date().toISOString(), progress: 0 }
      ];
      storage.saveEnrollments(mockEnrolls);
    }

    // 2. SYNC FROM SUPABASE
    if (supabase) {
        console.log("Starting Supabase Sync...");
        
        // A. Users
        const { data: users } = await supabase.from('users').select('*');
        if (users && users.length > 0) {
            const mappedUsers: User[] = users.map((u: any) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                firstName: u.first_name,
                role: u.role as UserRole,
                avatar: u.avatar,
                phone: u.phone,
                country: u.country,
                city: u.city,
                bio: u.bio,
                createdAt: u.created_at
            }));
            localStorage.setItem(USERS_KEY, JSON.stringify(mappedUsers));
        } else {
            // Push local to remote if remote is empty
            const local = storage.getUsers();
            if (local.length > 0) storage.saveUsers(local);
        }

        // B. Courses
        const { data: courses } = await supabase.from('courses').select('*, modules(*)');
        if (courses && courses.length > 0) {
            const mappedCourses: Course[] = courses.map((c: any) => ({
                id: c.id,
                title: c.title,
                instructor: c.instructor_name,
                instructorId: c.instructor_id,
                thumbnail: c.thumbnail,
                category: c.category,
                description: c.description,
                isDraft: c.is_draft,
                createdAt: c.created_at,
                modules: c.modules.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    videoUrl: m.video_url,
                    videoType: m.video_type,
                    description: m.description,
                    quiz: m.quiz
                }))
            }));
            localStorage.setItem(COURSES_KEY, JSON.stringify(mappedCourses));
        } else {
            const local = storage.getCourses();
            if (local.length > 0) storage.saveCourses(local);
        }

        // C. Enrollments
        const { data: enrolls } = await supabase.from('enrollments').select('*');
        if (enrolls && enrolls.length > 0) {
            const mappedEnrolls: Enrollment[] = enrolls.map((e: any) => ({
                userId: e.user_id,
                courseId: e.course_id,
                enrolledAt: e.enrolled_at,
                progress: e.progress
            }));
            localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(mappedEnrolls));
        } else {
            const local = storage.getEnrollments();
            if (local.length > 0) storage.saveEnrollments(local);
        }

        // D. Blog Posts
        const { data: posts } = await supabase.from('blog_posts').select('*');
        if (posts && posts.length > 0) {
            const mappedPosts: BlogPost[] = posts.map((p: any) => ({
                id: p.id,
                title: p.title,
                excerpt: p.excerpt,
                content: p.content,
                authorId: p.author_id,
                authorName: p.author_name,
                coverImage: p.cover_image,
                isPublished: p.is_published,
                createdAt: p.created_at
            }));
            localStorage.setItem(BLOG_KEY, JSON.stringify(mappedPosts));
        }

        // E. Access Codes
        const { data: codes } = await supabase.from('access_codes').select('*');
        if (codes && codes.length > 0) {
            const mappedCodes: AccessCode[] = codes.map((c: any) => ({
                code: c.code,
                role: c.role as UserRole,
                isUsed: c.is_used,
                generatedBy: c.generated_by,
                createdAt: c.created_at
            }));
            localStorage.setItem(ACCESS_CODES_KEY, JSON.stringify(mappedCodes));
        }

        window.dispatchEvent(new Event('storage_update'));
        console.log("Supabase Sync Complete.");
    }
  }
};
