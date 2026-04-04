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
  current_role: string | null;
  current_company_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  company?: Company;
  appearances?: Appearance[];
  milestones?: Milestone[];
  appearance_count?: number;
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

export interface StatsCache {
  id: string;
  key: string;
  value: number;
  updated_at: string;
}

export interface PeopleFilters {
  status?: CompanyStatus;
  industry?: string;
  year?: number;
  search?: string;
  sort?: "recent" | "funding" | "name";
  cursor?: string;
  limit?: number;
}
