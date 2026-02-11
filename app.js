const addFolderBtn = document.getElementById("addFolderBtn");
const editLibraryBtn = document.getElementById("editLibraryBtn");
const libraryToggle = document.getElementById("libraryToggle");
const shortsTab = document.getElementById("shortsTab");
const folderList = document.getElementById("folderList");
const videoGrid = document.getElementById("videoGrid");
const videoCount = document.getElementById("videoCount");
const searchInput = document.getElementById("searchInput");
const logoLink = document.getElementById("logoLink");
const folderInput = document.getElementById("folderInput");
const dateSort = document.getElementById("dateSort");
const durationMinInput = document.getElementById("durationMin");
const durationMaxInput = document.getElementById("durationMax");
const filterButtons = document.querySelectorAll(".filter-btn");
const libraryView = document.getElementById("libraryView");
const watchView = document.getElementById("watchView");
const shortsView = document.getElementById("shortsView");
const profileView = document.getElementById("profileView");
const urlFillerView = document.getElementById("urlFillerView");
const videoPlayer = document.getElementById("videoPlayer");
const watchTitle = document.getElementById("watchTitle");
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const likeCount = document.getElementById("likeCount");
const dislikeCount = document.getElementById("dislikeCount");
const progressLabel = document.getElementById("progressLabel");
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");
const saveCommentBtn = document.getElementById("saveCommentBtn");
const recommendations = document.getElementById("recommendations");
const videoCardTemplate = document.getElementById("videoCardTemplate");
const recommendationTemplate = document.getElementById("recommendationTemplate");
const shortsPlayer = document.getElementById("shortsPlayer");
const shortsPrevBtn = document.getElementById("shortsPrevBtn");
const shortsNextBtn = document.getElementById("shortsNextBtn");
const shortsPlayBtn = document.getElementById("shortsPlayBtn");
const shortsTitle = document.getElementById("shortsTitle");
const shortsChannel = document.getElementById("shortsChannel");
const shortsStatus = document.getElementById("shortsStatus");
const shortsLikeBtn = document.getElementById("shortsLikeBtn");
const shortsDislikeBtn = document.getElementById("shortsDislikeBtn");
const shortsLikeCount = document.getElementById("shortsLikeCount");
const shortsDislikeCount = document.getElementById("shortsDislikeCount");
const shortsCommentInput = document.getElementById("shortsCommentInput");
const shortsCommentBtn = document.getElementById("shortsCommentBtn");
const historyTab = document.getElementById("historyTab");
const shortsPlayerWrap = document.getElementById("shortsPlayerWrap");
const importStatus = document.getElementById("importStatus");
const importLabel = document.getElementById("importLabel");
const importBarFill = document.getElementById("importBarFill");
const profileBtn = document.getElementById("profileBtn");
const exportBackupBtn = document.getElementById("exportBackupBtn");
const importBackupInput = document.getElementById("importBackupInput");
const exportPendingListBtn = document.getElementById("exportPendingListBtn");
const autoParseLibraryBtn = document.getElementById("autoParseLibraryBtn");
const autoParseFirst20Btn = document.getElementById("autoParseFirst20Btn");
const importVideoDataInput = document.getElementById("importVideoDataInput");
const autoAddTreeBtn = document.getElementById("autoAddTreeBtn");
const autoAddTreeInput = document.getElementById("autoAddTreeInput");
const openUrlFillerBtn = document.getElementById("openUrlFillerBtn");
const youtubeApiKeyInput = document.getElementById("youtubeApiKeyInput");
const folderParseTools = document.getElementById("folderParseTools");
const folderParseTitle = document.getElementById("folderParseTitle");
const channelUrlInput = document.getElementById("channelUrlInput");
const importHtmlBtn = document.getElementById("importHtmlBtn");
const importHtmlInput = document.getElementById("importHtmlInput");
const importPdfBtn = document.getElementById("importPdfBtn");
const importPdfInput = document.getElementById("importPdfInput");
const importUrlInput = document.getElementById("importUrlInput");
const importUrlBtn = document.getElementById("importUrlBtn");
const watchViews = document.getElementById("watchViews");
const watchLikesImported = document.getElementById("watchLikesImported");
const watchDislikesImported = document.getElementById("watchDislikesImported");
const watchCommentsImported = document.getElementById("watchCommentsImported");
const watchImportSource = document.getElementById("watchImportSource");
const changeThumbnailBtn = document.getElementById("changeThumbnailBtn");
const resetThumbnailBtn = document.getElementById("resetThumbnailBtn");
const thumbnailInput = document.getElementById("thumbnailInput");
const urlFillerBackBtn = document.getElementById("urlFillerBackBtn");
const urlFillerProgress = document.getElementById("urlFillerProgress");
const urlFillerVideoTitle = document.getElementById("urlFillerVideoTitle");
const urlFillerChannelName = document.getElementById("urlFillerChannelName");
const urlFillerUrlInput = document.getElementById("urlFillerUrlInput");
const urlFillerImportUrlBtn = document.getElementById("urlFillerImportUrlBtn");
const urlFillerImportHtmlBtn = document.getElementById("urlFillerImportHtmlBtn");
const urlFillerHtmlInput = document.getElementById("urlFillerHtmlInput");
const urlFillerSkipBtn = document.getElementById("urlFillerSkipBtn");

const DB_NAME = "mytube-db";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";
const FOLDER_STORE = "folders";
const PAGE_SIZE = 40;
const TIME_PATTERN = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
const FOLDER_CHANNEL_MAP_STORAGE_KEY = "mytube-folder-channel-map";
const YOUTUBE_API_KEY_STORAGE_KEY = "mytube-youtube-api-key";
const DEFAULT_YOUTUBE_API_KEY = "AIzaSyCCXpvZAFDTm-pfCr2zYWj5LtVbjYzNqZo";
const YOUTUBE_IMPORT_MAX_COMMENTS = 50;
const YOUTUBE_IMPORT_MAX_REPLIES = 10;
const YOUTUBE_SEARCH_MAX_RESULTS = 8;
const YOUTUBE_MATCH_HIGH_CONFIDENCE = 90;
const YOUTUBE_MATCH_LOW_CONFIDENCE = 80;
const YOUTUBE_MATCH_MIN_FOR_TRY = 55;

let state = {
  videos: [],
  folders: [],
  activeVideoId: null,
  searchTerm: "",
  activeFolder: null,
  shuffleMode: false,
  shuffledIds: [],
  videoTypeFilter: "regular",
  dateSort: "none",
  durationMin: null,
  durationMax: null,
  visibleCount: PAGE_SIZE,
  renderedCount: 0,
  isEditing: false,
  shortsQueue: [],
  shortsIndex: 0,
  sessionSeenShorts: new Set(),
  activeShortsId: null,
  watchedHistory: [],
  historyMode: false,
  urlFillerQueue: [],
  urlFillerIndex: 0,
};

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FOLDER_STORE)) {
        db.createObjectStore(FOLDER_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (storeName, mode, callback) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = callback(store);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
};

const verifyPermission = async (handle) => {
  if (!handle) return false;
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const options = { mode: "read" };
  const query = await handle.queryPermission(options);
  if (query === "granted") return true;
  const request = await handle.requestPermission(options);
  return request === "granted";
};

const getAll = (storeName) =>
  withStore(storeName, "readonly", (store) =>
    new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    })
  );

const putItem = (storeName, value) =>
  withStore(storeName, "readwrite", (store) => store.put(value));

const deleteItem = (storeName, key) =>
  withStore(storeName, "readwrite", (store) => store.delete(key));

const idFromHandle = (handle, fallback, relativePath = "") => {
  if (relativePath) {
    return `${relativePath}-${fallback}`;
  }
  if (handle?.name) {
    return `${handle.name}-${fallback}`;
  }
  return `video-${crypto.randomUUID()}`;
};

const buildFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const getVideoFile = async (video) => {
  if (video.handle) {
    return video.handle.getFile();
  }
  return video.file;
};

const humanizeDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "--:--";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const extractWords = (text) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const scoreMatch = (title, queryWords) => {
  const words = new Set(extractWords(title));
  return queryWords.reduce((score, word) => (words.has(word) ? score + 1 : score), 0);
};

const parseTimecode = (timecode) => {
  const parts = timecode.split(":").map((value) => Number.parseInt(value, 10));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (match) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[match] || match;
  });

