const prompts = [
  "오늘 나를 가장 지치게 한 순간은 언제였을까?",
  "지금 나에게 필요한 것은 멈춤, 거리두기, 또는 도움 중 무엇일까?",
  "말로 꺼내기 어려운 감정은 어떤 색이나 질감일까?",
  "오늘 나의 경계를 지킨 순간이 있었나?",
  "누군가에게 기대고 싶었던 순간이 있었나?",
  "혼자 있어도 괜찮았던 순간은 언제였을까?",
  "지금 마음이 바라는 가장 작은 안전은 무엇일까?",
  "내가 피하고 싶었던 대화는 왜 부담스러웠을까?",
  "오늘 나에게 따뜻했던 행동 하나를 적어본다면?",
  "내가 지켜낸 약속이 있다면 무엇일까?",
  "오늘의 감정을 숫자로만 적어본다면?",
  "지금의 나를 한 문장으로 소개한다면?"
];

const moodLabels = {
  1: "아주 낮음",
  2: "낮음",
  3: "보통",
  4: "높음",
  5: "아주 높음"
};

const storageKey = "avoidantDiaryEntries";
const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const elements = {
  promptGrid: document.getElementById("promptGrid"),
  entryDate: document.getElementById("entryDate"),
  entryMood: document.getElementById("entryMood"),
  moodLabel: document.getElementById("moodLabel"),
  entryTags: document.getElementById("entryTags"),
  entryPrompt: document.getElementById("entryPrompt"),
  randomPrompt: document.getElementById("randomPrompt"),
  entryText: document.getElementById("entryText"),
  saveEntry: document.getElementById("saveEntry"),
  previewEntry: document.getElementById("previewEntry"),
  clearEntry: document.getElementById("clearEntry"),
  toggleHide: document.getElementById("toggleHide"),
  exportEntries: document.getElementById("exportEntries"),
  importEntries: document.getElementById("importEntries"),
  searchInput: document.getElementById("searchInput"),
  moodFilter: document.getElementById("moodFilter"),
  entryCount: document.getElementById("entryCount"),
  entryList: document.getElementById("entryList"),
  statusHint: document.getElementById("statusHint"),
  dialog: document.getElementById("entryDialog"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogMeta: document.getElementById("dialogMeta"),
  dialogBody: document.getElementById("dialogBody"),
  closeDialog: document.getElementById("closeDialog"),
  toggleAllSupport: document.getElementById("toggleAllSupport")
};

let hiddenMode = false;

const todayString = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getEntries = () => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const setEntries = (entries) => {
  localStorage.setItem(storageKey, JSON.stringify(entries));
};

const renderPrompts = () => {
  if (elements.promptGrid) {
    elements.promptGrid.innerHTML = "";
    prompts.forEach((text) => {
      const card = document.createElement("div");
      card.className = "prompt-card fade-in";
      card.textContent = text;
      elements.promptGrid.appendChild(card);
    });
  }

  if (elements.entryPrompt) {
    elements.entryPrompt.innerHTML = "";
    prompts.forEach((text, index) => {
      const option = document.createElement("option");
      option.value = text;
      option.textContent = `${index + 1}. ${text}`;
      elements.entryPrompt.appendChild(option);
    });
  }
};

const moodLabel = (value) => moodLabels[value] || "보통";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

const updateMoodLabel = () => {
  if (!elements.entryMood || !elements.moodLabel) return;
  const value = Number(elements.entryMood.value);
  elements.moodLabel.textContent = moodLabel(value);
};

const parseTags = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatTags = (tags) => tags.join(", ");

const showHint = (message) => {
  if (!elements.statusHint) return;
  elements.statusHint.textContent = message;
  setTimeout(() => {
    if (elements.statusHint && elements.statusHint.textContent === message) {
      elements.statusHint.textContent = "";
    }
  }, 3000);
};

const saveEntry = () => {
  if (!elements.entryText || !elements.entryDate || !elements.entryMood || !elements.entryTags || !elements.entryPrompt) {
    return;
  }
  const text = elements.entryText.value.trim();
  if (!text) {
    showHint("짧게라도 적어주세요. 한 줄도 충분합니다.");
    return;
  }

  const entry = {
    id: generateId(),
    date: elements.entryDate.value || todayString(),
    mood: Number(elements.entryMood.value),
    tags: parseTags(elements.entryTags.value),
    prompt: elements.entryPrompt.value,
    text,
    createdAt: new Date().toISOString()
  };

  const entries = getEntries();
  entries.unshift(entry);
  setEntries(entries);
  renderEntries();
  showHint("저장되었습니다. 필요할 때 다시 열어보세요.");
  elements.entryText.value = "";
};

const clearEntry = () => {
  if (!elements.entryText || !elements.entryTags || !elements.entryMood || !elements.entryPrompt || !elements.entryDate) {
    return;
  }
  elements.entryText.value = "";
  elements.entryTags.value = "";
  elements.entryMood.value = 3;
  updateMoodLabel();
  elements.entryPrompt.selectedIndex = 0;
  elements.entryDate.value = todayString();
  showHint("입력 내용을 비웠습니다.");
};

const toggleHiddenMode = () => {
  hiddenMode = !hiddenMode;
  elements.toggleHide.textContent = hiddenMode ? "숨김 해제" : "숨김 모드";
  renderEntries();
};

const exportEntries = () => {
  const entries = getEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `quiet-log-${todayString()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showHint("백업 파일을 다운로드했습니다.");
};

const importEntries = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) {
        throw new Error("invalid format");
      }
      const entries = [...imported, ...getEntries()];
      setEntries(entries);
      renderEntries();
      showHint("기록을 가져왔습니다.");
    } catch (error) {
      showHint("가져오기에 실패했습니다. JSON 형식을 확인하세요.");
    }
  };
  reader.readAsText(file);
};

const entryMatches = (entry, query, mood) => {
  const q = query.toLowerCase();
  const haystack = [entry.date, entry.text, entry.prompt, ...entry.tags]
    .join(" ")
    .toLowerCase();
  const moodOk = mood === "all" || String(entry.mood) === mood;
  return moodOk && (!q || haystack.includes(q));
};

const renderEntries = () => {
  if (!elements.entryList || !elements.entryCount) return;
  const query = elements.searchInput ? elements.searchInput.value.trim() : "";
  const mood = elements.moodFilter ? elements.moodFilter.value : "all";
  const entries = getEntries().filter((entry) => entryMatches(entry, query, mood));

  elements.entryList.innerHTML = "";

  if (entries.length === 0) {
    elements.entryList.innerHTML = "<div class=\"hint\">아직 저장된 기록이 없습니다.</div>";
  } else {
    entries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "entry-card fade-in";
      if (hiddenMode) {
        card.classList.add("hidden");
      }

      const title = document.createElement("strong");
      title.textContent = entry.prompt || "오늘의 기록";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${entry.date} · 감정 ${entry.mood} (${moodLabel(entry.mood)})`;

      const tags = document.createElement("div");
      tags.className = "tags";
      entry.tags.forEach((tag) => {
        const pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.textContent = tag;
        tags.appendChild(pill);
      });

      const snippet = document.createElement("div");
      snippet.className = "snippet";
      snippet.textContent = entry.text.length > 120 ? `${entry.text.slice(0, 120)}...` : entry.text;

      const actions = document.createElement("div");
      actions.className = "actions";

      const viewBtn = document.createElement("button");
      viewBtn.className = "btn ghost";
      viewBtn.type = "button";
      viewBtn.textContent = "자세히";
      viewBtn.addEventListener("click", () => openDialog(entry));

      const windowBtn = document.createElement("button");
      windowBtn.className = "btn ghost";
      windowBtn.type = "button";
      windowBtn.textContent = "새 창";
      windowBtn.addEventListener("click", () => openEntryInWindow(entry));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn ghost";
      deleteBtn.type = "button";
      deleteBtn.textContent = "삭제";
      deleteBtn.addEventListener("click", () => deleteEntry(entry.id));

      actions.append(viewBtn, windowBtn, deleteBtn);

      card.append(title, meta);
      if (entry.tags.length > 0) {
        card.append(tags);
      }
      card.append(snippet, actions);
      elements.entryList.appendChild(card);
    });
  }

  elements.entryCount.textContent = `${entries.length}개`;
};

