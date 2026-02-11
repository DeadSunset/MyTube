#!/usr/bin/env node
/**
 * Minimal local YouTube parser for MyTube.
 *
 * Usage:
 *   node tools/local-youtube-parser.js
 *
 * Endpoints:
 *   GET /youtube?url=https://www.youtube.com/watch?v=VIDEO_ID
 *   GET /youtube-search?q=video+title
 */

const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");

const PORT = Number.parseInt(process.env.MYTUBE_PARSER_PORT || "8787", 10);
const HOST = process.env.MYTUBE_PARSER_HOST || "0.0.0.0";
const DEFAULT_YOUTUBE_API_KEY = "AIzaSyCCXpvZAFDTm-pfCr2zYWj5LtVbjYzNqZo";
const YOUTUBE_API_KEY = process.env.MYTUBE_YOUTUBE_API_KEY || DEFAULT_YOUTUBE_API_KEY;
const MAX_COMMENTS = 50;
const MAX_REPLIES = 10;

const json = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
};

const errorToMessage = (error) => {
  if (!error) return "Unknown error";
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error.code) return `${error.code}`;
  return String(error);
};

const fetchJson = (targetUrl) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          "User-Agent": "MyTube Local Parser/1.0",
          Accept: "application/json",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`API responded with ${res.statusCode}`));
          res.resume();
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });

const parseObjectFromIndex = (html, start) => {
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const raw = html.slice(start, i + 1);
        try {
          return JSON.parse(raw);
        } catch (_error) {
          return null;
        }
      }
    }
  }
  return null;
};

const parseInitialJson = (html, marker) => {
  const patterns = [
    new RegExp(`(?:var\\s+)?${marker}\\s*=`),
    new RegExp(`${marker}`),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match) continue;
    const start = html.indexOf("{", match.index + match[0].length);
    const parsed = parseObjectFromIndex(html, start);
    if (parsed) return parsed;
  }

  return null;
};

const readTextLike = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.simpleText) return node.simpleText;
  if (Array.isArray(node.runs)) {
    return node.runs.map((run) => run.text || "").join("");
  }
  return "";
};

const parseCompactNumber = (value) => {
  if (!value && value !== 0) return null;
  const normalized = `${value}`
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  let numberPart = normalized.replace(/[^\d.,]/g, "");
  if (!numberPart) return null;

  const hasComma = numberPart.includes(",");
  const hasDot = numberPart.includes(".");
  if (hasComma && hasDot) {
    numberPart = numberPart.replace(/,/g, "");
  } else if (hasComma) {
    numberPart = numberPart.replace(",", ".");
  }

  const number = Number.parseFloat(numberPart);
  if (!Number.isFinite(number)) return null;
  if (/(?:тыс|k)(?:\b|\.)/.test(normalized)) return Math.round(number * 1_000);
  if (/(?:млн|m)(?:\b|\.)/.test(normalized)) return Math.round(number * 1_000_000);
  if (/(?:млрд|b)(?:\b|\.)/.test(normalized)) return Math.round(number * 1_000_000_000);
  return Math.round(number);
};


const parseLikeCountFromInitialData = (initialData) => {
  if (!initialData || typeof initialData !== "object") return null;
  const stack = [initialData];

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }

    if (node.toggleButtonRenderer?.defaultText) {
      const label =
        readTextLike(node.toggleButtonRenderer.defaultText) ||
        node.toggleButtonRenderer?.defaultText?.accessibility?.accessibilityData?.label ||
        "";
      const parsed = parseCompactNumber(label);
      if (Number.isFinite(parsed)) return parsed;
    }

    Object.values(node).forEach((value) => {
      if (value && typeof value === "object") stack.push(value);
    });
  }

  return null;
};

const collectCommentThreads = (node, bucket = []) => {
  if (!node || typeof node !== "object") return bucket;
  if (Array.isArray(node)) {
    node.forEach((item) => collectCommentThreads(item, bucket));
    return bucket;
  }

  if (node.commentThreadRenderer) {
    bucket.push(node.commentThreadRenderer);
  }

  Object.values(node).forEach((value) => collectCommentThreads(value, bucket));
  return bucket;
};

const parseReply = (replyRenderer, idx = 0) => {
  if (!replyRenderer) return null;
  const text = readTextLike(replyRenderer.contentText).trim();
  if (!text) return null;

  return {
    id: replyRenderer.commentId || `reply-${idx}`,
    author: readTextLike(replyRenderer.authorText).trim() || "YouTube user",
    text,
    createdAt: Date.now(),
  };
};