const formatCommentText = (text) => {
  const escaped = escapeHtml(text);
  return escaped.replace(
    TIME_PATTERN,
    (match) => `<a href="#" data-time="${match}">${match}</a>`
  );
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}`;
};

const ensureVideoImported = (video) => {
  if (!video.imported || typeof video.imported !== "object") {
    video.imported = {
      source: "local",
      sourceUrl: "",
      importedAt: null,
      stats: {
        views: null,
        likes: null,
        dislikes: null,
        comments: null,
      },
    };
  }
  if (!video.imported.stats) {
    video.imported.stats = { views: null, likes: null, dislikes: null, comments: null };
  }
  return video.imported;
};

const renderImportedStats = (video) => {
  const imported = ensureVideoImported(video);
  if (watchViews) watchViews.textContent = toDisplayValue(imported.stats.views);
  if (watchLikesImported) watchLikesImported.textContent = toDisplayValue(imported.stats.likes);
  if (watchDislikesImported) watchDislikesImported.textContent = toDisplayValue(imported.stats.dislikes);
  if (watchCommentsImported) {
    const commentCount = imported.stats.comments ?? (video.comments || []).length;
    watchCommentsImported.textContent = toDisplayValue(commentCount);
  }
  if (watchImportSource) {
    const source = imported.source === "youtube_html"
      ? "YouTube HTML"
      : imported.source === "youtube_pdf"
        ? "YouTube PDF"
      : imported.source === "youtube_url"
        ? "YouTube URL"
        : "Локально";
    watchImportSource.textContent = source;
  }
};

const normalizeComment = (comment, author = "Вы") => {
  const safeComment = comment && typeof comment === "object" ? comment : {};
  const replies = Array.isArray(safeComment.replies)
    ? safeComment.replies.map((reply) => {
        const safeReply = reply && typeof reply === "object" ? reply : {};
        return {
          id: safeReply.id || crypto.randomUUID(),
          author: safeReply.author || "Вы",
          text: safeReply.text || "",
          createdAt: safeReply.createdAt || Date.now(),
        };
      })
    : [];
  const replyCount = Number.isFinite(safeComment.replyCount) ? safeComment.replyCount : replies.length;
  return {
    id: safeComment.id || crypto.randomUUID(),
    author: safeComment.author || author,
    text: safeComment.text || "",
    createdAt: safeComment.createdAt || Date.now(),
    likes: Number.isFinite(safeComment.likes) ? safeComment.likes : 0,
    dislikes: Number.isFinite(safeComment.dislikes) ? safeComment.dislikes : 0,
    replies,
    replyCount,
    order: Number.isFinite(safeComment.order) ? safeComment.order : 0,
    repliesExpanded: Boolean(safeComment.repliesExpanded),
  };
};

const extractYouTubeVideoId = (urlOrId) => {
  if (!urlOrId) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  try {
    const url = new URL(urlOrId);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11);
    }
    return (url.searchParams.get("v") || "").slice(0, 11);
  } catch (_error) {
    return "";
  }
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

const getFolderChannelMap = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOLDER_CHANNEL_MAP_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const saveFolderChannelMap = (map) => {
  localStorage.setItem(FOLDER_CHANNEL_MAP_STORAGE_KEY, JSON.stringify(map || {}));
};

const getActiveFolderChannelUrl = () => {
  if (!state.activeFolder) return "";
  const map = getFolderChannelMap();
  return map[state.activeFolder] || "";
};

const saveActiveFolderChannelUrl = (value) => {
  if (!state.activeFolder) return;
  const map = getFolderChannelMap();
  if (!value) {
    delete map[state.activeFolder];
  } else {
    map[state.activeFolder] = value;
  }
  saveFolderChannelMap(map);
};

const getYouTubeApiKey = () => {
  const fromInput = youtubeApiKeyInput?.value?.trim();
  if (fromInput) return fromInput;
  return localStorage.getItem(YOUTUBE_API_KEY_STORAGE_KEY) || DEFAULT_YOUTUBE_API_KEY;
};

const saveYouTubeApiKey = (value) => {
  if (!value) {
    localStorage.removeItem(YOUTUBE_API_KEY_STORAGE_KEY);
    return;
  }
  localStorage.setItem(YOUTUBE_API_KEY_STORAGE_KEY, value);
};

const ensureYouTubeApiKey = () => {
  const key = getYouTubeApiKey();
  if (!key) {
    throw new Error("YouTube API key is missing");
  }
  return key;
};

const getYouTubeApiKeyCandidates = () => {
  const keys = [getYouTubeApiKey(), DEFAULT_YOUTUBE_API_KEY].filter(Boolean);
  return [...new Set(keys)];
};

const withYouTubeApiKeyFallback = async (runner) => {
  const keys = getYouTubeApiKeyCandidates();
  let lastError = null;

  for (const key of keys) {
    try {
      return await runner(key);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const shouldTryNext = /403/.test(message) || /API key/i.test(message);
      if (!shouldTryNext) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error("No available YouTube API key");
};

const isVideoMissingMeta = (video) => {
  const hasThumbnail = Boolean(video.thumbnail);
  const hasComments = Array.isArray(video.comments) && video.comments.length > 0;
  return !hasThumbnail || !hasComments;
};

const exportPendingVideoList = async () => {
  const pendingVideos = [];
  const total = state.videos.length;

  updateImportStatus(0, total);
  if (importLabel) {
    importLabel.textContent = `Проверка видео: 0 / ${total}`;
  }

  for (let index = 0; index < total; index += 1) {
    const video = state.videos[index];
    if (isVideoMissingMeta(video)) {
      pendingVideos.push({
        id: video.id,
        title: video.title,
        folderName: video.folderName || "",
        channelName: video.channelName || "",
        hasThumbnail: Boolean(video.thumbnail),
        commentsCount: Array.isArray(video.comments) ? video.comments.length : 0,
      });
    }

    if ((index + 1) % 50 === 0 || index + 1 === total) {
      updateImportStatus(index + 1, total);
      if (importLabel) {
        importLabel.textContent = `Проверка видео: ${index + 1} / ${total}`;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const blob = new Blob([JSON.stringify({ videos: pendingVideos }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mytube-pending-videos-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  resetImportStatus();
  alert(`Экспортировано ${pendingVideos.length} видео без превью ИЛИ комментариев.`);
};

const buildCommentsFromApi = (comments = [], baseIndex = 0) => comments.map((comment, index) => {
  const replies = Array.isArray(comment.replies)
    ? comment.replies.map((reply) => ({
        id: reply.id || crypto.randomUUID(),
        author: reply.author || "YouTube user",
        text: reply.text || "",
        createdAt: reply.createdAt || Date.now(),
      }))
    : [];
  const replyCount = Number.isFinite(comment.replyCount) ? comment.replyCount : replies.length;
  return normalizeComment({
    id: comment.id || crypto.randomUUID(),
    author: comment.author || "YouTube user",
    text: comment.text || "",
    createdAt: comment.createdAt || Date.now(),
    likes: Number.isFinite(comment.likes) ? comment.likes : 0,
    dislikes: Number.isFinite(comment.dislikes) ? comment.dislikes : 0,
    replies,
    replyCount,
    order: Number.isFinite(comment.order) ? comment.order : baseIndex + index,
    repliesExpanded: false,
  }, comment.author || "YouTube user");
});


const buildCommentsFromYouTubeApi = (threads = []) => threads
  .map((item, index) => {
    const topLevel = item?.snippet?.topLevelComment?.snippet;
    if (!topLevel?.textDisplay) return null;

    const replyItems = Array.isArray(item?.replies?.comments)
      ? item.replies.comments.slice(0, YOUTUBE_IMPORT_MAX_REPLIES)
      : [];

    const replies = replyItems
      .map((reply, replyIndex) => {
        const replySnippet = reply?.snippet;
        if (!replySnippet?.textDisplay) return null;
        return {
          id: reply?.id || `reply-${index}-${replyIndex}`,
          author: replySnippet.authorDisplayName || "YouTube user",
          text: replySnippet.textDisplay,
          createdAt: Date.now(),
        };
      })
      .filter(Boolean);

    return {
      id: item?.snippet?.topLevelComment?.id || `comment-${index}`,
      author: topLevel.authorDisplayName || "YouTube user",
      text: topLevel.textDisplay,
      likes: Number.parseInt(topLevel.likeCount || "0", 10) || 0,
      dislikes: 0,
      replyCount: Number.parseInt(item?.snippet?.totalReplyCount || "0", 10) || 0,
      replies,
      order: index,
    };
  })
  .filter(Boolean);

const fetchYouTubeApiPayload = async (inputUrl, videoId) => withYouTubeApiKeyFallback(async (apiKey) => {
  const videoApiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoApiUrl.searchParams.set("part", "snippet,statistics");
  videoApiUrl.searchParams.set("id", videoId);
  videoApiUrl.searchParams.set("key", apiKey);

  const commentsApiUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  commentsApiUrl.searchParams.set("part", "snippet,replies");
  commentsApiUrl.searchParams.set("videoId", videoId);
  commentsApiUrl.searchParams.set("maxResults", `${YOUTUBE_IMPORT_MAX_COMMENTS}`);
  commentsApiUrl.searchParams.set("order", "relevance");
  commentsApiUrl.searchParams.set("textFormat", "plainText");
  commentsApiUrl.searchParams.set("key", apiKey);

  const [videoResponse, commentsResponse] = await Promise.all([
    fetch(videoApiUrl.toString()),
    fetch(commentsApiUrl.toString()),
  ]);

  if (!videoResponse.ok) {
    throw new Error(`YouTube videos API error: ${videoResponse.status}`);
  }
  if (!commentsResponse.ok) {
    throw new Error(`YouTube comments API error: ${commentsResponse.status}`);
  }

  const videoData = await videoResponse.json();
  const commentsData = await commentsResponse.json();
  const firstVideo = videoData?.items?.[0];
  if (!firstVideo) {
    throw new Error("Video not found in YouTube API response");
  }

  const comments = buildCommentsFromYouTubeApi(commentsData?.items || []);
  return {
    title: firstVideo?.snippet?.title || "",
    channelName: firstVideo?.snippet?.channelTitle || "",
    sourceVideoId: videoId,
    thumbnail:
      firstVideo?.snippet?.thumbnails?.maxres?.url ||
      firstVideo?.snippet?.thumbnails?.high?.url ||
      firstVideo?.snippet?.thumbnails?.medium?.url ||
      firstVideo?.snippet?.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    stats: {
      views: Number.parseInt(firstVideo?.statistics?.viewCount || "0", 10) || 0,
      likes: Number.parseInt(firstVideo?.statistics?.likeCount || "0", 10) || 0,
      dislikes: null,
      comments: comments.length,
    },
    comments: buildCommentsFromApi(comments),
    importMeta: {
      source: "youtube-browser-api",
      sourceUrl: inputUrl,
      commentsLimit: YOUTUBE_IMPORT_MAX_COMMENTS,
    },
  };
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeTitleForSearch = (value = "") => {
  const lower = `${value}`.toLowerCase().replace(/ё/g, "е");
  const stripped = lower
    .replace(/\.(mp4|webm|mkv|mov)$/gi, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, " ")
    .replace(/[\[\(][^\]\)]*(official|lyric|lyrics|audio|hd|4k|remaster|live|clip|teaser|trailer|full|официальн|клип|трейлер|ремастер|лайв|аудио)[^\]\)]*[\]\)]/gi, " ")
    .replace(/[#!|•—–_]+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
};

const tokenSet = (text) => new Set(normalizeTitleForSearch(text).split(/\s+/).filter(Boolean));

const scoreTitleMatch = (originalTitle, candidateTitle) => {
  const a = tokenSet(originalTitle);
  const b = tokenSet(candidateTitle);
  if (!a.size || !b.size) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const jaccard = intersection / (a.size + b.size - intersection || 1);
  const containment = intersection / (a.size || 1);
  return Math.round((jaccard * 0.6 + containment * 0.4) * 100);
};

const fetchJsonWithRetry = async (url, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }

    // Retry only on rate limit / transient server errors
    if (attempt < maxRetries && (response.status === 429 || response.status >= 500)) {
      await sleep(400 * (2 ** attempt));
      continue;
    }

    // Surface the real YouTube API error reason (very important for 403).
    let details = "";
    try {
      const text = await response.text();
      details = text;
      try {
        const json = JSON.parse(text);
        const reason =
          json?.error?.errors?.[0]?.reason ||
          json?.error?.status ||
          "";
        const message =
          json?.error?.message ||
          "";
        details = JSON.stringify({ reason, message }, null, 2);
      } catch (_) {
        // keep raw text
      }
    } catch (_) {
      // ignore
    }

    console.error("YouTube API error:", { status: response.status, url, details });
    throw new Error(`YouTube API error: ${response.status}${details ? ` | ${details}` : ""}`);
  }
  throw new Error("YouTube API retry limit exceeded");
};

const parseChannelIdFromValue = (value = "") => {
  const raw = `${value}`.trim();
  if (!raw) return "";
  if (/^UC[\w-]{22}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/+$/, "");
    const channelMatch = path.match(/\/channel\/(UC[\w-]{22})/i);
    if (channelMatch) return channelMatch[1];
    return "";
  } catch (_error) {
    return "";
  }
};

const parseHandleFromValue = (value = "") => {
  const raw = `${value}`.trim();
  if (!raw) return "";
  if (raw.startsWith("@")) return raw;
  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/+$/, "");
    const match = path.match(/\/@([\w.-]+)/);
    return match ? `@${match[1]}` : "";
  } catch (_error) {
    return "";
  }
};

const resolveChannelId = async (channelValue = "") => {
  const directChannelId = parseChannelIdFromValue(channelValue);
  if (directChannelId) return directChannelId;

  const handle = parseHandleFromValue(channelValue);
  if (!handle) return "";

  const data = await withYouTubeApiKeyFallback(async (apiKey) => {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("q", handle);
    searchUrl.searchParams.set("key", apiKey);
    return fetchJsonWithRetry(searchUrl.toString(), 1);
  });
  // For search?type=channel, the channel id is returned under items[0].id.channelId
  // (not snippet.channelId). Using snippet.channelId causes channel filtering to fail.
  return data?.items?.[0]?.id?.channelId || "";
};

const searchYouTubeCandidates = async (query, options = {}) => {
  const data = await withYouTubeApiKeyFallback(async (apiKey) => {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", `${YOUTUBE_SEARCH_MAX_RESULTS}`);
    url.searchParams.set("regionCode", "RU");
    url.searchParams.set("relevanceLanguage", "ru");
    url.searchParams.set("safeSearch", "none");
    url.searchParams.set("q", query);
    if (options.channelId) {
      url.searchParams.set("channelId", options.channelId);
    }
    url.searchParams.set("key", apiKey);
    return fetchJsonWithRetry(url.toString(), 1);
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  const candidates = items.map((item) => ({
    videoId: item?.id?.videoId || "",
    title: item?.snippet?.title || "",
    channelTitle: item?.snippet?.channelTitle || "",
  })).filter((item) => item.videoId);

  return { candidates, source: options.channelId ? "browser-youtube-api-channel" : "browser-youtube-api", error: null };
};

const getVideoAutoparseState = (video) => {
  const hasThumbnail = Boolean(video.thumbnail);
  const hasComments = Array.isArray(video.comments) && video.comments.length > 0;
  const hasStats = Boolean(
    video.imported?.stats &&
    (video.imported.stats.views !== null || video.imported.stats.likes !== null || video.imported.stats.dislikes !== null)
  );
  return { hasThumbnail, hasComments, hasStats };
};

const shouldAutoparseVideo = (video) => {
  const stateMeta = getVideoAutoparseState(video);
  return !stateMeta.hasThumbnail || !stateMeta.hasComments || !stateMeta.hasStats;
};

const runAutoParse = async ({ limit = null, forceTopCandidates = false } = {}) => {
  if (!state.activeFolder) {
    alert("Сначала выберите нужную папку/канал в библиотеке.");
    return;
  }

  const allTargets = state.videos
    .filter((video) => video.folderName === state.activeFolder)
    .filter((video) => shouldAutoparseVideo(video));
  const targets = Number.isFinite(limit) ? allTargets.slice(0, limit) : allTargets;

  if (!targets.length) {
    alert("В библиотеке нет видео для автопарсинга.");
    return;
  }

  const queryMap = new Map();
  targets.forEach((video) => {
    const query = normalizeTitleForSearch(video.title || "");
    if (!query) return;
    if (!queryMap.has(query)) queryMap.set(query, []);
    queryMap.get(query).push(video.id);
  });

  const uniqueQueries = [...queryMap.keys()];
  if (!uniqueQueries.length) {
    alert("Не удалось сформировать запросы по названиям видео.");
    return;
  }

  const estimatedUnits = uniqueQueries.length * 100;
  const proceed = confirm(`Папка: ${state.activeFolder}. Найдено ${targets.length} видео для автопарсинга. Будет выполнено ${uniqueQueries.length} поисковых запросов (примерно ${estimatedUnits} quota units). Продолжить?`);
  if (!proceed) return;

  const selectedChannelUrl = getActiveFolderChannelUrl();
  let selectedChannelId = "";
  if (selectedChannelUrl) {
    try {
      selectedChannelId = await resolveChannelId(selectedChannelUrl);
    } catch (error) {
      console.warn("Не удалось определить channelId из URL канала", error);
    }
  }

  const searchCache = new Map();
  const stepTotal = uniqueQueries.length + targets.length;
  let processed = 0;

  updateImportStatus(processed, stepTotal);
  if (importLabel) {
    importLabel.textContent = `Автопоиск YouTube: 0 / ${uniqueQueries.length}`;
  }

  for (let i = 0; i < uniqueQueries.length; i += 1) {
    const query = uniqueQueries[i];
    try {
      const searchResult = await searchYouTubeCandidates(query, { channelId: selectedChannelId });
      const scored = (searchResult.candidates || [])
        .map((candidate) => ({
          ...candidate,
          score: scoreTitleMatch(query, candidate.title),
        }))
        .sort((a, b) => b.score - a.score);
      searchCache.set(query, {
        candidates: scored,
        source: searchResult.source || "unknown",
        error: searchResult.error || null,
      });
    } catch (error) {
      console.warn("Ошибка YouTube поиска для", query, error);
      searchCache.set(query, {
        candidates: [],
        source: "none",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    processed += 1;
    updateImportStatus(processed, stepTotal);
    if (importLabel) {
      importLabel.textContent = `Автопоиск YouTube: ${i + 1} / ${uniqueQueries.length}`;
    }
    await sleep(100);
  }

  const reviewItems = [];
  let importedCount = 0;
  let attemptedCount = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const video = targets[i];
    const query = normalizeTitleForSearch(video.title || "");
    const cached = searchCache.get(query) || { candidates: [], source: "none", error: null };
    const candidates = (cached.candidates || []).slice(0, 5);

    let imported = false;
    const candidatesToTry = forceTopCandidates
      ? candidates.slice(0, 3)
      : candidates.filter((item) => item.score >= YOUTUBE_MATCH_MIN_FOR_TRY).slice(0, 3);

    for (const candidate of candidatesToTry) {
      const url = `https://www.youtube.com/watch?v=${candidate.videoId}`;
      attemptedCount += 1;
      const ok = await importMetaFromUrl(url, { targetVideoId: video.id, showAlert: false });
      if (ok) {
        importedCount += 1;
        imported = true;
        if (candidate.score < YOUTUBE_MATCH_HIGH_CONFIDENCE) {
          reviewItems.push({
            id: video.id,
            title: video.title,
            normalizedTitle: query,
            youtube: {
              videoId: candidate.videoId,
              url,
              matchedTitle: candidate.title,
              score: candidate.score,
              confidence: candidate.score >= YOUTUBE_MATCH_LOW_CONFIDENCE ? "low" : "needs_review",
              candidates: candidates.slice(0, 3),
              searchSource: cached.source,
              searchError: cached.error || undefined,
            },
          });
        }
        break;
      }
      await sleep(120);
    }

    if (!imported) {
      const best = candidates[0];
      reviewItems.push({
        id: video.id,
        title: video.title,
        normalizedTitle: query,
        youtube: {
          confidence: "needs_review",
          score: best?.score || 0,
          candidates: candidates.slice(0, 3),
              searchSource: cached.source,
              searchError: cached.error || undefined,
        },
      });
    }

    processed += 1;
    updateImportStatus(processed, stepTotal);
    if (importLabel) {
      importLabel.textContent = `Импорт метаданных: ${i + 1} / ${targets.length}`;
    }
    await sleep(100);
  }

  resetImportStatus();
  renderVideos({ reset: true });

  if (reviewItems.length) {
    const blob = new Blob([JSON.stringify({ items: reviewItems }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mytube-autoparse-review-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  alert(`Автопарсинг завершен. Обновлено: ${importedCount} / ${targets.length}. Попыток импорта: ${attemptedCount}. ${reviewItems.length ? "Файл для проверки совпадений скачан." : ""}`);
};

const autoParseLibrary = async () => runAutoParse();

const autoParseFirst20 = async () => runAutoParse({ limit: 20, forceTopCandidates: true });

const hasMeaningfulYoutubeImport = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  const views = payload.stats?.views;
  const likes = payload.stats?.likes;
  const commentsFromStats = payload.stats?.comments;
  const commentsLength = Array.isArray(payload.comments) ? payload.comments.length : 0;
  return Number.isFinite(views) || Number.isFinite(likes) || Number.isFinite(commentsFromStats) || commentsLength > 0;
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
    new RegExp(`\"${marker}\"`),
    new RegExp(marker),
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

const collectCommentThreadRenderers = (node, bucket = []) => {
  if (!node || typeof node !== "object") return bucket;
  if (Array.isArray(node)) {
    node.forEach((item) => collectCommentThreadRenderers(item, bucket));
    return bucket;
  }
  if (node.commentThreadRenderer) bucket.push(node.commentThreadRenderer);
  Object.values(node).forEach((value) => collectCommentThreadRenderers(value, bucket));
  return bucket;
};

const parseReplyRenderer = (renderer, idx = 0) => {
  if (!renderer) return null;
  const text = readTextLike(renderer.contentText).trim();
  if (!text) return null;
  return {
    id: renderer.commentId || `reply-${idx}`,
    author: readTextLike(renderer.authorText).trim() || "YouTube user",
    text,
    createdAt: Date.now(),
  };
};

const collectCommentRenderersFromRawHtml = (htmlText) => {
  if (!htmlText) return [];
  const markers = ["\"commentRenderer\":", "\\\"commentRenderer\\\":"];
  const seen = new Set();
  const bucket = [];

  markers.forEach((marker) => {
    let idx = 0;
    while (idx >= 0) {
      idx = htmlText.indexOf(marker, idx);
      if (idx < 0) break;
      const start = htmlText.indexOf("{", idx + marker.length);
      if (start < 0) break;

      const parsed = parseObjectFromIndex(htmlText, start);
      if (parsed && parsed.commentId) {
        const key = `${parsed.commentId}-${readTextLike(parsed.authorText)}-${readTextLike(parsed.contentText)}`;
        if (!seen.has(key)) {
          seen.add(key);
          bucket.push(parsed);
        }
      }

      idx = start + 1;
    }
  });

  if (bucket.length) return bucket;

  // Some saved pages keep JSON fully escaped inside script strings.
  const unescaped = htmlText.replace(/\\\"/g, '"');
  let idx = 0;
  while (idx >= 0) {
    idx = unescaped.indexOf("\"commentRenderer\":", idx);
    if (idx < 0) break;
    const start = unescaped.indexOf("{", idx + 18);
    if (start < 0) break;
    const parsed = parseObjectFromIndex(unescaped, start);
    if (parsed && parsed.commentId) {
      const key = `${parsed.commentId}-${readTextLike(parsed.authorText)}-${readTextLike(parsed.contentText)}`;
      if (!seen.has(key)) {
        seen.add(key);
        bucket.push(parsed);
      }
    }
    idx = start + 1;
  }

  return bucket;
};

const parseThreadRenderer = (thread, order = 0) => {
  const renderer = thread?.comment?.commentRenderer;
  if (!renderer) return null;

  const text = readTextLike(renderer.contentText).trim();
  if (!text) return null;

  const likeText =
    readTextLike(renderer.voteCount) ||
    renderer.voteCount?.accessibility?.accessibilityData?.label ||
    "";

  const replyNodes = thread?.replies?.commentRepliesRenderer?.contents || [];
  const replies = Array.isArray(replyNodes)
    ? replyNodes
        .map((item, idx) => parseReplyRenderer(item?.commentRenderer, idx))
        .filter(Boolean)
    : [];

  const replyCount = parseCompactNumber(
    readTextLike(thread?.replies?.commentRepliesRenderer?.moreText) ||
      thread?.replies?.commentRepliesRenderer?.moreText?.accessibility?.accessibilityData?.label ||
      ""
  );

  return normalizeComment({
    id: renderer.commentId || crypto.randomUUID(),
    author: readTextLike(renderer.authorText).trim() || "YouTube user",
    text,
    likes: parseCompactNumber(likeText) || 0,
    createdAt: Date.now(),
    replies,
    order,
    replyCount: Number.isFinite(replyCount) ? Math.max(replyCount, replies.length) : replies.length,
  }, readTextLike(renderer.authorText).trim() || "YouTube user");
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

const decodePdfString = (value = "") => value
  .replace(/\\\(([\s\S])/g, "($1")
  .replace(/\\\)([\s\S])/g, ")$1")
  .replace(/\\n/g, "\n")
  .replace(/\\r/g, "\r")
  .replace(/\\t/g, "\t")
  .replace(/\\b/g, "\b")
  .replace(/\\f/g, "\f")
  .replace(/\\\\/g, "\\")
  .replace(/\\([0-7]{1,3})/g, (_m, oct) => String.fromCharCode(Number.parseInt(oct, 8)));

const extractPdfTextOperators = (chunk = "") => {
  const parts = [];

  const tjRegex = /\[((?:.|\n|\r)*?)\]\s*TJ/g;
  let tjMatch;
  while ((tjMatch = tjRegex.exec(chunk))) {
    const segment = tjMatch[1] || "";
    const tokens = segment.match(/\((?:\\.|[^\\)])*\)/g) || [];
    tokens.forEach((token) => {
      const value = token.slice(1, -1);
      const decoded = decodePdfString(value);
      if (decoded.trim()) parts.push(decoded);
    });
  }

  const tRegex = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let tMatch;
  while ((tMatch = tRegex.exec(chunk))) {
    const token = tMatch[0].replace(/\)\s*Tj$/, "").replace(/^\(/, "");
    const decoded = decodePdfString(token);
    if (decoded.trim()) parts.push(decoded);
  }

  return parts
    .join("\n")
    .replace(/[\u0000-\u001F]+/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const inflatePdfStream = async (streamBytes) => {
  if (!streamBytes?.length || typeof DecompressionStream === "undefined") return "";
  try {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    await writer.write(streamBytes);
    await writer.close();
    const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder("latin1").decode(new Uint8Array(decompressedBuffer));
  } catch (_error) {
    return "";
  }
};

const extractPdfTextPages = async (file) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const raw = new TextDecoder("latin1").decode(bytes);

  const pageChunks = raw.split(/\b\/Type\s*\/Page\b/g);
  const pages = pageChunks.length > 1 ? pageChunks.slice(1) : [raw];

  const decodedPages = [];

  for (let index = 0; index < pages.length; index += 1) {
    const chunk = pages[index];
    let text = extractPdfTextOperators(chunk);

    if (!text) {
      // Fallback for compressed content streams (/FlateDecode).
      const streamRegex = /<<(?:.|\n|\r)*?\/FlateDecode(?:.|\n|\r)*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match;
      const extractedFromStreams = [];
      while ((match = streamRegex.exec(chunk))) {
        const binaryStream = match[1] || "";
        const streamBytes = new Uint8Array(binaryStream.length);
        for (let i = 0; i < binaryStream.length; i += 1) {
          streamBytes[i] = binaryStream.charCodeAt(i) & 0xff;
        }
        // eslint-disable-next-line no-await-in-loop
        const inflated = await inflatePdfStream(streamBytes);
        if (!inflated) continue;
        const inflatedText = extractPdfTextOperators(inflated);
        if (inflatedText) extractedFromStreams.push(inflatedText);
      }
      text = extractedFromStreams.join("\n").trim();
    }

    if (!text) {
      // Last fallback: keep visible URL-ish and handle-like text from raw bytes.
      const urlHits = chunk.match(/https?:\/\/[^\s<>()"']+/g) || [];
      const handleHits = chunk.match(/@[\w.\-]{3,}/g) || [];
      text = [...urlHits, ...handleHits].join("\n").trim();
    }

    if (text) {
      decodedPages.push({ page: index + 1, text });
    }
  }

  return decodedPages.filter((item) => item.text);
};

const normalizePdfNumber = (value = "") => {
  const normalized = `${value}`
    .toLowerCase()
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return parseCompactNumber(normalized);
};

const parseYoutubePdfPayload = async (file) => {
  const pages = await extractPdfTextPages(file);
  if (!pages.length) return null;

  const lines = [];
  pages.forEach(({ page, text }) => {
    text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .forEach((line) => lines.push({ page, line }));
  });

  const wholeText = lines.map((item) => item.line).join("\n");
  const commentStartIndex = lines.findIndex((item) => /(комментар|comments|сначала новые|top comments|@)/i.test(item.line));
  const commentLines = commentStartIndex >= 0 ? lines.slice(commentStartIndex) : lines;

  const markerRegex = /(ответить|reply)/i;
  const handleRegex = /@[\w.\-]+/;
  const stopLineRegex = /^(поделиться|изменено|назад|watch|смотреть|просмотров|views|subscriber|подписчик)/i;

  const blocks = [];
  let current = null;
  let commentMarkersSeen = 0;

  commentLines.forEach((item, index) => {
    const text = item.line;
    if (markerRegex.test(text)) {
      commentMarkersSeen += 1;
    }

    const isStart = handleRegex.test(text) || (!stopLineRegex.test(text) && /[\p{L}\p{N}]{3,}/u.test(text) && index + 1 < commentLines.length && markerRegex.test(commentLines[index + 1].line));

    if (isStart) {
      if (current && current.lines.length) {
        blocks.push(current);
      }
      current = { page: item.page, lines: [text] };
      return;
    }

    if (!current) return;
    if (stopLineRegex.test(text) && !markerRegex.test(text)) return;
    current.lines.push(text);
  });

  if (current && current.lines.length) {
    blocks.push(current);
  }

  const seen = new Set();
  const comments = [];

  blocks.forEach((block, index) => {
    const joined = block.lines.join("\n");
    const authorHandle = (joined.match(handleRegex) || [null])[0];
    const textLines = block.lines.filter((line) => !markerRegex.test(line) && !/@[\w.\-]+/.test(line) && !stopLineRegex.test(line));
    const text = textLines.join(" ").replace(/\s+/g, " ").trim();
    if (!text) return;

    const repliesMatch = joined.match(/(\d+)\s*ответ/i);
    const repliesCount = repliesMatch ? Number.parseInt(repliesMatch[1], 10) : 0;
    const numericCandidates = block.lines
      .map((line) => normalizePdfNumber(line))
      .filter((value) => Number.isFinite(value));
    const likes = numericCandidates.length ? numericCandidates[numericCandidates.length - 1] : 0;

    const dedupeKey = `${authorHandle || "no_author"}-${text.toLowerCase().replace(/\s+/g, " ")}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const confidence = Math.max(0.35, Math.min(0.98, wordCount > 3 ? 0.85 : 0.55));

    comments.push({
      id: `pdf-comment-${index}-${crypto.randomUUID()}`,
      author: authorHandle || "YouTube user",
      author_handle: authorHandle,
      text,
      likes,
      dislikes: 0,
      replyCount: repliesCount,
      replies: [],
      order: index,
      source_page: block.page,
      confidence,
      createdAt: Date.now(),
    });
  });

  const viewsMatch = wholeText.match(/([\d\s.,]+(?:тыс\.?|млн\.?|млрд\.?|k|m|b)?)\s*(просмотр|views)/i);
  const likesMatch = wholeText.match(/([\d\s.,]+(?:тыс\.?|млн\.?|млрд\.?|k|m|b)?)\s*(лайк|likes?)/i);
  const sourceUrlMatch = wholeText.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})/i);
  const titleGuess = (lines.find((item) => item.line.length > 8 && !/(youtube|комментар|views|просмотр)/i.test(item.line)) || {}).line || "";

  const commentsExtracted = comments.length;
  const warnings = [];
  if (commentMarkersSeen > 0 && commentsExtracted < commentMarkersSeen * 0.9) {
    warnings.push("possible_comment_loss");
  }

  return {
    title: titleGuess,
    channelName: "",
    sourceUrl: sourceUrlMatch ? sourceUrlMatch[0] : "",
    stats: {
      views: viewsMatch ? normalizePdfNumber(viewsMatch[1]) : null,
      likes: likesMatch ? normalizePdfNumber(likesMatch[1]) : null,
      dislikes: null,
      comments: commentsExtracted,
    },
    comments,
    meta: {
      comments_extracted: commentsExtracted,
      comment_markers_seen: commentMarkersSeen,
      warnings,
    },
  };
};

const parseYoutubeHtmlPayload = (htmlText) => {
  const playerData = parseInitialJson(htmlText, "ytInitialPlayerResponse") || {};
  const initialData = parseInitialJson(htmlText, "ytInitialData") || {};
  const details = playerData.videoDetails || {};
  const commentsRaw = collectCommentThreadRenderers(initialData);
  let comments = commentsRaw
    .map((thread, index) => parseThreadRenderer(thread, index))
    .filter(Boolean);

  if (!comments.length) {
    const rawComments = collectCommentRenderersFromRawHtml(htmlText);
    comments = rawComments
      .map((renderer, index) => {
        const author = readTextLike(renderer.authorText).trim() || "YouTube user";
        const text = readTextLike(renderer.contentText).trim();
        if (!text) return null;
        const likes = parseCompactNumber(
          readTextLike(renderer.voteCount) ||
            renderer.voteCount?.accessibility?.accessibilityData?.label ||
            ""
        );
        return normalizeComment({
          id: renderer.commentId || crypto.randomUUID(),
          author,
          text,
          likes: likes || 0,
          createdAt: Date.now(),
          replies: [],
          order: index,
          replyCount: 0,
        }, author);
      })
      .filter(Boolean);
  }

  const viewCount =
    parseCompactNumber(details.viewCount) ||
    parseCompactNumber(playerData?.microformat?.playerMicroformatRenderer?.viewCount) ||
    parseCompactNumber(playerData?.videoDetails?.shortViewCountText?.simpleText);
  const likes = parseLikeCountFromInitialData(initialData);

  return {
    title: details.title || "",
    channelName: details.author || "",
    thumbnail: details.thumbnail?.thumbnails?.at?.(-1)?.url || "",
    sourceVideoId: details.videoId || "",
    stats: {
      views: viewCount,
      likes,
      dislikes: null,
      comments: comments.length,
    },
    comments,
  };
};


const loadWatchedHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("mytube-watched-history") || "[]");
    if (Array.isArray(saved)) {
      state.watchedHistory = saved;
    }
  } catch (error) {
    console.warn("Не удалось загрузить историю просмотров", error);
  }
};

const saveWatchedHistory = () => {
  try {
    localStorage.setItem("mytube-watched-history", JSON.stringify(state.watchedHistory));
  } catch (error) {
    console.warn("Не удалось сохранить историю просмотров", error);
  }
};

const recordWatch = (video) => {
  if (!video) return;
  const existingIndex = state.watchedHistory.findIndex((entry) => entry.id === video.id);
  const record = {
    id: video.id,
    title: video.title,
    watchedAt: Date.now(),
  };
  if (existingIndex >= 0) {
    state.watchedHistory.splice(existingIndex, 1);
  }
  state.watchedHistory.unshift(record);
  state.watchedHistory = state.watchedHistory.slice(0, 200);
  saveWatchedHistory();
  if (state.historyMode) {
    renderVideos({ reset: true });
  }
};

const buildBackupData = () => ({
  version: 1,
  createdAt: Date.now(),
  folders: state.folders.map((folder) => ({
    name: folder.name,
  })),
  videos: state.videos.map((video) => ({
    title: video.title,
    folderName: video.folderName,
    channelName: video.channelName,
    relativePath: video.relativePath,
    createdAt: video.createdAt,
    duration: video.duration,
    durationLabel: video.durationLabel,
    thumbnail: video.thumbnail,
    likes: video.likes,
    dislikes: video.dislikes,
    comments: video.comments,
    imported: video.imported,
    progress: video.progress,
    watched: video.watched,
    fileKey: video.fileKey,
  })),
  watchedHistory: state.watchedHistory,
});

const exportBackup = () => {
  const data = buildBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mytube-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const mergeBackup = async (data) => {
  const folders = Array.isArray(data.folders) ? data.folders : [];
  const videos = Array.isArray(data.videos) ? data.videos : [];
  const watchedHistory = Array.isArray(data.watchedHistory) ? data.watchedHistory : [];
  if (watchedHistory.length) {
    state.watchedHistory = watchedHistory.slice(0, 200);
    saveWatchedHistory();
  }
  if (folders.length) {
    const folderNames = new Set(folders.map((folder) => folder.name).filter(Boolean));
    await ensureFolders(folderNames);
  }
  if (!videos.length) {
    renderVideos({ reset: true });
    return;
  }
  const existingKeys = new Set(state.videos.map((video) => video.fileKey).filter(Boolean));
  const existingTitlesByFolder = new Map();
  state.videos.forEach((video) => {
    const folder = video.folderName || "";
    const titleSet = existingTitlesByFolder.get(folder) || new Set();
    titleSet.add(video.title);
    existingTitlesByFolder.set(folder, titleSet);
  });
  for (const video of videos) {
    if (!video || !video.title) continue;
    if (video.fileKey && existingKeys.has(video.fileKey)) continue;
    const folderKey = video.folderName || "";
    const titleSet = existingTitlesByFolder.get(folderKey) || new Set();
    if (titleSet.has(video.title)) continue;
    const record = {
      id: `backup-${crypto.randomUUID()}`,
      title: video.title,
      folderName: folderKey,
      channelName: video.channelName || folderKey,
      relativePath: video.relativePath,
      createdAt: video.createdAt || Date.now(),
      duration: video.duration,
      durationLabel: video.durationLabel,
      thumbnail: video.thumbnail,
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      comments: Array.isArray(video.comments) ? video.comments.map((comment) => normalizeComment(comment, comment.author)) : [],
      imported: video.imported || null,
      progress: video.progress || 0,
      watched: Boolean(video.watched),
      fileKey: video.fileKey,
      handle: null,
      file: null,
    };
    state.videos.push(record);
    if (record.fileKey) {
      existingKeys.add(record.fileKey);
    }
    titleSet.add(record.title);
    existingTitlesByFolder.set(folderKey, titleSet);
    await putItem(VIDEO_STORE, record);
  }
  renderVideos({ reset: true });
};

const loadState = async () => {
  const [videos, folders] = await Promise.all([
    getAll(VIDEO_STORE),
    getAll(FOLDER_STORE),
  ]);
  state.videos = (videos || []).map((video) => {
    const comments = Array.isArray(video.comments)
      ? video.comments
          .map((comment) => normalizeComment(comment, comment?.author || "Вы"))
          .filter((comment) => comment.text || (comment.replies && comment.replies.length))
      : video.comment
      ? [
          normalizeComment({
            id: crypto.randomUUID(),
            author: "Вы",
            text: video.comment,
            createdAt: Date.now(),
          }),
        ]
      : [];

    return {
      ...video,
      comments,
      imported: video.imported || null,
      watched: Boolean(video.watched),
    };
  });
  state.folders = folders || [];
  state.shuffledIds = [];
  loadWatchedHistory();
  renderFolders();
  renderVideos({ reset: true });
  await normalizeVideoMetadata();
};

const normalizeVideoMetadata = async () => {
  let updated = false;
  for (const video of state.videos) {
    if (video.createdAt && video.fileKey) continue;
    try {
      const file = await getVideoFile(video);
      if (!video.createdAt) {
        video.createdAt = file.lastModified || Date.now();
      }
      if (!video.fileKey) {
        video.fileKey = buildFileKey(file);
      }
      await putItem(VIDEO_STORE, video);
      updated = true;
    } catch (error) {
      console.warn("Не удалось обновить метаданные видео", error);
    }
  }
  if (updated) {
    renderVideos({ reset: true });
  }
};

const renderFolders = () => {
  folderList.innerHTML = "";
  state.folders.forEach((folder) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = folder.name;
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn btn";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await removeFolder(folder.id);
    });
    li.addEventListener("click", () => {
      state.activeFolder = folder.name;
      state.shuffleMode = false;
      state.historyMode = false;
      state.shuffledIds = [];
      switchView("library");
      renderFolders();
      renderVideos({ reset: true });
    });
    if (state.activeFolder === folder.name) {
      li.classList.add("active");
    }
    li.append(label, deleteButton);
    folderList.appendChild(li);
  });
};

const getFilteredVideos = () => {
  let base = state.videos;
  if (state.historyMode) {
    const historyMap = new Map(state.videos.map((video) => [video.id, video]));
    base = state.watchedHistory
      .slice()
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .map((entry) => historyMap.get(entry.id))
      .filter(Boolean);
    return base;
  }
  if (state.shuffleMode) {
    if (!state.shuffledIds.length) {
      state.shuffledIds = shuffle(state.videos).map((video) => video.id);
    }
    base = state.shuffledIds
      .map((id) => state.videos.find((video) => video.id === id))
      .filter(Boolean);
  }
  if (state.activeFolder) {
    base = base.filter((video) => video.folderName === state.activeFolder);
  }
  if (state.videoTypeFilter === "shorts") {
    base = base.filter((video) => video.duration && video.duration <= 60);
  } else if (state.videoTypeFilter === "regular") {
    base = base.filter((video) => !video.duration || video.duration > 60);
  }
  if (state.durationMin !== null) {
    base = base.filter((video) => (video.duration || 0) / 60 >= state.durationMin);
  }
  if (state.durationMax !== null) {
    base = base.filter((video) => (video.duration || 0) / 60 <= state.durationMax);
  }
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    base = base.filter((video) => video.title.toLowerCase().includes(term));
  }
  if (state.dateSort === "newest") {
    base = [...base].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (state.dateSort === "oldest") {
    base = [...base].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
  return base;
};

const setHistoryFeed = () => {
  state.activeFolder = null;
  state.searchTerm = "";
  if (searchInput) {
    searchInput.value = "";
  }
  state.shuffleMode = false;
  state.historyMode = true;
  state.shuffledIds = [];
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === "regular");
  });
  switchView("library");
  renderFolders();
  renderVideos({ reset: true });
};

const setShuffleFeed = () => {
  state.activeFolder = null;
  state.searchTerm = "";
  if (searchInput) {
    searchInput.value = "";
  }
  state.videoTypeFilter = "regular";
  state.historyMode = false;
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === "regular");
  });
  state.shuffleMode = true;
  state.shuffledIds = shuffle(state.videos).map((video) => video.id);
  switchView("library");
  renderFolders();
  renderVideos({ reset: true });
};

const buildVideoCard = (video) => {
  const card = videoCardTemplate.content.cloneNode(true);
  card.querySelector(".title").textContent = video.title;
  card.querySelector(".duration").textContent = video.durationLabel || "--:--";
  card.querySelector(".meta").textContent = video.channelName || video.folderName || "Без папки";
  const element = card.querySelector(".video-card");
  const thumbnail = card.querySelector(".thumbnail");
  const progressFill = card.querySelector(".progress-fill");
  if (video.thumbnail) {
    thumbnail.style.backgroundImage = `url(${video.thumbnail})`;
  } else {
    thumbnail.style.backgroundImage = "";
  }
  if (progressFill) {
    const percent = video.duration ? Math.min(100, (video.progress / video.duration) * 100) : 0;
    progressFill.style.width = `${percent}%`;
  }
  if (video.watched) {
    element.classList.add("is-watched");
  }
  element.dataset.videoId = video.id;
  const deleteBtn = card.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    await removeVideo(video.id);
  });
  element.addEventListener("click", () => openVideo(video.id));
  return card;
};

const renderVideos = ({ reset = false } = {}) => {
  const filtered = getFilteredVideos();
  if (reset) {
    videoGrid.innerHTML = "";
    state.renderedCount = 0;
    state.visibleCount = Math.min(PAGE_SIZE, filtered.length);
  }

  const targetCount = Math.min(state.visibleCount, filtered.length);
  videoCount.textContent = `${filtered.length} видео`;
  const slice = filtered.slice(state.renderedCount, targetCount);
  slice.forEach((video) => {
    videoGrid.appendChild(buildVideoCard(video));
  });
  state.renderedCount = targetCount;
  renderFolderParseTools();
};


const renderFolderParseTools = () => {
  if (!folderParseTools || !channelUrlInput || !folderParseTitle) return;
  const isVisible = Boolean(state.activeFolder);
  folderParseTools.classList.toggle("hidden", !isVisible);
  if (!isVisible) {
    folderParseTitle.textContent = "";
    channelUrlInput.value = "";
    return;
  }
  folderParseTitle.textContent = `Парсинг только для папки: ${state.activeFolder}`;
  channelUrlInput.value = getActiveFolderChannelUrl();
};

const updateWatchedIndicator = (videoId, watched) => {
  const card = videoGrid.querySelector(`[data-video-id="${videoId}"]`);
  if (!card) return;
  card.classList.toggle("is-watched", Boolean(watched));
};

const updateProgressIndicator = (videoId, progress, duration) => {
  const card = videoGrid.querySelector(`[data-video-id="${videoId}"]`);
  if (!card) return;
  const fill = card.querySelector(".progress-fill");
  if (!fill) return;
  const percent = duration ? Math.min(100, (progress / duration) * 100) : 0;
  fill.style.width = `${percent}%`;
};

const shouldIncludeVideo = (video) => {
  if (state.activeFolder && video.folderName !== state.activeFolder) return false;
  if (state.videoTypeFilter === "shorts") {
    if (!video.duration || video.duration > 60) return false;
  } else if (state.videoTypeFilter === "regular") {
    if (video.duration && video.duration <= 60) return false;
  }
  if (state.durationMin !== null && (video.duration || 0) / 60 < state.durationMin) {
    return false;
  }
  if (state.durationMax !== null && (video.duration || 0) / 60 > state.durationMax) {
    return false;
  }
  if (state.searchTerm) {
    return video.title.toLowerCase().includes(state.searchTerm.toLowerCase());
  }
  return true;
};

const appendVideoToGrid = (video) => {
  if (!shouldIncludeVideo(video)) return;
  if (state.shuffleMode) {
    state.shuffledIds.push(video.id);
  }
  state.visibleCount = Math.min(state.visibleCount + 1, getFilteredVideos().length);
  videoGrid.appendChild(buildVideoCard(video));
  state.renderedCount = videoGrid.children.length;
  videoCount.textContent = `${getFilteredVideos().length} видео`;
};

const renderRecommendations = (currentVideo) => {
  recommendations.innerHTML = "";
  const words = extractWords(currentVideo.title);
  const sorted = [...state.videos]
    .filter((video) => video.id !== currentVideo.id)
    .filter((video) => !video.duration || video.duration > 60)
    .map((video) => ({
      video,
      score: scoreMatch(video.title, words),
    }))
    .sort((a, b) => b.score - a.score || a.video.title.localeCompare(b.video.title));

  const picks = sorted.slice(0, 8).map((item) => item.video);
  picks.forEach((video) => {
    const card = recommendationTemplate.content.cloneNode(true);
    card.querySelector(".title").textContent = video.title;
    card.querySelector(".meta").textContent = `${video.durationLabel || "--:--"} • ${
      video.channelName || video.folderName || "Без папки"
    }`;
    const element = card.querySelector(".recommendation");
    element.addEventListener("click", () => openVideo(video.id));
    recommendations.appendChild(card);
  });
};

const renderComments = (video) => {
  commentList.innerHTML = "";
  const comments = (video.comments || [])
    .map((comment, index) => normalizeComment({ ...comment, order: Number.isFinite(comment.order) ? comment.order : index }, comment.author))
    .sort((a, b) => a.order - b.order);
  video.comments = comments;
  if (!comments.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Комментариев пока нет.";
    commentList.appendChild(empty);
    return;
  }

  comments.forEach((comment) => {
    const wrapper = document.createElement("div");
    wrapper.className = "comment";
    wrapper.dataset.commentId = comment.id;

    const header = document.createElement("div");
    header.className = "comment-header";
    const author = document.createElement("strong");
    author.textContent = comment.author || "Пользователь";
    const time = document.createElement("time");
    time.textContent = new Date(comment.createdAt).toLocaleString("ru-RU");
    header.append(author, time);

    const textNode = document.createElement("p");
    textNode.innerHTML = formatCommentText(comment.text || "");

    const actions = document.createElement("div");
    actions.className = "comment-actions";
    actions.innerHTML = `
      <button class="btn" data-action="like-comment" data-comment-id="${comment.id}">👍 ${comment.likes || 0}</button>
      <button class="btn" data-action="dislike-comment" data-comment-id="${comment.id}">👎 ${comment.dislikes || 0}</button>
      <button class="btn" data-action="reply-comment" data-comment-id="${comment.id}">Ответить</button>
    `;

    const replies = document.createElement("div");
    replies.className = `comment-replies ${comment.repliesExpanded ? "" : "is-collapsed"}`.trim();
    (comment.replies || []).forEach((reply) => {
      const item = document.createElement("div");
      item.className = "reply-item";
      item.innerHTML = `<b>${escapeHtml(reply.author || "Вы")}</b>: ${formatCommentText(reply.text || "")}`;
      replies.appendChild(item);
    });

    const replyButton = document.createElement("button");
    replyButton.className = "btn comment-thread-more";
    replyButton.dataset.action = "toggle-replies";
    replyButton.dataset.commentId = comment.id;
    const totalReplies = Number.isFinite(comment.replyCount) ? comment.replyCount : (comment.replies || []).length;
    replyButton.textContent = comment.repliesExpanded
      ? "Скрыть ответы"
      : `Подробнее (${totalReplies})`;
    if (!totalReplies) {
      replyButton.disabled = true;
    }

    wrapper.append(header, textNode, actions, replyButton, replies);
    commentList.appendChild(wrapper);
  });
};



const switchView = (view) => {
  watchView.classList.remove("active");
  shortsView.classList.remove("active");
  libraryView.classList.remove("active");
  if (profileView) {
    profileView.classList.remove("active");
  }
  if (urlFillerView) {
    urlFillerView.classList.remove("active");
  }
  if (view === "watch") {
    watchView.classList.add("active");
    stopShortsPlayback();
  } else if (view === "shorts") {
    shortsView.classList.add("active");
    stopMainPlayback();
  } else if (view === "url-filler" && urlFillerView) {
    urlFillerView.classList.add("active");
    stopMainPlayback();
    stopShortsPlayback();
  } else if (view === "profile" && profileView) {
    profileView.classList.add("active");
    stopMainPlayback();
    stopShortsPlayback();
  } else {
    libraryView.classList.add("active");
    stopMainPlayback();
    stopShortsPlayback();
  }
};

const getUrlFillerTargets = () => {
  const targets = state.videos.filter((video) => shouldAutoparseVideo(video));
  if (targets.length) return targets;
  return state.videos;
};

const getUrlFillerCurrentVideo = () => {
  const id = state.urlFillerQueue[state.urlFillerIndex];
  if (!id) return null;
  return state.videos.find((video) => video.id === id) || null;
};

const renderUrlFiller = () => {
  if (!urlFillerVideoTitle || !urlFillerChannelName || !urlFillerProgress) return;

  const total = state.urlFillerQueue.length;
  if (!total) {
    urlFillerProgress.textContent = "Нет видео для заполнения";
    urlFillerVideoTitle.textContent = "Все видео заполнены";
    urlFillerChannelName.textContent = "";
    return;
  }

  const current = getUrlFillerCurrentVideo();
  if (!current) {
    urlFillerProgress.textContent = "Нет текущего видео";
    urlFillerVideoTitle.textContent = "—";
    urlFillerChannelName.textContent = "—";
    return;
  }

  urlFillerProgress.textContent = `Видео ${state.urlFillerIndex + 1} из ${total}`;
  urlFillerVideoTitle.textContent = current.title || "Без названия";
  urlFillerChannelName.textContent = current.channelName || current.folderName || "Канал не указан";
};

const openUrlFiller = () => {
  const targets = getUrlFillerTargets();
  state.urlFillerQueue = targets.map((video) => video.id);
  state.urlFillerIndex = 0;
  switchView("url-filler");
  renderUrlFiller();
};

const moveUrlFillerNext = () => {
  if (!state.urlFillerQueue.length) return;
  if (state.urlFillerIndex < state.urlFillerQueue.length - 1) {
    state.urlFillerIndex += 1;
    renderUrlFiller();
    return;
  }

  alert("Готово: достигнут конец списка видео.");
  state.urlFillerQueue = [];
  state.urlFillerIndex = 0;
  renderUrlFiller();
};

const openVideo = async (videoId) => {
  const video = state.videos.find((item) => item.id === videoId);
  if (!video) return;
  state.activeVideoId = videoId;
  switchView("watch");
  watchTitle.textContent = video.title;
  likeCount.textContent = video.likes || 0;
  dislikeCount.textContent = video.dislikes || 0;
  commentInput.value = "";
  renderComments(video);
  renderImportedStats(video);

  const file = await getVideoFile(video);
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.currentTime = video.progress || 0;
  videoPlayer.play();
  if (!video.watched) {
    video.watched = true;
    await updateActiveVideo({ watched: true });
    updateWatchedIndicator(video.id, true);
  }
  recordWatch(video);
  progressLabel.textContent =
    video.progress && video.duration
      ? `Последняя остановка: ${humanizeDuration(video.progress)} / ${video.durationLabel}`
      : "";

  renderRecommendations(video);
};

const refreshVideoMetadata = async (video) => {
  const file = await getVideoFile(video);
  const tempUrl = URL.createObjectURL(file);
  const tempVideo = document.createElement("video");
  tempVideo.preload = "metadata";
  tempVideo.src = tempUrl;

  const duration = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(Number.NaN), 2000);
    tempVideo.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve(tempVideo.duration);
    };
    tempVideo.onerror = () => {
      clearTimeout(timeout);
      resolve(Number.NaN);
    };
  });

  let thumbnail = "";
  if (Number.isFinite(duration) && duration > 0) {
    const target = Math.min(duration - 0.2, Math.max(0.2, Math.random() * duration));
    await new Promise((resolve) => {
      tempVideo.onseeked = () => resolve();
      tempVideo.onerror = () => resolve();
      tempVideo.currentTime = target;
    });
    const canvas = document.createElement("canvas");
    const ratio = tempVideo.videoWidth && tempVideo.videoHeight
      ? tempVideo.videoWidth / tempVideo.videoHeight
      : 16 / 9;
    canvas.width = 320;
    canvas.height = Math.round(canvas.width / ratio);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
      thumbnail = canvas.toDataURL("image/jpeg", 0.8);
    }
  }
  URL.revokeObjectURL(tempUrl);

  return {
    duration,
    durationLabel: humanizeDuration(duration),
    thumbnail,
    createdAt: file.lastModified || Date.now(),
    fileKey: buildFileKey(file),
  };
};

const walkFolder = async (
  directoryHandle,
  rootName,
  path = "",
  files = [],
  folderHandles = new Map()
) => {
  try {
    for await (const entry of directoryHandle.values()) {
      try {
        if (entry.kind === "file") {
          if (entry.name.match(/\.(mp4|webm|mkv|mov)$/i)) {
            const relativePath = path ? `${path}/${entry.name}` : entry.name;
            files.push({
              handle: entry,
              parentPath: path ? `${rootName}/${path}` : rootName,
              relativePath,
            });
          }
        } else if (entry.kind === "directory") {
          const permitted = await verifyPermission(entry);
          if (!permitted) {
            console.warn(`Нет доступа к подпапке ${entry.name}`);
            continue;
          }
          const nextPath = path ? `${path}/${entry.name}` : entry.name;
          const folderPath = `${rootName}/${nextPath}`;
          folderHandles.set(folderPath, entry);
          await walkFolder(entry, rootName, nextPath, files, folderHandles);
        }
      } catch (error) {
        console.warn("Не удалось обработать элемент", entry?.name, error);
      }
    }
  } catch (error) {
    console.warn("Не удалось прочитать подпапку", error);
  }
  return { files, folderHandles };
};

// WebKit directory import (input[webkitdirectory]):
// Structure rule (3 levels):
//   Root (selected folder) -> Channel (subfolder) -> Playlist (sub-subfolder)
// Requirements:
// - Do NOT show prefixes like "Root/Channel" in the UI
// - Merge same Channel name across different Roots
// - Videos in Root belong to Root folder; videos in Root/Channel belong to Channel folder
// - Videos in Root/Channel/Playlist belong to Channel folder + playlistName
const buildStructuredEntriesFromFiles = (files) => {
  const entries = [];
  const folderNames = new Set();

  const normalizeFolderName = (name) => (name || "").trim();

  for (const file of files) {
    if (!file || !file.name || !file.name.match(/\.(mp4|webm|mkv|mov)$/i)) continue;

    const rel = file.webkitRelativePath || file.name;
    const parts = rel.split("/").filter(Boolean);
    // For webkitdirectory, parts[0] is the selected root folder name.
    if (parts.length < 2) continue;

    const rootName = normalizeFolderName(parts[0]);
    const pathParts = parts.slice(1, -1); // folders between root and filename
    const channel = normalizeFolderName(pathParts[0] || "");
    const playlist = normalizeFolderName(pathParts[1] || "");

    // Folder shown in library:
    // - root videos -> root folder name
    // - channel videos -> channel folder name (MERGED across roots)
    const folderKey = channel ? channel : rootName;

    folderNames.add(folderKey);

    entries.push({
      handle: null,
      file,
      name: file.name,
      relativePath: rel,
      parentPath: folderKey,

      // metadata for future grouping
      libraryRoot: rootName,
      channelName: channel ? channel : rootName,
      playlistName: channel && playlist ? playlist : null,
    });
  }

  return { entries, folderNames };
};


const updateImportStatus = (processed, total) => {
  if (!importStatus || !importLabel || !importBarFill) return;
  importStatus.classList.remove("hidden");
  importLabel.textContent = `Импорт: ${processed} / ${total}`;
  const percent = total ? Math.round((processed / total) * 100) : 0;
  importBarFill.style.width = `${percent}%`;
};

const resetImportStatus = () => {
  if (!importStatus || !importLabel || !importBarFill) return;
  importStatus.classList.add("hidden");
  importLabel.textContent = "Импорт: 0 / 0";
  importBarFill.style.width = "0%";
};

const ensureFolders = async (folderNames, folderHandles = new Map()) => {
  const existingFolders = new Set(state.folders.map((folder) => folder.name));
  for (const name of folderNames) {
    if (existingFolders.has(name)) continue;
    const folder = {
      id: `${name}-${crypto.randomUUID()}`,
      name,
      handle: folderHandles.get(name),
    };
    state.folders.push(folder);
    await putItem(FOLDER_STORE, folder);
  }
  renderFolders();
};

const importEntries = async (entries, folderHandles = new Map(), rootName = "") => {
  if (!entries.length) {
    alert("Видео не найдены. Проверьте, что папка содержит файлы mp4/webm/mkv/mov.");
    return;
  }

  const uniqueEntries = new Map();
  entries.forEach((entry) => {
    const key = entry.file ? buildFileKey(entry.file) : entry.relativePath;
    if (!uniqueEntries.has(key)) {
      uniqueEntries.set(key, entry);
    }
  });

  // Import can freeze the UI when there are тысячи видео.
  // We chunk work and yield to the browser regularly.
  const YIELD_EVERY = 5;
  const YIELD_DELAY_MS = 0;

  const total = uniqueEntries.size;
  let processed = 0;
  updateImportStatus(processed, total);
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));

  const folderNames = new Set(
    Array.from(uniqueEntries.values(), (entry) => entry.parentPath || rootName)
  );
  if (rootName) {
    folderNames.add(rootName);
  }
  await ensureFolders(folderNames, folderHandles);

  const existingKeys = new Set(state.videos.map((video) => video.fileKey).filter(Boolean));
  const existingTitlesByFolder = new Map();
  state.videos.forEach((video) => {
    const folder = video.folderName || "";
    const titleSet = existingTitlesByFolder.get(folder) || new Set();
    titleSet.add(video.title);
    existingTitlesByFolder.set(folder, titleSet);
  });
  let sinceYield = 0;
  for (const entry of uniqueEntries.values()) {
    let metadata;
    try {
      metadata = await refreshVideoMetadata(entry);
    } catch (error) {
      console.warn("Не удалось прочитать видео", entry.name, error);
      processed += 1;
      sinceYield += 1;
      if (processed === total || sinceYield >= YIELD_EVERY) {
        updateImportStatus(processed, total);
        sinceYield = 0;
        await new Promise((resolve) => setTimeout(resolve, YIELD_DELAY_MS));
      }
      continue;
    }
    processed += 1;
    sinceYield += 1;
    if (processed === total || sinceYield >= YIELD_EVERY) {
      updateImportStatus(processed, total);
    }
    if (metadata.fileKey && existingKeys.has(metadata.fileKey)) {
      if (sinceYield >= YIELD_EVERY) {
        sinceYield = 0;
        await new Promise((resolve) => setTimeout(resolve, YIELD_DELAY_MS));
      }
      continue;
    }
    const title = entry.name.replace(/\.[^.]+$/, "");
    const folderKey = entry.parentPath || rootName;
    const titleSet = existingTitlesByFolder.get(folderKey) || new Set();
    if (titleSet.has(title)) {
      if (sinceYield >= YIELD_EVERY) {
        sinceYield = 0;
        await new Promise((resolve) => setTimeout(resolve, YIELD_DELAY_MS));
      }
      continue;
    }
    const video = {
      id: idFromHandle(entry.handle, crypto.randomUUID(), entry.relativePath),
      title,
      folderName: folderKey,
      channelName: entry.channelName || folderKey,
      playlistName: entry.playlistName || null,
      libraryRoot: entry.libraryRoot || (rootName || null),
      relativePath: entry.relativePath,
      handle: entry.handle,
      file: entry.file,
      ...metadata,
      likes: 0,
      dislikes: 0,
      comments: [],
      progress: 0,
      watched: false,
    };
    state.videos.push(video);
    if (metadata.fileKey) {
      existingKeys.add(metadata.fileKey);
    }
    titleSet.add(title);
    existingTitlesByFolder.set(folderKey, titleSet);
    await putItem(VIDEO_STORE, video);

    // Do not touch DOM per-item: it gets very slow for large imports.
    if (sinceYield >= YIELD_EVERY) {
      updateImportStatus(processed, total);
      sinceYield = 0;
      await new Promise((resolve) => setTimeout(resolve, YIELD_DELAY_MS));
    }
  }

  renderVideos({ reset: true });
  setTimeout(resetImportStatus, 800);
};

const importFolderHandle = async (handle) => {
  const permitted = await verifyPermission(handle);
  if (!permitted) {
    alert("Нужен доступ к папке, чтобы импортировать видео.");
    return;
  }
  const { files: entries, folderHandles } = await walkFolder(handle, handle.name);
  folderHandles.set(handle.name, handle);
  await importEntries(entries, folderHandles, handle.name);
};

const addFolder = async () => {
  if (folderInput) {
    folderInput.click();
    return;
  }
  if (!window.showDirectoryPicker) {
    alert("Ваш браузер не поддерживает выбор папок. Откройте в Chrome/Edge.");
    return;
  }
  if (!window.isSecureContext) {
    alert("Импорт папок работает только на HTTPS или localhost.");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker();
    await importFolderHandle(handle);
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    console.error(error);
    alert("Не удалось импортировать видео. Проверьте доступ к папке.");
  }
};

const handleFolderFiles = async (event) => {
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  if (!files.length) return;
  const entries = [];
  const folderNames = new Set();
  files.forEach((file) => {
    if (!file.name.match(/\.(mp4|webm|mkv|mov)$/i)) return;
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split("/");
    const rootName = parts[0] || "Импорт";
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : rootName;
    folderNames.add(parentPath);
    entries.push({
      handle: null,
      file,
      name: file.name,
      relativePath,
      parentPath,
    });
  });
  if (!entries.length) {
    alert("Видео не найдены. Проверьте, что папка содержит файлы mp4/webm/mkv/mov.");
    return;
  }
  try {
    await ensureFolders(folderNames);
    await importEntries(entries);
  } catch (error) {
    console.error(error);
    alert("Не удалось импортировать видео. Проверьте доступ к папке.");
  }
};

const updateActiveVideo = async (updates) => {
  const video = state.videos.find((item) => item.id === state.activeVideoId);
  if (!video) return;
  Object.assign(video, updates);
  await putItem(VIDEO_STORE, video);
};

const applyImportedDataToVideo = async (video, payload, source, sourceUrl = "") => {
  if (!video || !payload) return;
  const imported = ensureVideoImported(video);
  imported.source = source;
  imported.sourceUrl = sourceUrl;
  imported.importedAt = Date.now();
  imported.sourceVideoId = payload.sourceVideoId || imported.sourceVideoId || "";
  imported.stats = {
    views: payload.stats?.views ?? null,
    likes: payload.stats?.likes ?? null,
    dislikes: payload.stats?.dislikes ?? null,
    comments: payload.stats?.comments ?? (payload.comments || []).length,
  };
  if (payload.title) {
    video.title = payload.title;
    if (state.activeVideoId === video.id && watchTitle) {
      watchTitle.textContent = payload.title;
    }
  }
  if (payload.channelName) {
    video.channelName = payload.channelName;
  }
  if (payload.thumbnail) {
    video.thumbnail = payload.thumbnail;
  }
  if (Array.isArray(payload.comments) && payload.comments.length) {
    video.comments = payload.comments.map((comment, index) => normalizeComment({
      ...comment,
      order: Number.isFinite(comment.order) ? comment.order : index,
    }, comment.author || "YouTube user"));
  }
  await updateActiveVideo({
    title: video.title,
    channelName: video.channelName,
    thumbnail: video.thumbnail,
    comments: video.comments,
    imported,
  });
  renderImportedStats(video);
  renderComments(video);
  renderVideos({ reset: true });
};

const importMetaFromHtmlFile = async (file, options = {}) => {
  const targetVideoId = options.targetVideoId || state.activeVideoId;
  const showAlert = options.showAlert !== false;
  const video = state.videos.find((item) => item.id === targetVideoId);
  if (!video || !file) return false;
  const htmlText = await file.text();
  const payload = parseYoutubeHtmlPayload(htmlText);
  if (!payload.title && !(payload.comments || []).length) {
    if (showAlert) {
      alert("Не удалось распарсить YouTube HTML. Попробуйте сохранить полную страницу видео.");
    }
    return false;
  }
  await applyImportedDataToVideo(video, payload, "youtube_html", "local-html");
  if (showAlert) {
    alert("HTML импорт завершен.");
  }
  return true;
};

const importMetaFromPdfFile = async (file, options = {}) => {
  const targetVideoId = options.targetVideoId || state.activeVideoId;
  const showAlert = options.showAlert !== false;
  const video = state.videos.find((item) => item.id === targetVideoId);
  if (!video || !file) return false;

  const payload = await parseYoutubePdfPayload(file);
  if (payload?.sourceUrl) {
    try {
      const byUrl = await importMetaFromUrl(payload.sourceUrl, {
        targetVideoId,
        showAlert: false,
      });
      if (byUrl) {
        if (showAlert) {
          alert("PDF найден URL YouTube. Данные успешно подтянуты по URL/API.");
        }
        return true;
      }
    } catch (error) {
      console.warn("Не удалось выполнить fallback импорт по URL из PDF", error);
    }
  }

  if (!payload || (!payload.title && !(payload.comments || []).length)) {
    if (showAlert) {
      alert("Не удалось извлечь данные из PDF. Вероятно это скан/изображение или сжатый экспорт без текстового слоя. Попробуйте PDF с текстовым слоем или вставьте URL вручную.");
    }
    return false;
  }

  await applyImportedDataToVideo(video, payload, "youtube_pdf", "local-pdf");

  if (showAlert) {
    const warnings = payload.meta?.warnings || [];
    if (warnings.length) {
      alert(`PDF импорт завершен с предупреждениями: ${warnings.join(", ")}`);
    } else {
      alert("PDF импорт завершен.");
    }
  }
  return true;
};

const importMetaFromUrl = async (inputUrl, options = {}) => {
  const targetVideoId = options.targetVideoId || state.activeVideoId;
  const showAlert = options.showAlert !== false;
  const video = state.videos.find((item) => item.id === targetVideoId);
  if (!video || !inputUrl) return false;
  const id = extractYouTubeVideoId(inputUrl);
  if (!id) {
    if (showAlert) {
      alert("Не удалось определить video id из URL.");
    }
    return false;
  }

  let payload = null;
  let importedSource = "unknown";

  try {
    payload = await fetchYouTubeApiPayload(inputUrl, id);
    importedSource = "youtube-browser-api";
  } catch (error) {
    console.warn("Импорт через YouTube API недоступен, используем fallback по URL.", error);
  }

  if (!payload) {
    payload = {
      sourceVideoId: id,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      stats: {
        views: null,
        likes: null,
        dislikes: null,
        comments: null,
      },
      comments: [],
    };

    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(inputUrl)}`);
      if (response.ok) {
        const data = await response.json();
        payload.title = data.title || "";
        payload.channelName = data.author_name || "";
        payload.thumbnail = data.thumbnail_url || payload.thumbnail;
      }
    } catch (error) {
      console.warn("Не удалось получить oEmbed метаданные, используем только video id.", error);
    }
    importedSource = "oembed-fallback";
  }

  if (!hasMeaningfulYoutubeImport(payload)) {
    if (showAlert) {
      alert("Не удалось загрузить просмотры/лайки/комментарии по URL. Если видите 403, проверьте API KEY (не OAuth client), включен YouTube Data API v3 и сняты/корректно настроены ограничения referrer/quota. Также можно вставить ключ в профиль и оставить поле пустым — приложение попробует резервный ключ.");
    }
    return false;
  }

  await applyImportedDataToVideo(video, payload, "youtube_url", inputUrl);
  if (showAlert) {
    const sourceLabel = importedSource === "youtube-browser-api"
      ? "YouTube API"
      : "fallback";
    alert(`Импорт по URL завершен (${sourceLabel}).`);
  }
  return true;
};

const importVideoDataList = async (file) => {
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.videos) ? parsed.videos : [];
  if (!entries.length) {
    alert("Файл не содержит данных для импорта.");
    return;
  }

  let importedCount = 0;
  for (const entry of entries) {
    const url = `${entry.url || ""}`.trim();
    if (!url) continue;
    const targetVideo = entry.id
      ? state.videos.find((video) => video.id === entry.id)
      : state.videos.find((video) => video.title === entry.title);
    if (!targetVideo) continue;
    try {
      const ok = await importMetaFromUrl(url, { targetVideoId: targetVideo.id, showAlert: false });
      if (ok) {
        importedCount += 1;
      }
    } catch (error) {
      console.warn("Не удалось импортировать запись", entry, error);
    }
  }

  alert(`Импорт данных завершен: ${importedCount} видео обновлено.`);
};

const shuffle = (list) => {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function updateShortsPlaybackState() {
  if (!shortsPlayBtn) return;
  shortsPlayBtn.textContent = shortsPlayer.paused ? "▶" : "⏸";
}

const updateShortsLayout = () => {
  if (!shortsPlayerWrap) return;
  const isWide = shortsPlayer.videoWidth >= shortsPlayer.videoHeight;
  shortsPlayerWrap.classList.toggle("wide", isWide);
};

const stopMainPlayback = () => {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();
};

const stopShortsPlayback = () => {
  shortsPlayer.pause();
  shortsPlayer.removeAttribute("src");
  shortsPlayer.load();
  updateShortsPlaybackState();
};

const buildShortsQueue = () => {
  const shorts = state.videos.filter((video) => video.duration && video.duration <= 60);
  const unseen = shorts.filter((video) => !video.watched);
  const candidates = unseen.length ? unseen : shorts;
  const filtered = candidates.filter((video) => !state.sessionSeenShorts.has(video.id));
  const selection = filtered.length ? filtered : candidates;
  state.shortsQueue = shuffle(selection);
  state.shortsIndex = 0;
};

const openShorts = async (direction = 0) => {
  if (!state.shortsQueue.length) {
    buildShortsQueue();
  }
  if (!state.shortsQueue.length) {
    shortsTitle.textContent = "Нет коротких видео";
    shortsChannel.textContent = "";
    shortsStatus.textContent = "";
    shortsPlayer.removeAttribute("src");
    return;
  }
  if (direction !== 0) {
    const nextIndex = state.shortsIndex + direction;
    if (nextIndex >= 0 && nextIndex < state.shortsQueue.length) {
      state.shortsIndex = nextIndex;
    }
  }
  const video = state.shortsQueue[state.shortsIndex];
  state.activeShortsId = video.id;
  state.sessionSeenShorts.add(video.id);
  const file = await getVideoFile(video);
  const url = URL.createObjectURL(file);
  shortsPlayer.src = url;
  updateShortsPlaybackState();
  await shortsPlayer.play();
  updateShortsPlaybackState();
  shortsTitle.textContent = video.title;
  shortsChannel.textContent = video.channelName || video.folderName || "Без канала";
  shortsStatus.textContent = `Видео ${state.shortsIndex + 1} из ${state.shortsQueue.length}`;
  shortsLikeCount.textContent = video.likes || 0;
  shortsDislikeCount.textContent = video.dislikes || 0;
  shortsCommentInput.value = "";
  if (!video.watched) {
    video.watched = true;
    await putItem(VIDEO_STORE, video);
    updateWatchedIndicator(video.id, true);
  }
  recordWatch(video);
};

const removeVideo = async (videoId) => {
  state.videos = state.videos.filter((video) => video.id !== videoId);
  await deleteItem(VIDEO_STORE, videoId);
  if (state.activeVideoId === videoId) {
    switchView("library");
  }
  renderVideos({ reset: true });
};

const removeFolder = async (folderId) => {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return;
  state.folders = state.folders.filter((item) => item.id !== folderId);
  await deleteItem(FOLDER_STORE, folderId);
  const videosToRemove = state.videos.filter((video) => video.folderName === folder.name);
  for (const video of videosToRemove) {
    await deleteItem(VIDEO_STORE, video.id);
  }
  state.videos = state.videos.filter((video) => video.folderName !== folder.name);
  if (state.activeFolder === folder.name) {
    state.activeFolder = null;
  }
  renderFolders();
  renderVideos({ reset: true });
};

const toggleEditing = () => {
  state.isEditing = !state.isEditing;
  document.body.classList.toggle("editing", state.isEditing);
  editLibraryBtn.textContent = state.isEditing ? "Готово" : "Редактировать";
};

const toggleLibraryList = () => {
  folderList.classList.toggle("collapsed");
};

const handleScroll = () => {
  if (!libraryView.classList.contains("active")) return;
  const filtered = getFilteredVideos();
  if (state.renderedCount >= filtered.length) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    state.visibleCount = Math.min(state.visibleCount + PAGE_SIZE, filtered.length);
    renderVideos();
  }
};

addFolderBtn.addEventListener("click", addFolder);
if (folderInput) {
  folderInput.addEventListener("change", handleFolderFiles);
}
editLibraryBtn.addEventListener("click", toggleEditing);
libraryToggle.addEventListener("click", toggleLibraryList);
if (logoLink) {
  logoLink.addEventListener("click", (event) => {
    event.preventDefault();
    setShuffleFeed();
  });
}
if (profileBtn) {
  profileBtn.addEventListener("click", () => {
    switchView("profile");
  });
}
if (openUrlFillerBtn) {
  openUrlFillerBtn.addEventListener("click", () => {
    openUrlFiller();
  });
}
if (urlFillerBackBtn) {
  urlFillerBackBtn.addEventListener("click", () => {
    switchView("profile");
  });
}
if (urlFillerSkipBtn) {
  urlFillerSkipBtn.addEventListener("click", () => {
    moveUrlFillerNext();
  });
}
if (urlFillerImportHtmlBtn && urlFillerHtmlInput) {
  urlFillerImportHtmlBtn.addEventListener("click", () => {
    const current = getUrlFillerCurrentVideo();
    if (!current) {
      alert("Нет текущего видео для заполнения.");
      return;
    }
    urlFillerHtmlInput.click();
  });

  urlFillerHtmlInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const current = getUrlFillerCurrentVideo();
    if (!current) {
      alert("Нет текущего видео для заполнения.");
      return;
    }
    try {
      const ok = await importMetaFromHtmlFile(file, { targetVideoId: current.id, showAlert: false });
      if (!ok) {
        alert("HTML не обработан. Попробуйте другой файл.");
        return;
      }
      moveUrlFillerNext();
    } catch (error) {
      console.error(error);
      alert("Ошибка обработки HTML.");
    }
  });
}
if (urlFillerImportUrlBtn && urlFillerUrlInput) {
  urlFillerImportUrlBtn.addEventListener("click", async () => {
    const current = getUrlFillerCurrentVideo();
    if (!current) {
      alert("Нет текущего видео для заполнения.");
      return;
    }
    const url = urlFillerUrlInput.value.trim();
    if (!url) {
      alert("Вставьте URL видео.");
      return;
    }
    try {
      const ok = await importMetaFromUrl(url, { targetVideoId: current.id, showAlert: false });
      if (!ok) {
        alert("URL не обработан. Проверьте ссылку или попробуйте HTML.");
        return;
      }
      urlFillerUrlInput.value = "";
      moveUrlFillerNext();
    } catch (error) {
      console.error(error);
      alert("Ошибка обработки URL.");
    }
  });
}
shortsTab.addEventListener("click", () => {
  switchView("shorts");
  buildShortsQueue();
  openShorts(0);
});
if (historyTab) {
  historyTab.addEventListener("click", () => {
    setHistoryFeed();
  });
}

if (exportBackupBtn) {
  exportBackupBtn.addEventListener("click", exportBackup);
}

if (exportPendingListBtn) {
  exportPendingListBtn.addEventListener("click", exportPendingVideoList);
}

if (autoParseLibraryBtn) {
  autoParseLibraryBtn.addEventListener("click", async () => {
    try {
      await autoParseLibrary();
    } catch (error) {
      console.error(error);
      resetImportStatus();
      alert("Не удалось выполнить автопарсинг библиотеки.");
    }
  });
}

if (autoParseFirst20Btn) {
  autoParseFirst20Btn.addEventListener("click", async () => {
    try {
      await autoParseFirst20();
    } catch (error) {
      console.error(error);
      resetImportStatus();
      alert("Не удалось обновить первые 20 видео.");
    }
  });
}

if (importVideoDataInput) {
  importVideoDataInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importVideoDataList(file);
    } catch (error) {
      console.error(error);
      alert("Не удалось импортировать данные из файла.");
    }
  });
}

