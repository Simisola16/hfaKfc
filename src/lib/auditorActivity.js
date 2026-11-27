// Shared helpers for accurate Auditor Start/End time & GPS location sessions

function toCoord(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function cleanTime(val) {
  const s = String(val || '').trim();
  if (!s || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return '';
  return s;
}

function parseClockSeconds(timeStr) {
  const s = cleanTime(timeStr);
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0);
}

export function formatDuration(startTime, endTime) {
  const s = parseClockSeconds(startTime);
  const e = parseClockSeconds(endTime);
  if (s === null || e === null || e < s) return '';
  const diffMin = Math.round((e - s) / 60);
  if (diffMin < 1) return '<1m';
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return null;
  }
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function cleanLocationLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s
    .replace(/^Country:\s*UK\s*/i, '')
    .replace(/^GPS Location:\s*/i, '')
    .replace(/^Location:\s*/i, '')
    .trim();
}

function normalizeDateKey(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dmy = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{4})$/);
  if (dmy) {
    const m = months[dmy[2].slice(0, 3).toLowerCase()];
    if (m) return `${dmy[3]}-${m}-${String(dmy[1]).padStart(2, '0')}`;
  }
  return s.toLowerCase();
}

function isStartEvent(log) {
  const et = String(log.eventType || '').toLowerCase();
  if (et === 'start' || et === 'login') return true;
  const act = String(log.activity || '').toLowerCase();
  return (
    act.includes('sinin') ||
    act.includes('sign-in') ||
    act.includes('signin') ||
    act.includes('login') ||
    act.includes('new audit') ||
    act.includes('check-in') ||
    act.includes('start')
  );
}

function isEndEvent(log) {
  const et = String(log.eventType || '').toLowerCase();
  if (et === 'end' || et === 'logout') return true;
  const act = String(log.activity || '').toLowerCase();
  return (
    act.includes('sinout') ||
    act.includes('sign-out') ||
    act.includes('signout') ||
    act.includes('logout') ||
    act.includes('recommendation') ||
    act.includes('completed') ||
    act.includes('finished') ||
    act.includes('end')
  );
}

function formatGpsSourceTag(source, accuracy) {
  if (source === 'gps') {
    return Number.isFinite(accuracy) ? `GPS ±${accuracy}m` : 'Live GPS';
  }
  if (source === 'unavailable') return 'GPS Unavailable';
  return 'GPS Recorded';
}

const geoLabelCache = new Map();

export async function reverseGeocodeClient(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return '';
  const cacheKey = `${numLat.toFixed(4)},${numLng.toFixed(4)}`;
  if (geoLabelCache.has(cacheKey)) return geoLabelCache.get(cacheKey);

  try {
    const stored = sessionStorage.getItem(`hfa_geo_${cacheKey}`);
    if (stored) {
      geoLabelCache.set(cacheKey, stored);
      return stored;
    }
  } catch {
    // ignore storage error
  }

  const fetchJson = async (url, timeoutMs = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  let resolved = '';

  // 1. OpenStreetMap Nominatim for exact real street / area / town / postcode / country anywhere
  const osmData = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(numLat)}&lon=${encodeURIComponent(numLng)}&zoom=18`
  );
  if (osmData?.address) {
    const a = osmData.address;
    const street = [a.house_number, a.road || a.pedestrian || a.neighbourhood || a.suburb].filter(Boolean).join(' ');
    const city = a.city || a.town || a.village || a.borough || a.county || '';
    const parts = [street, city, a.postcode, a.country_code ? a.country_code.toUpperCase() : ''].filter(Boolean);
    if (parts.length > 0) resolved = parts.join(', ');
  }

  // 2. Fallback for UK coordinates: ONS postcodes.io
  if (!resolved && numLat >= 49.5 && numLat <= 61.0 && numLng >= -8.5 && numLng <= 2.0) {
    const ukData = await fetchJson(
      `https://api.postcodes.io/postcodes?lon=${encodeURIComponent(numLng)}&lat=${encodeURIComponent(numLat)}&limit=1`
    );
    const ukMatch = Array.isArray(ukData?.result) && ukData.result[0] ? ukData.result[0] : null;
    if (ukMatch) {
      resolved = [ukMatch.admin_ward, ukMatch.admin_district, ukMatch.postcode].filter(Boolean).join(', ');
    }
  }

  if (resolved) {
    geoLabelCache.set(cacheKey, resolved);
    try {
      sessionStorage.setItem(`hfa_geo_${cacheKey}`, resolved);
    } catch {
      // ignore storage error
    }
    return resolved;
  }

  return `${numLat.toFixed(5)}, ${numLng.toFixed(5)}`;
}

