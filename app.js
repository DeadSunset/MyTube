const addFolderBtn = document.getElementById("addFolderBtn");
const editLibraryBtn = document.getElementById("editLibraryBtn");
const libraryToggle = document.getElementById("libraryToggle");
const shortsTab = document.getElementById("shortsTab");
const folderList = document.getElementById("folderList");
const videoGrid = document.getElementById("videoGrid");
const videoCount = document.getElementById("videoCount");
const searchInput = document.getElementById("searchInput");
const libraryView = document.getElementById("libraryView");
const watchView = document.getElementById("watchView");
const shortsView = document.getElementById("shortsView");
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
const shortsTitle = document.getElementById("shortsTitle");
const shortsChannel = document.getElementById("shortsChannel");
const shortsStatus = document.getElementById("shortsStatus");

const DB_NAME = "mytube-db";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";
const FOLDER_STORE = "folders";
const PAGE_SIZE = 40;
const TIME_PATTERN = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;

let state = {
  videos: [],
  folders: [],
  activeVideoId: null,
  searchTerm: "",
  visibleCount: PAGE_SIZE,
  renderedCount: 0,
  isEditing: false,
  shortsQueue: [],
  shortsIndex: 0,
  sessionSeenShorts: new Set(),
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

const idFromHandle = (handle, fallback) => {
  if (handle?.name) {
    return `${handle.name}-${fallback}`;
  }
  return `video-${crypto.randomUUID()}`;
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

const loadState = async () => {
  const [videos, folders] = await Promise.all([
    getAll(VIDEO_STORE),
    getAll(FOLDER_STORE),
  ]);
  state.videos = (videos || []).map((video) => ({
    ...video,
    comments: Array.isArray(video.comments)
      ? video.comments
      : video.comment
      ? [
          {
            id: crypto.randomUUID(),
            text: video.comment,
            createdAt: Date.now(),
          },
        ]
      : [],
    watched: Boolean(video.watched),
  }));
  state.folders = folders || [];
  renderFolders();
  renderVideos({ reset: true });
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
    li.append(label, deleteButton);
    folderList.appendChild(li);
  });
};

const getFilteredVideos = () =>
  state.searchTerm
    ? state.videos.filter((video) =>
        video.title.toLowerCase().includes(state.searchTerm.toLowerCase())
      )
    : state.videos;

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
    const card = videoCardTemplate.content.cloneNode(true);
    card.querySelector(".title").textContent = video.title;
    card.querySelector(".duration").textContent = video.durationLabel || "--:--";
    card.querySelector(".meta").textContent = video.channelName || video.folderName || "Без папки";
    const element = card.querySelector(".video-card");
    const thumbnail = card.querySelector(".thumbnail");
    if (video.thumbnail) {
      thumbnail.style.backgroundImage = `url(${video.thumbnail})`;
    } else {
      thumbnail.style.backgroundImage = "";
    }
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await removeVideo(video.id);
    });
    element.addEventListener("click", () => openVideo(video.id));
    videoGrid.appendChild(card);
  });
  state.renderedCount = targetCount;
};

const renderRecommendations = (currentVideo) => {
  recommendations.innerHTML = "";
  const words = extractWords(currentVideo.title);
  const sorted = [...state.videos]
    .filter((video) => video.id !== currentVideo.id)
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
  if (!video.comments.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Заметок пока нет.";
    commentList.appendChild(empty);
    return;
  }
  video.comments.forEach((comment) => {
    const wrapper = document.createElement("div");
    wrapper.className = "comment";
    const text = document.createElement("p");
    text.innerHTML = formatCommentText(comment.text);
    const time = document.createElement("time");
    time.textContent = new Date(comment.createdAt).toLocaleString("ru-RU");
    wrapper.append(text, time);
    commentList.appendChild(wrapper);
  });
};

