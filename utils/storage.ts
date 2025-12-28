
import { User, Course, Enrollment, ChatMessage, BlogPost, AccessCode, UserRole, Module } from '../types';
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
      const users: User[] = stored ? JSON.parse(stored) : [];
      // HARD FILTER: Never return demo users even if they exist in storage
      return users.filter(u => !['u1', 'u2', 'u3', 'u4'].includes(u.id));
    } catch (e) {
      console.error("Erreur lecture users:", e);
      return [];
    }
  },
  saveUsers: (users: User[]) => {
    // Ensure we NEVER save demo users back to storage
    const cleanUsers = users.filter(u => !['u1', 'u2', 'u3', 'u4'].includes(u.id));
    localStorage.setItem(USERS_KEY, JSON.stringify(cleanUsers));
    window.dispatchEvent(new Event('storage_update'));
    
    if (supabase) {
      cleanUsers.forEach(async (u) => {
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
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erreur lecture courses:", e);
      return [];
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
        // On s'assure d'abord que les utilisateurs existent avant d'envoyer les inscriptions
        // pour éviter l'erreur FK (23503)
        const currentUsers = storage.getUsers();
        storage.saveUsers(currentUsers); 

        // Petite pause pour laisser le temps à saveUsers de finir (simple hack, idéalement async/await complet)
        setTimeout(() => {
            enrolls.forEach(async (e) => {
                // Skip deleted/mock courses to avoid FK constraint errors
                if (['c1', 'c2', 'c3', 'c4', 'c5'].includes(e.courseId)) return;

                try {
                    const { error } = await supabase.from('enrollments').upsert({
                        user_id: e.userId,
                        course_id: e.courseId,
                        enrolled_at: e.enrolledAt,
                        progress: e.progress
                    });
                    if (error) {
                         // Ignore FK error if course was deleted remotely but still in local storage enrollments
                         if (error.code !== '23503') console.error("Erreur sync enrollment:", error);
                    }
                } catch (err) {
                    console.error("Exception sync enrollment:", err);
                }
            });
        }, 1000);
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
      if (supabase) {
        msgs.forEach(async (m) => {
          // Skip syncing temporary messages (optimistic UI) or invalid UUIDs
          if (m.id.startsWith('m-')) return;
          
          try {
            const { error } = await supabase.from('messages').upsert({
              id: m.id,
              from_id: m.fromId,
              to_id: m.toId,
              text: m.text,
              created_at: m.createdAt,
              read: m.read || false,
              file_name: m.fileName,
              file_data: m.fileData,
              file_type: m.fileType,
              file_size: m.fileSize
            });
            if (error) console.error("Erreur sync message:", error);
          } catch (e) {
            console.error("Exception sync message:", e);
          }
        });
      }
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
  validateCode: async (code: string): Promise<UserRole | null> => {
    // 1. Check local
    const localCodes = storage.getAccessCodes();
    const localCode = localCodes.find(c => c.code === code);
    
    if (localCode) {
        if (!localCode.isUsed) return localCode.role;
        // If local says used, verify with server in case of sync error? 
        // No, safer to assume used.
        return null; 
    }

    // 2. Check Supabase (if not found locally)
    if (supabase) {
        const { data, error } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', code)
            .single();
        
        if (data && !data.is_used) {
             // Cache it locally for future reference
             const newCode: AccessCode = {
                code: data.code,
                role: data.role as UserRole,
                isUsed: data.is_used,
                generatedBy: data.generated_by,
                createdAt: data.created_at
            };
            // Merge carefully
            const current = storage.getAccessCodes();
            if (!current.find(c => c.code === newCode.code)) {
                storage.saveAccessCodes([...current, newCode]);
            }
            return data.role as UserRole;
        }
    }
    return null;
  },

  markCodeAsUsed: async (code: string) => {
      // 1. Update Local
      const codes = storage.getAccessCodes();
      const updated = codes.map(c => c.code === code ? { ...c, isUsed: true } : c);
      
      // If code wasn't local (fetched from Supabase during validate), we need to add it marked as used
      if (!codes.find(c => c.code === code)) {
          // We can't easily reconstruct the whole object without fetching again, 
          // but we know it's used.
          // Let's rely on the fact validateCode added it to cache, 
          // OR we fetch it again?
          // Actually validateCode added it to cache above.
      } else {
          storage.saveAccessCodes(updated);
      }

      // 2. Update Supabase
      if (supabase) {
        const { error } = await supabase
            .from('access_codes')
            .update({ is_used: true })
            .eq('code', code);
        if (error) console.error("Erreur update code used:", error);
      }
  },

  deleteAccessCode: async (code: string) => {
    // 1. Delete Local
    const codes = storage.getAccessCodes();
    const updated = codes.filter(c => c.code !== code);
    storage.saveAccessCodes(updated);

    // 2. Delete Supabase
    if (supabase) {
        const { error } = await supabase.from('access_codes').delete().eq('code', code);
        if (error) console.error("Error deleting access code:", error);
    }
  },

  // --- SYNC ---
  init: async () => {
    // 1. Load defaults if empty
    if (!localStorage.getItem(COURSES_KEY)) storage.saveCourses([]);
    
    // CLEANUP: Remove MOCK_COURSES if they exist (ids c1-c5) to fix "demo courses" issue
    try {
        const currentCourses = storage.getCourses();
        const mockIds = ['c1', 'c2', 'c3', 'c4', 'c5'];
        const hasMocks = currentCourses.some(c => mockIds.includes(c.id));
        if (hasMocks) {
            console.log("Cleaning up mock courses...");
            const cleanCourses = currentCourses.filter(c => !mockIds.includes(c.id));
            storage.saveCourses(cleanCourses);
        }
    } catch (e) {
        console.error("Error cleaning mock courses:", e);
    }

    // CLEANUP: Remove MOCK_USERS (u1-u4) and their messages
    try {
        const currentUsers = storage.getUsers();
        const mockUserIds = ['u1', 'u2', 'u3', 'u4'];
        const hasMockUsers = currentUsers.some(u => mockUserIds.includes(u.id));
        
        if (hasMockUsers) {
            console.log("Cleaning up mock users...");
            const cleanUsers = currentUsers.filter(u => !mockUserIds.includes(u.id));
            storage.saveUsers(cleanUsers);

            // Clean associated messages
            const currentMessages = storage.getMessages();
            const cleanMessages = currentMessages.filter(m => 
                !mockUserIds.includes(m.fromId) && !mockUserIds.includes(m.toId)
            );
            if (cleanMessages.length !== currentMessages.length) {
                storage.saveMessages(cleanMessages);
            }
        }
    } catch (e) {
        console.error("Error cleaning mock users:", e);
    }

    // CLEANUP: Scan for broken image URLs (e.g., Pixabay webpage links instead of images)
    try {
        const posts = storage.getPosts();
        let postsChanged = false;
        const cleanPosts = posts.map(p => {
            if (p.coverImage && p.coverImage.includes('pixabay.com/photos/')) {
                // Replace webpage URL with a safe placeholder
                postsChanged = true;
                return { ...p, coverImage: 'https://placehold.co/800x600/4CAF50/FFFFFF?text=Akwaba+Blog' };
            }
            return p;
        });
        if (postsChanged) {
             console.log("Fixed broken blog image URLs");
             storage.savePosts(cleanPosts);
        }

        const courses = storage.getCourses();
        let coursesChanged = false;
        const cleanCourses = courses.map(c => {
            if (c.thumbnail && c.thumbnail.includes('pixabay.com/photos/')) {
                 coursesChanged = true;
                 return { ...c, thumbnail: 'https://placehold.co/800x600/FF8800/FFFFFF?text=Akwaba+Course' };
            }
            return c;
        });
        if (coursesChanged) {
            console.log("Fixed broken course image URLs");
            storage.saveCourses(cleanCourses);
        }
    } catch (e) {
        console.error("Error cleaning image URLs:", e);
    }

    if (!localStorage.getItem(ENROLLMENTS_KEY)) {
      storage.saveEnrollments([]);
    }

    // 2. SYNC FROM SUPABASE
    if (supabase) {
        console.log("Starting Supabase Sync...");
        
        // A. Users (MUST BE FIRST to avoid FK errors)
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
            if (local.length > 0) storage.saveUsers(local); // This creates users in DB
        }

        // B. Courses (MUST BE SECOND)
        const { data: courses } = await supabase.from('courses').select('*, modules(*)');
        if (courses && courses.length > 0) {
             // ... mapping code ...
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
            if (local.length > 0) await storage.saveCourses(local); // Await critical here
        }

        // C. Enrollments (Depends on Users AND Courses)
        // Wait a bit to ensure Users/Courses are processed if we just pushed them
        setTimeout(async () => {
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
        }, 2000); // 2s delay for enrollments sync

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
