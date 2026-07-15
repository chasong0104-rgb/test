import { supabase } from "./supabase-config.js";

/* ------------------------------------------------------------
   원여고 실제 층별 도면 + 장소(핀) 좌표
   x, y 는 각 도면 이미지 기준 백분율(%) 위치입니다.
   (학생이 들어갈 수 없는 준비실/기자재실 등은 제외)
------------------------------------------------------------ */
const WONYEO_FLOORS = {
  1: { img: "img/wonyeo_1f.png", rooms: [
    { n: "여자화장실", x: 14, y: 33 }, { n: "신발장", x: 38, y: 30 }, { n: "계단", x: 61, y: 29 },
    { n: "승강기", x: 72, y: 28 }, { n: "출입구", x: 76, y: 40 },
    { n: "2-1", x: 16, y: 54 }, { n: "2-2", x: 25, y: 54 }, { n: "2-3", x: 34, y: 54 }, { n: "2-4", x: 44, y: 54 },
    { n: "2학년부", x: 53, y: 54 }, { n: "소담소담2", x: 62, y: 54 }, { n: "스튜디오1", x: 71, y: 53 },
    { n: "온라인학습실1", x: 79, y: 53 }, { n: "샘들마루", x: 86, y: 53 },
    { n: "토론학습실2", x: 93, y: 30 }, { n: "토론학습실1", x: 93, y: 41 }, { n: "부채마루", x: 93, y: 54 },
  ]},
  2: { img: "img/wonyeo_2f.jpg", rooms: [
    { n: "화장실(상단)", x: 31, y: 16 }, { n: "교직원휴게실", x: 46, y: 15 }, { n: "계단(상단)", x: 68, y: 15 },
    { n: "건강체력실", x: 12, y: 26 }, { n: "별무리홀", x: 16, y: 40 }, { n: "교무실", x: 39, y: 26 },
    { n: "교감실", x: 52, y: 26 }, { n: "산들마루", x: 64, y: 26 }, { n: "화장실(중앙)", x: 71, y: 24 },
    { n: "예지홀", x: 84, y: 30 }, { n: "방송실", x: 70, y: 41 }, { n: "3학년신발장", x: 70, y: 52 },
    { n: "신발장", x: 33, y: 63 }, { n: "계단(중앙)", x: 48, y: 63 }, { n: "승강기", x: 59, y: 62 },
    { n: "보건실", x: 16, y: 79 }, { n: "운영위원회의실", x: 26, y: 79 }, { n: "교장실", x: 35, y: 79 },
    { n: "교육행정실", x: 44, y: 79 }, { n: "행정실무실", x: 53, y: 79 }, { n: "역사관", x: 62, y: 79 },
  ]},
  3: { img: "img/wonyeo_3f.jpg", rooms: [
    { n: "화장실(상단)", x: 30, y: 16 }, { n: "계단(상단)", x: 60, y: 15 }, { n: "학생안전부", x: 14, y: 24 },
    { n: "3-9", x: 30, y: 18 }, { n: "메이커스실", x: 14, y: 36 }, { n: "컴퓨터실", x: 31, y: 31 },
    { n: "3-8", x: 38, y: 31 }, { n: "3-7", x: 47, y: 31 }, { n: "3-6", x: 56, y: 31 }, { n: "3-5", x: 64, y: 31 },
    { n: "화장실(중앙)", x: 71, y: 30 }, { n: "별하당셋", x: 70, y: 44 }, { n: "체육관", x: 85, y: 32 },
    { n: "학생휴게실", x: 28, y: 58 }, { n: "진학상담실", x: 40, y: 58 }, { n: "소인수교실3", x: 50, y: 58 },
    { n: "계단(중앙)", x: 58, y: 58 }, { n: "진달래글마루도서관", x: 73, y: 61 }, { n: "계단(하단)", x: 8, y: 60 },
    { n: "3-1", x: 11, y: 73 }, { n: "3-2", x: 20, y: 73 }, { n: "3-3", x: 29, y: 73 }, { n: "3-4", x: 38, y: 73 },
    { n: "3학년부", x: 48, y: 73 }, { n: "소담소담3", x: 57, y: 73 },
  ]},
  4: { img: "img/wonyeo_4f.jpg", rooms: [
    { n: "화장실(상단)", x: 30, y: 15 }, { n: "계단(상단)", x: 72, y: 15 }, { n: "물리실", x: 16, y: 27 },
    { n: "교육정보부", x: 9, y: 35 }, { n: "지구과학실", x: 22, y: 41 }, { n: "리스실", x: 13, y: 49 },
    { n: "2-10", x: 31, y: 33 }, { n: "2-9", x: 41, y: 33 }, { n: "1-6", x: 51, y: 33 }, { n: "1-5", x: 60, y: 33 },
    { n: "화장실(중앙)", x: 70, y: 33 }, { n: "별하당하나", x: 70, y: 48 }, { n: "미술실", x: 89, y: 55 },
    { n: "음악실", x: 79, y: 60 }, { n: "여자화장실", x: 12, y: 58 }, { n: "계단(하단)", x: 60, y: 58 },
    { n: "1-1", x: 12, y: 73 }, { n: "1-2", x: 22, y: 73 }, { n: "1-3", x: 31, y: 73 }, { n: "1-4", x: 40, y: 73 },
    { n: "1학년부", x: 50, y: 73 }, { n: "소담소담1", x: 60, y: 73 },
  ]},
  5: { img: "img/wonyeo_5f.jpg", rooms: [
    { n: "화장실(상단)", x: 30, y: 15 }, { n: "계단(상단)", x: 72, y: 15 }, { n: "생명과학실", x: 20, y: 20 },
    { n: "화학실", x: 20, y: 33 }, { n: "교과연구실", x: 28, y: 27 }, { n: "과학부", x: 38, y: 27 },
    { n: "진로교육부", x: 48, y: 27 }, { n: "미래교육부", x: 57, y: 27 }, { n: "wee클래스집단상담실", x: 68, y: 26 },
    { n: "화장실(중앙)", x: 79, y: 26 }, { n: "식당", x: 86, y: 56 },
    { n: "Wee클래스", x: 26, y: 58 }, { n: "통합교육지원실", x: 41, y: 58 }, { n: "계단(하단)", x: 55, y: 58 },
    { n: "여자화장실", x: 12, y: 58 },
    { n: "1-7", x: 12, y: 73 }, { n: "1-8", x: 22, y: 73 }, { n: "1-9", x: 31, y: 73 }, { n: "1-10", x: 41, y: 73 },
    { n: "1-11", x: 50, y: 73 },
  ]},
};
const FLOORS = [1, 2, 3, 4, 5];
function getFloorLocations(floor) {
  return (WONYEO_FLOORS[floor]?.rooms || []).map((r) => ({
    id: `${floor}:${r.n}`, floor, x: r.x, y: r.y, name: r.n,
  }));
}