const switchView = (view) => {
  if (view === "watch") {
    libraryView.classList.remove("active");
    watchView.classList.add("active");
    shortsView.classList.remove("active");
  } else if (view === "shorts") {
    libraryView.classList.remove("active");
    watchView.classList.remove("active");
    shortsView.classList.add("active");
  } else {
    watchView.classList.remove("active");
    shortsView.classList.remove("active");
    libraryView.classList.add("active");
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

  const file = await video.handle.getFile();
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.currentTime = video.progress || 0;
  if (!video.watched) {
    video.watched = true;
    await updateActiveVideo({ watched: true });
  }
  progressLabel.textContent =
    video.progress && video.duration
      ? `Последняя остановка: ${humanizeDuration(video.progress)} / ${video.durationLabel}`
      : "";

  renderRecommendations(video);
};

const refreshVideoMetadata = async (video) => {
  const file = await video.handle.getFile();
  const tempUrl = URL.createObjectURL(file);
  const tempVideo = document.createElement("video");
  tempVideo.preload = "metadata";
  tempVideo.src = tempUrl;

  await new Promise((resolve) => {
    tempVideo.onloadedmetadata = () => resolve();
  });

  const duration = tempVideo.duration;
  let thumbnail = "";
  if (Number.isFinite(duration) && duration > 0) {
    const target = Math.min(duration - 0.2, Math.max(0.2, Math.random() * duration));
    await new Promise((resolve) => {
      tempVideo.currentTime = target;
      tempVideo.onseeked = () => resolve();
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
  };
};

const walkFolder = async (directoryHandle, files = []) => {
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "file") {
      if (entry.name.match(/\.(mp4|webm|mkv|mov)$/i)) {
        files.push({ handle: entry, parent: directoryHandle.name });
      }
    } else if (entry.kind === "directory") {
      await walkFolder(entry, files);
    }
  }
  return files;
};

const addFolder = async () => {
  if (!window.showDirectoryPicker) {
    alert("Ваш браузер не поддерживает выбор папок. Откройте в Chrome/Edge.");
    return;
  }
  const handle = await window.showDirectoryPicker();
  const folder = {
    id: `${handle.name}-${crypto.randomUUID()}`,
    name: handle.name,
    handle,
  };

  state.folders.push(folder);
  await putItem(FOLDER_STORE, folder);
  renderFolders();

  const entries = await walkFolder(handle);

  for (const entry of entries) {
    const fileHandle = entry.handle;
    const id = idFromHandle(fileHandle, crypto.randomUUID());
    const metadata = await refreshVideoMetadata({ handle: fileHandle });
    const video = {
      id,
      title: fileHandle.name.replace(/\.[^.]+$/, ""),
      folderName: handle.name,
      channelName: entry.parent || handle.name,
      handle: fileHandle,
      ...metadata,
      likes: 0,
      dislikes: 0,
      comments: [],
      progress: 0,
      watched: false,
    };
    state.videos.push(video);
    await putItem(VIDEO_STORE, video);
  }

  renderVideos({ reset: true });
};

const updateActiveVideo = async (updates) => {
  const video = state.videos.find((item) => item.id === state.activeVideoId);
  if (!video) return;
  Object.assign(video, updates);
  await putItem(VIDEO_STORE, video);
};

const shuffle = (list) => {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  state.sessionSeenShorts.add(video.id);
  const file = await video.handle.getFile();
  const url = URL.createObjectURL(file);
  shortsPlayer.src = url;
  shortsPlayer.play();
  shortsTitle.textContent = video.title;
  shortsChannel.textContent = video.channelName || video.folderName || "Без канала";
  shortsStatus.textContent = `Видео ${state.shortsIndex + 1} из ${state.shortsQueue.length}`;
  if (!video.watched) {
    video.watched = true;
    await putItem(VIDEO_STORE, video);
  }
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
editLibraryBtn.addEventListener("click", toggleEditing);
libraryToggle.addEventListener("click", toggleLibraryList);
shortsTab.addEventListener("click", () => {
  switchView("shorts");
  buildShortsQueue();
  openShorts(0);
});

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  renderVideos({ reset: true });
});

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
  const newComment = {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  };
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
  if (current.duration) {
    progressLabel.textContent = `Последняя остановка: ${humanizeDuration(progress)} / ${
      current.durationLabel
    }`;
  }
});

videoPlayer.addEventListener("ended", () => {
  updateActiveVideo({ progress: 0 });
});

window.addEventListener("hashchange", () => {
  if (!location.hash) {
    switchView("library");
  }
});

commentList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
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

loadState();
