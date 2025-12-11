
export interface UserState {
  points: number;
  name: string;
  avatar: string;
  // Extended Profile Fields
  idCard?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  gender?: string;
  age?: string;
  location?: string;
  status?: string;
  // Preferences
  showAchievement?: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  likes: number;
  tags: string[];
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum PrepTab {
  QUESTIONS = 'questions',
  MOCK_INTERVIEW = 'mock_interview',
  SELF_INTRO = 'self_intro',
}

export interface InterviewConfig {
  company: string;
  role: string;
  jd: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  summary: string;
  experiences: Experience[];
  skills: string;
}

export interface CareerAdvice {
  recommendedRole: string;
  industryFit: string;
  strengths: string[];
  improvementAreas: string[];
  rationale: string;
}