const CATEGORIES = ["전자기기", "의류", "학용품", "지갑·카드류", "음식", "생활용품", "화장품", "악세서리", "학급", "기타"];
const REGISTER_POINTS = 10;      // 로그인 사용자가 분실물(발견)을 등록하면 적립 (DB 트리거가 실제 처리)
const FAKE_EMAIL_DOMAIN = "@lostfound.app";
const LONG_TERM_DAYS = 30;       // 등록 30일 지나면 장기보관함으로

const THEME_LABELS = { wonyeo: "원여", vintage: "빈티지" };
const THEME_TAGLINE = {
  wonyeo: "벚꽃 내음 가득한 원여고 분실물 지도",
  vintage: "차분한 빈티지 톤의 분실물 지도",
};

/* ------------------------------------------------------------
   상태
------------------------------------------------------------ */
const state = {
  theme: "wonyeo",
  tab: "map",
  items: [],
  leaderboard: [],
  currentUser: null,
  userDoc: null,
  map: { floor: 1, selected: null, sort: "new" },
  search: {
    scope: "normal", sort: "new",
    locMode: "text", locText: "", floor: 1, picked: null,
    itemMode: "category", category: "", itemText: "",
  },
  add: {
    photo: null, title: "", category: CATEGORIES[0], desc: "",
    locMode: "map", floor: 1, picked: null, locText: "",
    moved: false, movedMode: "map", movedFloor: 1, movedPicked: null, movedText: "",
  },
  lost: {
    formOpen: false, sort: "new",
    photo: null, title: "", category: CATEGORIES[0], desc: "",
    locMode: "map", floor: 1, picked: null, locText: "",
  },
  myMode: "login",
};

/* ------------------------------------------------------------
   Supabase 행 <-> 화면용 아이템 변환
------------------------------------------------------------ */
function rowToItem(r) {
  return {
    id: r.id, title: r.title, category: r.category, description: r.description, photo: r.photo,
    foundLocation: r.found_location, currentLocation: r.current_location,
    status: r.status, points: r.points, postType: r.post_type || "found",
    reporterUid: r.reporter_uid, reporterName: r.reporter_name,
    createdAtMillis: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

/* ------------------------------------------------------------
   유틸
------------------------------------------------------------ */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtTime(ts) {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function daysSince(ms) { return (Date.now() - ms) / 86400000; }
function isLongTerm(item) { return daysSince(item.createdAtMillis) > LONG_TERM_DAYS; }
function sortByTime(list, order) {
  const arr = [...list];
  arr.sort((a, b) => order === "old" ? a.createdAtMillis - b.createdAtMillis : b.createdAtMillis - a.createdAtMillis);
  return arr;
}
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}
function resizeImageFile(file, maxDim = 720, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   테마
------------------------------------------------------------ */
function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
  document.getElementById("theme-label").textContent = THEME_LABELS[state.theme];
  document.getElementById("header-tagline").textContent = THEME_TAGLINE[state.theme];
}
document.getElementById("theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "wonyeo" ? "vintage" : "wonyeo";
  applyTheme();
  renderCurrentTab();
});

/* ------------------------------------------------------------
   탭 네비게이션
------------------------------------------------------------ */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.tab = btn.dataset.tab;
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
    document.getElementById(`tab-${state.tab}`).classList.add("active");
    renderCurrentTab();
  });
});
function renderCurrentTab() {
  if (state.tab === "map") renderMapTab();
  else if (state.tab === "search") renderSearchTab();
  else if (state.tab === "add") renderAddTab();
  else if (state.tab === "lost") renderLostTab();
  else if (state.tab === "my") renderMyTab();
}

/* ------------------------------------------------------------
   지도 위젯 (층 버튼 + 실제 도면 + 핀)
------------------------------------------------------------ */
function renderFloorPicker(container, currentFloor, onPick) {
  container.innerHTML = "";
  FLOORS.forEach((f) => {
    const b = document.createElement("button");
    b.className = "floor-btn" + (f === currentFloor ? " active" : "");
    b.textContent = `${f}층`;
    b.addEventListener("click", () => onPick(f));
    container.appendChild(b);
  });
}
function renderMapWrap(container, floor, selectedId, onSelect, colorInfo) {
  container.innerHTML = "";
  const img = document.createElement("img");
  img.className = "map-img";
  img.src = WONYEO_FLOORS[floor].img;
  img.alt = `${floor}층 도면`;
  container.appendChild(img);
  getFloorLocations(floor).forEach((loc) => {
    const btn = document.createElement("button");
    btn.className = "map-pin-btn" + (selectedId === loc.id ? " active" : "");
    btn.style.left = loc.x + "%";
    btn.style.top = loc.y + "%";
    btn.title = loc.name;
    const pin = document.createElement("div");
    let cls = "map-pin" + (selectedId === loc.id ? " active" : "");
    const ci = colorInfo && colorInfo[loc.id];
    if (ci) {
      if (ci.f && ci.c) cls += " has-both";
      else if (ci.f) cls += " has-found";
      else if (ci.c) cls += " has-current";
    }
    pin.className = cls;
    btn.appendChild(pin);
    btn.addEventListener("click", () => onSelect(loc));
    container.appendChild(btn);
  });
}

