export type CompanyStatus = "active" | "ipo" | "acquired" | "closed";

export type MilestoneEventType =
  | "funding"
  | "ipo"
  | "acquisition"
  | "launch"
  | "expansion"
  | "award"
  | "eo_appearance"
  | "other";

export interface Person {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  role: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
  appearances?: Appearance[];
  milestones?: Milestone[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  status: CompanyStatus;
  founded_year: number | null;
}

export interface Appearance {
  id: string;
  person_id: string;
  video_id: string;
  title: string;
  published_at: string;
  thumbnail_url: string | null;
}

export interface Milestone {
  id: string;
  person_id: string;
  company_id: string | null;
  event_type: MilestoneEventType;
  description: string;
  date: string;
  source_url: string | null;
  confidence: number;
}

export type NewsCategory =
  | "funding"
  | "acquisition"
  | "ipo"
  | "launch"
  | "award"
  | "hire"
  | "other";

export interface NewsItem {
  id: string;
  person_id: string | null;
  company_id: string | null;
  category: NewsCategory;
  headline: string;
  summary: string | null;
  source_url: string;
  source_domain: string | null;
  published_at: string | null;
  discovered_at: string;
  confidence: number;
  og_image_url: string | null;
  story_id: string | null;
  // Joined
  person_name?: string;
  person_slug?: string;
  person_photo?: string | null;
  company_name?: string;
  appearance_thumbnail?: string | null;
}

export interface PeopleFilters {
  status?: CompanyStatus;
  search?: string;
  sort?: "recent" | "name";
  cursor?: string;
  limit?: number;
}
