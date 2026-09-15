import { diffShelterLists, fetchOfficialShelterDataset, reconcileShelterIds } from './geonorgeShelters.js';

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
    enrichLocalName: 'Lokalnavn',
    enrichEntrance: 'Inngang / veibeskrivelse',
    enrichKommune: 'Kommune',
    enrichMoh: 'Høyde over havet: {moh} m',
    enrichStatusOppgradering: 'Under ombygging',
    enrichStatusStengt: 'Stengt',
    enrichStreetView: 'Åpne Street View',
    enrichStreetViewComment:
      'Offentlig tilfluktsrom skal ifølge DSB være skiltet utvendig med «TILFLUKTSROM». Bruk Street View for å orientere deg mot inngang — verifiser på stedet.',
    romtypeParkeringshus: 'Parkeringshus',
    romtypeIdrettshall: 'Idrettshall',
    romtypeTunnel: 'T-bane / tunnel',
    romtypeFjellanlegg: 'Fjellanlegg',
    romtypeBrannstasjon: 'Brannstasjon',
    romtypeSkole: 'Skole',
    romtypeSykehjem: 'Sykehjem',
    romtypeKai: 'Kai',
    romtypeOffentlig: 'Offentlig tilfluktsrom',
    enrichStructureFjellanlegg: 'Fjellanlegg',
    enrichStructureUnderBygg: 'Under bygg',
    enrichStructureTunnel: 'Tunnel / T-bane',
    mapLegendTitle: 'Kartfarger',
    mapLegendGreen: 'Inngang / god info',
    mapLegendOrange: 'noe info',
    mapLegendRed: 'Kun DSB-data',
    alarmSignalsTitle: 'Varslingsanlegg (tyfoner / «flyalarmen»)',
    alarmSignal1Title: 'Viktig melding – søk informasjon',
    alarmSignal1Sound: 'Tre serier med tut, ett minutts pause mellom seriene.',
    alarmSignal1Action: 'Søk informasjon om hva som skjer.',
    alarmSignal2Title: 'Fare for angrep – søk dekning',
    alarmSignal2Sound: 'Korte støt i cirka ett minutt.',
    alarmSignal2Action: 'Søk dekning med én gang.',
    alarmSignal3Title: 'Faren over',
    alarmSignal3Sound: 'Sammenhengende tut i et halvt minutt.',
    alarmSignal3Action: 'Faren er over.',
    multiHits: '{count} treff — velg i listen',
    coords: '{lat} · {lon}',
    clearSearch: 'Tøm søk',
    shelterDataTitle: 'Tilfluktsrom-data',
    shelterDataLocal: 'Lokal liste: {date} · {count} rom',
    shelterDataRemote: 'Offentlig liste: {date} · {count} rom',
    shelterDataHint:
      'Krever nett. Henter offentlig liste fra Geonorge (DSB) og lagrer den i nettleseren.',
    shelterDataCheck: 'Hent offentlig liste (DSB/Geonorge)',
    shelterDataUpToDate: 'Listen er à jour med offentlig DSB-data.',
    shelterDataDiff: '{added} nye, {removed} fjernet, {changed} endret',
    shelterDataStampOnly: 'Nyere offentlig uttrekk (samme rom-ID-er).',
    shelterDataApply: 'Bruk ny liste',
    shelterDataCancel: 'Avbryt',
    shelterDataApplying: 'Lagrer…',
    shelterDataChecking: 'Henter…',
    shelterDataCorsNote: '',
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
    enrichLocalName: 'Local name',
    enrichEntrance: 'Entrance / directions',
    enrichKommune: 'Municipality',
    enrichMoh: 'Elevation: {moh} m above sea level',
    enrichStatusOppgradering: 'Under renovation',
    enrichStatusStengt: 'Closed',
    enrichStreetView: 'Open Street View',
    enrichStreetViewComment:
      'Public shelters should be marked outdoors with «TILFLUKTSROM» according to DSB. Use Street View to orient yourself toward the entrance — verify on site.',
    romtypeParkeringshus: 'Parking garage',
    romtypeIdrettshall: 'Sports hall',
    romtypeTunnel: 'Metro / tunnel',
    romtypeFjellanlegg: 'Mountain shelter',
    romtypeBrannstasjon: 'Fire station',
    romtypeSkole: 'School',
    romtypeSykehjem: 'Nursing home',
    romtypeKai: 'Quay',
    romtypeOffentlig: 'Public shelter',
    enrichStructureFjellanlegg: 'Mountain shelter',
    enrichStructureUnderBygg: 'Under building',
    enrichStructureTunnel: 'Tunnel / metro',
    mapLegendTitle: 'Map colours',
    mapLegendGreen: 'Entrance / good info',
    mapLegendOrange: 'some info',
    mapLegendRed: 'DSB data only',
    alarmSignalsTitle: 'Warning sirens («air raid alarm»)',
    alarmSignal1Title: 'Important message – seek information',
    alarmSignal1Sound: 'Three series of blasts, one minute pause between series.',
    alarmSignal1Action: 'Seek information about what is happening.',
    alarmSignal2Title: 'Danger of attack – seek shelter',
    alarmSignal2Sound: 'Short blasts for about one minute.',
    alarmSignal2Action: 'Seek shelter immediately.',
    alarmSignal3Title: 'All clear',
    alarmSignal3Sound: 'Continuous blast for half a minute.',
    alarmSignal3Action: 'The danger is over.',
    multiHits: '{count} matches — pick from the list',
    coords: '{lat} · {lon}',
    clearSearch: 'Clear search',
    shelterDataTitle: 'Shelter data',
    shelterDataLocal: 'Local list: {date} · {count} shelters',
    shelterDataRemote: 'Public list: {date} · {count} shelters',
    shelterDataHint:
      'Needs internet. Fetches the public list from Geonorge (DSB) and stores it in this browser.',
    shelterDataCheck: 'Fetch public list (DSB/Geonorge)',
    shelterDataUpToDate: 'Your list matches the public DSB data.',
    shelterDataDiff: '{added} new, {removed} removed, {changed} changed',
    shelterDataStampOnly: 'Newer public extract (same shelter IDs).',
    shelterDataApply: 'Use new list',
    shelterDataCancel: 'Cancel',
    shelterDataApplying: 'Saving…',
    shelterDataChecking: 'Fetching…',
    shelterDataCorsNote: '',
  },
};