/* ------------------------------------------------------------
   아이템 카드 HTML
------------------------------------------------------------ */
function itemCardHtml(item, matchedBy) {
  const moved = item.foundLocation.name !== item.currentLocation.name;
  let guide = "";
  if (matchedBy === "found" && moved) {
    guide = `<div class="item-guide">📍 지금 찾으러 갈 곳: ${item.currentLocation.floor}층 ${esc(item.currentLocation.name)}</div>`;
  } else if (matchedBy === "current" && moved) {
    guide = `<div class="item-guide">🔎 처음 발견된 곳: ${item.foundLocation.floor}층 ${esc(item.foundLocation.name)}</div>`;
  }
  let matchTag = "";
  if (matchedBy === "found") matchTag = `<span class="match-tag found">발견 위치</span>`;
  else if (matchedBy === "current") matchTag = `<span class="match-tag current">현재 위치</span>`;
  const statusBadge = item.status === "주인찾음"
    ? `<span class="badge badge-found">✔ 주인찾음</span>`
    : (item.postType === "lost" ? `<span class="badge badge-registered">찾는중</span>` : `<span class="badge badge-registered">등록</span>`);
  const pointBadge = (item.postType === "found" && item.status === "주인찾음") ? `<span class="badge badge-point">+${item.points || 10}P</span>` : "";
  const longTermBadge = isLongTerm(item) ? `<span class="badge badge-longterm">📦 장기</span>` : "";
  return `
    <div class="item-card" data-item-id="${item.id}">
      <div class="item-thumb" style="${item.photo ? `background-image:url('${item.photo}')` : ""}">${item.photo ? "" : "📦"}</div>
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-weight:700; font-size:15px;">${esc(item.title)}</span>
          <span class="badge badge-cat">${esc(item.category)}</span>
          ${statusBadge} ${pointBadge} ${longTermBadge} ${matchTag}
        </div>
        <div class="item-loc">${item.foundLocation.floor}층 · ${esc(item.foundLocation.name)}${moved ? ` → ${item.currentLocation.floor}층 · ${esc(item.currentLocation.name)}` : ""}</div>
        ${guide}
        <div class="item-meta">${fmtTime(item.createdAtMillis)} · ${esc(item.reporterName || "게스트")}</div>
      </div>
    </div>`;
}
function wireItemCards(container) {
  container.querySelectorAll(".item-card").forEach((el) => {
    el.addEventListener("click", () => {
      const item = state.items.find((it) => it.id === el.dataset.itemId);
      if (item) openItemModal(item);
    });
  });
}

/* 화면에 노출되는 '분실물(발견)' 목록: 찾습니다 글 제외 */
function foundItems() { return state.items.filter((it) => it.postType !== "lost"); }

/* ------------------------------------------------------------
   지도 탭
------------------------------------------------------------ */
function renderMapTab() {
  const m = state.map;
  // 정렬 버튼 상태
  document.querySelectorAll("[data-map-sort]").forEach((b) => b.classList.toggle("active", b.dataset.mapSort === m.sort));
  renderFloorPicker(document.getElementById("map-floor-picker"), m.floor, (f) => {
    m.floor = f; m.selected = null; renderMapTab();
  });
  // 이 층에서 장기보관 제외한 분실물로 핀 색 정보 구성
  const activeItems = foundItems().filter((it) => !isLongTerm(it));
  const colorInfo = {};
  activeItems.forEach((it) => {
    if (it.foundLocation.floor === m.floor) { (colorInfo[it.foundLocation.id] ||= { f: false, c: false }).f = true; }
    if (it.currentLocation.floor === m.floor) { (colorInfo[it.currentLocation.id] ||= { f: false, c: false }).c = true; }
  });
  renderMapWrap(document.getElementById("map-mapwrap"), m.floor, m.selected?.id, (loc) => {
    m.selected = loc; renderMapTab();
  }, colorInfo);

  const resultEl = document.getElementById("map-result");
  if (!m.selected) { resultEl.innerHTML = `<div class="empty-msg">지도에서 장소(핀)를 선택하면 그곳의 분실물이 표시됩니다.</div>`; return; }
  const sel = m.selected;
  let locItems = activeItems.filter((it) => it.foundLocation.id === sel.id || it.currentLocation.id === sel.id);
  locItems = sortByTime(locItems, m.sort);
  let html = `<div class="selected-loc-title">${sel.floor}층 · ${esc(sel.name)}</div>`;
  if (locItems.length === 0) {
    html += `<div class="empty-msg">이 장소에 등록된 분실물이 아직 없어요.</div>`;
  } else {
    html += locItems.map((it) => itemCardHtml(it, it.foundLocation.id === sel.id ? "found" : "current")).join("");
  }
  resultEl.innerHTML = html;
  wireItemCards(resultEl);
}
document.querySelectorAll("[data-map-sort]").forEach((b) => b.addEventListener("click", () => { state.map.sort = b.dataset.mapSort; renderMapTab(); }));

