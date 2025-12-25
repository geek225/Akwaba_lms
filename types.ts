
export enum UserRole {
  STUDENT = 'Étudiant',
  INSTRUCTOR = 'Formateur',
  EDITOR = 'Éditeur',
  ADMIN = 'Administrateur'
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  createdAt: string;
}

export interface Enrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // 0 to 100
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string; // 'all_students', 'all_instructors', 'global' or specific userId
  text: string;
  fileName?: string;
  fileData?: string; // base64
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Module {
  id: string;
  title: string;
  videoUrl: string;
  videoType: 'file' | 'url';
  description: string;
  quiz?: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorId: string;
  thumbnail: string;
  category: string;
  description: string;
  modules: Module[];
  isDraft: boolean;
  createdAt: string;
}