if (youtubeApiKeyInput) {
  youtubeApiKeyInput.value = getYouTubeApiKey();
  youtubeApiKeyInput.addEventListener("change", () => {
    saveYouTubeApiKey(youtubeApiKeyInput.value.trim());
  });
}

if (channelUrlInput) {
  channelUrlInput.addEventListener("change", () => {
    saveActiveFolderChannelUrl(channelUrlInput.value.trim());
  });
}

if (importBackupInput) {
  importBackupInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await mergeBackup(data);
      alert("Бекап импортирован. Для воспроизведения файлов потребуется повторный импорт видео.");
    } catch (error) {
      console.error(error);
      alert("Не удалось импортировать бекап.");
    }
  });
}

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  state.historyMode = false;
  renderVideos({ reset: true });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.videoTypeFilter = button.dataset.type || "regular";
    state.historyMode = false;
    renderVideos({ reset: true });
  });
});

if (dateSort) {
  dateSort.addEventListener("change", (event) => {
    state.dateSort = event.target.value;
    state.historyMode = false;
    renderVideos({ reset: true });
  });
}

const parseDurationInput = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};


if (autoAddTreeBtn && autoAddTreeInput) {
  autoAddTreeBtn.addEventListener("click", () => autoAddTreeInput.click());

  autoAddTreeInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const { entries } = buildStructuredEntriesFromFiles(files);

    if (!entries.length) {
      alert("Видео не найдены. Нужны файлы mp4/webm/mkv/mov.");
      return;
    }

    try {
      await importEntries(entries);
      alert(`Готово: добавлено файлов: ${entries.length}`);
    } catch (error) {
      console.error(error);
      alert("Не удалось импортировать. Проверьте доступ к папке/файлам.");
    }
  });
}