/* ------------------------------------------------------------
   검색 탭
------------------------------------------------------------ */
function renderSearchTab() {
  const s = state.search;
  document.querySelectorAll("[data-search-scope]").forEach((b) => b.classList.toggle("active", b.dataset.searchScope === s.scope));
  document.getElementById("search-scope-hint").style.display = s.scope === "longterm" ? "" : "none";
  document.querySelectorAll("[data-search-sort]").forEach((b) => b.classList.toggle("active", b.dataset.searchSort === s.sort));

  document.querySelectorAll("[data-search-loc-mode]").forEach((b) => b.classList.toggle("active", b.dataset.searchLocMode === s.locMode));
  document.getElementById("search-loc-text-wrap").style.display = s.locMode === "text" ? "" : "none";
  document.getElementById("search-loc-map-wrap").style.display = s.locMode === "map" ? "" : "none";
  document.querySelectorAll("[data-search-item-mode]").forEach((b) => b.classList.toggle("active", b.dataset.searchItemMode === s.itemMode));
  document.getElementById("search-item-category-wrap").style.display = s.itemMode === "category" ? "" : "none";
  document.getElementById("search-item-text-wrap").style.display = s.itemMode === "text" ? "" : "none";

  const catSel = document.getElementById("search-item-category");
  if (!catSel.dataset.filled) {
    CATEGORIES.forEach((c) => catSel.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`));
    catSel.dataset.filled = "1";
  }
  catSel.value = s.category;

  if (s.locMode === "map") {
    renderFloorPicker(document.getElementById("search-floor-picker"), s.floor, (f) => { s.floor = f; s.picked = null; renderSearchTab(); });
    renderMapWrap(document.getElementById("search-mapwrap"), s.floor, s.picked?.id, (loc) => { s.picked = loc; renderSearchTab(); });
    document.getElementById("search-picked-loc").textContent = s.picked ? `선택됨: ${s.picked.floor}층 ${s.picked.name}` : "";
  }

  const locQuery = s.locMode === "map" ? (s.picked?.name || "") : s.locText.trim();
  let results = foundItems().filter((it) => {
    // 장기보관함 여부
    if (s.scope === "longterm" ? !isLongTerm(it) : isLongTerm(it)) return false;
    let locOk = true, matchedBy = null;
    if (locQuery) {
      const f = it.foundLocation.name.includes(locQuery);
      const c = it.currentLocation.name.includes(locQuery);
      locOk = f || c;
      matchedBy = f ? "found" : (c ? "current" : null);
    }
    let itemOk = true;
    if (s.itemMode === "category" && s.category) itemOk = it.category === s.category;
    else if (s.itemMode === "text" && s.itemText.trim()) {
      const q = s.itemText.trim();
      itemOk = it.title.includes(q) || (it.description || "").includes(q);
    }
    it.__matchedBy = matchedBy;
    return locOk && itemOk;
  });
  results = sortByTime(results, s.sort);

  document.getElementById("search-count").textContent = `${s.scope === "longterm" ? "장기보관함" : "검색 결과"} ${results.length}건`;
  const resEl = document.getElementById("search-result");
  resEl.innerHTML = results.length === 0
    ? `<div class="empty-msg">조건에 맞는 분실물이 없어요.</div>`
    : results.map((it) => itemCardHtml(it, it.__matchedBy)).join("");
  wireItemCards(resEl);
}
document.querySelectorAll("[data-search-scope]").forEach((b) => b.addEventListener("click", () => { state.search.scope = b.dataset.searchScope; renderSearchTab(); }));
document.querySelectorAll("[data-search-sort]").forEach((b) => b.addEventListener("click", () => { state.search.sort = b.dataset.searchSort; renderSearchTab(); }));
document.querySelectorAll("[data-search-loc-mode]").forEach((b) => b.addEventListener("click", () => { state.search.locMode = b.dataset.searchLocMode; renderSearchTab(); }));
document.querySelectorAll("[data-search-item-mode]").forEach((b) => b.addEventListener("click", () => { state.search.itemMode = b.dataset.searchItemMode; renderSearchTab(); }));
document.getElementById("search-loc-text").addEventListener("input", (e) => { state.search.locText = e.target.value; renderSearchTab(); });
document.getElementById("search-item-text").addEventListener("input", (e) => { state.search.itemText = e.target.value; renderSearchTab(); });
document.getElementById("search-item-category").addEventListener("change", (e) => { state.search.category = e.target.value; renderSearchTab(); });

/* ------------------------------------------------------------
   공통: 카테고리/층 select 채우기
------------------------------------------------------------ */
function fillCategorySelect(sel) {
  if (sel.dataset.filled) return;
  CATEGORIES.forEach((c) => sel.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`));
  sel.dataset.filled = "1";
}
function fillFloorSelect(sel) {
  if (sel.dataset.filled) return;
  FLOORS.forEach((f) => sel.insertAdjacentHTML("beforeend", `<option value="${f}">${f}층</option>`));
  sel.dataset.filled = "1";
}