export function isCoordOnlyLabel(label) {
  const s = String(label || '').trim();
  if (!s) return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(s);
}

export function getCoordCacheKey(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return '';
  return `${nLat.toFixed(4)},${nLng.toFixed(4)}`;
}

/**
 * Resolves real street/area/postcode addresses for any visible session coordinates
 * that only have raw lat/lng saved (strictly from the actual GPS coordinates, never store data).
 */
export async function resolveMissingRealLocations(sessions = [], limit = 6) {
  const toResolve = new Map();
  sessions.slice(0, limit).forEach(sess => {
    if (Number.isFinite(sess.startLat) && Number.isFinite(sess.startLng) && isCoordOnlyLabel(sess.startLocationLabel)) {
      const k = getCoordCacheKey(sess.startLat, sess.startLng);
      if (k && !toResolve.has(k)) toResolve.set(k, { lat: sess.startLat, lng: sess.startLng });
    }
    if (Number.isFinite(sess.endLat) && Number.isFinite(sess.endLng) && isCoordOnlyLabel(sess.endLocationLabel)) {
      const k = getCoordCacheKey(sess.endLat, sess.endLng);
      if (k && !toResolve.has(k)) toResolve.set(k, { lat: sess.endLat, lng: sess.endLng });
    }
  });

  const resolvedMap = {};
  for (const [key, coords] of toResolve.entries()) {
    const label = await reverseGeocodeClient(coords.lat, coords.lng);
    if (label && !isCoordOnlyLabel(label)) {
      resolvedMap[key] = label;
    }
  }
  return resolvedMap;
}

/**
 * Pairs raw DeviceLog entries (including legacy User-SinIn / User-SinOut and live kfcaudit logs)
 * and enriches missing Start/End time or location from matching Audit records without ever
 * overwriting recorded GPS coordinates.
 */