const ROMTYPE_KEYS = {
  parkeringshus: 'romtypeParkeringshus',
  idrettshall: 'romtypeIdrettshall',
  tunnel: 'romtypeTunnel',
  fjellanlegg: 'romtypeFjellanlegg',
  brannstasjon: 'romtypeBrannstasjon',
  skole: 'romtypeSkole',
  sykehjem: 'romtypeSykehjem',
  kai: 'romtypeKai',
  offentlig_rom: 'romtypeOffentlig',
};

const STRUCTURE_KEYS = {
  fjellanlegg: 'enrichStructureFjellanlegg',
  under_bygg: 'enrichStructureUnderBygg',
  tunnel: 'enrichStructureTunnel',
};

const COLORS = { green: '#2e7d32', orange: '#ef6c00', red: '#c62828' };
const FAV_KEY = 'bomberom.favorites';
const LOCALE_KEY = 'bomberom.locale';
const THEME_KEY = 'bomberom.theme';
const SHELTER_CACHE_KEY = 'bomberom.shelters-v3';

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
  footerExtras: document.getElementById('footerExtras'),
};

let locale = localStorage.getItem(LOCALE_KEY) || 'nb';
let themeMode = localStorage.getItem(THEME_KEY) || 'system';
let shelters = [];
let datasetInfo = { updated: '', count: 0, source: '' };
let enrichment = {};
/** romnr → enrichment (Geonorge lokalId rotates between extracts). */
let enrichmentByRomnr = {};
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
  const e = enrichmentFor(shelter);
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
  renderFooterExtras();
}

function renderFooterExtras() {
  if (!el.footerExtras) return;
  el.footerExtras.innerHTML = `
    <section class="info-block">
      <h3>${escapeHtml(t('mapLegendTitle'))}</h3>
      <ul class="legend-list">
        <li><span class="legend-dot" style="background:${COLORS.green}"></span>${escapeHtml(t('mapLegendGreen'))}</li>
        <li><span class="legend-dot" style="background:${COLORS.orange}"></span>${escapeHtml(t('mapLegendOrange'))}</li>
        <li><span class="legend-dot" style="background:${COLORS.red}"></span>${escapeHtml(t('mapLegendRed'))}</li>
      </ul>
    </section>
    <section class="info-block">
      <h3>${escapeHtml(t('alarmSignalsTitle'))}</h3>
      <div class="alarm-item">
        <strong>${escapeHtml(t('alarmSignal1Title'))}</strong>
        <p>${escapeHtml(t('alarmSignal1Sound'))}</p>
        <p class="alarm-action">→ ${escapeHtml(t('alarmSignal1Action'))}</p>
      </div>
      <div class="alarm-item">
        <strong>${escapeHtml(t('alarmSignal2Title'))}</strong>
        <p>${escapeHtml(t('alarmSignal2Sound'))}</p>
        <p class="alarm-action">→ ${escapeHtml(t('alarmSignal2Action'))}</p>
      </div>
      <div class="alarm-item">
        <strong>${escapeHtml(t('alarmSignal3Title'))}</strong>
        <p>${escapeHtml(t('alarmSignal3Sound'))}</p>
        <p class="alarm-action">→ ${escapeHtml(t('alarmSignal3Action'))}</p>
      </div>
    </section>
  `;
}

