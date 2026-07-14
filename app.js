import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  initializeFirestore, collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, setDoc, getDoc, increment, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ------------------------------------------------------------
   Firebase 초기화
------------------------------------------------------------ */
const app = initializeApp(firebaseConfig);
// 비공개 릴레이(Private Relay), 학교/회사 방화벽 등 프록시 환경에서
// 기본 스트리밍 연결이 응답 없이 멈추는 문제를 막기 위해 자동으로
// 긴 폴링(long polling) 방식으로 전환되도록 설정합니다.
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
const auth = getAuth(app);
const FAKE_EMAIL_DOMAIN = "@lostfound.app"; // 아이디 -> 내부 이메일 변환용

/* ------------------------------------------------------------
   상수: 층 / 장소 / 카테고리
------------------------------------------------------------ */
const POINTS = [
  { id: "p1", x: 39, y: 15 },
  { id: "p2", x: 15, y: 30 },
  { id: "p3", x: 20, y: 53 },
  { id: "p4", x: 47, y: 45 },
  { id: "p5", x: 80, y: 37 },
  { id: "p6", x: 93, y: 21 },
  { id: "p7", x: 61, y: 71 },
  { id: "p8", x: 20, y: 89 },
];
const FLOOR_NAMES = {
  1: ["정문 현관", "행정실", "교무실", "중앙 정원", "도서관", "동관 라운지", "급식실", "보건실"],
  2: ["1학년 1·2반", "1학년 3·4반", "1학년 5·6반", "미술실", "음악실", "방송실", "1학년 자습실", "학생상담실"],
  3: ["2학년 1·2반", "2학년 3·4반", "2학년 5·6반", "과학실", "컴퓨터실", "2학년 자습실", "서관 복도", "옥상정원 입구"],
  4: ["3학년 1·2반", "3학년 3·4반", "3학년 5·6반", "진로상담실", "시청각실", "3학년 자습실", "열람실", "교재연구실"],
  5: ["체육관", "강당", "동아리실", "매점", "주차장 입구", "옥상정원", "수영장", "비품창고"],
};
function getFloorLocations(floor) {
  return POINTS.map((p, i) => ({ id: `${floor}-${p.id}`, floor, x: p.x, y: p.y, name: FLOOR_NAMES[floor][i] }));
}
const CATEGORIES = ["전자기기", "의류", "학용품", "지갑·카드류", "음식", "생활용품", "화장품", "악세서리", "학급", "기타"];

const THEME_LABELS = { castle: "고성 지도", blossom: "블로썸 핑크" };
const THEME_TAGLINE = { castle: "성을 탐험하듯 학교를 누비는 지도", blossom: "은은한 로즈 톤으로 정리한 지도" };

/* ------------------------------------------------------------
   상태
------------------------------------------------------------ */
const state = {
  theme: "castle",
  tab: "map",
  items: [],
  currentUser: null,
  userDoc: null,
  map: { floor: 1, selected: null },
  search: {
    locMode: "text", locText: "", floor: 1, picked: null,
    itemMode: "category", category: "", itemText: "",
  },
  add: {
    photo: null, title: "", category: CATEGORIES[0], desc: "",
    locMode: "map", floor: 1, picked: null, locText: "",
    moved: false, movedText: "",
  },
  myMode: "login",
};

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
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* 사진 리사이즈 (Firestore 문서 용량 절약) */
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
  state.theme = state.theme === "castle" ? "blossom" : "castle";
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
  else if (state.tab === "my") renderMyTab();
}

