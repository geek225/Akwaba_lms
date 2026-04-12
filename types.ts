
export enum UserRole {
  STUDENT = 'Étudiant',
  INSTRUCTOR = 'Formateur',
  EDITOR = 'Éditeur',
  ADMIN = 'Administrateur'
}

export interface AccessCode {
  code: string;
  role: UserRole;
  isUsed: boolean;
  generatedBy: string; // Admin ID
  createdAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  studentIds: string[];
  courseIds: string[];
  createdBy: string; // User ID (Admin/Instructor)
  createdAt: string;
}

export interface User {
  id: string;
  studentId?: string; // Unique Identifier (Matricule) for Login
  name: string;
  firstName: string;
  email: string;
  role: UserRole;
  isValidated?: boolean;
  avatar: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  coverImage: string;
  createdAt: string;
  isPublished: boolean;
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
  read?: boolean;
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