function streetViewUrl(lat, lon, override) {
  if (override) return override;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
}

function formatStatusLabel(e) {
  if (!e?.status) return null;
  const base =
    e.status === 'stengt' ? t('enrichStatusStengt') : t('enrichStatusOppgradering');
  if (e.status_published) {
    const [y, m, d] = String(e.status_published).split('-');
    const formatted = d && m && y ? `${d}.${m}.${y}` : e.status_published;
    return `${base} (${formatted})`;
  }
  return base;
}

function renderEnrichmentHtml(e, lat, lon) {
  const parts = [];
  if (e.kommune) {
    const extra = e.romtype_offentlig ? ` · ${e.romtype_offentlig}` : '';
    parts.push(
      `<p class="enrich-meta">${escapeHtml(t('enrichKommune'))}: ${escapeHtml(e.kommune)}${escapeHtml(extra)}</p>`,
    );
  }
  if (e.lokalnavn) {
    parts.push(
      `<div class="enrich-row"><span class="enrich-label">${escapeHtml(t('enrichLocalName'))}</span><span>${escapeHtml(e.lokalnavn)}</span></div>`,
    );
  }
  const romKey = e.romtype ? ROMTYPE_KEYS[e.romtype] : null;
  const structKey = e.structure_type ? STRUCTURE_KEYS[e.structure_type] : null;
  if (romKey || structKey) {
    parts.push(
      `<div class="badge-row">${
        romKey ? `<span class="badge">${escapeHtml(t(romKey))}</span>` : ''
      }${
        structKey
          ? `<span class="badge badge-outline">${escapeHtml(t(structKey))}</span>`
          : ''
      }</div>`,
    );
  }
  if (e.inngang) {
    parts.push(
      `<div class="enrich-row"><span class="enrich-label">${escapeHtml(t('enrichEntrance'))}</span><span>${escapeHtml(e.inngang)}</span></div>`,
    );
  }
  if (e.moh != null) {
    parts.push(`<p class="enrich-meta">${escapeHtml(t('enrichMoh', { moh: e.moh }))}</p>`);
  }
  const statusLabel = formatStatusLabel(e);
  if (statusLabel) {
    parts.push(
      `<div class="status-box"><strong>${escapeHtml(statusLabel)}</strong>${
        e.status_quote
          ? `<p class="status-quote">${escapeHtml(e.status_quote)}</p>`
          : ''
      }</div>`,
    );
  }
  const sv = streetViewUrl(lat, lon, e.streetview_url);
  const hint = e.streetview_comment || t('enrichStreetViewComment');
  parts.push(`
    <div class="streetview-row">
      <a class="btn streetview" href="${escapeHtml(sv)}" target="_blank" rel="noopener">${escapeHtml(t('enrichStreetView'))}</a>
      <p class="streetview-hint">${escapeHtml(hint)}</p>
    </div>
  `);
  return `<div class="enrich-block">${parts.join('')}</div>`;
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

const markersById = new Map();

function syncSelectedMarkerIcons(prevId, nextId) {
  if (prevId && markersById.has(prevId)) {
    const shelter = shelters.find((s) => s.id === prevId);
    if (shelter) {
      markersById.get(prevId).setIcon(makeDotIcon(markerQuality(shelter), false));
    }
  }
  if (nextId && markersById.has(nextId)) {
    const shelter = shelters.find((s) => s.id === nextId);
    if (shelter) {
      markersById.get(nextId).setIcon(makeDotIcon(markerQuality(shelter), true));
    }
  }
}

function setSelectedId(nextId) {
  const prev = selectedId;
  selectedId = nextId;
  syncSelectedMarkerIcons(prev, nextId);
}

function updateGpsVisibility() {
  const show = view === 'map' && el.sheet.hidden;
  el.gpsBtn.style.display = show ? 'block' : 'none';
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
  markersById.clear();
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
    markersById.set(s.id, m);
    cluster.addLayer(m);
  }
}

function setView(next) {
  view = next;
  el.viewMap.classList.toggle('on', view === 'map');
  el.viewList.classList.toggle('on', view === 'list');
  el.map.style.display = view === 'map' ? 'block' : 'none';
  el.listWrap.hidden = view !== 'list';
  updateGpsVisibility();
  if (view === 'map') {
    setTimeout(() => map.invalidateSize(true), 50);
  }
}

