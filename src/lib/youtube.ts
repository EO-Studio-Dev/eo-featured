const CHANNEL_ID = "UClWTCPVi-AU9TeCN6FkGARg"; // EO Global
const MAX_RESULTS = 50;

interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export async function fetchRecentVideos(pageToken?: string): Promise<{
  videos: YouTubeVideo[];
  nextPageToken: string | null;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    maxResults: String(MAX_RESULTS),
    order: "date",
    type: "video",
    videoDuration: "medium", // Exclude shorts (< 4min) and long (> 20min)
    key: apiKey,
  });

  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );

  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  const videos: YouTubeVideo[] = (data.items || []).map(
    (item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>;
      const id = item.id as Record<string, string>;
      const thumbnails = snippet.thumbnails as Record<string, Record<string, unknown>>;
      return {
        videoId: id.videoId,
        title: snippet.title as string,
        publishedAt: snippet.publishedAt as string,
        thumbnailUrl: (thumbnails?.high?.url || thumbnails?.medium?.url || "") as string,
      };
    }
  );

  return {
    videos,
    nextPageToken: (data.nextPageToken as string) || null,
  };
}

export async function fetchAllVideos(): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];
  let pageToken: string | undefined;

  do {
    const { videos, nextPageToken } = await fetchRecentVideos(pageToken);
    allVideos.push(...videos);
    pageToken = nextPageToken || undefined;
    // Safety limit
    if (allVideos.length > 2000) break;
  } while (pageToken);

  return allVideos;
}

/**
 * Parse person name and company from EO video title.
 * Common patterns:
 * - "Title text | Company, Person Name"
 * - "Title text | Person Name"
 * - "Quote" Person Desc | Company, Person Name
 */
export function parseVideoTitle(title: string): {
  personName: string | null;
  companyName: string | null;
  role: string | null;
} {
  // Decode HTML entities
  const decoded = title
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

  // Pattern: ... | Company, Person Name
  const pipeMatch = decoded.match(/\|\s*(.+)$/);
  if (!pipeMatch) return { personName: null, companyName: null, role: null };

  const afterPipe = pipeMatch[1].trim();
  const parts = afterPipe.split(",").map((s) => s.trim());

  if (parts.length >= 2) {
    // "Company, Person Name" or "Company, Role Person Name"
    return {
      companyName: parts[0],
      personName: parts[parts.length - 1],
      role: parts.length > 2 ? parts[1] : null,
    };
  }

  // Single part after pipe — could be person name
  return {
    personName: parts[0],
    companyName: null,
    role: null,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `person-${Date.now()}`;
}

export function makeSlug(name: string): string {
  const base = slugify(name);
  const hash = Math.random().toString(36).substring(2, 6);
  return `${base}-${hash}`;
}