/* ------------------------------------------------------------
   등록 탭 (분실물 발견)
------------------------------------------------------------ */
function renderAddTab() {
  const a = state.add;
  const catSel = document.getElementById("add-category");
  fillCategorySelect(catSel); catSel.value = a.category;
  const floorSel = document.getElementById("add-loc-floor");
  fillFloorSelect(floorSel); floorSel.value = a.floor;

  document.querySelectorAll("[data-add-loc-mode]").forEach((b) => b.classList.toggle("active", b.dataset.addLocMode === a.locMode));
  document.getElementById("add-loc-map-wrap").style.display = a.locMode === "map" ? "" : "none";
  document.getElementById("add-loc-text-wrap").style.display = a.locMode === "text" ? "" : "none";
  if (a.locMode === "map") {
    renderFloorPicker(document.getElementById("add-floor-picker"), a.floor, (f) => { a.floor = f; a.picked = null; renderAddTab(); });
    renderMapWrap(document.getElementById("add-mapwrap"), a.floor, a.picked?.id, (loc) => { a.picked = loc; renderAddTab(); });
    document.getElementById("add-picked-loc").textContent = a.picked ? `선택됨: ${a.picked.floor}층 ${a.picked.name}` : "";
  }

  // 위치 변경(옮겨짐)
  document.getElementById("add-moved-check").checked = a.moved;
  document.getElementById("add-moved-wrap").style.display = a.moved ? "" : "none";
  if (a.moved) {
    document.querySelectorAll("[data-add-moved-mode]").forEach((b) => b.classList.toggle("active", b.dataset.addMovedMode === a.movedMode));
    document.getElementById("add-moved-map-wrap").style.display = a.movedMode === "map" ? "" : "none";
    document.getElementById("add-moved-text-wrap").style.display = a.movedMode === "text" ? "" : "none";
    if (a.movedMode === "map") {
      renderFloorPicker(document.getElementById("add-moved-floor-picker"), a.movedFloor, (f) => { a.movedFloor = f; a.movedPicked = null; renderAddTab(); });
      renderMapWrap(document.getElementById("add-moved-mapwrap"), a.movedFloor, a.movedPicked?.id, (loc) => { a.movedPicked = loc; renderAddTab(); });
      document.getElementById("add-moved-picked-loc").textContent = a.movedPicked ? `선택됨: ${a.movedPicked.floor}층 ${a.movedPicked.name}` : "";
    }
  }

  const previewEl = document.getElementById("add-photo-preview");
  previewEl.innerHTML = a.photo
    ? `<div class="photo-preview"><img src="${a.photo}" /><button type="button" class="photo-remove" id="add-photo-remove">✕</button></div>` : "";
  if (a.photo) document.getElementById("add-photo-remove").addEventListener("click", () => { a.photo = null; renderAddTab(); });

  const movedOk = !a.moved || (a.movedMode === "map" ? a.movedPicked : a.movedText.trim());
  const canSubmit = a.title.trim() && (a.locMode === "map" ? a.picked : a.locText.trim()) && movedOk;
  document.getElementById("add-submit").disabled = !canSubmit;
}
document.getElementById("add-photo-camera").addEventListener("click", () => document.getElementById("add-file-camera").click());
document.getElementById("add-photo-gallery").addEventListener("click", () => document.getElementById("add-file-gallery").click());
async function handleAddFile(e) {
  const f = e.target.files?.[0]; if (!f) return;
  state.add.photo = await resizeImageFile(f); renderAddTab(); e.target.value = "";
}
document.getElementById("add-file-camera").addEventListener("change", handleAddFile);
document.getElementById("add-file-gallery").addEventListener("change", handleAddFile);
document.getElementById("add-title").addEventListener("input", (e) => { state.add.title = e.target.value; renderAddTab(); });
document.getElementById("add-category").addEventListener("change", (e) => { state.add.category = e.target.value; });
document.getElementById("add-desc").addEventListener("input", (e) => { state.add.desc = e.target.value; });
document.querySelectorAll("[data-add-loc-mode]").forEach((b) => b.addEventListener("click", () => { state.add.locMode = b.dataset.addLocMode; renderAddTab(); }));
document.getElementById("add-loc-floor").addEventListener("change", (e) => { state.add.floor = Number(e.target.value); });
document.getElementById("add-loc-text").addEventListener("input", (e) => { state.add.locText = e.target.value; renderAddTab(); });
document.getElementById("add-moved-check").addEventListener("change", (e) => { state.add.moved = e.target.checked; renderAddTab(); });
document.querySelectorAll("[data-add-moved-mode]").forEach((b) => b.addEventListener("click", () => { state.add.movedMode = b.dataset.addMovedMode; renderAddTab(); }));
document.getElementById("add-moved-text").addEventListener("input", (e) => { state.add.movedText = e.target.value; renderAddTab(); });

