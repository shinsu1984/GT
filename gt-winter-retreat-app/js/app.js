import { RETREAT_DATA } from './data.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

/* ============================================================================
   ICONS
============================================================================ */
const ICONS = {
  home: '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10.2V19a1 1 0 001 1h10a1 1 0 001-1v-8.8"/><path d="M10 20v-5.2h4V20"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.3"/><circle cx="12" cy="8.2" r=".3" stroke-width="2.6"/>',
  'map-pin': '<path d="M12 21s7-7.6 7-12.4A7 7 0 105 8.6C5 13.4 12 21 12 21z"/><circle cx="12" cy="8.6" r="2.3"/>',
  calendar: '<rect x="3.6" y="5" width="16.8" height="15.6" rx="2.2"/><path d="M3.6 9.6h16.8"/><path d="M8 3v4M16 3v4"/>',
  users: '<circle cx="8.6" cy="8.6" r="3"/><path d="M2.6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="16.6" cy="9.6" r="2.5"/><path d="M15.2 14.3c2.6.4 4.4 2.7 4.4 5.7"/>',
  backpack: '<rect x="5.2" y="8.6" width="13.6" height="12.4" rx="3.6"/><path d="M9 8.6V6.2a3 3 0 016 0v2.4"/><rect x="9.4" y="12.8" width="5.2" height="4.6" rx="1.5"/>',
  megaphone: '<path d="M3 10.4v3.6a1 1 0 001 1h1.8l7.6 3.8V5.6L5.8 9.4H4a1 1 0 00-1 1z"/><path d="M13.8 9.2a3 3 0 010 5.4"/>',
  help: '<circle cx="12" cy="12" r="8.4"/><path d="M9.6 9.6a2.4 2.4 0 114 1.9c-.8.6-1.4 1-1.4 2.2"/><circle cx="12.1" cy="16.6" r=".25" stroke-width="2.4"/>',
  phone: '<path d="M6.2 3h2.8l1.4 3.8-2 1.6a11.6 11.6 0 005.6 5.6l1.6-2 3.8 1.4v2.8a1.8 1.8 0 01-2 1.8A16 16 0 014.4 5a1.8 1.8 0 011.8-2z"/>',
  camera: '<path d="M4 8.4A1.4 1.4 0 015.4 7h2l1-2h7.2l1 2h2A1.4 1.4 0 0120 8.4V18a1.4 1.4 0 01-1.4 1.4H5.4A1.4 1.4 0 014 18z"/><circle cx="12" cy="13" r="3.6"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4L10 14"/><path d="M18 14v4.6A1.4 1.4 0 0116.6 20H5.4A1.4 1.4 0 014 18.6V7.4A1.4 1.4 0 015.4 6H10"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
function iconSvg(name, extraClass) {
  return `<svg class="icon${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 24 24">${ICONS[name] || ICONS.info}</svg>`;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* ============================================================================
   TOAST
============================================================================ */
const toastEl = document.getElementById('toast');
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

/* ============================================================================
   TABS
============================================================================ */
const TAB_DEFS = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'schedule', label: '일정', icon: 'calendar' },
  { id: 'info', label: '정보', icon: 'info' },
  { id: 'notice', label: '공지', icon: 'megaphone' },
  { id: 'photos', label: '사진', icon: 'camera' },
  { id: 'contact', label: '연락처', icon: 'phone' },
];
let currentTab = 'home';

function renderTabBar() {
  const bar = document.getElementById('tabbar');
  bar.innerHTML = TAB_DEFS.map(
    (t) => `<button type="button" class="tab-btn${t.id === currentTab ? ' active' : ''}" data-tab="${t.id}">${iconSvg(t.icon)}<span>${esc(t.label)}</span></button>`
  ).join('');
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + tabId));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  window.scrollTo(0, 0);
}

/* ============================================================================
   TOPBAR / D-DAY
============================================================================ */
function computeDday() {
  const m = RETREAT_DATA.meta;
  if (!m.dateStart) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(m.dateStart + 'T00:00:00');
  const diff = Math.round((start - today) / 86400000);
  if (diff > 0) return 'D-' + diff;
  if (diff === 0) return 'D-DAY';
  return '여정 종료';
}
function renderTopbar() {
  document.getElementById('topbarTitle').textContent = (RETREAT_DATA.meta.orgName || 'GT') + ' 겨울여정';
  document.getElementById('ddayBadge').textContent = computeDday();
}

