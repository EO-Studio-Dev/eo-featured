import { PersonGrid } from "./person-grid";
import type { CompanyStatus } from "@/types/supabase";

// Mock data for development
const mockPeople = [
  {
    id: "1",
    name: "이승건",
    slug: "lee-seunggun-a1b2",
    photo_url: null,
    current_role: "대표이사",
    current_company_id: "1",
    created_at: "2024-01-01",
    updated_at: "2026-04-01",
    company: {
      id: "1",
      name: "비바리퍼블리카 (토스)",
      slug: "toss",
      industry: "핀테크",
      status: "active" as CompanyStatus,
      founded_year: 2013,
    },
    appearances: [{ count: 5 }],
  },
  {
    id: "2",
    name: "김슬아",
    slug: "kim-seula-c3d4",
    photo_url: null,
    current_role: "대표이사",
    current_company_id: "2",
    created_at: "2024-02-01",
    updated_at: "2026-03-28",
    company: {
      id: "2",
      name: "컬리",
      slug: "kurly",
      industry: "이커머스",
      status: "ipo" as CompanyStatus,
      founded_year: 2015,
    },
    appearances: [{ count: 3 }],
  },
  {
    id: "3",
    name: "김봉진",
    slug: "kim-bongjin-e5f6",
    photo_url: null,
    current_role: "의장",
    current_company_id: "3",
    created_at: "2024-03-01",
    updated_at: "2026-03-25",
    company: {
      id: "3",
      name: "우아한형제들 (배달의민족)",
      slug: "woowa",
      industry: "푸드테크",
      status: "acquired" as CompanyStatus,
      founded_year: 2011,
    },
    appearances: [{ count: 4 }],
  },
  {
    id: "4",
    name: "이택경",
    slug: "lee-taekkyung-g7h8",
    photo_url: null,
    current_role: "대표",
    current_company_id: "4",
    created_at: "2024-04-01",
    updated_at: "2026-03-20",
    company: {
      id: "4",
      name: "매쉬업엔젤스",
      slug: "mashup-angels",
      industry: "벤처캐피탈",
      status: "active" as CompanyStatus,
      founded_year: 2014,
    },
    appearances: [{ count: 2 }],
  },
  {
    id: "5",
    name: "정세영",
    slug: "jung-seyoung-i9j0",
    photo_url: null,
    current_role: "CTO",
    current_company_id: "5",
    created_at: "2024-05-01",
    updated_at: "2026-03-18",
    company: {
      id: "5",
      name: "당근",
      slug: "daangn",
      industry: "하이퍼로컬",
      status: "active" as CompanyStatus,
      founded_year: 2015,
    },
    appearances: [{ count: 3 }],
  },
  {
    id: "6",
    name: "하형석",
    slug: "ha-hyungseok-k1l2",
    photo_url: null,
    current_role: "CEO",
    current_company_id: "6",
    created_at: "2024-06-01",
    updated_at: "2026-03-15",
    company: {
      id: "6",
      name: "직방",
      slug: "zigbang",
      industry: "프롭테크",
      status: "active" as CompanyStatus,
      founded_year: 2012,
    },
    appearances: [{ count: 2 }],
  },
];

interface PeopleSectionProps {
  status?: CompanyStatus;
  search?: string;
  sort?: "recent" | "name";
}

export function PeopleSection({ status, search, sort = "recent" }: PeopleSectionProps) {
  let filtered = mockPeople;

  if (status) {
    filtered = filtered.filter((p) => p.company?.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.company?.name ?? "").toLowerCase().includes(q)
    );
  }

  if (sort === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  } else {
    // "recent": sort by updated_at descending
    filtered = [...filtered].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  return <PersonGrid people={filtered} />;
}