export function buildAuditorActivitySessions(gpsLogs = [], audits = []) {
  const auditByAppId = new Map();
  const auditByTriple = new Map();
  audits.forEach(a => {
    if (a.appId) auditByAppId.set(String(a.appId).trim(), a);
    const key = [
      String(a.auditor || '').trim().toLowerCase(),
      String(a.storeName || '').trim().toLowerCase(),
      normalizeDateKey(a.auditDate),
    ].join('|');
    if (!auditByTriple.has(key)) auditByTriple.set(key, a);
  });

  const sessionMap = new Map();
  const orderedKeys = [];

  gpsLogs.forEach((log, idx) => {
    const auditor = String(log.auditor || 'Auditor').trim();
    const storeName = String(log.storeName || 'KFC Store').trim();
    const date = String(log.date || '').trim();
    const auditAppId = String(log.auditAppId || '').trim();
    const groupKey = auditAppId
      ? `app:${auditAppId}`
      : `trip:${auditor.toLowerCase()}|${storeName.toLowerCase()}|${normalizeDateKey(date)}`;

    if (!sessionMap.has(groupKey)) {
      orderedKeys.push(groupKey);
      sessionMap.set(groupKey, {
        id: String(log.id || log._id || `sess-${idx}`),
        auditAppId,
        auditor,
        storeName,
        branchCode: String(log.branchCode || '').trim(),
        date,
        session: log.session || '',
        activity: log.activity || 'Audit Activity',
        device: log.device || '',
        ipAddress: log.ipAddress || '',
        startTime: '',
        startLat: null,
        startLng: null,
        startAccuracy: null,
        startLocation: '',
        startGpsSource: '',
        endTime: '',
        endLat: null,
        endLng: null,
        endAccuracy: null,
        endLocation: '',
        endGpsSource: '',
      });
    }

    const s = sessionMap.get(groupKey);
    if (!s.branchCode && log.branchCode) s.branchCode = String(log.branchCode).trim();
    if (!s.session && log.session) s.session = log.session;
    if (!s.device && log.device) s.device = log.device;
    if (!s.ipAddress && log.ipAddress) s.ipAddress = log.ipAddress;

    const isStoreFallback = String(log.gpsSource || '').trim() === 'store_fallback';
    const primaryLat = isStoreFallback ? null : toCoord(log.lat);
    const primaryLng = isStoreFallback ? null : toCoord(log.lng);
    const primaryAcc = Number.isFinite(Number(log.accuracy)) && log.accuracy !== null ? Math.round(Number(log.accuracy)) : null;
    const primaryLoc = isStoreFallback ? '' : cleanLocationLabel(log.location);
    const primarySrc = isStoreFallback ? '' : String(log.gpsSource || '').trim();

    // Explicit start fields on unified backend log (ignore any store_fallback coords)
    if (cleanTime(log.startTime) && !s.startTime) s.startTime = cleanTime(log.startTime);
    if (log.startGpsSource !== 'store_fallback' && toCoord(log.startLat) !== null && s.startLat === null) {
      s.startLat = toCoord(log.startLat);
      s.startLng = toCoord(log.startLng);
      s.startAccuracy = log.startAccuracy !== null && log.startAccuracy !== undefined ? Math.round(Number(log.startAccuracy)) : primaryAcc;
      s.startLocation = cleanLocationLabel(log.startLocation) || primaryLoc;
      s.startGpsSource = String(log.startGpsSource || primarySrc || 'gps');
    }

    // Explicit end fields on unified backend log (ignore any store_fallback coords)
    if (cleanTime(log.endTime) && !s.endTime) s.endTime = cleanTime(log.endTime);
    if (log.endGpsSource !== 'store_fallback' && toCoord(log.endLat) !== null && s.endLat === null) {
      s.endLat = toCoord(log.endLat);
      s.endLng = toCoord(log.endLng);
      s.endAccuracy = log.endAccuracy !== null && log.endAccuracy !== undefined ? Math.round(Number(log.endAccuracy)) : primaryAcc;
      s.endLocation = cleanLocationLabel(log.endLocation) || primaryLoc;
      s.endGpsSource = String(log.endGpsSource || primarySrc || 'gps');
    }

    // Pair separate start vs end events (legacy User-SinIn/User-SinOut or separate POSTs)
    if (isStartEvent(log)) {
      if (!s.startTime && cleanTime(log.time)) s.startTime = cleanTime(log.time);
      if (s.startLat === null && primaryLat !== null && primaryLng !== null) {
        s.startLat = primaryLat;
        s.startLng = primaryLng;
        s.startAccuracy = primaryAcc;
        s.startLocation = cleanLocationLabel(log.startLocation) || primaryLoc;
        s.startGpsSource = primarySrc || 'recorded';
      }
    } else if (isEndEvent(log)) {
      if (!s.endTime && cleanTime(log.time)) s.endTime = cleanTime(log.time);
      if (s.endLat === null && primaryLat !== null && primaryLng !== null) {
        s.endLat = primaryLat;
        s.endLng = primaryLng;
        s.endAccuracy = primaryAcc;
        s.endLocation = cleanLocationLabel(log.endLocation) || primaryLoc;
        s.endGpsSource = primarySrc || 'recorded';
      }
      if (log.activity && !String(log.activity).toLowerCase().includes('sinout')) {
        s.activity = log.activity;
      }
    } else if (s.startLat === null && primaryLat !== null && primaryLng !== null) {
      // Milestone fallback if no explicit start log existed
      if (!s.startTime && cleanTime(log.time)) s.startTime = cleanTime(log.time);
      s.startLat = primaryLat;
      s.startLng = primaryLng;
      s.startAccuracy = primaryAcc;
      s.startLocation = primaryLoc;
      s.startGpsSource = primarySrc || 'recorded';
    }
  });

  // Also include recent audits that captured real startLocation/endLocation even if not in gpsLogs yet
  audits.slice(0, 60).forEach((a, idx) => {
    const hasStartLoc = toCoord(a.startLocation?.lat) !== null && toCoord(a.startLocation?.lng) !== null;
    const hasEndLoc = toCoord(a.endLocation?.lat) !== null && toCoord(a.endLocation?.lng) !== null;
    if (!hasStartLoc && !hasEndLoc) return;

    const groupKey = a.appId
      ? `app:${String(a.appId).trim()}`
      : `trip:${String(a.auditor || '').trim().toLowerCase()}|${String(a.storeName || '').trim().toLowerCase()}|${normalizeDateKey(a.auditDate)}`;

    if (!sessionMap.has(groupKey)) {
      orderedKeys.unshift(groupKey);
      sessionMap.set(groupKey, {
        id: `aud-sess-${a.id || idx}`,
        auditAppId: String(a.appId || ''),
        auditor: a.auditor || 'Auditor',
        storeName: a.storeName || 'KFC Store',
        branchCode: String(a.branchCode || ''),
        date: a.auditDate || '',
        session: a.session || '',
        activity: a.finalized ? (a.auditorRecommendation || a.category || 'Audit Completed') : 'Audit In Progress',
        device: 'Auditor Portal',
        ipAddress: '',
        startTime: cleanTime(a.timeIn),
        startLat: toCoord(a.startLocation?.lat),
        startLng: toCoord(a.startLocation?.lng),
        startAccuracy: a.startLocation?.accuracy ?? null,
        startLocation: cleanLocationLabel(a.startLocation?.address),
        startGpsSource: a.startLocation?.source || (hasStartLoc ? 'gps' : ''),
        endTime: cleanTime(a.timeOut),
        endLat: toCoord(a.endLocation?.lat),
        endLng: toCoord(a.endLocation?.lng),
        endAccuracy: a.endLocation?.accuracy ?? null,
        endLocation: cleanLocationLabel(a.endLocation?.address),
        endGpsSource: a.endLocation?.source || (hasEndLoc ? 'gps' : ''),
      });
    }
  });

  return orderedKeys.map(key => {
    const s = sessionMap.get(key);
    const matchedAudit =
      (s.auditAppId && auditByAppId.get(s.auditAppId)) ||
      auditByTriple.get(
        `${s.auditor.toLowerCase()}|${s.storeName.toLowerCase()}|${normalizeDateKey(s.date)}`
      ) ||
      null;

    if (matchedAudit) {
      if (!s.branchCode && matchedAudit.branchCode) s.branchCode = String(matchedAudit.branchCode);
      if (!s.startTime && cleanTime(matchedAudit.timeIn)) s.startTime = cleanTime(matchedAudit.timeIn);
      if (!s.endTime && cleanTime(matchedAudit.timeOut)) s.endTime = cleanTime(matchedAudit.timeOut);
      if (s.startLat === null && toCoord(matchedAudit.startLocation?.lat) !== null) {
        s.startLat = toCoord(matchedAudit.startLocation.lat);
        s.startLng = toCoord(matchedAudit.startLocation.lng);
        s.startAccuracy = matchedAudit.startLocation.accuracy ?? null;
        s.startLocation = cleanLocationLabel(matchedAudit.startLocation.address);
        s.startGpsSource = matchedAudit.startLocation.source || 'gps';
      }
      if (s.endLat === null && toCoord(matchedAudit.endLocation?.lat) !== null) {
        s.endLat = toCoord(matchedAudit.endLocation.lat);
        s.endLng = toCoord(matchedAudit.endLocation.lng);
        s.endAccuracy = matchedAudit.endLocation.accuracy ?? null;
        s.endLocation = cleanLocationLabel(matchedAudit.endLocation.address);
        s.endGpsSource = matchedAudit.endLocation.source || 'gps';
      }
    }

    // Strictly show the auditor's real captured GPS location — never substitute the KFC store's address
    const startLocationLabel =
      s.startLocation ||
      (s.startLat !== null && s.startLng !== null
        ? `${s.startLat.toFixed(5)}, ${s.startLng.toFixed(5)}`
        : 'Real GPS location not captured');

    const endLocationLabel =
      s.endLocation ||
      (s.endLat !== null && s.endLng !== null
        ? `${s.endLat.toFixed(5)}, ${s.endLng.toFixed(5)}`
        : (s.endTime ? 'Real GPS location not captured' : 'Awaiting completion'));

    const distanceMeters = haversineMeters(s.startLat, s.startLng, s.endLat, s.endLng);
    const durationLabel = formatDuration(s.startTime, s.endTime);

    return {
      ...s,
      startLocationLabel,
      endLocationLabel,
      startSourceTag: s.startLat !== null ? formatGpsSourceTag(s.startGpsSource, s.startAccuracy) : 'No GPS',
      endSourceTag: s.endLat !== null ? formatGpsSourceTag(s.endGpsSource, s.endAccuracy) : (s.endTime ? 'No GPS' : ''),
      durationLabel,
      distanceMeters,
      distanceLabel: distanceMeters !== null ? formatDistance(distanceMeters) : '',
    };
  });
}
