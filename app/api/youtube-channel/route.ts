import { NextRequest, NextResponse } from "next/server";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractVideoId = (url: string) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7]?.length === 11 ? match[7] : null;
};

const extractChannelIdFromUrl = (url: string) => {
  const directChannel = url.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
  if (directChannel?.[1]) {
    return directChannel[1];
  }

  return null;
};

const normalizeThumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    return "";
  }

  return response.text();
}

async function resolveChannelId(url: string) {
  const directChannel = extractChannelIdFromUrl(url);
  if (directChannel) {
    return directChannel;
  }

  const normalizedUrl = url.includes("/videos") ? url : url.replace(/\/$/, "");
  const htmlCandidates = [normalizedUrl, `${normalizedUrl}/videos`];

  for (const candidate of htmlCandidates) {
    try {
      const html = await fetchHtml(candidate);
      if (!html) {
        continue;
      }

      const channelIdMatch = html.match(/"channelId":"(UC[\w-]+)"/);
      if (channelIdMatch?.[1]) {
        return channelIdMatch[1];
      }

      const externalChannelIdMatch = html.match(/"externalChannelId":"(UC[\w-]+)"/);
      if (externalChannelIdMatch?.[1]) {
        return externalChannelIdMatch[1];
      }
    } catch {
      // Ignore and try the next candidate.
    }
  }

  return null;
}

async function fetchOEmbed(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error("Failed to load YouTube metadata");
  }

  return response.json() as Promise<{ title: string; author_name: string; thumbnail_url: string }>;
}

function parseChannelFeed(xml: string) {
  const channelTitle = decodeEntities(xml.match(/<feed[^>]*>[\s\S]*?<title>(.*?)<\/title>/)?.[1] ?? "YouTube Channel");
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g));

  const videos = entries
    .map((entry, index) => {
      const block = entry[1];
      const id = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
      const title = block.match(/<title>(.*?)<\/title>/)?.[1];
      const publishedAt = block.match(/<published>(.*?)<\/published>/)?.[1];
      const thumbnail = block.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title: decodeEntities(title),
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnail: normalizeThumbnailUrl(id),
        publishedAt,
        order: index + 1,
      };
    })
    .filter(Boolean)
    .slice(0, 12) as Array<{
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    publishedAt?: string;
    order: number;
  }>;

  return { channelTitle, videos };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ ok: false, error: "YouTube URL is required" }, { status: 400 });
    }

    const channelId = await resolveChannelId(url);
    if (channelId) {
      try {
        const feedResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/xml,text/xml,*/*;q=0.8",
          },
        });

        if (feedResponse.ok) {
          const xml = await feedResponse.text();
          const feed = parseChannelFeed(xml);

          if (feed.videos.length > 0) {
            return NextResponse.json({
              ok: true,
              channelId,
              channelTitle: feed.channelTitle,
              videos: feed.videos,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch YouTube channel feed:", error);
      }
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ ok: false, error: "Invalid YouTube URL" }, { status: 400 });
    }

    const metadata = await fetchOEmbed(videoId).catch(() => ({
      title: "YouTube Video",
      author_name: "Unknown",
      thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }));

    return NextResponse.json({
      ok: true,
      channelTitle: metadata.author_name,
      videos: [
        {
          id: videoId,
          title: metadata.title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: normalizeThumbnailUrl(videoId),
          publishedAt: undefined,
          order: 1,
        },
      ],
    });
  } catch (error) {
    console.error("YouTube channel lookup error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load YouTube channel" },
      { status: 500 },
    );
  }
}
