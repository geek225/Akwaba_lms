
import { User, Course, Enrollment, ChatMessage, BlogPost, AccessCode, UserRole } from '../types';
import { MOCK_USERS, MOCK_COURSES } from '../constants';
import { createClient } from '@supabase/supabase-js';

const USERS_KEY = 'akwaba_db_users_v4';
const COURSES_KEY = 'akwaba_db_courses_v4';
const ENROLLMENTS_KEY = 'akwaba_db_enrollments_v4';
const MESSAGES_KEY = 'akwaba_db_messages_v4';
const BLOG_KEY = 'akwaba_db_blog_v4';
const ACCESS_CODES_KEY = 'akwaba_db_codes_v4';

// Initialisation de Supabase via les variables d'environnement
// Note: Dans un environnement Vite, on utilise import.meta.env
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const storage = {
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
    
    // Synchronisation vers Supabase pour que le Chat fonctionne avec tous les utilisateurs
    if (supabase) {
      users.forEach(async (u) => {
        try {
          const { error } = await supabase.from('users').upsert({
            id: u.id,
            email: u.email,
            name: u.name,
            first_name: u.firstName,
            role: u.role,
            avatar: u.avatar
          });
          if (error) console.error("Erreur sync user Supabase:", u.name, error);
        } catch (e) {
          console.error("Exception sync user Supabase:", e);
        }
      });
    }
  },
  getCourses: (): Course[] => {
    try {
      const stored = localStorage.getItem(COURSES_KEY);
      return stored ? JSON.parse(stored) : MOCK_COURSES;
    } catch (e) {
      console.error("Erreur lecture courses:", e);
      return MOCK_COURSES;
    }
  },
  saveCourses: (courses: Course[]) => {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    window.dispatchEvent(new Event('storage_update'));
  },
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
  },
  getMessages: (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erreur lecture messages (localStorage corrompu ?):", e);
      // En cas d'erreur (JSON invalide), on retourne un tableau vide pour ne pas crasher l'app
      return [];
    }
  },
  saveMessages: (msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
      window.dispatchEvent(new Event('storage_update'));
    } catch (e) {
      console.error("Erreur sauvegarde messages (Quota dépassé ?):", e);
      // Optionnel : Notifier l'utilisateur ou tenter de nettoyer les vieux messages
    }
  },
  getPosts: (): BlogPost[] => {
    const stored = localStorage.getItem(BLOG_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  savePosts: (posts: BlogPost[]) => {
    localStorage.setItem(BLOG_KEY, JSON.stringify(posts));
    window.dispatchEvent(new Event('storage_update'));
  },
  getAccessCodes: (): AccessCode[] => {
    const stored = localStorage.getItem(ACCESS_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  saveAccessCodes: (codes: AccessCode[]) => {
    localStorage.setItem(ACCESS_CODES_KEY, JSON.stringify(codes));
    window.dispatchEvent(new Event('storage_update'));
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
  init: () => {
    // Nettoyage des données de démonstration si elles existent encore
    const currentUsers = storage.getUsers();
    const realUsers = currentUsers.filter(u => !MOCK_USERS.some(m => m.id === u.id));
    if (realUsers.length !== currentUsers.length) {
       storage.saveUsers(realUsers);
    }

    // On ne charge plus les mocks par défaut
    // if (!localStorage.getItem(USERS_KEY)) storage.saveUsers(MOCK_USERS);
    
    if (!localStorage.getItem(COURSES_KEY)) storage.saveCourses(MOCK_COURSES);
    if (!localStorage.getItem(ENROLLMENTS_KEY)) {
      const mockEnrolls: Enrollment[] = [
        { userId: 'u1', courseId: 'c1', enrolledAt: new Date().toISOString(), progress: 0 }
      ];
      storage.saveEnrollments(mockEnrolls);
    }

    // Force la synchronisation des utilisateurs vers Supabase au démarrage
    if (supabase) {
      const current = storage.getUsers();
      if (current.length > 0) {
        storage.saveUsers(current);
      }
    }
  }
};
