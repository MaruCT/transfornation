export interface Reward {
  title: string;
  pledgeAmount: number;
  description: string;
  isFoundersPass?: boolean;
}

export interface User {
    id: string;
    name: string;
    avatar: string;
}

export interface Pledge {
    projectId: string;
    projectTitle: string;
    projectImageUrl: string;
    amount: number;
    rewardTitle: string;
}

export interface Comment {
  author: string;
  avatar: string;
  text: string;
  date: string;
  type: 'user' | 'ai_suggestion';
}

export interface RoadmapStep {
    milestone: string;
    description: string;
    status: 'completed' | 'in_progress' | 'planned';
}

export interface AnalysisResult {
    score: number;
    suggestions: string[];
}

export interface Backer {
    name: string;
    avatar: string;
    level: 'Bronze' | 'Silver' | 'Gold';
    badges: string[];
    isFounder: boolean;
    foundersPassImage?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'website';
  url: string;
}

export interface Project {
  id: string;
  slug?: string;
  creatorId: string;
  title: string;
  creator: string;
  creatorBio: string;
  creatorAvatar: string;
  tagline: string;
  description: string;
  problems?: string; // What problems the project solves (HTML)
  category: string;
  imageUrl: string; // Primary image for cards
  media: MediaItem[]; // Gallery for detail page
  isFeatured?: boolean;
  team: TeamMember[];
  socialLinks: SocialLink[];
  videoGenerationState: 'none' | 'generating' | 'done';
  goal: number;
  pledged: number;
  backers: number;
  fundingVelocity: 'trending_up' | 'stable' | 'slowing';
  faq: {
    question: string;
    answer: string;
  }[];
  rewards: Reward[];
  comments: Comment[];
  commentSummary: {
      sentiment: string;
      summary: string;
  };
  roadmap: RoadmapStep[];
  analysis?: AnalysisResult;
  backersList: Backer[];
  favoritedBy: string[];
  city: string;
  country: string; // e.g., "US", "JP"
  anticipationScore: number; // 0-100
  impactScore: number; // 0-100
  efficiencyScore: number; // 0-100
  // Translation support
  translations?: {
    [language: string]: {
      title: string;
      tagline: string;
      description: string;
      problems?: string;
      creatorBio: string;
      faq: { question: string; answer: string; }[];
      rewards: { title: string; description: string; }[];
    };
  };
  isTranslating?: boolean; // Loading state for translation
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    imageUrl: string;
}

export interface Speaker {
    name: string;
    title: string;
    avatar: string;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    imageUrl: string;
    description: string;
    speakers: Speaker[];
}

export enum View {
  Landing = 'LANDING',
  Home = 'HOME',
  ProjectDetail = 'PROJECT_DETAIL',
  EventDetail = 'EVENT_DETAIL',
  CreateProject = 'CREATE_PROJECT',
  Profile = 'PROFILE',
  Contest = 'CONTEST',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  project?: Project;
}