/* ============================================================================
   HOME TAB
============================================================================ */
function renderHome() {
  const m = RETREAT_DATA.meta;
  const notices = (RETREAT_DATA.notices || []).slice().sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0)).slice(0, 2);

  const quickLinks = [
    { tab: 'schedule', icon: 'calendar', label: '전체 일정표' },
    { tab: 'info', icon: 'backpack', label: '준비물 확인' },
    { tab: 'info', icon: 'users', label: '조 편성 보기' },
    { tab: 'photos', icon: 'camera', label: '사진 보러가기' },
  ];

  let html = '';
  html += `<div class="home-banner">
    <div class="home-eyebrow">${esc(m.eyebrow || 'GT WINTER RETREAT')}</div>
    <h1 class="home-title">${esc(m.orgName || 'GT')} 겨울수련회 <span class="home-year">${esc(m.year || '')}</span></h1>
    <p class="home-theme">${esc(m.theme || '')}</p>
    <div class="home-chips">
      <span class="home-chip">${iconSvg('calendar')} ${esc(m.dateLabel)}</span>
      <span class="home-chip">${iconSvg('map-pin')} ${esc(m.venueLabel)}</span>
      <span class="home-chip">${iconSvg('users')} ${esc(m.audience)}</span>
    </div>
    <div class="home-dday-row"><span class="home-dday">${esc(computeDday())}</span></div>
  </div>`;

  html += `<div class="home-welcome">${esc(m.welcome || '')}</div>`;

  html += `<div class="section-label">바로가기</div>`;
  html += `<div class="quick-grid">${quickLinks
    .map((q) => `<button type="button" class="quick-card" data-goto-tab="${q.tab}"><span class="icon-badge">${iconSvg(q.icon)}</span><b>${esc(q.label)}</b></button>`)
    .join('')}</div>`;

  html += `<div class="section-label">최근 공지</div>`;
  if (notices.length) {
    html += notices
      .map(
        (n) =>
          `<button type="button" class="notice-preview-card${n.important ? ' important' : ''}" data-goto-tab="notice">
            <span class="notice-dot"></span>
            <span class="notice-preview-text"><b>${esc(n.title)}</b><span>${esc((n.body || '').slice(0, 40))}${(n.body || '').length > 40 ? '…' : ''}</span></span>
          </button>`
      )
      .join('');
  } else {
    html += `<p class="empty-note">등록된 공지가 없어요.</p>`;
  }
  html += `<button type="button" class="see-all-link" data-goto-tab="notice">공지사항 전체보기 ${iconSvg('arrow-right')}</button>`;

  return html;
}