const handleDurationFilter = () => {
  state.durationMin = parseDurationInput(durationMinInput?.value);
  state.durationMax = parseDurationInput(durationMaxInput?.value);
  state.historyMode = false;
  renderVideos({ reset: true });
};

if (durationMinInput) {
  durationMinInput.addEventListener("input", handleDurationFilter);
}

if (durationMaxInput) {
  durationMaxInput.addEventListener("input", handleDurationFilter);
}

if (importHtmlBtn && importHtmlInput) {
  importHtmlBtn.addEventListener("click", () => {
    if (!state.activeVideoId) {
      alert("Сначала откройте видео.");
      return;
    }
    importHtmlInput.click();
  });

  importHtmlInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importMetaFromHtmlFile(file);
    } catch (error) {
      console.error(error);
      alert("Ошибка импорта HTML.");
    }
  });
}

if (importPdfBtn && importPdfInput) {
  importPdfBtn.addEventListener("click", () => {
    if (!state.activeVideoId) {
      alert("Сначала откройте видео.");
      return;
    }
    importPdfInput.click();
  });

  importPdfInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importMetaFromPdfFile(file);
    } catch (error) {
      console.error(error);
      alert("Ошибка импорта PDF.");
    }
  });
}

if (importUrlBtn && importUrlInput) {
  importUrlBtn.addEventListener("click", async () => {
    if (!state.activeVideoId) {
      alert("Сначала откройте видео.");
      return;
    }
    const url = importUrlInput.value.trim();
    if (!url) {
      alert("Вставьте URL видео.");
      return;
    }
    try {
      await importMetaFromUrl(url);
    } catch (error) {
      console.error(error);
      alert("Ошибка импорта по URL.");
    } finally {
      importUrlInput.value = "";
    }
  });
}