/* ------------------------------------------------------------
   지도 위젯 (공용) : 층 버튼 + 핀
------------------------------------------------------------ */
function renderFloorPicker(container, currentFloor, onPick) {
  container.innerHTML = "";
  [1, 2, 3, 4, 5].forEach((f) => {
    const b = document.createElement("button");
    b.className = "floor-btn" + (f === currentFloor ? " active" : "");
    b.textContent = `${f}층`;
    b.addEventListener("click", () => onPick(f));
    container.appendChild(b);
  });
}
function renderMapWrap(container, floor, selectedId, onSelect) {
  container.innerHTML = "";
  getFloorLocations(floor).forEach((loc) => {
    const btn = document.createElement("button");
    btn.className = "map-pin-btn";
    btn.style.left = loc.x + "%";
    btn.style.top = loc.y + "%";
    btn.title = loc.name;
    const pin = document.createElement("div");
    pin.className = "map-pin" + (selectedId === loc.id ? " active" : "");
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
  const statusBadge = item.status === "주인찾음"
    ? `<span class="badge badge-found">✔ 주인찾음</span>`
    : `<span class="badge badge-registered">등록</span>`;
  const pointBadge = item.status === "주인찾음" ? `<span class="badge badge-point">+${item.points || 10}P</span>` : "";
  return `
    <div class="item-card" data-item-id="${item.id}">
      <div class="item-thumb" style="${item.photo ? `background-image:url('${item.photo}')` : ""}">${item.photo ? "" : "📦"}</div>
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-weight:700; font-size:15px;">${esc(item.title)}</span>
          <span class="badge badge-cat">${esc(item.category)}</span>
          ${statusBadge} ${pointBadge}
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

/* ------------------------------------------------------------
   지도 탭
------------------------------------------------------------ */
function renderMapTab() {
  renderFloorPicker(document.getElementById("map-floor-picker"), state.map.floor, (f) => {
    state.map.floor = f; state.map.selected = null; renderMapTab();
  });
  renderMapWrap(document.getElementById("map-mapwrap"), state.map.floor, state.map.selected?.id, (loc) => {
    state.map.selected = loc; renderMapTab();
  });
  const resultEl = document.getElementById("map-result");
  if (!state.map.selected) { resultEl.innerHTML = ""; return; }
  const sel = state.map.selected;
  const locItems = state.items.filter((it) => it.foundLocation.id === sel.id || it.currentLocation.id === sel.id);
  let html = `<div class="selected-loc-title">${sel.floor}층 · ${esc(sel.name)}</div>`;
  if (locItems.length === 0) {
    html += `<div class="empty-msg">이 장소에 등록된 분실물이 아직 없어요.</div>`;
  } else {
    html += locItems.map((it) => itemCardHtml(it, it.foundLocation.id === sel.id ? "found" : "current")).join("");
  }
  resultEl.innerHTML = html;
  wireItemCards(resultEl);
}

/* ------------------------------------------------------------
   검색 탭
------------------------------------------------------------ */
function renderSearchTab() {
  const s = state.search;
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

  const locQuery = (s.locMode === "map" ? s.picked?.name : s.locText).trim ? (s.locMode === "map" ? (s.picked?.name || "") : s.locText).trim() : "";
  const results = state.items.filter((it) => {
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

  document.getElementById("search-count").textContent = `검색 결과 ${results.length}건`;
  const resEl = document.getElementById("search-result");
  resEl.innerHTML = results.length === 0
    ? `<div class="empty-msg">조건에 맞는 분실물이 없어요.</div>`
    : results.map((it) => itemCardHtml(it, it.__matchedBy)).join("");
  wireItemCards(resEl);
}

document.querySelectorAll("[data-search-loc-mode]").forEach((b) => b.addEventListener("click", () => { state.search.locMode = b.dataset.searchLocMode; renderSearchTab(); }));
document.querySelectorAll("[data-search-item-mode]").forEach((b) => b.addEventListener("click", () => { state.search.itemMode = b.dataset.searchItemMode; renderSearchTab(); }));
document.getElementById("search-loc-text").addEventListener("input", (e) => { state.search.locText = e.target.value; renderSearchTab(); });
document.getElementById("search-item-text").addEventListener("input", (e) => { state.search.itemText = e.target.value; renderSearchTab(); });
document.getElementById("search-item-category").addEventListener("change", (e) => { state.search.category = e.target.value; renderSearchTab(); });

/* ------------------------------------------------------------
   등록 탭
------------------------------------------------------------ */
function renderAddTab() {
  const a = state.add;
  const catSel = document.getElementById("add-category");
  if (!catSel.dataset.filled) {
    CATEGORIES.forEach((c) => catSel.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`));
    catSel.dataset.filled = "1";
  }
  catSel.value = a.category;

  const floorSel = document.getElementById("add-loc-floor");
  if (!floorSel.dataset.filled) {
    [1, 2, 3, 4, 5].forEach((f) => floorSel.insertAdjacentHTML("beforeend", `<option value="${f}">${f}층</option>`));
    floorSel.dataset.filled = "1";
  }
  floorSel.value = a.floor;

  document.querySelectorAll("[data-add-loc-mode]").forEach((b) => b.classList.toggle("active", b.dataset.addLocMode === a.locMode));
  document.getElementById("add-loc-map-wrap").style.display = a.locMode === "map" ? "" : "none";
  document.getElementById("add-loc-text-wrap").style.display = a.locMode === "text" ? "" : "none";

  if (a.locMode === "map") {
    renderFloorPicker(document.getElementById("add-floor-picker"), a.floor, (f) => { a.floor = f; a.picked = null; renderAddTab(); });
    renderMapWrap(document.getElementById("add-mapwrap"), a.floor, a.picked?.id, (loc) => { a.picked = loc; renderAddTab(); });
    document.getElementById("add-picked-loc").textContent = a.picked ? `선택됨: ${a.picked.floor}층 ${a.picked.name}` : "";
  }

  document.getElementById("add-moved-check").checked = a.moved;
  document.getElementById("add-moved-text-wrap").style.display = a.moved ? "" : "none";

  const previewEl = document.getElementById("add-photo-preview");
  previewEl.innerHTML = a.photo
    ? `<div class="photo-preview"><img src="${a.photo}" /><button type="button" class="photo-remove" id="add-photo-remove">✕</button></div>`
    : "";
  if (a.photo) document.getElementById("add-photo-remove").addEventListener("click", () => { a.photo = null; renderAddTab(); });

  const canSubmit = a.title.trim() && (a.locMode === "map" ? a.picked : a.locText.trim()) && (!a.moved || a.movedText.trim());
  document.getElementById("add-submit").disabled = !canSubmit;
}
document.getElementById("add-photo-camera").addEventListener("click", () => document.getElementById("add-file-camera").click());
document.getElementById("add-photo-gallery").addEventListener("click", () => document.getElementById("add-file-gallery").click());
async function handleAddFile(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  state.add.photo = await resizeImageFile(f);
  renderAddTab();
  e.target.value = "";
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
document.getElementById("add-moved-text").addEventListener("input", (e) => { state.add.movedText = e.target.value; renderAddTab(); });

document.getElementById("add-submit").addEventListener("click", async () => {
  const a = state.add;
  const btn = document.getElementById("add-submit");
  btn.disabled = true; btn.textContent = "등록 중...";
  try {
    const foundLocation = a.locMode === "map" ? a.picked : { id: `text-${uid()}`, floor: a.floor, name: a.locText.trim() };
    const currentLocation = a.moved ? { id: `moved-${uid()}`, floor: a.floor, name: a.movedText.trim() } : foundLocation;
    const user = state.currentUser;
    const reporterName = state.userDoc?.nickname || "게스트";
    await addDoc(collection(db, "items"), {
      title: a.title.trim(),
      category: a.category,
      description: a.desc.trim(),
      photo: a.photo || null,
      foundLocation, currentLocation,
      status: "등록",
      points: 0,
      reporterUid: user ? user.uid : null,
      reporterName,
      createdAt: serverTimestamp(),
      createdAtMillis: Date.now(),
    });
    showToast("분실물이 등록되었어요! 목록에서 바로 확인해보세요.");
    state.add = { photo: null, title: "", category: CATEGORIES[0], desc: "", locMode: "map", floor: 1, picked: null, locText: "", moved: false, movedText: "" };
    document.getElementById("add-title").value = "";
    document.getElementById("add-desc").value = "";
    document.getElementById("add-loc-text").value = "";
    document.getElementById("add-moved-text").value = "";
    state.tab = "map";
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === "map"));
    document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
    document.getElementById("tab-map").classList.add("active");
    renderMapTab();
  } catch (err) {
    console.error(err);
    showToast("등록에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    btn.textContent = "분실물 등록하기";
    renderAddTab();
  }
});