/* ============================================================================
   SCHEDULE TAB
============================================================================ */
function renderSchedule() {
  const days = RETREAT_DATA.schedule.days;
  const tabs = days.map((d, i) => `<button type="button" class="day-tab${i === 0 ? ' active' : ''}" data-day="${d.id}">${esc(d.label)}</button>`).join('');
  const panels = days
    .map((d, i) => {
      const items = d.items
        .map(
          (it) => `<div class="tl-item">
            <span class="tl-dot"></span>
            <div class="tl-row">
              <span class="tl-time">${esc(it.time)}</span>
              <span class="tl-title">${esc(it.title)}</span>
              ${it.tag ? `<span class="tl-tag">${esc(it.tag)}</span>` : ''}
            </div>
            ${it.desc ? `<div class="tl-desc">${esc(it.desc)}</div>` : ''}
          </div>`
        )
        .join('');
      return `<div class="day-panel${i === 0 ? ' active' : ''}" data-day-panel="${d.id}">
        <div class="timeline">${items || '<p class="empty-note">아직 일정이 없어요.</p>'}</div>
      </div>`;
    })
    .join('');

  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('calendar')}</div><h2 class="stop-title">전체 일정표</h2></div>
    <div class="day-tabs">${tabs}</div>
    ${panels}
  </div>`;
}

/* ============================================================================
   INFO TAB (location + packing + group)
============================================================================ */
function renderLocationSection() {
  const c = RETREAT_DATA.location;
  const mapLink = c.mapUrl ? c.mapUrl : 'https://map.naver.com/p/search/' + encodeURIComponent(c.address || c.venueName || '');
  const transport = (c.transport || [])
    .map((t) => `<div class="transport-item"><div class="transport-method">${esc(t.method)}</div><div class="transport-desc">${esc(t.desc)}</div></div>`)
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('map-pin')}</div><h2 class="stop-title">오시는 길</h2></div>
    <div class="venue-card">
      <div class="venue-name">${esc(c.venueName)}</div>
      <div class="venue-addr">${esc(c.address)}</div>
      <a class="venue-link" href="${esc(mapLink)}" target="_blank" rel="noopener">지도에서 보기 ${iconSvg('external')}</a>
      <div class="transport-list">${transport}</div>
    </div>
  </div>`;
}
function renderPackingSection() {
  const cats = (RETREAT_DATA.packing || [])
    .map((cat) => {
      const items = (cat.items || [])
        .map((item, idx) => {
          const key = 'gt_pack_' + cat.id + '_' + idx;
          const checked = lsGet(key, false);
          return `<li>
            <span class="pack-check${checked ? ' checked' : ''}" data-pack-toggle="${key}">${checked ? iconSvg('check') : ''}</span>
            <span class="pack-text${checked ? ' checked' : ''}" data-pack-text="${key}">${esc(item)}</span>
          </li>`;
        })
        .join('');
      return `<div class="pack-card">
        <div class="pack-title">${esc(cat.title)}</div>
        <ul class="pack-list">${items || '<li class="empty-note">항목 없음</li>'}</ul>
      </div>`;
    })
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('backpack')}</div><h2 class="stop-title">준비물</h2></div>
    <div class="pack-grid">${cats}</div>
  </div>`;
}
function renderGroupSection() {
  const cards = (RETREAT_DATA.groups || [])
    .map(
      (g) => `<div class="group-card">
        <div class="group-name">${esc(g.name)}</div>
        <div class="group-row"><b>리더</b><span>${esc(g.leader)}</span></div>
        <div class="group-row"><b>조원</b><span>${esc(g.members)}</span></div>
        <div class="group-row"><b>숙소</b><span>${esc(g.room)}</span></div>
      </div>`
    )
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('users')}</div><h2 class="stop-title">조 편성</h2></div>
    <div class="group-grid">${cards || '<p class="empty-note">아직 조 편성이 없어요.</p>'}</div>
  </div>`;
}
function renderInfo() {
  return renderLocationSection() + renderPackingSection() + renderGroupSection();
}

/* ============================================================================
   NOTICE TAB (notices + faq)
============================================================================ */
function renderNoticeSection() {
  const list = (RETREAT_DATA.notices || []).slice().sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));
  const html = list
    .map(
      (n) => `<div class="notice-card${n.important ? ' important' : ''}">
        <div class="notice-top"><div class="notice-title">${esc(n.title)}</div>${n.important ? '<span class="badge-important">중요</span>' : ''}</div>
        <div class="notice-body">${esc(n.body)}</div>
      </div>`
    )
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('megaphone')}</div><h2 class="stop-title">공지사항</h2></div>
    <div class="notice-list">${html || '<p class="empty-note">공지사항이 없어요.</p>'}</div>
  </div>`;
}
function renderFaqSection() {
  const html = (RETREAT_DATA.faq || [])
    .map(
      (f, idx) => `<div class="faq-item" data-faq-item="${idx}">
        <button type="button" class="faq-q" data-faq-toggle="${idx}">${esc(f.q)}${iconSvg('chevron-down')}</button>
        <div class="faq-a"><div class="faq-a-inner">${esc(f.a)}</div></div>
      </div>`
    )
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('help')}</div><h2 class="stop-title">자주 묻는 질문</h2></div>
    <div class="faq-list">${html || '<p class="empty-note">등록된 질문이 없어요.</p>'}</div>
  </div>`;
}
function renderNotice() {
  return renderNoticeSection() + renderFaqSection();
}