function renderList(list) {
  if (!list.length) {
    el.list.innerHTML = `<p class="lead">${escapeHtml(t('listEmpty'))}</p>`;
    return;
  }
  const ref = userPos;
  const ranked = [...list].sort((a, b) => {
    if (!ref) {
      return (a.adresse || '').localeCompare(b.adresse || '', 'nb');
    }
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
  setSelectedId(shelter.id);
  const e = enrichmentFor(shelter);
  const places =
    shelter.plasser != null ? t('capacity', { places: shelter.plasser }) : t('capacityUnknown');
  const title = e.lokalnavn || shelter.adresse || '—';
  const sameName =
    e.lokalnavn &&
    shelter.adresse &&
    e.lokalnavn.trim().toLowerCase() === shelter.adresse.trim().toLowerCase();
  const subtitle =
    e.lokalnavn && shelter.adresse && !sameName
      ? `<p class="sheet-sub">${escapeHtml(shelter.adresse)}</p>`
      : '';
  const rom =
    shelter.romnr != null ? `<p>${escapeHtml(t('romnr', { n: shelter.romnr }))}</p>` : '';
  const dist =
    userPos != null ? `<p>${escapeHtml(formatKm(haversineKm(userPos, shelter)))}</p>` : '';
  const favLabel = isFav(shelter.id) ? t('removeFav') : t('addFav');
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`;
  const enrichHtml = renderEnrichmentHtml(
    sameName ? { ...e, lokalnavn: undefined } : e,
    shelter.latitude,
    shelter.longitude,
  );

  el.sheetBody.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    ${subtitle}
    ${rom}
    <p>${escapeHtml(places)}</p>
    ${dist}
    ${enrichHtml}
    <div class="row">
      <button type="button" class="btn" id="sheetFav">${escapeHtml(favLabel)}</button>
      <a class="btn primary" href="${navUrl}" target="_blank" rel="noopener">${escapeHtml(t('navigate'))}</a>
    </div>
  `;
  el.sheet.hidden = false;
  updateGpsVisibility();
  document.getElementById('sheetFav')?.addEventListener('click', () => {
    toggleFav(shelter.id);
    openShelter(shelter, false);
  });

  if (pan && view === 'map') {
    map.setView([shelter.latitude, shelter.longitude], Math.max(map.getZoom(), 14));
  }
}

function closeSheet() {
  el.sheet.hidden = true;
  setSelectedId(null);
  updateGpsVisibility();
  setTimeout(() => map?.invalidateSize(true), 50);
}

function filterByText(query) {
  const q = query.trim().toLowerCase();
  if (!q) return shelters;
  return shelters.filter((s) => {
    const rom = s.romnr != null ? String(s.romnr) : '';
    const e = enrichmentFor(s);
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
    applyChrome();
    rebuildMarkers(shelters);
    renderList(shelters);
    return;
  }
  const textHits = filterByText(q);
  if (textHits.length) {
    rebuildMarkers(textHits);
    renderList(textHits);
    if (submit) {
      if (textHits.length === 1) {
        setView('map');
        openShelter(textHits[0], true);
      } else {
        setView('list');
        el.status.textContent = t('multiHits', { count: textHits.length });
      }
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
  el.q.value = '';
  el.geoChoices.hidden = true;
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

function formatShelterDate(value) {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : value;
}

function enrichmentFor(shelter) {
  return (
    shelter.enrichment ||
    enrichment[shelter.id] ||
    (shelter.romnr != null ? enrichmentByRomnr[shelter.romnr] : undefined) ||
    {}
  );
}

function applyShelterDataset(data) {
  shelters = (data.shelters || []).map((s) => ({ ...s }));
  datasetInfo = {
    updated: data.updated || '',
    count: data.count || shelters.length,
    source: data.source || '',
  };
  shelters = shelters.map((s) => {
    const e = enrichmentFor(s);
    return Object.keys(e).length ? { ...s, enrichment: e } : s;
  });
}

function persistShelterDataset(data) {
  localStorage.setItem(
    SHELTER_CACHE_KEY,
    JSON.stringify({
      updated: data.updated,
      source: data.source || 'DSB via Geonorge',
      count: data.shelters.length,
      shelters: data.shelters,
    }),
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
    <div class="shelter-update">
      <h3>${escapeHtml(t('shelterDataTitle'))}</h3>
      <p class="meta" id="shelterLocalMeta">${escapeHtml(
        t('shelterDataLocal', {
          date: formatShelterDate(datasetInfo.updated),
          count: datasetInfo.count || shelters.length,
        }),
      )}</p>
      <p class="hint">${escapeHtml(t('shelterDataHint'))}</p>
      <button type="button" class="primary-btn" id="shelterCheckBtn">${escapeHtml(t('shelterDataCheck'))}</button>
      <p class="error" id="shelterUpdateError" hidden></p>
      <div id="shelterUpdateResult" hidden></div>
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

  const errEl = document.getElementById('shelterUpdateError');
  const resultEl = document.getElementById('shelterUpdateResult');
  const checkBtn = document.getElementById('shelterCheckBtn');
  let pendingRemote = null;

  checkBtn?.addEventListener('click', async () => {
    errEl.hidden = true;
    resultEl.hidden = true;
    pendingRemote = null;
    checkBtn.disabled = true;
    checkBtn.textContent = t('shelterDataChecking');
    try {
      const remote = await fetchOfficialShelterDataset();
      const local = {
        updated: datasetInfo.updated,
        count: datasetInfo.count,
        shelters,
      };
      const diff = diffShelterLists(local, remote);
      pendingRemote = remote;
      resultEl.hidden = false;
      if (diff.isUpToDate) {
        resultEl.innerHTML = `<p><strong>${escapeHtml(t('shelterDataUpToDate'))}</strong></p>
          <p class="meta">${escapeHtml(
            t('shelterDataRemote', {
              date: formatShelterDate(diff.remoteUpdated),
              count: diff.remoteCount,
            }),
          )}</p>`;
      } else {
        const summary =
          diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0
            ? t('shelterDataStampOnly')
            : t('shelterDataDiff', {
                added: diff.added.length,
                removed: diff.removed.length,
                changed: diff.changed.length,
              });
        resultEl.innerHTML = `<p><strong>${escapeHtml(summary)}</strong></p>
          <p class="meta">${escapeHtml(
            t('shelterDataRemote', {
              date: formatShelterDate(diff.remoteUpdated),
              count: diff.remoteCount,
            }),
          )}</p>
          <div class="shelter-actions">
            <button type="button" class="primary-btn" id="shelterApplyBtn">${escapeHtml(t('shelterDataApply'))}</button>
            <button type="button" class="ghost-btn" id="shelterCancelBtn">${escapeHtml(t('shelterDataCancel'))}</button>
          </div>`;
        document.getElementById('shelterApplyBtn')?.addEventListener('click', () => {
          if (!pendingRemote) return;
          const reconciled = reconcileShelterIds(shelters, pendingRemote);
          persistShelterDataset(reconciled);
          applyShelterDataset(reconciled);
          applyChrome();
          rebuildMarkers(shelters);
          renderList(currentFiltered());
          openSettings();
        });
        document.getElementById('shelterCancelBtn')?.addEventListener('click', () => {
          pendingRemote = null;
          resultEl.hidden = true;
        });
      }
    } catch (err) {
      errEl.hidden = false;
      const msg = err instanceof Error ? err.message : String(err);
      const corsHint =
        /Failed to fetch|NetworkError|CORS|TypeError/i.test(msg)
          ? ' (CORS / nett — prøv app-versjonen hvis dette gjentar seg.)'
          : '';
      errEl.textContent = msg + corsHint;
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = t('shelterDataCheck');
    }
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
  const [enrichRes, bundledRes] = await Promise.all([
    fetch('./data/shelter-enrichment.json').catch(() => null),
    fetch('./data/shelters.json'),
  ]);
  const bundled = await bundledRes.json();
  if (enrichRes && enrichRes.ok) {
    const enr = await enrichRes.json();
    enrichment = enr.entries || {};
  }
  enrichmentByRomnr = {};
  for (const s of bundled.shelters || []) {
    if (s.romnr != null && enrichment[s.id]) {
      enrichmentByRomnr[s.romnr] = enrichment[s.id];
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem(SHELTER_CACHE_KEY) || 'null');
    if (
      cached &&
      Array.isArray(cached.shelters) &&
      cached.shelters.length > 0 &&
      cached.shelters.length === cached.count
    ) {
      applyShelterDataset(cached);
      return;
    }
  } catch {
    // fall through to bundled JSON
  }

  applyShelterDataset(bundled);
  try {
    persistShelterDataset({
      updated: bundled.updated,
      source: bundled.source,
      count: bundled.shelters?.length || 0,
      shelters: bundled.shelters || [],
    });
  } catch {
    // ignore quota
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
      await navigator.serviceWorker.register('./sw.js?v=7');
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  el.status.textContent = String(err.message || err);
});