/* ------------------------------------------------------------
   MY 탭
------------------------------------------------------------ */
function renderMyTab() {
  const el = document.getElementById("my-content");
  const user = state.currentUser;
  const loggedInReal = user && !user.isAnonymous;

  if (loggedInReal && state.userDoc) {
    const myItems = state.items.filter((it) => it.reporterUid === user.uid);
    el.innerHTML = `
      <div class="profile-card">
        <div class="profile-greet">안녕하세요</div>
        <div class="profile-name">${esc(state.userDoc.nickname)}님</div>
        <div class="profile-points">🪙 ${state.userDoc.points || 0} P 보유</div>
      </div>
      <div class="field-label" style="margin-bottom:8px;">내가 등록한 분실물 (${myItems.length})</div>
      <div id="my-items">${myItems.length === 0 ? `<div class="empty-msg">아직 등록한 분실물이 없어요.</div>` : myItems.map((it) => itemCardHtml(it, null)).join("")}</div>
      <button class="btn-secondary" id="my-logout" style="margin-top:10px;">↩ 로그아웃</button>
    `;
    wireItemCards(document.getElementById("my-items"));
    document.getElementById("my-logout").addEventListener("click", async () => {
      await signOut(auth);
      showToast("로그아웃 되었어요.");
    });
    return;
  }

  el.innerHTML = `
    <div class="my-header">
      <div style="font-size:28px;">📜</div>
      <div class="font-display" style="font-size:18px; font-weight:700; margin-top:6px;">MY 페이지</div>
      <div class="sub">로그인하면 포인트 적립과 내 등록 내역을 볼 수 있어요.</div>
    </div>
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), { nickname, username, points: 0, createdAt: serverTimestamp() });
      showToast("회원가입 완료! 환영합니다 🎉");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("로그인 되었어요.");
    }
  } catch (err) {
    console.error(err);
    let msg = "요청을 처리하지 못했어요.";
    if (err.code === "auth/email-already-in-use") msg = "이미 사용 중인 아이디예요.";
    else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") msg = "아이디 또는 비밀번호가 올바르지 않아요.";
    else if (err.code === "auth/weak-password") msg = "비밀번호는 6자 이상이어야 해요.";
    errEl.textContent = msg;
    errEl.style.display = "";
  } finally {
    btn.disabled = false;
  }
}

/* ------------------------------------------------------------
   상세 모달
------------------------------------------------------------ */
function openItemModal(item) {
  const moved = item.foundLocation.name !== item.currentLocation.name;
  const contentEl = document.getElementById("item-modal-content");
  contentEl.innerHTML = `
    <div class="modal-head">
      <button class="modal-close" id="modal-close-1">‹</button>
      <div style="font-weight:800;">분실물 상세</div>
      <button class="modal-close" id="modal-close-2">✕</button>
    </div>
    <div style="display:flex; gap:14px; margin-bottom:14px;">
      <div class="detail-thumb" style="${item.photo ? `background-image:url('${item.photo}')` : ""}">${item.photo ? "" : "📦"}</div>
      <div>
        <div class="font-display" style="font-size:18px; font-weight:700;">${esc(item.title)}</div>
        <div style="margin-top:4px;">
          <span class="badge badge-cat">${esc(item.category)}</span>
          ${item.status === "주인찾음" ? `<span class="badge badge-found">주인찾음</span>` : `<span class="badge badge-registered">등록</span>`}
        </div>
      </div>
    </div>
    ${item.description ? `<div style="font-size:13.5px; margin-bottom:12px; line-height:1.5;">${esc(item.description)}</div>` : ""}
    <div class="detail-box">
      <div class="detail-row"><span>발견 위치</span><span class="v">${item.foundLocation.floor}층 · ${esc(item.foundLocation.name)}</span></div>
      ${moved ? `<div class="detail-row"><span>현재 위치</span><span class="v strong">${item.currentLocation.floor}층 · ${esc(item.currentLocation.name)}</span></div>` : ""}
      <div class="detail-row"><span>등록자</span><span class="v">${esc(item.reporterName || "게스트")}</span></div>
      <div class="detail-row"><span>등록 시각</span><span class="v">${fmtTime(item.createdAtMillis)}</span></div>
      ${item.status === "주인찾음" ? `<div class="detail-row"><span>지급 포인트</span><span class="v strong">+${item.points || 10} P</span></div>` : ""}
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
    await updateDoc(doc(db, "items", item.id), { status: "주인찾음", points: 10 });
    if (item.reporterUid) {
      await updateDoc(doc(db, "users", item.reporterUid), { points: increment(10) }).catch(() => {});
    }
    showToast("주인을 찾았어요! +10P 지급 완료 🎉");
    closeItemModal();
  } catch (err) {
    console.error(err);
    showToast("처리에 실패했어요. 다시 시도해주세요.");
  }
}