/* ============================================================================
   CONTACT TAB
============================================================================ */
function renderContact() {
  const html = (RETREAT_DATA.contacts || [])
    .map(
      (ct) => `<div class="contact-card">
        <div class="contact-info">
          <div class="contact-role">${esc(ct.role)}</div>
          <div class="contact-name">${esc(ct.name)}</div>
          <a class="contact-phone" href="tel:${esc((ct.phone || '').replace(/[^0-9+]/g, ''))}">${iconSvg('phone')} ${esc(ct.phone)}</a>
        </div>
      </div>`
    )
    .join('');
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('phone')}</div><h2 class="stop-title">비상연락처</h2></div>
    <div class="contact-list">${html || '<p class="empty-note">등록된 연락처가 없어요.</p>'}</div>
  </div>`;
}

/* ============================================================================
   PHOTOS TAB (Firebase Storage + Firestore)
============================================================================ */
let firebaseApp = null;
let db = null;
let storage = null;
const uploaderKey = 'gt_uploader_name';

function renderPhotosShell() {
  if (!isFirebaseConfigured()) {
    return `<div class="stop">
      <div class="stop-head"><div class="stop-badge">${iconSvg('camera')}</div><h2 class="stop-title">사진</h2></div>
      <div class="firebase-setup-note">
        <b>사진 공유 기능을 켜려면 Firebase 설정이 필요해요</b>
        js/firebase-config.js 파일에 Firebase 프로젝트 정보를 채워주세요.<br>자세한 방법은 README.md를 참고하세요.
      </div>
    </div>`;
  }
  return `<div class="stop">
    <div class="stop-head"><div class="stop-badge">${iconSvg('camera')}</div><h2 class="stop-title">사진</h2></div>
    <div class="photo-upload-card">
      <div class="field">
        <label for="uploaderName">이름 (선택)</label>
        <input type="text" id="uploaderName" placeholder="예: 1조 김학생">
      </div>
      <label class="file-drop" id="fileDrop">
        <span id="fileDropText">${iconSvg('upload')} 눌러서 사진 선택 (여러 장 가능)</span>
        <input type="file" id="fileInput" accept="image/*" multiple>
      </label>
      <button type="button" class="upload-btn" id="uploadBtn" disabled>사진 업로드</button>
      <div class="upload-progress" id="uploadProgress" hidden></div>
    </div>
    <div class="section-label">공유된 사진</div>
    <div class="photo-grid" id="photoGrid"><p class="empty-note">불러오는 중…</p></div>
  </div>`;
}

async function initFirebase() {
  if (!isFirebaseConfigured()) return;
  try {
    const [{ initializeApp }, firestoreMod, storageMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js'),
    ]);
    firebaseApp = initializeApp(firebaseConfig);
    db = firestoreMod.getFirestore(firebaseApp);
    storage = storageMod.getStorage(firebaseApp);
    watchPhotos(firestoreMod);
    setupUploadUI(storageMod, firestoreMod);
  } catch (err) {
    console.error('Firebase init failed', err);
    const grid = document.getElementById('photoGrid');
    if (grid) grid.innerHTML = '<p class="empty-note">사진을 불러오지 못했어요. firebase-config.js 값을 확인해주세요.</p>';
  }
}

function watchPhotos(firestoreMod) {
  const { collection, query, orderBy, limit, onSnapshot } = firestoreMod;
  const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'), limit(120));
  onSnapshot(
    q,
    (snap) => {
      const grid = document.getElementById('photoGrid');
      if (!grid) return;
      if (snap.empty) {
        grid.innerHTML = '<p class="empty-note">아직 업로드된 사진이 없어요. 첫 사진을 올려보세요!</p>';
        return;
      }
      grid.innerHTML = snap.docs
        .map((d) => {
          const p = d.data();
          return `<div class="photo-thumb" data-url="${esc(p.url)}" data-name="${esc(p.name || '')}">
            <img src="${esc(p.url)}" loading="lazy" alt="${esc(p.name || '공유 사진')}">
            ${p.name ? `<span class="photo-name">${esc(p.name)}</span>` : ''}
          </div>`;
        })
        .join('');
    },
    (err) => {
      console.error('photo watch failed', err);
      const grid = document.getElementById('photoGrid');
      if (grid) grid.innerHTML = '<p class="empty-note">사진을 불러오지 못했어요. Firestore 보안 규칙을 확인해주세요.</p>';
    }
  );
}

function setupUploadUI(storageMod, firestoreMod) {
  const nameInput = document.getElementById('uploaderName');
  const fileInput = document.getElementById('fileInput');
  const fileDrop = document.getElementById('fileDrop');
  const fileDropText = document.getElementById('fileDropText');
  const uploadBtn = document.getElementById('uploadBtn');
  const progressEl = document.getElementById('uploadProgress');
  if (!fileInput) return;

  nameInput.value = lsGet(uploaderKey, '');
  nameInput.addEventListener('input', () => lsSet(uploaderKey, nameInput.value));

  fileInput.addEventListener('change', () => {
    const n = fileInput.files.length;
    fileDrop.classList.toggle('has-files', n > 0);
    fileDropText.textContent = n > 0 ? `${n}장 선택됨 · 다시 눌러 변경` : '눌러서 사진 선택 (여러 장 가능)';
    uploadBtn.disabled = n === 0;
  });

  uploadBtn.addEventListener('click', async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    uploadBtn.disabled = true;
    progressEl.hidden = false;
    const { ref, uploadBytes, getDownloadURL } = storageMod;
    const { collection, addDoc, serverTimestamp } = firestoreMod;
    const name = nameInput.value.trim();
    let done = 0;
    for (const file of files) {
      progressEl.textContent = `업로드 중… (${done + 1}/${files.length})`;
      try {
        const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
        const sref = ref(storage, path);
        await uploadBytes(sref, file);
        const url = await getDownloadURL(sref);
        await addDoc(collection(db, 'photos'), {
          url,
          name: name || '',
          path,
          uploadedAt: serverTimestamp(),
        });
        done++;
      } catch (err) {
        console.error('upload failed', err);
        toast('일부 사진 업로드에 실패했어요.');
      }
    }
    progressEl.textContent = `${done}장 업로드 완료!`;
    setTimeout(() => { progressEl.hidden = true; }, 2000);
    fileInput.value = '';
    fileDrop.classList.remove('has-files');
    fileDropText.textContent = '눌러서 사진 선택 (여러 장 가능)';
    uploadBtn.disabled = true;
    if (done > 0) toast(`사진 ${done}장을 공유했어요!`);
  });
}

/* ============================================================================
   RENDER ALL
============================================================================ */
const RENDERERS = {
  home: renderHome,
  schedule: renderSchedule,
  info: renderInfo,
  notice: renderNotice,
  photos: renderPhotosShell,
  contact: renderContact,
};

function renderContent() {
  const main = document.getElementById('content');
  main.innerHTML = TAB_DEFS.map((t) => `<div class="tab-panel${t.id === currentTab ? ' active' : ''}" id="panel-${t.id}">${RENDERERS[t.id]()}</div>`).join('');
}

function renderAll() {
  renderTopbar();
  renderTabBar();
  renderContent();
}

/* ============================================================================
   LIGHTBOX
============================================================================ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
function openLightbox(url, caption) {
  lightboxImg.src = url;
  lightboxCaption.textContent = caption || '';
  lightbox.hidden = false;
}
document.getElementById('lightboxClose').addEventListener('click', () => { lightbox.hidden = true; lightboxImg.src = ''; });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) { lightbox.hidden = true; lightboxImg.src = ''; } });

/* ============================================================================
   GLOBAL CLICK DELEGATION
============================================================================ */
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn[data-tab]');
  if (tabBtn) { switchTab(tabBtn.getAttribute('data-tab')); return; }

  const gotoTab = e.target.closest('[data-goto-tab]');
  if (gotoTab) { switchTab(gotoTab.getAttribute('data-goto-tab')); return; }

  const dayTab = e.target.closest('.day-tab[data-day]');
  if (dayTab) {
    const panel = dayTab.closest('.tab-panel');
    panel.querySelectorAll('.day-tab').forEach((t) => t.classList.remove('active'));
    dayTab.classList.add('active');
    panel.querySelectorAll('.day-panel').forEach((p) => p.classList.remove('active'));
    const dp = panel.querySelector(`[data-day-panel="${dayTab.getAttribute('data-day')}"]`);
    if (dp) dp.classList.add('active');
    return;
  }

  const faqQ = e.target.closest('[data-faq-toggle]');
  if (faqQ) { faqQ.closest('.faq-item').classList.toggle('open'); return; }

  const packToggle = e.target.closest('[data-pack-toggle]');
  if (packToggle) {
    const key = packToggle.getAttribute('data-pack-toggle');
    const now = !lsGet(key, false);
    lsSet(key, now);
    packToggle.classList.toggle('checked', now);
    packToggle.innerHTML = now ? iconSvg('check') : '';
    const textEl = document.querySelector(`[data-pack-text="${key}"]`);
    if (textEl) textEl.classList.toggle('checked', now);
    return;
  }

  const thumb = e.target.closest('.photo-thumb');
  if (thumb) { openLightbox(thumb.getAttribute('data-url'), thumb.getAttribute('data-name')); return; }
});

document.getElementById('dismissBanner').addEventListener('click', () => {
  document.getElementById('sampleBanner').hidden = true;
});

/* ============================================================================
   BOOT
============================================================================ */
renderAll();
initFirebase();