if (changeThumbnailBtn && thumbnailInput) {
  changeThumbnailBtn.addEventListener("click", () => {
    if (!state.activeVideoId) {
      alert("Сначала откройте видео.");
      return;
    }
    thumbnailInput.click();
  });

  thumbnailInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const current = state.videos.find((item) => item.id === state.activeVideoId);
      if (!current) return;
      current.thumbnail = `${reader.result || ""}`;
      await updateActiveVideo({ thumbnail: current.thumbnail });
      renderVideos({ reset: true });
    };
    reader.readAsDataURL(file);
  });
}

if (resetThumbnailBtn) {
  resetThumbnailBtn.addEventListener("click", async () => {
    const current = state.videos.find((item) => item.id === state.activeVideoId);
    if (!current) return;
    current.thumbnail = "";
    await updateActiveVideo({ thumbnail: "" });
    renderVideos({ reset: true });
  });
}

likeBtn.addEventListener("click", async () => {
  const current = state.videos.find((item) => item.id === state.activeVideoId);
  if (!current) return;
  const likes = (current.likes || 0) + 1;
  likeCount.textContent = likes;
  await updateActiveVideo({ likes });
});

dislikeBtn.addEventListener("click", async () => {
  const current = state.videos.find((item) => item.id === state.activeVideoId);
  if (!current) return;
  const dislikes = (current.dislikes || 0) + 1;
  dislikeCount.textContent = dislikes;
  await updateActiveVideo({ dislikes });
});