const parseCommentThread = (thread, order) => {
  const renderer = thread?.comment?.commentRenderer;
  if (!renderer) return null;

  const text = readTextLike(renderer.contentText).trim();
  if (!text) return null;

  const likesText =
    readTextLike(renderer.voteCount) ||
    renderer.voteCount?.accessibility?.accessibilityData?.label ||
    "";

  const replyNodes = thread?.replies?.commentRepliesRenderer?.contents || [];
  const replies = Array.isArray(replyNodes)
    ? replyNodes
        .map((item, idx) => parseReply(item?.commentRenderer, idx))
        .filter(Boolean)
    : [];

  return {
    id: renderer.commentId || `comment-${order}`,
    author: readTextLike(renderer.authorText).trim() || "YouTube user",
    text,
    likes: parseCompactNumber(likesText) || 0,
    dislikes: 0,
    replyCount: replies.length,
    replies,
    order,
  };
};

const collectVideoRenderers = (node, bucket = []) => {
  if (!node || typeof node !== "object") return bucket;
  if (Array.isArray(node)) {
    node.forEach((item) => collectVideoRenderers(item, bucket));
    return bucket;
  }
  if (node.videoRenderer) {
    bucket.push(node.videoRenderer);
  }
  Object.values(node).forEach((value) => collectVideoRenderers(value, bucket));
  return bucket;
};

const parseSearchHtmlCandidates = (html) => {
  const initialData = parseInitialJson(html, "ytInitialData") || {};
  const renderers = collectVideoRenderers(initialData).slice(0, 10);
  return renderers
    .map((renderer) => ({
      videoId: renderer.videoId || "",
      title: readTextLike(renderer.title).trim() || "",
      channelTitle: readTextLike(renderer.ownerText).trim() || "",
    }))
    .filter((item) => item.videoId && item.title);
};

const fetchYouTubeApiSearchCandidates = async (query, limit = 10) => {
  const searchApiUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchApiUrl.searchParams.set("part", "snippet");
  searchApiUrl.searchParams.set("q", query);
  searchApiUrl.searchParams.set("type", "video");
  searchApiUrl.searchParams.set("maxResults", `${Math.max(1, Math.min(limit, 10))}`);
  searchApiUrl.searchParams.set("regionCode", "RU");
  searchApiUrl.searchParams.set("relevanceLanguage", "ru");
  searchApiUrl.searchParams.set("safeSearch", "none");
  searchApiUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const searchData = await fetchJson(searchApiUrl);
  const items = Array.isArray(searchData?.items) ? searchData.items : [];
  return items
    .map((item) => ({
      videoId: item?.id?.videoId || "",
      title: item?.snippet?.title || "",
      channelTitle: item?.snippet?.channelTitle || "",
    }))
    .filter((item) => item.videoId);
};

