const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    return {
      ok: false,
      message: `Cannot reach backend at ${API_BASE_URL}. Make sure the server is running.`,
      status: 0,
      data: null
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload?.message || `Request failed with status ${response.status}.`,
      status: response.status,
      data: payload
    };
  }

  return { ok: true, data: payload };
}

export async function saveTripForUser(accessToken, trip) {
  if (!accessToken) {
    return { ok: false, message: 'Sign in to save trips to your profile.' };
  }

  const result = await apiRequest('/trips', {
    method: 'POST',
    token: accessToken,
    body: trip
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, message: 'Trip saved to your profile.', trip: result.data };
}

export async function getTripsForUser(accessToken) {
  if (!accessToken) {
    return { ok: true, trips: [] };
  }

  const result = await apiRequest('/trips', { token: accessToken });
  if (!result.ok) {
    return { ok: false, message: result.message, trips: [] };
  }

  const trips = Array.isArray(result.data) ? result.data : [];
  return { ok: true, trips };
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function baseFileName(userEmail) {
  const safeUser = String(userEmail || 'metroom-user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeUser || 'metroom-user'}-trips-${stamp}`;
}

export function downloadTripsAsJson(userEmail, trips) {
  if (!trips.length) return { ok: false, message: 'No saved trips to download.' };

  const payload = {
    version: 1,
    app: 'Metroom Trip Exports',
    exportedAt: new Date().toISOString(),
    owner: userEmail,
    count: trips.length,
    trips
  };

  downloadFile(`${baseFileName(userEmail)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  return { ok: true, message: 'JSON download started.' };
}

export function downloadTripsAsCsv(userEmail, trips) {
  if (!trips.length) return { ok: false, message: 'No saved trips to download.' };

  const header = [
    'id',
    'created_at',
    'start_line',
    'end_line',
    'start_station',
    'end_station',
    'stations_count',
    'estimated_time',
    'fare_regular',
    'fare_elderly',
    'fare_special',
    'transfer_station',
    'route'
  ].join(',');

  const escapeCell = (value) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows = trips.map((trip) => [
    trip.id,
    trip.createdAt,
    trip.startLine,
    trip.endLine,
    trip.startStation,
    trip.endStation,
    trip.stationsCount,
    trip.estimatedTime,
    trip.fares?.regular,
    trip.fares?.elderly,
    trip.fares?.special,
    trip.transferStation || '',
    Array.isArray(trip.route) ? trip.route.join(' > ') : ''
  ].map(escapeCell).join(','));

  downloadFile(`${baseFileName(userEmail)}.csv`, [header].concat(rows).join('\n'), 'text/csv;charset=utf-8');
  return { ok: true, message: 'CSV download started.' };
}

export function downloadTripsAsGeoJson(userEmail, trips) {
  if (!trips.length) return { ok: false, message: 'No saved trips to download.' };

  const features = trips.map((trip) => ({
    type: 'Feature',
    properties: {
      id: trip.id,
      createdAt: trip.createdAt,
      startLine: trip.startLine,
      endLine: trip.endLine,
      startStation: trip.startStation,
      endStation: trip.endStation,
      stationsCount: trip.stationsCount,
      estimatedTime: trip.estimatedTime,
      fareRegular: trip.fares?.regular,
      fareElderly: trip.fares?.elderly,
      fareSpecial: trip.fares?.special,
      transferStation: trip.transferStation || null,
      route: Array.isArray(trip.route) ? trip.route : []
    },
    geometry: null
  }));

  const geojson = {
    type: 'FeatureCollection',
    name: baseFileName(userEmail),
    features
  };

  downloadFile(`${baseFileName(userEmail)}.geojson`, JSON.stringify(geojson, null, 2), 'application/geo+json;charset=utf-8');
  return { ok: true, message: 'GeoJSON download started.' };
}