saveCommentBtn.addEventListener("click", async () => {
  const text = commentInput.value.trim();
  if (!text) return;
  const video = state.videos.find((item) => item.id === state.activeVideoId);
  if (!video) return;
  const newComment = normalizeComment({
    id: crypto.randomUUID(),
    author: "Вы",
    text,
    createdAt: Date.now(),
    likes: 0,
    dislikes: 0,
    replies: [],
  });
  video.comments = video.comments || [];
  video.comments.push(newComment);
  commentInput.value = "";
  await updateActiveVideo({ comments: video.comments });
  renderComments(video);
});

videoPlayer.addEventListener("timeupdate", () => {
  const current = state.videos.find((item) => item.id === state.activeVideoId);
  if (!current) return;
  const progress = videoPlayer.currentTime;
  updateActiveVideo({ progress });
  updateProgressIndicator(current.id, progress, current.duration);
  if (current.duration) {
    progressLabel.textContent = `Последняя остановка: ${humanizeDuration(progress)} / ${
      current.durationLabel
    }`;
  }
});

videoPlayer.addEventListener("ended", () => {
  updateActiveVideo({ progress: 0 });
  updateProgressIndicator(state.activeVideoId, 0, 0);
});

window.addEventListener("hashchange", () => {
  if (!location.hash) {
    switchView("library");
  }
});

