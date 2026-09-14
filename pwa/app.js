const I18N = {
  nb: {
    subtitle: '{count} offentlige tilfluktsrom i Norge',
    searchPlaceholder: 'Søk sted, adresse eller romnummer…',
    viewMap: 'Kart',
    viewList: 'Liste',
    gps: 'Finn nærmeste med GPS',
    gpsBusy: 'Henter posisjon…',
    gpsFail: 'Kunne ikke hente posisjon.',
    gpsDenied: 'Posisjonstilgang ble ikke gitt.',
    listEmpty: 'Ingen treff.',
    searching: 'Søker…',
    multiPlaces: 'Flere steder matcher — velg ett',
    favorites: 'Favoritter',
    favoritesEmpty: 'Ingen favoritter ennå.',
    settings: 'Innstillinger',
    language: 'Språk',
    theme: 'Utseende',
    themeSystem: 'System',
    themeLight: 'Lyst',
    themeDark: 'Mørkt',
    close: 'Lukk',
    capacity: 'Kapasitet: {places} plasser',
    capacityUnknown: 'Kapasitet: Ukjent',
    romnr: 'Romnummer {n}',
    navigate: 'Åpne i Google Maps',
    addFav: 'Favoritt',
    removeFav: 'Fjern favoritt',
    distance: '{km} km',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerBody:
      'Appen viser kun offentlige tilfluktsrom registrert hos DSB. Private tilfluktsrom er ikke offentliggjort. Dette er et informasjonsverktøy og erstatter ikke offisiell beredskapsinformasjon. Kontroller skilting og lokale anvisninger på stedet.',
    dataUpdated: 'Data oppdatert: {date}',
  },
  en: {
    subtitle: '{count} public shelters in Norway',
    searchPlaceholder: 'Search place, address or room number…',
    viewMap: 'Map',
    viewList: 'List',
    gps: 'Find nearest with GPS',
    gpsBusy: 'Getting location…',
    gpsFail: 'Could not get location.',
    gpsDenied: 'Location access was denied.',
    listEmpty: 'No matches.',
    searching: 'Searching…',
    multiPlaces: 'Several places match — pick one',
    favorites: 'Favorites',
    favoritesEmpty: 'No favorites yet.',
    settings: 'Settings',
    language: 'Language',
    theme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    close: 'Close',
    capacity: 'Capacity: {places} spaces',
    capacityUnknown: 'Capacity: Unknown',
    romnr: 'Shelter number {n}',
    navigate: 'Open in Google Maps',
    addFav: 'Favorite',
    removeFav: 'Remove favorite',
    distance: '{km} km',
    disclaimerTitle: 'Important information',
    disclaimerBody:
      'The app only shows public shelters registered with DSB. Private shelters are not published. This is an information tool and does not replace official civil protection guidance. Always verify signage and local instructions on site.',
    dataUpdated: 'Data updated: {date}',
  },
};

const COLORS = { green: '#2e7d32', orange: '#ef6c00', red: '#c62828' };
const FAV_KEY = 'bomberom.favorites';
const LOCALE_KEY = 'bomberom.locale';
const THEME_KEY = 'bomberom.theme';