document.getElementById("add-submit").addEventListener("click", async () => {
  const a = state.add;
  const btn = document.getElementById("add-submit");
  btn.disabled = true; btn.textContent = "등록 중...";
  try {
    const foundLocation = a.locMode === "map" ? a.picked : { id: `text-${uid()}`, floor: a.floor, name: a.locText.trim() };
    let currentLocation = foundLocation;
    if (a.moved) {
      currentLocation = a.movedMode === "map" ? a.movedPicked : { id: `text-${uid()}`, floor: a.movedFloor, name: a.movedText.trim() };
    }
    const user = state.currentUser;
    const isRealUser = !!user;
    const reporterName = state.userDoc?.nickname || "게스트";
    const { error } = await supabase.from("items").insert({
      title: a.title.trim(), category: a.category, description: a.desc.trim(), photo: a.photo || null,
      found_location: foundLocation, current_location: currentLocation,
      status: "등록", points: 0, post_type: "found",
      reporter_uid: user ? user.id : null, reporter_name: reporterName,
    });
    if (error) throw error;
    showToast(isRealUser ? `분실물이 등록되었어요! +${REGISTER_POINTS}P 적립 🎉` : "분실물이 등록되었어요! 목록에서 바로 확인해보세요.");
    state.add = { photo: null, title: "", category: CATEGORIES[0], desc: "", locMode: "map", floor: 1, picked: null, locText: "", moved: false, movedMode: "map", movedFloor: 1, movedPicked: null, movedText: "" };
    ["add-title", "add-desc", "add-loc-text", "add-moved-text"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
    await loadItems();
    if (isRealUser) loadProfile(user.id);
    switchTab("map");
  } catch (err) {
    console.error(err);
    showToast("등록에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    btn.textContent = "분실물 등록하기";
    renderAddTab();
  }
});

/* ------------------------------------------------------------
   찾습니다 탭 (물건을 잃어버린 사람)
------------------------------------------------------------ */
function renderLostTab() {
  const L = state.lost;
  document.getElementById("lost-form-wrap").style.display = L.formOpen ? "" : "none";
  document.getElementById("lost-new-btn").style.display = L.formOpen ? "none" : "";
  document.querySelectorAll("[data-lost-sort]").forEach((b) => b.classList.toggle("active", b.dataset.lostSort === L.sort));

  if (L.formOpen) {
    const catSel = document.getElementById("lost-category");
    fillCategorySelect(catSel); catSel.value = L.category;
    const floorSel = document.getElementById("lost-loc-floor");
    fillFloorSelect(floorSel); floorSel.value = L.floor;
    document.querySelectorAll("[data-lost-loc-mode]").forEach((b) => b.classList.toggle("active", b.dataset.lostLocMode === L.locMode));
    document.getElementById("lost-loc-map-wrap").style.display = L.locMode === "map" ? "" : "none";
    document.getElementById("lost-loc-text-wrap").style.display = L.locMode === "text" ? "" : "none";
    if (L.locMode === "map") {
      renderFloorPicker(document.getElementById("lost-floor-picker"), L.floor, (f) => { L.floor = f; L.picked = null; renderLostTab(); });
      renderMapWrap(document.getElementById("lost-mapwrap"), L.floor, L.picked?.id, (loc) => { L.picked = loc; renderLostTab(); });
      document.getElementById("lost-picked-loc").textContent = L.picked ? `선택됨: ${L.picked.floor}층 ${L.picked.name}` : "";
    }
    const previewEl = document.getElementById("lost-photo-preview");
    previewEl.innerHTML = L.photo ? `<div class="photo-preview"><img src="${L.photo}" /><button type="button" class="photo-remove" id="lost-photo-remove">✕</button></div>` : "";
    if (L.photo) document.getElementById("lost-photo-remove").addEventListener("click", () => { L.photo = null; renderLostTab(); });
    const canSubmit = L.title.trim() && (L.locMode === "map" ? L.picked : L.locText.trim());
    document.getElementById("lost-submit").disabled = !canSubmit;
  }

  const lostList = sortByTime(state.items.filter((it) => it.postType === "lost"), L.sort);
  document.getElementById("lost-count").textContent = `찾는 글 ${lostList.length}건`;
  const resEl = document.getElementById("lost-result");
  resEl.innerHTML = lostList.length === 0
    ? `<div class="empty-msg">아직 찾는 글이 없어요.</div>`
    : lostList.map((it) => itemCardHtml(it, null)).join("");
  wireItemCards(resEl);
}
document.getElementById("lost-new-btn").addEventListener("click", () => { state.lost.formOpen = true; renderLostTab(); });
document.getElementById("lost-cancel").addEventListener("click", () => { state.lost.formOpen = false; renderLostTab(); });
document.querySelectorAll("[data-lost-sort]").forEach((b) => b.addEventListener("click", () => { state.lost.sort = b.dataset.lostSort; renderLostTab(); }));
document.getElementById("lost-photo-camera").addEventListener("click", () => document.getElementById("lost-file-camera").click());
document.getElementById("lost-photo-gallery").addEventListener("click", () => document.getElementById("lost-file-gallery").click());
async function handleLostFile(e) {
  const f = e.target.files?.[0]; if (!f) return;
  state.lost.photo = await resizeImageFile(f); renderLostTab(); e.target.value = "";
}
document.getElementById("lost-file-camera").addEventListener("change", handleLostFile);
document.getElementById("lost-file-gallery").addEventListener("change", handleLostFile);
document.getElementById("lost-title").addEventListener("input", (e) => { state.lost.title = e.target.value; renderLostTab(); });
document.getElementById("lost-category").addEventListener("change", (e) => { state.lost.category = e.target.value; });
document.getElementById("lost-desc").addEventListener("input", (e) => { state.lost.desc = e.target.value; });
document.querySelectorAll("[data-lost-loc-mode]").forEach((b) => b.addEventListener("click", () => { state.lost.locMode = b.dataset.lostLocMode; renderLostTab(); }));
document.getElementById("lost-loc-floor").addEventListener("change", (e) => { state.lost.floor = Number(e.target.value); });
document.getElementById("lost-loc-text").addEventListener("input", (e) => { state.lost.locText = e.target.value; renderLostTab(); });

document.getElementById("lost-submit").addEventListener("click", async () => {
  const L = state.lost;
  const btn = document.getElementById("lost-submit");
  btn.disabled = true; btn.textContent = "올리는 중...";
  try {
    const loc = L.locMode === "map" ? L.picked : { id: `text-${uid()}`, floor: L.floor, name: L.locText.trim() };
    const user = state.currentUser;
    const reporterName = state.userDoc?.nickname || "게스트";
    const { error } = await supabase.from("items").insert({
      title: L.title.trim(), category: L.category, description: L.desc.trim(), photo: L.photo || null,
      found_location: loc, current_location: loc,
      status: "등록", points: 0, post_type: "lost",
      reporter_uid: user ? user.id : null, reporter_name: reporterName,
    });
    if (error) throw error;
    showToast("찾는 글이 올라갔어요! 🙋");
    state.lost = { formOpen: false, sort: L.sort, photo: null, title: "", category: CATEGORIES[0], desc: "", locMode: "map", floor: 1, picked: null, locText: "" };
    ["lost-title", "lost-desc", "lost-loc-text"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
    await loadItems();
    renderLostTab();
  } catch (err) {
    console.error(err);
    showToast("등록에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    btn.textContent = "찾는 글 올리기";
  }
});

/* ------------------------------------------------------------
   MY 탭
------------------------------------------------------------ */
function renderMyTab() {
  const el = document.getElementById("my-content");
  const user = state.currentUser;
  const loggedInReal = !!user;

  const rankHtml = `
    <div class="rank-card">
      <div class="rank-title">🏆 이번 달 포인트 랭킹 TOP 3</div>
      ${state.leaderboard.length === 0
        ? `<div class="empty-msg" style="padding:6px 0;">아직 포인트를 획득한 사람이 없어요.</div>`
        : state.leaderboard.map((p, i) => `
          <div class="rank-row">
            <span class="rank-medal">${["🥇", "🥈", "🥉"][i] || "🏅"}</span>
            <span class="rank-name">${esc(p.nickname)}</span>
            <span class="rank-pts">${p.points} P</span>
          </div>`).join("")}
    </div>`;

  if (loggedInReal && state.userDoc) {
    const myItems = state.items.filter((it) => it.reporterUid === user.id);
    el.innerHTML = `
      <div class="profile-card">
        <div class="profile-greet">안녕하세요</div>
        <div class="profile-name">${esc(state.userDoc.nickname)}님</div>
        <div class="profile-points">🪙 이번 달 ${state.userDoc.points || 0} P 보유</div>
      </div>
      ${rankHtml}
      <div class="field-label" style="margin-bottom:8px;">내가 올린 글 (${myItems.length})</div>
      <div id="my-items">${myItems.length === 0 ? `<div class="empty-msg">아직 올린 글이 없어요.</div>` : myItems.map((it) => itemCardHtml(it, null)).join("")}</div>
      <button class="btn-secondary" id="my-logout" style="margin-top:10px;">↩ 로그아웃</button>
    `;
    wireItemCards(document.getElementById("my-items"));
    document.getElementById("my-logout").addEventListener("click", async () => { await supabase.auth.signOut(); showToast("로그아웃 되었어요."); });
    return;
  }

  el.innerHTML = `
    <div class="my-header">
      <div style="font-size:28px;">📜</div>
      <div class="font-display" style="font-size:18px; font-weight:700; margin-top:6px;">MY 페이지</div>
      <div class="sub">로그인하면 포인트 적립과 내 등록 내역을 볼 수 있어요.</div>
    </div>
    ${rankHtml}
    <div class="seg-row">
      <button class="seg-btn ${state.myMode === "login" ? "active" : ""}" id="my-mode-login">로그인</button>
      <button class="seg-btn ${state.myMode === "signup" ? "active" : ""}" id="my-mode-signup">회원가입</button>
    </div>
    <div class="field"><label class="field-label">아이디</label><input type="text" id="my-username" /></div>
    ${state.myMode === "signup" ? `<div class="field"><label class="field-label">닉네임</label><input type="text" id="my-nickname" /></div>` : ""}
    <div class="field"><label class="field-label">비밀번호</label><input type="password" id="my-password" /></div>
    <div id="my-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary" id="my-submit">${state.myMode === "login" ? "🔑 로그인" : "🔑 회원가입하고 시작하기"}</button>
    <div class="guest-link" id="my-guest-note">현재 게스트로 둘러보는 중이에요. 등록 시 '게스트'로 표시됩니다.</div>
  `;
  document.getElementById("my-mode-login").addEventListener("click", () => { state.myMode = "login"; renderMyTab(); });
  document.getElementById("my-mode-signup").addEventListener("click", () => { state.myMode = "signup"; renderMyTab(); });
  document.getElementById("my-submit").addEventListener("click", handleAuthSubmit);
}

async function handleAuthSubmit() {
  const errEl = document.getElementById("my-err");
  errEl.style.display = "none";
  const username = document.getElementById("my-username").value.trim();
  const password = document.getElementById("my-password").value;
  const nicknameEl = document.getElementById("my-nickname");
  const nickname = nicknameEl ? nicknameEl.value.trim() : "";

  if (!username || !password) { errEl.textContent = "아이디와 비밀번호를 입력해주세요."; errEl.style.display = ""; return; }
  if (state.myMode === "signup" && !nickname) { errEl.textContent = "닉네임을 입력해주세요."; errEl.style.display = ""; return; }
  if (password.length < 6) { errEl.textContent = "비밀번호는 6자 이상이어야 해요."; errEl.style.display = ""; return; }

  const email = username + FAKE_EMAIL_DOMAIN;
  const btn = document.getElementById("my-submit");
  btn.disabled = true;
  try {
    if (state.myMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username, nickname } } });
      if (error) throw error;
      showToast("회원가입 완료! 환영합니다 🎉");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast("로그인 되었어요.");
    }
  } catch (err) {
    console.error(err);
    const m = ((err && err.message) || "").toLowerCase();
    let msg = "요청을 처리하지 못했어요.";
    if (m.includes("already registered") || m.includes("already been registered") || err.code === "user_already_exists") msg = "이미 사용 중인 아이디예요.";
    else if (m.includes("invalid login credentials")) msg = "아이디 또는 비밀번호가 올바르지 않아요.";
    else if (m.includes("weak") || (m.includes("password") && m.includes("6"))) msg = "비밀번호는 6자 이상이어야 해요.";
    errEl.textContent = msg; errEl.style.display = "";
  } finally { btn.disabled = false; }
}