commentList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const actionEl = target.closest("[data-action]");
  if (actionEl instanceof HTMLElement) {
    const action = actionEl.dataset.action;
    const commentId = actionEl.dataset.commentId;
    const video = state.videos.find((item) => item.id === state.activeVideoId);
    if (!video || !commentId) return;
    const comment = (video.comments || []).find((item) => item.id === commentId);
    if (!comment) return;

    if (action === "like-comment") {
      comment.likes = (comment.likes || 0) + 1;
    }
    if (action === "dislike-comment") {
      comment.dislikes = (comment.dislikes || 0) + 1;
    }
    if (action === "toggle-replies") {
      comment.repliesExpanded = !comment.repliesExpanded;
    }
    if (action === "reply-comment") {
      const wrapper = actionEl.closest(".comment");
      if (wrapper && !wrapper.querySelector(".reply-form")) {
        const form = document.createElement("div");
        form.className = "reply-form";
        form.innerHTML = `
          <input class="reply-input" type="text" placeholder="Ваш ответ..." />
          <button class="btn" data-action="send-reply" data-comment-id="${comment.id}">Отправить</button>
        `;
        wrapper.appendChild(form);
      }
      return;
    }
    if (action === "send-reply") {
      const wrapper = actionEl.closest(".comment");
      const input = wrapper?.querySelector(".reply-input");
      if (!(input instanceof HTMLInputElement)) return;
      const textValue = input.value.trim();
      if (!textValue) return;
      comment.replies = comment.replies || [];
      comment.replies.push({
        id: crypto.randomUUID(),
        author: "Вы",
        text: textValue,
        createdAt: Date.now(),
      });
      comment.replyCount = comment.replies.length;
      comment.repliesExpanded = true;
    }

    await updateActiveVideo({ comments: video.comments });
    renderComments(video);
    return;
  }

  const timecode = target.dataset.time;
  if (!timecode) return;
  event.preventDefault();
  const seconds = parseTimecode(timecode);
  if (Number.isFinite(seconds)) {
    videoPlayer.currentTime = seconds;
    videoPlayer.play();
  }
});

