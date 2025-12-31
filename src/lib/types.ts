export type Page = 'welcome' | 'onboarding' | 'explore' | 'space-detail' | 'create-space' | 'profile' | 'admin' | 'edit-profile';

export interface User {
  id?: string;
  fullName: string;
  location: string;
  bio: string;
  email?: string;
  avatar?: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  members: number;
  rating: number;
  creator: string;
  isPrivate: boolean;
  color: string;
}

