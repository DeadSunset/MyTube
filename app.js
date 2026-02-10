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
const importVideoDataInput = document.getElementById("importVideoDataInput");
const localParserApiInput = document.getElementById("localParserApiInput");
const importHtmlBtn = document.getElementById("importHtmlBtn");
const importHtmlInput = document.getElementById("importHtmlInput");
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

const DB_NAME = "mytube-db";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";
const FOLDER_STORE = "folders";
const PAGE_SIZE = 40;
const TIME_PATTERN = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
const PARSER_API_STORAGE_KEY = "mytube-parser-api-url";

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
      : imported.source === "youtube_url"
        ? "YouTube URL"
        : "Локально";
    watchImportSource.textContent = source;
  }
};

const normalizeComment = (comment, author = "Вы") => {
  const replies = Array.isArray(comment.replies)
    ? comment.replies.map((reply) => ({
        id: reply.id || crypto.randomUUID(),
        author: reply.author || "Вы",
        text: reply.text || "",
        createdAt: reply.createdAt || Date.now(),
      }))
    : [];
  const replyCount = Number.isFinite(comment.replyCount) ? comment.replyCount : replies.length;
  return {
    id: comment.id || crypto.randomUUID(),
    author: comment.author || author,
    text: comment.text || "",
    createdAt: comment.createdAt || Date.now(),
    likes: Number.isFinite(comment.likes) ? comment.likes : 0,
    dislikes: Number.isFinite(comment.dislikes) ? comment.dislikes : 0,
    replies,
    replyCount,
    order: Number.isFinite(comment.order) ? comment.order : 0,
    repliesExpanded: Boolean(comment.repliesExpanded),
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
  if (!value) return null;
  const normalized = `${value}`.replace(/\s+/g, " ").trim().toLowerCase();
  const number = Number.parseFloat(normalized.replace(/[^\d.,]/g, "").replace(",", "."));
  if (!Number.isFinite(number)) return null;
  if (normalized.includes("тыс")) return Math.round(number * 1_000);
  if (normalized.includes("млн")) return Math.round(number * 1_000_000);
  if (normalized.includes("млрд")) return Math.round(number * 1_000_000_000);
  return Math.round(number);
};

const getParserApiUrl = () => {
  const fromInput = localParserApiInput?.value?.trim();
  if (fromInput) return fromInput;
  return localStorage.getItem(PARSER_API_STORAGE_KEY) || "";
};

const saveParserApiUrl = (value) => {
  if (!value) {
    localStorage.removeItem(PARSER_API_STORAGE_KEY);
    return;
  }
  localStorage.setItem(PARSER_API_STORAGE_KEY, value);
};

const isVideoMissingMeta = (video) => {
  const hasThumbnail = Boolean(video.thumbnail);
  const hasComments = Array.isArray(video.comments) && video.comments.length > 0;
  const imported = video.imported;
  const hasImportedStats = Boolean(
    imported?.stats &&
    (imported.stats.views !== null || imported.stats.likes !== null || imported.stats.dislikes !== null)
  );
  return !hasThumbnail && !hasComments && !hasImportedStats;
};

const exportPendingVideoList = () => {
  const pendingVideos = state.videos
    .filter((video) => isVideoMissingMeta(video))
    .map((video) => ({
      id: video.id,
      title: video.title,
      folderName: video.folderName || "",
      channelName: video.channelName || "",
    }));

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
  alert(`Экспортировано ${pendingVideos.length} видео без превью/комментариев.`);
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

const fetchUrlImportPayload = async (inputUrl) => {
  const parserApiUrl = getParserApiUrl();
  if (!parserApiUrl) return null;
  const response = await fetch(`${parserApiUrl}?url=${encodeURIComponent(inputUrl)}`);
  if (!response.ok) {
    throw new Error(`Parser API error: ${response.status}`);
  }
  const data = await response.json();
  const payload = {
    title: data.title || "",
    channelName: data.channelName || data.author || "",
    sourceVideoId: data.sourceVideoId || extractYouTubeVideoId(inputUrl),
    thumbnail: data.thumbnail || data.thumbnailUrl || "",
    stats: {
      views: data.stats?.views ?? null,
      likes: data.stats?.likes ?? null,
      dislikes: data.stats?.dislikes ?? null,
      comments: data.stats?.comments ?? (Array.isArray(data.comments) ? data.comments.length : null),
    },
    comments: buildCommentsFromApi(Array.isArray(data.comments) ? data.comments : []),
  };
  return payload;
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
  const markerPatterns = [
    new RegExp(`(?:var\s+)?${marker}\s*=`),
    new RegExp(`${marker}`),
  ];
  for (const pattern of markerPatterns) {
    const match = pattern.exec(html);
    if (!match) continue;
    const startIndex = html.indexOf("{", match.index + match[0].length);
    const parsed = parseObjectFromIndex(html, startIndex);
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

const collectCommentNodes = (node, bucket = []) => {
  if (!node || typeof node !== "object") return bucket;
  if (Array.isArray(node)) {
    node.forEach((item) => collectCommentNodes(item, bucket));
    return bucket;
  }

  const renderer = node.commentRenderer || node?.commentViewModel?.commentViewModelRenderer;
  if (renderer) {
    bucket.push(renderer);
  }

  const thread = node.commentThreadRenderer;
  if (thread?.comment?.commentRenderer) {
    bucket.push(thread.comment.commentRenderer);
  }
  const threadReplies = thread?.replies?.commentRepliesRenderer?.contents || [];
  if (Array.isArray(threadReplies)) {
    threadReplies.forEach((replyNode) => {
      if (replyNode?.commentRenderer) {
        bucket.push(replyNode.commentRenderer);
      }
    });
  }

  Object.values(node).forEach((value) => collectCommentNodes(value, bucket));
  return bucket;
};

const parseCommentsFromDom = (htmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const nodes = doc.querySelectorAll('#content-text, yt-formatted-string#content-text');
  if (!nodes.length) return [];
  return Array.from(nodes)
    .map((node, index) => {
      const root = node.closest('ytd-comment-thread-renderer, ytd-comment-renderer, .ytd-comment-thread-renderer') || node.parentElement;
      const authorNode = root?.querySelector('#author-text span, .ytd-comment-renderer #author-text span');
      const likesNode = root?.querySelector('#vote-count-middle, #vote-count-left');
      return normalizeComment({
        id: `dom-comment-${index}-${crypto.randomUUID()}`,
        author: authorNode?.textContent?.trim() || "YouTube user",
        text: node.textContent?.trim() || "",
        likes: parseCompactNumber(likesNode?.textContent?.trim()) || 0,
        createdAt: Date.now(),
        order: index,
        replies: [],
        replyCount: 0,
      });
    })
    .filter((comment) => comment.text);
};

const parseYoutubeHtmlPayload = (htmlText) => {
  const playerData = parseInitialJson(htmlText, "ytInitialPlayerResponse") || {};
  const initialData = parseInitialJson(htmlText, "ytInitialData") || {};
  const details = playerData.videoDetails || {};

  const commentsRaw = collectCommentNodes(initialData);
  let comments = commentsRaw.map((item, index) => {
    const text = readTextLike(item.contentText).trim();
    const author = readTextLike(item.authorText).trim() || "YouTube user";
    const likesText =
      readTextLike(item.voteCount) ||
      item.voteCount?.accessibility?.accessibilityData?.label ||
      item.actionButtons?.commentActionButtonsRenderer?.likeButton?.toggleButtonRenderer?.defaultText?.accessibility?.accessibilityData?.label ||
      "";
    const replies = [];
    return normalizeComment({
      id: item.commentId || crypto.randomUUID(),
      author,
      text,
      likes: parseCompactNumber(likesText) || 0,
      dislikes: 0,
      createdAt: Date.now(),
      replies,
      order: index,
      replyCount: replies.length,
    }, author);
  }).filter((item) => item.text);

  if (!comments.length) {
    comments = parseCommentsFromDom(htmlText);
  }

  const viewsFromDetails = parseCompactNumber(details.viewCount);
  const viewsFromMicroformat = parseCompactNumber(
    playerData?.microformat?.playerMicroformatRenderer?.viewCount
  );
  const likesFromDetails = parseCompactNumber(details.likes);

  return {
    title: details.title || "",
    channelName: details.author || "",
    sourceVideoId: details.videoId || "",
    stats: {
      views: viewsFromDetails ?? viewsFromMicroformat,
      likes: likesFromDetails,
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
  state.videos = (videos || []).map((video) => ({
    ...video,
    comments: Array.isArray(video.comments)
      ? video.comments.map((comment) => normalizeComment(comment, comment.author))
      : video.comment
      ? [
          normalizeComment({
            id: crypto.randomUUID(),
            author: "Вы",
            text: video.comment,
            createdAt: Date.now(),
          }),
        ]
      : [],
    imported: video.imported || null,
    watched: Boolean(video.watched),
  }));
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
  if (view === "watch") {
    watchView.classList.add("active");
    stopShortsPlayback();
  } else if (view === "shorts") {
    shortsView.classList.add("active");
    stopMainPlayback();
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
  for (const entry of uniqueEntries.values()) {
    let metadata;
    try {
      metadata = await refreshVideoMetadata(entry);
    } catch (error) {
      console.warn("Не удалось прочитать видео", entry.name, error);
      processed += 1;
      updateImportStatus(processed, total);
      await new Promise((resolve) => setTimeout(resolve, 16));
      continue;
    }
    processed += 1;
    updateImportStatus(processed, total);
    if (metadata.fileKey && existingKeys.has(metadata.fileKey)) {
      await new Promise((resolve) => setTimeout(resolve, 16));
      continue;
    }
    const title = entry.name.replace(/\.[^.]+$/, "");
    const folderKey = entry.parentPath || rootName;
    const titleSet = existingTitlesByFolder.get(folderKey) || new Set();
    if (titleSet.has(title)) {
      await new Promise((resolve) => setTimeout(resolve, 16));
      continue;
    }
    const video = {
      id: idFromHandle(entry.handle, crypto.randomUUID(), entry.relativePath),
      title,
      folderName: folderKey,
      channelName: folderKey,
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
    appendVideoToGrid(video);
    await new Promise((resolve) => setTimeout(resolve, 16));
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
    watchTitle.textContent = payload.title;
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

const importMetaFromHtmlFile = async (file) => {
  const video = state.videos.find((item) => item.id === state.activeVideoId);
  if (!video || !file) return;
  const htmlText = await file.text();
  const payload = parseYoutubeHtmlPayload(htmlText);
  if (!payload.title && !(payload.comments || []).length) {
    alert("Не удалось распарсить YouTube HTML. Попробуйте сохранить полную страницу видео с прокрученными комментариями.");
    return;
  }
  await applyImportedDataToVideo(video, payload, "youtube_html", "local-html");
  const importedComments = payload.comments?.length || 0;
  if (!importedComments) {
    alert("HTML импорт завершен, но в файле не нашлись комментарии. Сохраните страницу после загрузки комментариев.");
    return;
  }
  alert(`HTML импорт завершен: импортировано комментариев ${importedComments}.`);
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
  try {
    payload = await fetchUrlImportPayload(inputUrl);
  } catch (error) {
    console.warn("Локальный парсер недоступен, используем fallback по URL.", error);
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
  }

  await applyImportedDataToVideo(video, payload, "youtube_url", inputUrl);
  if (showAlert) {
    const importedComments = payload.comments?.length || 0;
    if (!importedComments) {
      alert("Импорт по URL завершен без комментариев. Для комментариев укажите локальный parser API в профиле.");
    } else {
      alert(`Импорт по URL завершен: комментариев ${importedComments}.`);
    }
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

if (localParserApiInput) {
  localParserApiInput.value = getParserApiUrl();
  localParserApiInput.addEventListener("change", () => {
    saveParserApiUrl(localParserApiInput.value.trim());
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

loadState();