const deleteEntry = (id) => {
  const entries = getEntries().filter((entry) => entry.id !== id);
  setEntries(entries);
  renderEntries();
  showHint("기록을 삭제했습니다.");
};

const openEntryInWindow = (entry) => {
  const meta = `${entry.date} · 감정 ${entry.mood} (${moodLabel(entry.mood)})`;
  const tags = entry.tags.length > 0 ? `태그: ${formatTags(entry.tags)}` : "태그: 없음";
  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>기록 보기</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="entry-view">
    <div class="entry-view-card">
      <div class="entry-view-actions">
        <button class="btn ghost" type="button" onclick="window.close()">닫기</button>
      </div>
      <div class="entry-view-title">${escapeHtml(entry.prompt || "오늘의 기록")}</div>
      <div class="entry-view-meta">${escapeHtml(meta)}</div>
      <pre class="entry-view-text">${escapeHtml(entry.text)}</pre>
      <div class="entry-view-tags">${escapeHtml(tags)}</div>
    </div>
  </main>
</body>
</html>`;

  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    showHint("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
};

const openDialog = (entry) => {
  elements.dialogTitle.textContent = entry.prompt || "오늘의 기록";
  elements.dialogMeta.textContent = `${entry.date} · 감정 ${entry.mood} (${moodLabel(entry.mood)})`;
  const tagText = entry.tags.length > 0 ? `태그: ${formatTags(entry.tags)}` : "";
  elements.dialogBody.textContent = `${entry.text}\n\n${tagText}`.trim();
  elements.dialog.showModal();
};

const closeDialog = () => {
  elements.dialog.close();
};

const init = () => {
  renderPrompts();
  if (elements.entryDate) {
    elements.entryDate.value = todayString();
  }
  updateMoodLabel();
  renderEntries();
  const supportCards = document.querySelectorAll(".support-contacts details");

  const updateSupportToggleLabel = () => {
    if (!elements.toggleAllSupport) return;
    const allOpen = [...supportCards].every((card) => card.open);
    elements.toggleAllSupport.textContent = allOpen ? "모두 접기" : "모두 펼치기";
  };

  if (elements.entryMood) {
    elements.entryMood.addEventListener("input", updateMoodLabel);
  }
  if (elements.randomPrompt && elements.entryPrompt) {
    elements.randomPrompt.addEventListener("click", () => {
      const choice = prompts[Math.floor(Math.random() * prompts.length)];
      elements.entryPrompt.value = choice;
    });
  }
  if (elements.saveEntry) {
    elements.saveEntry.addEventListener("click", saveEntry);
  }
  if (elements.previewEntry) {
    elements.previewEntry.addEventListener("click", () => {
      if (!elements.entryText || !elements.entryDate || !elements.entryMood || !elements.entryTags || !elements.entryPrompt) {
        return;
      }
      const text = elements.entryText.value.trim();
      if (!text) {
        showHint("새 창으로 보려면 먼저 내용을 입력해주세요.");
        return;
      }
      const draftEntry = {
        date: elements.entryDate.value || todayString(),
        mood: Number(elements.entryMood.value),
        tags: parseTags(elements.entryTags.value),
        prompt: elements.entryPrompt.value,
        text
      };
      openEntryInWindow(draftEntry);
    });
  }
  if (elements.clearEntry) {
    elements.clearEntry.addEventListener("click", clearEntry);
  }
  if (elements.toggleHide) {
    elements.toggleHide.addEventListener("click", toggleHiddenMode);
  }
  if (elements.exportEntries) {
    elements.exportEntries.addEventListener("click", exportEntries);
  }
  if (elements.importEntries) {
    elements.importEntries.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        importEntries(file);
        event.target.value = "";
      }
    });
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", renderEntries);
  }
  if (elements.moodFilter) {
    elements.moodFilter.addEventListener("change", renderEntries);
  }
  if (elements.closeDialog) {
    elements.closeDialog.addEventListener("click", closeDialog);
  }
  if (elements.dialog) {
    elements.dialog.addEventListener("click", (event) => {
      if (event.target === elements.dialog) {
        closeDialog();
      }
    });
  }

  if (elements.toggleAllSupport && supportCards.length > 0) {
    elements.toggleAllSupport.addEventListener("click", () => {
      const shouldOpen = elements.toggleAllSupport.textContent.includes("펼치기");
      supportCards.forEach((card) => {
        card.open = shouldOpen;
      });
      updateSupportToggleLabel();
    });
    supportCards.forEach((card) => {
      card.addEventListener("toggle", updateSupportToggleLabel);
    });
    updateSupportToggleLabel();
  }
};

init();