window.addEventListener("scroll", handleScroll);

shortsNextBtn.addEventListener("click", () => openShorts(1));
shortsPrevBtn.addEventListener("click", () => openShorts(-1));

shortsPlayer.addEventListener("ended", () => openShorts(1));

shortsLikeBtn.addEventListener("click", async () => {
  const current = state.videos.find((item) => item.id === state.activeShortsId);
  if (!current) return;
  const likes = (current.likes || 0) + 1;
  current.likes = likes;
  shortsLikeCount.textContent = likes;
  await putItem(VIDEO_STORE, current);
});

shortsDislikeBtn.addEventListener("click", async () => {
  const current = state.videos.find((item) => item.id === state.activeShortsId);
  if (!current) return;
  const dislikes = (current.dislikes || 0) + 1;
  current.dislikes = dislikes;
  shortsDislikeCount.textContent = dislikes;
  await putItem(VIDEO_STORE, current);
});

shortsCommentBtn.addEventListener("click", async () => {
  const text = shortsCommentInput.value.trim();
  if (!text) return;
  const current = state.videos.find((item) => item.id === state.activeShortsId);
  if (!current) return;
  const newComment = {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  };
  current.comments = current.comments || [];
  current.comments.push(newComment);
  shortsCommentInput.value = "";
  await putItem(VIDEO_STORE, current);
});

window.addEventListener("keydown", (event) => {
  if (!shortsView.classList.contains("active")) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    openShorts(1);
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    openShorts(-1);
  }
});

window.addEventListener("wheel", (event) => {
  if (!shortsView.classList.contains("active")) return;
  if (event.deltaY > 0) {
    openShorts(1);
  } else if (event.deltaY < 0) {
    openShorts(-1);
  }
});

shortsPlayer.addEventListener("loadedmetadata", updateShortsLayout);
shortsPlayer.addEventListener("play", updateShortsPlaybackState);
shortsPlayer.addEventListener("pause", updateShortsPlaybackState);

if (shortsPlayBtn) {
  shortsPlayBtn.addEventListener("click", () => {
    if (shortsPlayer.paused) {
      shortsPlayer.play();
    } else {
      shortsPlayer.pause();
    }
  });
}

loadState().catch((error) => {
  console.error("Не удалось загрузить библиотеку", error);
  alert("Ошибка загрузки библиотеки. Данные не удалены, попробуйте обновить страницу.");
});