/* ------------------------------------------------------------
   상세 모달
------------------------------------------------------------ */
function openItemModal(item) {
  const isLost = item.postType === "lost";
  const moved = item.foundLocation.name !== item.currentLocation.name;
  const contentEl = document.getElementById("item-modal-content");
  contentEl.innerHTML = `
    <div class="modal-head">
      <button class="modal-close" id="modal-close-1">‹</button>
      <div style="font-weight:800;">${isLost ? "🙋 찾는 물건 상세" : "분실물 상세"}</div>
      <button class="modal-close" id="modal-close-2">✕</button>
    </div>
    <div style="display:flex; gap:14px; margin-bottom:14px;">
      <div class="detail-thumb" style="${item.photo ? `background-image:url('${item.photo}')` : ""}">${item.photo ? "" : "📦"}</div>
      <div>
        <div class="font-display" style="font-size:18px; font-weight:700;">${esc(item.title)}</div>
        <div style="margin-top:4px;">
          <span class="badge badge-cat">${esc(item.category)}</span>
          ${item.status === "주인찾음" ? `<span class="badge badge-found">주인찾음</span>` : (isLost ? `<span class="badge badge-registered">찾는중</span>` : `<span class="badge badge-registered">등록</span>`)}
          ${isLongTerm(item) ? `<span class="badge badge-longterm">📦 장기</span>` : ""}
        </div>
      </div>
    </div>
    ${item.description ? `<div style="font-size:13.5px; margin-bottom:12px; line-height:1.5;">${esc(item.description)}</div>` : ""}
    <div class="detail-box">
      <div class="detail-row"><span>${isLost ? "잃어버린 장소" : "발견 위치"}</span><span class="v">${item.foundLocation.floor}층 · ${esc(item.foundLocation.name)}</span></div>
      ${moved ? `<div class="detail-row"><span>현재 위치</span><span class="v strong">${item.currentLocation.floor}층 · ${esc(item.currentLocation.name)}</span></div>` : ""}
      <div class="detail-row"><span>${isLost ? "작성자" : "등록자"}</span><span class="v">${esc(item.reporterName || "게스트")}</span></div>
      <div class="detail-row"><span>등록 시각</span><span class="v">${fmtTime(item.createdAtMillis)}</span></div>
      ${(!isLost && item.status === "주인찾음") ? `<div class="detail-row"><span>지급 포인트</span><span class="v strong">+${item.points || 10} P</span></div>` : ""}
    </div>
    ${item.status !== "주인찾음" ? `<button class="btn-primary" id="modal-mark-found">주인 찾음으로 표시하기</button>` : ""}
  `;
  document.getElementById("modal-close-1").addEventListener("click", closeItemModal);
  document.getElementById("modal-close-2").addEventListener("click", closeItemModal);
  const markBtn = document.getElementById("modal-mark-found");
  if (markBtn) markBtn.addEventListener("click", () => markFound(item));
  document.getElementById("item-modal").classList.add("open");
}
function closeItemModal() { document.getElementById("item-modal").classList.remove("open"); }
document.getElementById("item-modal").addEventListener("click", (e) => { if (e.target.id === "item-modal") closeItemModal(); });