const el = {
  status: document.getElementById('status'),
  q: document.getElementById('q'),
  viewMap: document.getElementById('viewMap'),
  viewList: document.getElementById('viewList'),
  geoChoices: document.getElementById('geoChoices'),
  map: document.getElementById('map'),
  listWrap: document.getElementById('listWrap'),
  list: document.getElementById('list'),
  gpsBtn: document.getElementById('gpsBtn'),
  sheet: document.getElementById('sheet'),
  sheetBody: document.getElementById('sheetBody'),
  sheetClose: document.getElementById('sheetClose'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
  favBtn: document.getElementById('favBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  disclaimerTitle: document.getElementById('disclaimerTitle'),
  disclaimerBody: document.getElementById('disclaimerBody'),
  dataMeta: document.getElementById('dataMeta'),
};

let locale = localStorage.getItem(LOCALE_KEY) || 'nb';
let themeMode = localStorage.getItem(THEME_KEY) || 'system';
let shelters = [];
let datasetInfo = { updated: '', count: 0, source: '' };
let enrichment = {};
let favorites = loadFavorites();
let view = 'map';
let map;
let cluster;
let userMarker;
let userPos = null;
let selectedId = null;
let searchTimer;

function t(key, vars = {}) {
  let s = (I18N[locale] || I18N.nb)[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

function loadFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function isFav(id) {
  return favorites.includes(id);
}

function toggleFav(id) {
  if (isFav(id)) {
    favorites = favorites.filter((x) => x !== id);
  } else {
    favorites = [...favorites, id];
  }
  saveFavorites();
}

function resolveThemeDark() {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme() {
  document.body.classList.toggle('dark', resolveThemeDark());
}

function markerQuality(shelter) {
  const e = shelter.enrichment || enrichment[shelter.id] || {};
  if (e.marker_quality === 'green' || e.marker_quality === 'orange' || e.marker_quality === 'red') {
    return e.marker_quality;
  }
  if (e.status === 'stengt' || e.status === 'under_oppgradering' || e.status === 'under_ombygning') {
    return 'orange';
  }
  if (e.inngang || e.lokalnavn) return 'green';
  return 'red';
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatKm(km) {
  if (!Number.isFinite(km)) return '';
  return t('distance', { km: km < 10 ? km.toFixed(1) : Math.round(km) });
}

function applyChrome() {
  el.q.placeholder = t('searchPlaceholder');
  el.viewMap.textContent = t('viewMap');
  el.viewList.textContent = t('viewList');
  el.gpsBtn.textContent = t('gps');
  el.sheetClose.textContent = t('close');
  el.disclaimerTitle.textContent = t('disclaimerTitle');
  el.disclaimerBody.textContent = t('disclaimerBody');
  el.status.textContent = t('subtitle', { count: datasetInfo.count || shelters.length });
  el.dataMeta.textContent = t('dataUpdated', {
    date: datasetInfo.updated ? datasetInfo.updated.slice(0, 10) : '—',
  });
  el.favBtn.setAttribute('aria-label', t('favorites'));
  el.settingsBtn.setAttribute('aria-label', t('settings'));
  document.documentElement.lang = locale;
}

function makeDotIcon(quality, selected) {
  const color = COLORS[quality] || COLORS.red;
  const size = selected ? 18 : 12;
  return L.divIcon({
    className: '',
    html: `<div class="shelter-dot" style="width:${size}px;height:${size}px;background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function initMap() {
  map = L.map(el.map, { zoomControl: true }).setView([64.5, 11], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 55,
  });
  map.addLayer(cluster);

  map.on('click', () => closeSheet());
}

function rebuildMarkers(list) {
  cluster.clearLayers();
  for (const s of list) {
    const q = markerQuality(s);
    const m = L.marker([s.latitude, s.longitude], {
      icon: makeDotIcon(q, s.id === selectedId),
    });
    m.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openShelter(s, false);
    });
    m.shelterId = s.id;
    cluster.addLayer(m);
  }
}

function setView(next) {
  view = next;
  el.viewMap.classList.toggle('on', view === 'map');
  el.viewList.classList.toggle('on', view === 'list');
  el.map.style.display = view === 'map' ? 'block' : 'none';
  el.listWrap.hidden = view !== 'list';
  el.gpsBtn.style.display = view === 'map' ? 'block' : 'none';
  if (view === 'map') {
    setTimeout(() => map.invalidateSize(true), 50);
  }
}

function renderList(list) {
  if (!list.length) {
    el.list.innerHTML = `<p class="lead">${t('listEmpty')}</p>`;
    return;
  }
  const ref = userPos;
  const ranked = [...list].sort((a, b) => {
    if (!ref) return a.adresse.localeCompare(b.adresse, 'nb');
    return haversineKm(ref, a) - haversineKm(ref, b);
  });
  el.list.innerHTML = ranked
    .slice(0, 200)
    .map((s) => {
      const dist = ref ? formatKm(haversineKm(ref, s)) : '';
      const places =
        s.plasser != null ? t('capacity', { places: s.plasser }) : t('capacityUnknown');
      return `<button type="button" class="list-item" data-id="${s.id}">
        <strong>${escapeHtml(s.adresse || '—')}</strong>
        <span>${escapeHtml(places)}${dist ? ' · ' + escapeHtml(dist) : ''}</span>
      </button>`;
    })
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function openShelter(shelter, pan = true) {
  selectedId = shelter.id;
  const e = shelter.enrichment || enrichment[shelter.id] || {};
  const places =
    shelter.plasser != null ? t('capacity', { places: shelter.plasser }) : t('capacityUnknown');
  const rom =
    shelter.romnr != null ? `<p>${escapeHtml(t('romnr', { n: shelter.romnr }))}</p>` : '';
  const lokal = e.lokalnavn ? `<p>${escapeHtml(e.lokalnavn)}</p>` : '';
  const inngang = e.inngang ? `<p>${escapeHtml(e.inngang)}</p>` : '';
  const dist =
    userPos != null ? `<p>${escapeHtml(formatKm(haversineKm(userPos, shelter)))}</p>` : '';
  const favLabel = isFav(shelter.id) ? t('removeFav') : t('addFav');
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`;

  el.sheetBody.innerHTML = `
    <h3>${escapeHtml(shelter.adresse || '—')}</h3>
    ${rom}${lokal}${inngang}
    <p>${escapeHtml(places)}</p>
    ${dist}
    <div class="row">
      <button type="button" class="btn" id="sheetFav">${escapeHtml(favLabel)}</button>
      <a class="btn primary" href="${navUrl}" target="_blank" rel="noopener">${escapeHtml(t('navigate'))}</a>
    </div>
  `;
  el.sheet.hidden = false;
  document.getElementById('sheetFav')?.addEventListener('click', () => {
    toggleFav(shelter.id);
    openShelter(shelter, false);
  });

  if (pan && view === 'map') {
    map.setView([shelter.latitude, shelter.longitude], Math.max(map.getZoom(), 14));
  }
  rebuildMarkers(currentFiltered());
}

function closeSheet() {
  el.sheet.hidden = true;
  selectedId = null;
}

function filterByText(query) {
  const q = query.trim().toLowerCase();
  if (!q) return shelters;
  return shelters.filter((s) => {
    const rom = s.romnr != null ? String(s.romnr) : '';
    const e = s.enrichment || enrichment[s.id] || {};
    return (
      (s.adresse || '').toLowerCase().includes(q) ||
      rom.includes(q) ||
      (e.lokalnavn || '').toLowerCase().includes(q) ||
      (e.kommune || '').toLowerCase().includes(q)
    );
  });
}

function currentFiltered() {
  const q = el.q.value.trim();
  if (!q) return shelters;
  const text = filterByText(q);
  return text.length ? text : shelters;
}

async function geocodeCandidates(query) {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: `${query}, Norge`,
      format: 'json',
      limit: '8',
      countrycodes: 'no',
      addressdetails: '1',
    });
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Bomberom-PWA/1.0 (public safety)' },
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r) => {
    const a = r.address || {};
    const street = [a.road || a.pedestrian, a.house_number].filter(Boolean).join(' ');
    const place = a.municipality || a.city || a.town || a.village || a.suburb;
    const label = [street || query, place, a.postcode].filter(Boolean).join(', ') || r.display_name;
    return {
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      label: label.split(',').slice(0, 3).map((p) => p.trim()).join(', '),
    };
  });
}

function showGeoChoices(candidates) {
  if (candidates.length < 2) {
    el.geoChoices.hidden = true;
    el.geoChoices.innerHTML = '';
    return;
  }
  el.geoChoices.hidden = false;
  el.geoChoices.innerHTML =
    `<div class="geo-hint">${escapeHtml(t('multiPlaces'))}</div>` +
    candidates
      .map(
        (c, i) =>
          `<button type="button" data-i="${i}">${escapeHtml(c.label)}</button>`,
      )
      .join('');
  el.geoChoices.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = candidates[Number(btn.dataset.i)];
      el.geoChoices.hidden = true;
      setView('map');
      map.setView([c.latitude, c.longitude], 13);
      rebuildMarkers(shelters);
      renderList(shelters);
    });
  });
}