const fetchSearchPayload = async (query, limit = 10) => {
  const trimmedQuery = `${query || ""}`.trim();
  if (!trimmedQuery) {
    return { query: "", candidates: [] };
  }

  let apiError = null;
  try {
    if (YOUTUBE_API_KEY) {
      const candidates = await fetchYouTubeApiSearchCandidates(trimmedQuery, limit);
      return {
        query: trimmedQuery,
        candidates,
        meta: { parser: "youtube-data-api-v3-search", limit },
      };
    }
  } catch (error) {
    apiError = error;
  }

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}&hl=ru`;
  const html = await fetchText(searchUrl);
  const candidates = parseSearchHtmlCandidates(html).slice(0, Math.max(1, Math.min(limit, 10)));

  return {
    query: trimmedQuery,
    candidates,
    meta: {
      parser: "youtube-search-html",
      limit,
      apiFallbackError: apiError ? errorToMessage(apiError) : undefined,
    },
  };
};

const fetchText = (targetUrl) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
          "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`YouTube responded with ${res.statusCode}`));
          res.resume();
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });

const parseWatchPayload = (html, sourceUrl) => {
  const playerData = parseInitialJson(html, "ytInitialPlayerResponse") || {};
  const initialData = parseInitialJson(html, "ytInitialData") || {};
  const details = playerData.videoDetails || {};

  const threads = collectCommentThreads(initialData);
  const comments = threads
    .map((thread, index) => parseCommentThread(thread, index))
    .filter(Boolean);

  const views =
    parseCompactNumber(details.viewCount) ||
    parseCompactNumber(playerData?.microformat?.playerMicroformatRenderer?.viewCount);
  const likes = parseLikeCountFromInitialData(initialData);

  return {
    sourceUrl,
    sourceVideoId: details.videoId || "",
    title: details.title || "",
    channelName: details.author || "",
    thumbnail: details.thumbnail?.thumbnails?.at?.(-1)?.url || "",
    stats: {
      views,
      likes,
      dislikes: null,
      comments: comments.length,
    },
    comments,
  };
};

const mapApiReply = (reply, commentOrder, replyOrder) => {
  const snippet = reply?.snippet;
  if (!snippet?.textDisplay) return null;
  return {
    id: reply?.id || `reply-${commentOrder}-${replyOrder}`,
    author: snippet.authorDisplayName || "YouTube user",
    text: snippet.textDisplay,
    createdAt: Date.now(),
  };
};

const mapApiComment = (item, order) => {
  const topLevel = item?.snippet?.topLevelComment?.snippet;
  if (!topLevel?.textDisplay) return null;

  const replyItems = Array.isArray(item?.replies?.comments)
    ? item.replies.comments.slice(0, MAX_REPLIES)
    : [];

  const replies = replyItems
    .map((reply, replyOrder) => mapApiReply(reply, order, replyOrder))
    .filter(Boolean);

  return {
    id: item?.snippet?.topLevelComment?.id || `comment-${order}`,
    author: topLevel.authorDisplayName || "YouTube user",
    text: topLevel.textDisplay,
    likes: Number.parseInt(topLevel.likeCount || "0", 10) || 0,
    dislikes: 0,
    replyCount: Number.parseInt(item?.snippet?.totalReplyCount || "0", 10) || 0,
    replies,
    order,
  };
};

const fetchYouTubeApiPayload = async (videoId, sourceUrl) => {
  const videoApiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoApiUrl.searchParams.set("part", "snippet,statistics");
  videoApiUrl.searchParams.set("id", videoId);
  videoApiUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const commentsApiUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  commentsApiUrl.searchParams.set("part", "snippet,replies");
  commentsApiUrl.searchParams.set("videoId", videoId);
  commentsApiUrl.searchParams.set("maxResults", `${MAX_COMMENTS}`);
  commentsApiUrl.searchParams.set("order", "relevance");
  commentsApiUrl.searchParams.set("textFormat", "plainText");
  commentsApiUrl.searchParams.set("key", YOUTUBE_API_KEY);

  const [videoData, commentsData] = await Promise.all([
    fetchJson(videoApiUrl),
    fetchJson(commentsApiUrl),
  ]);

  const firstVideo = videoData?.items?.[0];
  if (!firstVideo) {
    throw new Error("Video not found in YouTube API response");
  }

  const comments = Array.isArray(commentsData?.items)
    ? commentsData.items
        .map((item, index) => mapApiComment(item, index))
        .filter(Boolean)
    : [];

  return {
    sourceUrl,
    sourceVideoId: videoId,
    title: firstVideo?.snippet?.title || "",
    channelName: firstVideo?.snippet?.channelTitle || "",
    thumbnail:
      firstVideo?.snippet?.thumbnails?.maxres?.url ||
      firstVideo?.snippet?.thumbnails?.high?.url ||
      firstVideo?.snippet?.thumbnails?.medium?.url ||
      firstVideo?.snippet?.thumbnails?.default?.url ||
      "",
    stats: {
      views: Number.parseInt(firstVideo?.statistics?.viewCount || "0", 10) || 0,
      likes: Number.parseInt(firstVideo?.statistics?.likeCount || "0", 10) || 0,
      dislikes: null,
      comments: comments.length,
    },
    comments,
  };
};

const extractVideoId = (raw) => {
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").slice(0, 11);
    }
    return (parsed.searchParams.get("v") || "").slice(0, 11);
  } catch (_error) {
    return "";
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const incoming = new URL(req.url, `http://${req.headers.host}`);

  if (incoming.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (incoming.pathname === "/youtube-search") {
    const query = incoming.searchParams.get("q") || "";
    const limit = Number.parseInt(incoming.searchParams.get("limit") || "8", 10);
    if (!query.trim()) {
      json(res, 400, { error: "Missing search query" });
      return;
    }
    try {
      const payload = await fetchSearchPayload(query, limit);
      json(res, 200, payload);
    } catch (error) {
      json(res, 500, {
        error: "Failed to search YouTube",
        details: errorToMessage(error),
      });
    }
    return;
  }

  if (incoming.pathname !== "/youtube") {
    json(res, 404, { error: "Not found" });
    return;
  }

  const inputUrl = incoming.searchParams.get("url") || "";
  const videoId = extractVideoId(inputUrl);
  if (!videoId) {
    json(res, 400, { error: "Invalid YouTube URL or video id" });
    return;
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=ru`;

  try {
    let payload = null;
    let apiError = null;

    if (YOUTUBE_API_KEY) {
      try {
        payload = await fetchYouTubeApiPayload(videoId, inputUrl || watchUrl);
        payload.meta = {
          parser: "youtube-data-api-v3",
          commentsLimit: MAX_COMMENTS,
          repliesLimit: MAX_REPLIES,
        };
      } catch (error) {
        apiError = error;
      }
    }

    if (!payload) {
      const html = await fetchText(watchUrl);
      payload = parseWatchPayload(html, inputUrl || watchUrl);
      payload.meta = {
        parser: "youtube-watch-html",
        commentsLimit: payload.comments.length,
        repliesLimit: MAX_REPLIES,
        apiFallbackError: apiError ? errorToMessage(apiError) : undefined,
      };
    }

    json(res, 200, payload);
  } catch (error) {
    json(res, 500, {
      error: "Failed to parse YouTube page",
      details: errorToMessage(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MyTube local parser is running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Endpoint:     http://${HOST}:${PORT}/youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
  console.log(`Search:       http://${HOST}:${PORT}/youtube-search?q=video+title`);
});
