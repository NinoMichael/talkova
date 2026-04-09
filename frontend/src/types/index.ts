export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Career {
  id: string;
  title: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
}

export interface Internship {
  id: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  careers?: Career[];
  education?: Education[];
  internships?: Internship[];
  experiences?: Experience[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface Interview {
  id: string;
  userId: string;
  jobTitle: string;
  company?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  score?: number;
  feedback?: string;
  questions?: InterviewQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
}

export interface InterviewStats {
  totalInterviews: number;
  averageScore: number;
  totalQuestions: number;
  recentScores: {
    score: number;
    date: string;
    jobTitle: string;
  }[];
}