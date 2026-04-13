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

export async function getMetroConfig() {
  const result = await apiRequest('/metro/config');
  if (!result.ok) {
    return { ok: false, message: result.message, lines: [], fareBands: [] };
  }

  return {
    ok: true,
    lines: Array.isArray(result.data?.lines) ? result.data.lines : [],
    fareBands: Array.isArray(result.data?.fareBands) ? result.data.fareBands : []
  };
}

export async function getAdminMetroConfig(accessToken) {
  const result = await apiRequest('/metro/admin/config', { token: accessToken });
  if (!result.ok) {
    return { ok: false, message: result.message, lines: [], fareBands: [] };
  }

  return {
    ok: true,
    lines: Array.isArray(result.data?.lines) ? result.data.lines : [],
    fareBands: Array.isArray(result.data?.fareBands) ? result.data.fareBands : []
  };
}

export async function createMetroLine(accessToken, payload) {
  return apiRequest('/metro/admin/lines', { method: 'POST', token: accessToken, body: payload });
}

export async function updateMetroLine(accessToken, lineId, payload) {
  return apiRequest(`/metro/admin/lines/${lineId}`, { method: 'PATCH', token: accessToken, body: payload });
}

export async function deleteMetroLine(accessToken, lineId) {
  return apiRequest(`/metro/admin/lines/${lineId}`, { method: 'DELETE', token: accessToken });
}

export async function createMetroStation(accessToken, payload) {
  return apiRequest('/metro/admin/stations', { method: 'POST', token: accessToken, body: payload });
}

export async function updateMetroStation(accessToken, stationId, payload) {
  return apiRequest(`/metro/admin/stations/${stationId}`, { method: 'PATCH', token: accessToken, body: payload });
}

export async function deleteMetroStation(accessToken, stationId) {
  return apiRequest(`/metro/admin/stations/${stationId}`, { method: 'DELETE', token: accessToken });
}

export async function createFareBand(accessToken, payload) {
  return apiRequest('/metro/admin/fares', { method: 'POST', token: accessToken, body: payload });
}

export async function updateFareBand(accessToken, fareId, payload) {
  return apiRequest(`/metro/admin/fares/${fareId}`, { method: 'PATCH', token: accessToken, body: payload });
}

export async function deleteFareBand(accessToken, fareId) {
  return apiRequest(`/metro/admin/fares/${fareId}`, { method: 'DELETE', token: accessToken });
}
