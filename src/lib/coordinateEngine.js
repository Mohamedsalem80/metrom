function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function tryExtractDirectCoordinates(text) {
  if (!text) return null;

  const candidates = [text];
  try {
    const decoded = decodeURIComponent(text);
    if (decoded && decoded !== text) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore malformed URI input and continue with raw text.
  }

  const pairPatterns = [
    /@\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /[?&](?:q|query|ll|saddr|daddr|origin|destination|center|cp)=(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /geo:\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/
  ];

  for (let idx = 0; idx < candidates.length; idx += 1) {
    const candidate = candidates[idx];

    for (let p = 0; p < pairPatterns.length; p += 1) {
      const match = candidate.match(pairPatterns[p]);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (isValidLatLng(lat, lng)) {
          return { lat, lng };
        }
      }
    }

    const googleMatch = candidate.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/i);
    if (googleMatch) {
      const lat = parseFloat(googleMatch[1]);
      const lng = parseFloat(googleMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
  }

  return null;
}

export async function extractCoordinatesFromText(rawText) {
  if (!rawText || !String(rawText).trim()) return null;

  const text = String(rawText).trim();
  const direct = tryExtractDirectCoordinates(text);
  if (direct) return direct;

  if (text.includes('goo.gl') || text.includes('maps.app.goo')) {
    try {
      const response = await fetch(text, { method: 'HEAD', redirect: 'follow' });
      const expanded = response.url || text;
      return tryExtractDirectCoordinates(expanded);
    } catch {
      return null;
    }
  }

  return null;
}

export function findNearestStation(lat, lng, geoStations) {
  if (!Array.isArray(geoStations) || geoStations.length === 0) return null;

  let nearest = null;
  let minDistance = Number.MAX_VALUE;

  geoStations.forEach((station) => {
    const distanceKm = haversineKm(lat, lng, station.lat, station.lng);
    if (distanceKm < minDistance) {
      minDistance = distanceKm;
      nearest = { ...station, distanceKm };
    }
  });

  return nearest;
}

export function lineIdToPlannerValue(lineId) {
  if (lineId === 'Line 1') return 'one';
  if (lineId === 'Line 2') return 'two';
  return 'three';
}

export function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}