async function runSearch(submit = false) {
  const q = el.q.value.trim();
  el.geoChoices.hidden = true;
  if (!q) {
    rebuildMarkers(shelters);
    renderList(shelters);
    return;
  }
  const textHits = filterByText(q);
  if (textHits.length) {
    rebuildMarkers(textHits);
    renderList(textHits);
    if (submit && textHits[0]) {
      setView('map');
      openShelter(textHits[0], true);
    }
    return;
  }
  if (!submit && q.length < 3) return;
  el.status.textContent = t('searching');
  try {
    const candidates = await geocodeCandidates(q);
    applyChrome();
    if (!candidates.length) {
      rebuildMarkers([]);
      renderList([]);
      return;
    }
    if (candidates.length === 1) {
      const c = candidates[0];
      setView('map');
      map.setView([c.latitude, c.longitude], 13);
      rebuildMarkers(shelters);
      renderList(shelters);
      return;
    }
    showGeoChoices(candidates);
    rebuildMarkers(shelters);
    renderList(shelters);
  } catch {
    applyChrome();
  }
}

function setUserLocation(coords) {
  userPos = coords;
  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.marker([coords.latitude, coords.longitude], {
    icon: L.divIcon({
      className: '',
      html: '<div class="user-dot"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    }),
  }).addTo(map);
}

async function findNearest() {
  if (!navigator.geolocation) {
    alert(t('gpsFail'));
    return;
  }
  el.gpsBtn.disabled = true;
  el.gpsBtn.textContent = t('gpsBusy');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setUserLocation(coords);
      setView('map');
      map.setView([coords.latitude, coords.longitude], 14);
      const nearest = [...shelters].sort(
        (a, b) => haversineKm(coords, a) - haversineKm(coords, b),
      )[0];
      if (nearest) openShelter(nearest, true);
      el.gpsBtn.disabled = false;
      el.gpsBtn.textContent = t('gps');
      renderList(currentFiltered());
    },
    (err) => {
      alert(err.code === 1 ? t('gpsDenied') : t('gpsFail'));
      el.gpsBtn.disabled = false;
      el.gpsBtn.textContent = t('gps');
    },
    { enableHighAccuracy: true, timeout: 15000 },
  );
}