async function markFound(item) {
  try {
    const { error } = await supabase.rpc("mark_item_found", { item_id: item.id });
    if (error) throw error;
    showToast("주인을 찾았어요! 🎉");
    closeItemModal();
    await loadItems();
  } catch (err) {
    console.error(err);
    showToast("처리에 실패했어요. 다시 시도해주세요.");
  }
}

/* ------------------------------------------------------------
   데이터 로드 + 실시간
------------------------------------------------------------ */
async function loadItems() {
  const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
  if (error) { console.error("items 로드 오류", error); return; }
  state.items = (data || []).map(rowToItem);
  renderCurrentTab();
}
function subscribeItems() {
  loadItems();
  supabase.channel("items-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => loadItems())
    .subscribe();
}
async function loadLeaderboard() {
  const { data, error } = await supabase.rpc("get_top_profiles");
  if (error) { console.error("랭킹 로드 오류", error); return; }
  state.leaderboard = data || [];
  if (state.tab === "my") renderMyTab();
}
async function loadProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) { console.error("profile 로드 오류", error); return; }
  state.userDoc = data || null;
  loadLeaderboard();
  if (state.tab === "my") renderMyTab();
}
let profileChannel = null;
function subscribeProfile(userId) {
  if (profileChannel) { supabase.removeChannel(profileChannel); profileChannel = null; }
  profileChannel = supabase.channel("profile-" + userId)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, (payload) => {
      state.userDoc = payload.new || state.userDoc;
      loadLeaderboard();
      if (state.tab === "my") renderMyTab();
    })
    .subscribe();
}

/* ------------------------------------------------------------
   인증 상태
------------------------------------------------------------ */
function applySession(session) {
  const user = session?.user ?? null;
  state.currentUser = user;
  if (user) { subscribeProfile(user.id); loadProfile(user.id); }
  else {
    state.userDoc = null;
    if (profileChannel) { supabase.removeChannel(profileChannel); profileChannel = null; }
    if (state.tab === "my") renderMyTab();
  }
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  renderCurrentTab();
}

let __appRevealed = false;
function revealApp() {
  if (__appRevealed) return;
  __appRevealed = true;
  document.getElementById("loading").style.display = "none";
  document.getElementById("app-inner").style.display = "flex";
  applyTheme();
  renderCurrentTab();
}

revealApp();
subscribeItems();
loadLeaderboard();
supabase.auth.getSession().then(({ data: { session } }) => applySession(session));
supabase.auth.onAuthStateChange((_event, session) => applySession(session));

/* 서비스 워커 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW 등록 실패", e));
  });
}
