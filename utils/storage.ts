
import { User, Course, Enrollment, ChatMessage } from '../types';
import { MOCK_USERS, MOCK_COURSES } from '../constants';
import { createClient } from '@supabase/supabase-js';

const USERS_KEY = 'akwaba_db_users_v4';
const COURSES_KEY = 'akwaba_db_courses_v4';
const ENROLLMENTS_KEY = 'akwaba_db_enrollments_v4';
const MESSAGES_KEY = 'akwaba_db_messages_v4';

// Initialisation de Supabase via les variables d'environnement
// Note: Dans un environnement Vite, on utilise import.meta.env
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const storage = {
  getUsers: (): User[] => {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : MOCK_USERS;
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('storage_update'));
    // Si supabase est configuré, on pourrait synchroniser ici (en asynchrone)
    if (supabase) {
      // Logique de sync optionnelle
    }
  },
  getCourses: (): Course[] => {
    const stored = localStorage.getItem(COURSES_KEY);
    return stored ? JSON.parse(stored) : MOCK_COURSES;
  },
  saveCourses: (courses: Course[]) => {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    window.dispatchEvent(new Event('storage_update'));
  },
  getEnrollments: (): Enrollment[] => {
    const stored = localStorage.getItem(ENROLLMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  saveEnrollments: (enrolls: Enrollment[]) => {
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrolls));
    window.dispatchEvent(new Event('storage_update'));
  },
  getMessages: (): ChatMessage[] => {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  saveMessages: (msgs: ChatMessage[]) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
    window.dispatchEvent(new Event('storage_update'));
  },
  getPosts: (): BlogPost[] => {
    const stored = localStorage.getItem(BLOG_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  savePosts: (posts: BlogPost[]) => {
    localStorage.setItem(BLOG_KEY, JSON.stringify(posts));
    window.dispatchEvent(new Event('storage_update'));
  },
  init: () => {
    if (!localStorage.getItem(USERS_KEY)) storage.saveUsers(MOCK_USERS);
    if (!localStorage.getItem(COURSES_KEY)) storage.saveCourses(MOCK_COURSES);
    if (!localStorage.getItem(ENROLLMENTS_KEY)) {
      const mockEnrolls: Enrollment[] = [
        { userId: 'u1', courseId: 'c1', enrolledAt: new Date().toISOString(), progress: 0 }
      ];
      storage.saveEnrollments(mockEnrolls);
    }
  }
};