function openSettings() {
  el.modalTitle.textContent = t('settings');
  el.modalBody.innerHTML = `
    <div class="setting-row">
      <span>${escapeHtml(t('language'))}</span>
      <select id="localeSel">
        <option value="nb" ${locale === 'nb' ? 'selected' : ''}>Norsk</option>
        <option value="en" ${locale === 'en' ? 'selected' : ''}>English</option>
      </select>
    </div>
    <div class="setting-row">
      <span>${escapeHtml(t('theme'))}</span>
      <select id="themeSel">
        <option value="system" ${themeMode === 'system' ? 'selected' : ''}>${escapeHtml(t('themeSystem'))}</option>
        <option value="light" ${themeMode === 'light' ? 'selected' : ''}>${escapeHtml(t('themeLight'))}</option>
        <option value="dark" ${themeMode === 'dark' ? 'selected' : ''}>${escapeHtml(t('themeDark'))}</option>
      </select>
    </div>
  `;
  el.modal.hidden = false;
  document.getElementById('localeSel')?.addEventListener('change', (e) => {
    locale = e.target.value;
    localStorage.setItem(LOCALE_KEY, locale);
    applyChrome();
    openSettings();
  });
  document.getElementById('themeSel')?.addEventListener('change', (e) => {
    themeMode = e.target.value;
    localStorage.setItem(THEME_KEY, themeMode);
    applyTheme();
  });
}

function openFavorites() {
  el.modalTitle.textContent = t('favorites');
  const favs = shelters.filter((s) => isFav(s.id));
  if (!favs.length) {
    el.modalBody.innerHTML = `<p class="lead">${escapeHtml(t('favoritesEmpty'))}</p>`;
  } else {
    el.modalBody.innerHTML = favs
      .map(
        (s) => `<div class="fav-row">
          <button type="button" class="list-item" data-open="${s.id}">
            <strong>${escapeHtml(s.adresse || '—')}</strong>
          </button>
          <button type="button" class="fav-heart" data-unfav="${s.id}" aria-label="${escapeHtml(t('removeFav'))}">♥</button>
        </div>`,
      )
      .join('');
    el.modalBody.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = shelters.find((x) => x.id === btn.getAttribute('data-open'));
        el.modal.hidden = true;
        if (s) {
          setView('map');
          openShelter(s, true);
        }
      });
    });
    el.modalBody.querySelectorAll('[data-unfav]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleFav(btn.getAttribute('data-unfav'));
        openFavorites();
      });
    });
  }
  el.modal.hidden = false;
}

async function loadData() {
  const [shelterRes, enrichRes] = await Promise.all([
    fetch('./data/shelters.json'),
    fetch('./data/shelter-enrichment.json').catch(() => null),
  ]);
  const data = await shelterRes.json();
  shelters = (data.shelters || []).map((s) => ({ ...s }));
  datasetInfo = {
    updated: data.updated || '',
    count: data.count || shelters.length,
    source: data.source || '',
  };
  if (enrichRes && enrichRes.ok) {
    const enr = await enrichRes.json();
    enrichment = enr.entries || {};
    shelters = shelters.map((s) =>
      enrichment[s.id] ? { ...s, enrichment: enrichment[s.id] } : s,
    );
  }
}

function wire() {
  el.viewMap.addEventListener('click', () => setView('map'));
  el.viewList.addEventListener('click', () => {
    setView('list');
    renderList(currentFiltered());
  });
  el.q.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => void runSearch(false), 400);
  });
  el.q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch(true);
    }
  });
  el.gpsBtn.addEventListener('click', () => void findNearest());
  el.sheetClose.addEventListener('click', closeSheet);
  el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;
    const s = shelters.find((x) => x.id === btn.getAttribute('data-id'));
    if (s) {
      setView('map');
      openShelter(s, true);
    }
  });
  el.settingsBtn.addEventListener('click', openSettings);
  el.favBtn.addEventListener('click', openFavorites);
  el.modalClose.addEventListener('click', () => {
    el.modal.hidden = true;
  });
  el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal) el.modal.hidden = true;
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
}

async function main() {
  applyTheme();
  initMap();
  wire();
  await loadData();
  applyChrome();
  setView('map');
  rebuildMarkers(shelters);
  renderList(shelters);
  setTimeout(() => map.invalidateSize(true), 100);

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  el.status.textContent = String(err.message || err);
});