/* ------------------------------------------------------------
   Firestore 실시간 구독 (모든 사용자에게 동일한 목록)
------------------------------------------------------------ */
function subscribeItems() {
  const q = query(collection(db, "items"), orderBy("createdAtMillis", "desc"));
  onSnapshot(q, (snap) => {
    state.items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderCurrentTab();
  }, (err) => console.error("items 구독 오류", err));
}
let unsubUserDoc = null;
function subscribeUserDoc(uid) {
  if (unsubUserDoc) unsubUserDoc();
  unsubUserDoc = onSnapshot(doc(db, "users", uid), (snap) => {
    state.userDoc = snap.exists() ? snap.data() : null;
    if (state.tab === "my") renderMyTab();
  });
}

/* ------------------------------------------------------------
   인증 상태 관리
------------------------------------------------------------ */
function showConnectionError() {
  const el = document.getElementById("loading");
  el.innerHTML = `
    <div style="padding:24px; text-align:center; max-width:320px;">
      <div style="font-size:15px; font-weight:700; margin-bottom:8px;">연결이 원활하지 않아요</div>
      <div style="font-size:13px; color:#8A7A5E; line-height:1.6; margin-bottom:16px;">
        네트워크 연결이 느리거나(교내 와이파이, 이동통신망 등), 기기의 특정 보안 설정 때문일 수 있어요.
        아래 버튼으로 다시 시도해보세요.
      </div>
      <button id="retry-connect-btn" style="background:#7A2E2E; color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:700; cursor:pointer;">다시 시도</button>
    </div>`;
  document.getElementById("retry-connect-btn").addEventListener("click", () => location.reload());
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

// 일정 시간(12초) 안에 로그인이 끝나지 않으면 무한 로딩 대신 재시도 화면을 보여줍니다.
const __connectTimeout = setTimeout(() => {
  if (!__appRevealed) showConnectionError();
}, 12000);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("익명 로그인 실패", e);
      clearTimeout(__connectTimeout);
      showConnectionError();
    }
    return;
  }
  clearTimeout(__connectTimeout);
  state.currentUser = user;
  // 화면부터 먼저 보여주고, 사용자 문서 준비는 백그라운드에서 처리합니다.
  revealApp();
  subscribeUserDoc(user.uid);
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef).catch(() => null);
  if (!snap || !snap.exists()) {
    await setDoc(userRef, { nickname: "게스트", points: 0, createdAt: serverTimestamp() }, { merge: true }).catch(() => {});
  }
});
subscribeItems();

/* ------------------------------------------------------------
   서비스 워커 등록 (설치 가능한 앱)
------------------------------------------------------------ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW 등록 실패", e));
  });
}
