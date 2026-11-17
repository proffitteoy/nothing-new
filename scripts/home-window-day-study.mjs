// Acceptance-only daylight study. Bundled into the ignored evidence directory,
// injected into the real homepage by home-scene-preview.py; never imported by app/.
// The photograph is substituted at the request boundary, preserving the actual
// Image loading/error handlers and Splash readiness contract.
const DAY_WIDTH = 1672
const DAY_HEIGHT = 877

// Manually re-marked against convict-lake-day-study.webp, not the night plate.
// The 4px sky inset protects small snow/branch details at the silhouette.
const DAY_RIDGE = [
  [0, 50], [27, 46], [52, 102], [56, 142], [78, 182], [80, 222],
  [105, 242], [111, 286], [150, 300], [196, 324], [226, 304],
  [253, 285], [282, 274], [310, 265], [342, 246], [370, 242],
  [398, 228], [421, 232], [442, 239], [456, 258], [487, 250],
  [513, 260], [538, 277], [560, 290], [579, 288], [604, 312],
  [631, 322], [660, 340], [681, 362], [707, 382], [729, 400],
  [750, 398], [778, 423], [806, 411], [825, 401], [846, 402],
  [869, 397], [894, 384], [917, 382], [947, 368], [970, 361],
  [994, 372], [1015, 364], [1041, 346], [1068, 336], [1091, 314],
  [1115, 306], [1142, 305], [1162, 295], [1185, 279], [1206, 283],
  [1229, 280], [1252, 285], [1277, 286], [1302, 297], [1335, 302],
  [1358, 304], [1386, 302], [1414, 308], [1441, 302], [1464, 273],
  [1487, 260], [1511, 245], [1535, 237], [1562, 245], [1582, 259],
  [1603, 231], [1626, 218], [1650, 194], [1672, 174],
]
const DAY_SHORE = [[0, 579], [103, 558], [252, 552], [459, 549], [802, 548],
  [1118, 545], [1414, 546], [1672, 544]]
const DAY_NEAR_SHORE = [[0, 681], [25, 679], [63, 696], [83, 726],
  [112, 755], [106, 799], [90, 844], [100, 877], [0, 877]]

const DAY_CSS = `
[data-home-day-study] {
  --site-bg:#d9e1e7; --site-surface:#f0f4f7; --site-recess:#dce5ec;
  --site-ink:#243a4d; --site-muted:#526b7e; --site-accent:#225d94;
  --site-detail:#a34479; --site-violet:#6551a3; --site-mint:#29796d;
  --site-line:#a1b4c4; --site-glass:rgb(235 242 247 / 96%);
  --site-wash:rgb(34 93 148 / 10%);
  color-scheme:light;
  background:linear-gradient(90deg,#dce4ea,#eaf0f4 8%,#cbd6df 16%,#cbd6df 84%,#e3eaf0 92%,#d6e0e7);
}
[data-home-day-study] [data-home-window] {
  background:linear-gradient(90deg,#aebfcd,#e4edf3 3px,#7f96a9 9px,#a6b7c5 calc(100% - 8px),#cfdde7 calc(100% - 3px),#8199ac);
  border-top-color:#f6fafc;
  box-shadow:0 12px 38px #263c502e,0 0 0 1px #95aabd,inset 0 10px 12px #566e8140;
}
[data-home-day-study] [data-home-viewport] {
  background:#91bbd4;
  box-shadow:0 0 0 1px #f1f7fb99,0 0 18px #ffffff30;
}
[data-home-day-study] [data-home-viewport] > :not([data-home-artwork]):not(:last-child) {
  visibility:hidden;
}
[data-home-day-study] [data-home-artwork] {
  opacity:1 !important;
  background:linear-gradient(#8cbde1,#d2e6ef 62%,#50849a 63%,#24546c);
}
[data-home-day-study] [data-home-artwork]::before { background:#6b879c; }
[data-home-day-study] [data-home-viewport] > :last-child {
  background:linear-gradient(110deg,#ffffff08,transparent 38%,#ffffff08 47%,transparent 58%);
  box-shadow:inset 0 0 26px #2a486a30,inset 1px 1px 2px #ffffffb3;
}
[data-home-day-study] [data-home-sill] {
  background:linear-gradient(#eaf2f7,#b9cad8 3px,#b1c3d1 20px,#d0dce5 45%,#a9bdcd);
  border-top-color:#ffffffb3; border-bottom-color:#8da6ba;
  box-shadow:0 26px 35px #233e5429,0 2px 0 #bccdda,inset 0 12px 22px #ffffff33;
}
[data-home-day-study] [data-home-sill]::before { background:linear-gradient(#7690a5,#dbe8f1); }
[data-home-day-study] [data-edge-trigger] { color:#3c566b; text-shadow:none; }
[data-home-day-study] [data-edge-trigger]:is(:hover,:focus-visible,[aria-expanded=true]) {
  color:#173c5a; background:linear-gradient(90deg,transparent,#ffffff48,transparent); text-shadow:none;
}
[data-home-day-study] [data-home-music] [aria-label="当前歌词"] p {
  text-shadow:0 1px 6px #f4f8fbc9,0 0 16px #f4f8fba6;
}
[data-home-day-study] [data-home-sill] > a { color:#3d596e; }
[data-home-day-study] [data-home-sill] > a:hover { color:#163e60; }
[data-home-day-study] dialog { color-scheme:light; }
`

window.startDayWindowStudy = async () => {
  window.__dayWindowStudy?.destroy()
  const stage = document.querySelector('[data-home-scene]')
  const opening = document.querySelector('[data-home-viewport]')
  if (!stage || !opening) return null // Mobile redirect never mounts a desktop study.
  const source = opening.querySelector('[data-home-artwork] img')
  const style = document.createElement('style')
  style.textContent = DAY_CSS
  document.head.append(style)
  stage.dataset.homeDayStudy = 'static'
  const notice = stage.querySelector('[data-home-sill] > a')
  const previousNotice = notice.getAttribute('href')
  notice.href = '/home-window/NOTICE-day-study.txt'
  const metadata = {
    plate: { width: DAY_WIDTH, height: DAY_HEIGHT },
    shoreline: DAY_SHORE.map(([x, y]) => [x / DAY_WIDTH, y / DAY_HEIGHT]),
    nearShore: DAY_NEAR_SHORE.map(([x, y]) => [x / DAY_WIDTH, y / DAY_HEIGHT]),
    ridge: DAY_RIDGE.map(([x, y]) => [x / DAY_WIDTH, (y - 4) / DAY_HEIGHT]),
    sourceReady: source.complete && source.naturalWidth === DAY_WIDTH,
  }
  window.__dayWindowStudy = {
    metadata,
    destroy() {
      style.remove()
      delete stage.dataset.homeDayStudy
      notice.setAttribute('href', previousNotice)
      delete window.__dayWindowStudy
    },
  }
  return metadata
}
