const addFolderBtn = document.getElementById("addFolderBtn");
const folderList = document.getElementById("folderList");
const videoGrid = document.getElementById("videoGrid");
const videoCount = document.getElementById("videoCount");
const searchInput = document.getElementById("searchInput");
const libraryView = document.getElementById("libraryView");
const watchView = document.getElementById("watchView");
const videoPlayer = document.getElementById("videoPlayer");
const watchTitle = document.getElementById("watchTitle");
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const likeCount = document.getElementById("likeCount");
const dislikeCount = document.getElementById("dislikeCount");
const progressLabel = document.getElementById("progressLabel");
const commentInput = document.getElementById("commentInput");
const saveCommentBtn = document.getElementById("saveCommentBtn");
const recommendations = document.getElementById("recommendations");
const videoCardTemplate = document.getElementById("videoCardTemplate");
const recommendationTemplate = document.getElementById("recommendationTemplate");

const DB_NAME = "mytube-db";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";
const FOLDER_STORE = "folders";

let state = {
  videos: [],
  folders: [],
  activeVideoId: null,
  searchTerm: "",
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

const loadState = async () => {
  const [videos, folders] = await Promise.all([
    getAll(VIDEO_STORE),
    getAll(FOLDER_STORE),
  ]);
  state.videos = videos || [];
  state.folders = folders || [];
  renderFolders();
  renderVideos();
};

const renderFolders = () => {
  folderList.innerHTML = "";
  state.folders.forEach((folder) => {
    const li = document.createElement("li");
    li.textContent = folder.name;
    folderList.appendChild(li);
  });
};

const renderVideos = () => {
  videoGrid.innerHTML = "";
  const filtered = state.searchTerm
    ? state.videos.filter((video) =>
        video.title.toLowerCase().includes(state.searchTerm.toLowerCase())
      )
    : state.videos;
  videoCount.textContent = `${filtered.length} видео`;
  filtered.forEach((video) => {
    const card = videoCardTemplate.content.cloneNode(true);
    card.querySelector(".title").textContent = video.title;
    card.querySelector(".duration").textContent = video.durationLabel || "--:--";
    card.querySelector(".meta").textContent = video.folderName || "Без папки";
    const element = card.querySelector(".video-card");
    element.addEventListener("click", () => openVideo(video.id));
    videoGrid.appendChild(card);
  });
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
      video.folderName || "Без папки"
    }`;
    const element = card.querySelector(".recommendation");
    element.addEventListener("click", () => openVideo(video.id));
    recommendations.appendChild(card);
  });
};

const switchView = (view) => {
  if (view === "watch") {
    libraryView.classList.remove("active");
    watchView.classList.add("active");
  } else {
    watchView.classList.remove("active");
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
  commentInput.value = video.comment || "";

  const file = await video.handle.getFile();
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.currentTime = video.progress || 0;
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

  await new Promise((resolve) => {
    tempVideo.onloadedmetadata = () => resolve();
    tempVideo.src = tempUrl;
  });

  const duration = tempVideo.duration;
  URL.revokeObjectURL(tempUrl);

  return {
    duration,
    durationLabel: humanizeDuration(duration),
  };
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

  const entries = [];
  for await (const entry of handle.values()) {
    if (entry.kind === "file" && entry.name.match(/\.(mp4|webm|mkv|mov)$/i)) {
      entries.push(entry);
    }
  }

  for (const fileHandle of entries) {
    const id = idFromHandle(fileHandle, crypto.randomUUID());
    const metadata = await refreshVideoMetadata({ handle: fileHandle });
    const video = {
      id,
      title: fileHandle.name.replace(/\.[^.]+$/, ""),
      folderName: handle.name,
      handle: fileHandle,
      ...metadata,
      likes: 0,
      dislikes: 0,
      comment: "",
      progress: 0,
    };
    state.videos.push(video);
    await putItem(VIDEO_STORE, video);
  }

  renderVideos();
};

const updateActiveVideo = async (updates) => {
  const video = state.videos.find((item) => item.id === state.activeVideoId);
  if (!video) return;
  Object.assign(video, updates);
  await putItem(VIDEO_STORE, video);
};

addFolderBtn.addEventListener("click", addFolder);

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  renderVideos();
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
  await updateActiveVideo({ comment: commentInput.value });
  alert("Комментарий сохранен");
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

loadState();
