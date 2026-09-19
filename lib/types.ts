// Hand-written domain types matching supabase/schema.sql.
//
// For full type safety once your project is deployed, generate the real
// types from your live schema and replace the `Database = any` below:
//   npx supabase gen types typescript --project-id <your-project-ref> > lib/database.types.ts
// then `export type { Database } from './database.types';`
export type Database = any;

export type Visibility = 'public' | 'private' | 'unlisted';
export type SkillStatus = 'exploring' | 'learning' | 'comfortable' | 'advanced' | 'want_to_improve';
export type ProjectStatus = 'idea' | 'building' | 'live' | 'completed' | 'paused';
export type TaskPriority = 'low' | 'medium' | 'high';
export type Mood = 'great' | 'good' | 'okay' | 'low' | 'angry' | 'tired' | 'thoughtful' | 'grateful';
export type ReadStatus = 'want_to_read' | 'reading' | 'finished';
export type ChapterStatus = 'not_started' | 'in_progress' | 'completed';
export type RevisionStatus = 'none' | 'needs_revision' | 'revised';
export type ChapterDifficulty = 'easy' | 'medium' | 'hard';
export type ChapterStrength = 'weak' | 'average' | 'strong';
export type RevisionStage = 'revision_1' | 'revision_2' | 'revision_3' | 'final';

export interface Profile {
  id: string;
  owner_id: string;
  full_name: string;
  tagline: string;
  bio: string;
  what_i_like: string;
  philosophy: string;
  avatar_url: string | null;
  social_links: { label: string; url: string }[];
  closing_line: string;
  now_playing: string | null;
  favorite_artists: string[];
  favorite_songs: string[];
  music_visibility: Visibility;
  updated_at: string;
}

export interface NamedListItem {
  id: string;
  owner_id: string;
  label?: string;
  title?: string;
  value?: string;
  position: number;
  created_at: string;
}

export interface Skill {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string;
  status: SkillStatus;
  started_on: string | null;
  is_interest: boolean;
  visibility: Visibility;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string;
  cover_url: string | null;
  gallery: string[];
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  tools: string[];
  link: string | null;
  github_link: string | null;
  learned: string;
  challenges: string;
  outcome: string;
  is_featured: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface Moment {
  id: string;
  owner_id: string;
  photo_url: string | null;
  video_url: string | null;
  caption: string;
  occurred_on: string;
  location: string | null;
  people: string | null;
  category: string;
  is_featured: boolean;
  visibility: Visibility;
  created_at: string;
}

export interface Task {
  id: string;
  owner_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: TaskPriority;
  category: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_completed: boolean;
  completed_at: string | null;
  study_chapter_id: string | null;
  created_at: string;
}

export interface StudyGoal {
  id: string;
  owner_id: string;
  title: string;
  target_date: string;
  is_active: boolean;
  created_at: string;
}

export interface StudySubject {
  id: string;
  owner_id: string;
  goal_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface StudyChapter {
  id: string;
  owner_id: string;
  subject_id: string;
  name: string;
  position: number;
  difficulty: ChapterDifficulty;
  estimated_minutes: number;
  status: ChapterStatus;
  revision_status: RevisionStatus;
  strength: ChapterStrength;
  completed_at: string | null;
  created_at: string;
}

export interface StudyRevision {
  id: string;
  owner_id: string;
  chapter_id: string;
  stage: RevisionStage;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  owner_id: string;
  subject_id: string | null;
  chapter_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string;
  created_at: string;
}

export interface StudyTest {
  id: string;
  owner_id: string;
  subject_id: string;
  name: string;
  test_date: string;
  chapters_covered: string[];
  total_marks: number;
  marks_obtained: number | null;
  notes: string;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  owner_id: string;
  title: string;
  entry_date: string;
  content: string;
  mood: Mood | null;
  tags: string[];
  photos: string[];
  location: string | null;
  is_favorite: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  rating: number | null;
  date_read: string | null;
  notes: string;
  favorite_quote: string;
  status: ReadStatus;
  visibility: Visibility;
  created_at: string;
}

export interface Movie {
  id: string;
  owner_id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  rating: number | null;
  date_watched: string | null;
  review: string;
  is_favorite: boolean;
  genre: string | null;
  is_watchlist: boolean;
  visibility: Visibility;
  created_at: string;
}

export interface BucketListItem {
  id: string;
  owner_id: string;
  goal: string;
  category: string;
  description: string;
  priority: TaskPriority;
  deadline: string | null;
  is_completed: boolean;
  completed_on: string | null;
  photo_url: string | null;
  notes: string;
  visibility: Visibility;
  created_at: string;
}

export interface Bookmark {
  id: string;
  owner_id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  link: string | null;
  message: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
}
