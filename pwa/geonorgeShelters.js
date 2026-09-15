/**
 * Client-side Geonorge → ShelterDataset (same contract as Expo geonorgeShelters.ts).
 * Expects global `proj4` and `fflate` from classic script tags.
 */

const METADATA_UUID = 'dbae9aae-10e7-4b75-8d67-7f0e8828f3d8';
const ORDER_URL = 'https://nedlasting.geonorge.no/api/order';
const CATALOG_ZIP_URL =
  'https://nedlasting.geonorge.no/geonorge/Samfunnssikkerhet/TilfluktsromOffentlige/GeoJSON/Samfunnssikkerhet_0000_Norge_25833_TilfluktsromOffentlige_GeoJSON.zip';
const FETCH_TIMEOUT_MS = 60_000;

function getProj4() {
  const p = globalThis.proj4;
  if (!p) {
    throw new Error('proj4 not loaded');
  }
  if (typeof p.defs === 'function') {
    p.defs(
      'EPSG:25833',
      '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
    );
  }
  return p;
}

function getFflate() {
  const f = globalThis.fflate;
  if (!f?.unzipSync || !f?.strFromU8) {
    throw new Error('fflate not loaded');
  }
  return f;
}

function withTimeout(ms, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return controller.signal;
}

async function fetchArrayBuffer(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
}

async function orderDownloadUrl(signal) {
  const payload = {
    email: 'dev@example.com',
    orderLines: [
      {
        metadataUuid: METADATA_UUID,
        areas: [{ code: '0000', name: 'Hele landet', type: 'landsdekkende' }],
        formats: [{ name: 'GeoJSON ' }],
        projections: [
          {
            code: '25833',
            name: 'EUREF89 UTM sone 33, 2d',
            codespace: 'http://www.opengis.net/def/crs/EPSG/0/25833',
          },
        ],
      },
    ],
  };
  const response = await fetch(ORDER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new Error(`Geonorge order HTTP ${response.status}`);
  const json = await response.json();
  const url = json.files?.[0]?.downloadUrl;
  if (!url) throw new Error('Geonorge order returned no download URL');
  return url;
}

function unzipGeoJson(buffer) {
  const { unzipSync, strFromU8 } = getFflate();
  const files = unzipSync(new Uint8Array(buffer));
  const entry = Object.entries(files).find(([name]) => name.toLowerCase().endsWith('.json'));
  if (!entry) throw new Error('Zip contained no GeoJSON file');
  return JSON.parse(strFromU8(entry[1]));
}

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function featureToShelter(feature, proj4) {
  const props = feature.properties || {};
  const id = typeof props.lokalId === 'string' ? props.lokalId.trim() : '';
  const coords = feature.geometry?.coordinates;
  if (!id || !coords || coords.length < 2) return null;
  const [x, y] = coords;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const [lon, lat] = proj4('EPSG:25833', 'EPSG:4326', [x, y]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lat < 57 || lat > 81 || lon < 4 || lon > 35) return null;
  return {
    id,
    romnr: asNumber(props.romnr),
    plasser: asNumber(props.plasser),
    adresse: typeof props.adresse === 'string' ? props.adresse : '',
    latitude: Math.round(lat * 1e6) / 1e6,
    longitude: Math.round(lon * 1e6) / 1e6,
  };
}

export function geoJsonToShelterDataset(geojson) {
  const proj4 = getProj4();
  const features = geojson.features || [];
  const shelters = [];
  let updated = '';
  for (const feature of features) {
    const shelter = featureToShelter(feature, proj4);
    if (!shelter) continue;
    shelters.push(shelter);
    if (!updated) {
      const raw = feature.properties?.datauttaksdato;
      if (typeof raw === 'string' && raw.trim()) updated = raw.trim();
    }
  }
  if (shelters.length < 100) {
    throw new Error(`Too few shelters after convert (${shelters.length})`);
  }
  return {
    updated: updated || new Date().toISOString(),
    source: 'DSB via Geonorge',
    count: shelters.length,
    shelters,
  };
}

export async function fetchOfficialShelterDataset(signal) {
  const timed = withTimeout(FETCH_TIMEOUT_MS, signal);
  let buffer;
  try {
    buffer = await fetchArrayBuffer(CATALOG_ZIP_URL, timed);
  } catch (catalogError) {
    try {
      const downloadUrl = await orderDownloadUrl(timed);
      buffer = await fetchArrayBuffer(downloadUrl, timed);
    } catch (orderError) {
      const catalogMsg = catalogError instanceof Error ? catalogError.message : String(catalogError);
      const orderMsg = orderError instanceof Error ? orderError.message : String(orderError);
      throw new Error(`Could not download Geonorge data. Catalog: ${catalogMsg}. Order: ${orderMsg}`);
    }
  }
  return geoJsonToShelterDataset(unzipGeoJson(buffer));
}

function shelterCoreKey(s) {
  return [s.romnr ?? '', s.plasser ?? '', s.adresse ?? '', s.latitude, s.longitude].join('|');
}

/** Geonorge lokalId may rotate; romnr is unique in the public list. */
export function stableShelterKey(s) {
  if (s.romnr != null && Number.isFinite(s.romnr)) return `romnr:${s.romnr}`;
  return `id:${s.id}`;
}

export function reconcileShelterIds(localShelters, remote) {
  const byRomnr = new Map();
  for (const s of localShelters || []) {
    if (s.romnr != null && Number.isFinite(s.romnr) && !byRomnr.has(s.romnr)) {
      byRomnr.set(s.romnr, s);
    }
  }
  const claimedRomnr = new Set();
  const shelters = (remote.shelters || []).map((r) => {
    if (r.romnr == null || !Number.isFinite(r.romnr)) return r;
    if (claimedRomnr.has(r.romnr)) return r;
    claimedRomnr.add(r.romnr);
    const prev = byRomnr.get(r.romnr);
    return prev ? { ...r, id: prev.id } : r;
  });
  return { ...remote, count: shelters.length, shelters };
}

export function diffShelterLists(local, remote) {
  const localByKey = new Map((local.shelters || []).map((s) => [stableShelterKey(s), s]));
  const remoteByKey = new Map((remote.shelters || []).map((s) => [stableShelterKey(s), s]));
  const added = [];
  const removed = [];
  const changed = [];
  for (const key of remoteByKey.keys()) {
    if (!localByKey.has(key)) added.push(key);
  }
  for (const key of localByKey.keys()) {
    if (!remoteByKey.has(key)) removed.push(key);
  }
  for (const [key, remoteShelter] of remoteByKey) {
    const localShelter = localByKey.get(key);
    if (!localShelter) continue;
    if (shelterCoreKey(localShelter) !== shelterCoreKey(remoteShelter)) changed.push(key);
  }
  const isUpToDate =
    local.updated === remote.updated &&
    local.count === remote.count &&
    added.length === 0 &&
    removed.length === 0 &&
    changed.length === 0;
  return {
    added,
    removed,
    changed,
    unchanged: remote.shelters.length - added.length - changed.length,
    remoteUpdated: remote.updated,
    remoteCount: remote.count,
    localUpdated: local.updated,
    localCount: local.count,
    isUpToDate,
  };
}
