#!/usr/bin/env node
/**
 * Minimal local YouTube parser for MyTube.
 *
 * Usage:
 *   node tools/local-youtube-parser.js
 *
 * Endpoint:
 *   GET /youtube?url=https://www.youtube.com/watch?v=VIDEO_ID
 */

const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");

const PORT = Number.parseInt(process.env.MYTUBE_PARSER_PORT || "8787", 10);
const HOST = process.env.MYTUBE_PARSER_HOST || "127.0.0.1";

const json = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
};

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
  if (!value) return null;
  const normalized = `${value}`.replace(/\s+/g, " ").trim().toLowerCase();
  const number = Number.parseFloat(
    normalized.replace(/[^\d.,]/g, "").replace(",", ".")
  );

  if (!Number.isFinite(number)) return null;
  if (normalized.includes("тыс") || normalized.includes("k")) return Math.round(number * 1_000);
  if (normalized.includes("млн") || normalized.includes("m")) return Math.round(number * 1_000_000);
  if (normalized.includes("млрд") || normalized.includes("b")) return Math.round(number * 1_000_000_000);
  return Math.round(number);
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

  return {
    sourceUrl,
    sourceVideoId: details.videoId || "",
    title: details.title || "",
    channelName: details.author || "",
    thumbnail: details.thumbnail?.thumbnails?.at?.(-1)?.url || "",
    stats: {
      views,
      likes: null,
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
    const html = await fetchText(watchUrl);
    const payload = parseWatchPayload(html, inputUrl || watchUrl);
    json(res, 200, payload);
  } catch (error) {
    json(res, 500, {
      error: "Failed to parse YouTube page",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MyTube local parser is running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Endpoint:     http://${HOST}:${PORT}/youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
});
