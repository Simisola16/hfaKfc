import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  MapPin, Store, Navigation, Radio, ShieldCheck,
  ExternalLink, Calendar, Search, Crosshair, ZoomIn, Award, ClipboardCheck, Layers,
  Play, Flag, Activity
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import NewAuditModal from '../components/NewAuditModal';
import {
  buildAuditorActivitySessions,
  getCoordCacheKey,
  isCoordOnlyLabel,
  resolveMissingRealLocations,
  reverseGeocodeClient,
} from '../lib/auditorActivity';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILE_PROVIDERS = {
  osm: {
    label: 'Street Map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors • HFA Portal'
  },
  esriStreet: {
    label: 'Detailed Roads',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri • HFA Portal'
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery • HFA Portal'
  }
};

export default function MapPage() {
  const navigate = useNavigate();
  const { stores, audits, gpsLogs, currentUser, addGpsLog } = useKfc();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [tileMode, setTileMode] = useState('osm');
  const [activeStore, setActiveStore] = useState(null);
  const [showAuditorLogs, setShowAuditorLogs] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('activity');
  const [auditStoreId, setAuditStoreId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const storeMarkersRef = useRef([]);
  const auditorMarkersRef = useRef([]);
  const auditorMarkersByKeyRef = useRef(new Map());

  const rawActivitySessions = useMemo(
    () => buildAuditorActivitySessions(gpsLogs, audits),
    [gpsLogs, audits]
  );

  const [resolvedGeoLabels, setResolvedGeoLabels] = useState({});

  useEffect(() => {
    let cancelled = false;
    resolveMissingRealLocations(rawActivitySessions, 12).then(found => {
      if (!cancelled && Object.keys(found).length > 0) {
        setResolvedGeoLabels(prev => ({ ...prev, ...found }));
      }
    });
    return () => { cancelled = true; };
  }, [rawActivitySessions]);

  const activitySessions = useMemo(
    () =>
      rawActivitySessions.map(sess => {
        const startKey = getCoordCacheKey(sess.startLat, sess.startLng);
        const endKey = getCoordCacheKey(sess.endLat, sess.endLng);
        return {
          ...sess,
          startLocationLabel:
            isCoordOnlyLabel(sess.startLocationLabel) && resolvedGeoLabels[startKey]
              ? resolvedGeoLabels[startKey]
              : sess.startLocationLabel,
          endLocationLabel:
            isCoordOnlyLabel(sess.endLocationLabel) && resolvedGeoLabels[endKey]
              ? resolvedGeoLabels[endKey]
              : sess.endLocationLabel,
        };
      }),
    [rawActivitySessions, resolvedGeoLabels]
  );

  const cities = ['London', 'Birmingham', 'Manchester', 'Bolton', 'Leeds', 'Bristol', 'Glasgow', 'Sheffield', 'Cardiff', 'Liverpool', 'Newcastle'];

  const filteredStores = stores.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.branchCode?.toLowerCase().includes(q) ||
      s.postcode?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.franchisee?.toLowerCase().includes(q);

    const matchesCity = selectedCity === 'ALL' ||
      s.name?.toLowerCase().includes(selectedCity.toLowerCase()) ||
      s.address?.toLowerCase().includes(selectedCity.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

    return matchesSearch && matchesCity && matchesStatus;
  });

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [53.5, -2.2],
        zoom: 6,
        zoomControl: false,
        attributionControl: true
      });

      const cfg = TILE_PROVIDERS.osm;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Safely swap tile layer when tileMode changes without rebuilding map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = TILE_PROVIDERS[tileMode] || TILE_PROVIDERS.osm;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19
    }).addTo(map);
  }, [tileMode]);

  // Sync Store Markers onto Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    storeMarkersRef.current.forEach(m => m.remove());
    storeMarkersRef.current = [];

    filteredStores.forEach(st => {
      if (!st.lat || !st.lng) return;

      const isCertified = st.status === 'Passed' || st.halalCertified;
      const markerColor = isCertified ? '#059669' : '#e4002b';
      const isSelected = activeStore && String(activeStore.id) === String(st.id);

      const iconHtml = `
        <div style="
          position: relative;
          width: ${isSelected ? '36px' : '28px'};
          height: ${isSelected ? '36px' : '28px'};
          border-radius: 50%;
          background: ${markerColor};
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          border: 2px solid #ffffff;
          box-shadow: ${isSelected ? '0 0 0 4px rgba(5, 150, 105, 0.35), 0 8px 16px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.25)'};
          transition: transform 0.2s ease;
          cursor: pointer;
        ">
          <svg width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-kfc-marker',
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: var(--font-sans); min-width: 210px; padding: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: ${isCertified ? '#059669' : '#e4002b'}; text-transform: uppercase; margin-bottom: 2px;">
            ${st.branchCode} • ${isCertified ? 'HALAL CERTIFIED' : 'INSPECTION DUE'}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ${st.name}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
            ${st.address}, ${st.postcode}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            Franchisee: <strong>${st.franchisee}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px;">
            <span>Last Audit: <strong>${st.lastAuditDate || 'N/A'}</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setActiveStore(st));

      storeMarkersRef.current.push(marker);
    });

    if (!activeStore && filteredStores.length > 0) {
      setActiveStore(filteredStores[0]);
    }
  }, [filteredStores, activeStore]);

  // Sync Auditor Start & End GPS Pins onto Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    auditorMarkersRef.current.forEach(m => m.remove());
    auditorMarkersRef.current = [];
    auditorMarkersByKeyRef.current = new Map();

    if (!showAuditorLogs) return;

    const escapeHtml = (val) =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const makeBadgeIcon = (letter, bg) =>
      L.divIcon({
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${bg};color:#ffffff;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 2px 10px rgba(15,23,42,0.38);font-size:10.5px;font-weight:800;font-family:var(--font-sans);cursor:pointer;">${letter}</div>`,
        className: 'auditor-gps-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });

    activitySessions.slice(0, 30).forEach(sess => {
      const hasStart = Number.isFinite(sess.startLat) && Number.isFinite(sess.startLng);
      const hasEnd = Number.isFinite(sess.endLat) && Number.isFinite(sess.endLng);
      if (!hasStart && !hasEnd) return;

      const samePoint =
        hasStart &&
        hasEnd &&
        Math.abs(sess.startLat - sess.endLat) < 0.00005 &&
        Math.abs(sess.startLng - sess.endLng) < 0.00005;

      if (samePoint) {
        const marker = L.marker([sess.startLat, sess.startLng], {
          icon: makeBadgeIcon('S/E', '#0f766e'),
        }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: var(--font-sans); min-width: 220px; padding: 2px;">
            <div style="font-size: 10px; font-weight: 800; color: #0f766e; text-transform: uppercase;">
              START &amp; END GPS LOCATION
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(sess.auditor)} • ${escapeHtml(sess.storeName)}
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 5px;">
              Start: ${escapeHtml(sess.startTime || '—')} (${escapeHtml(sess.startSourceTag)})
            </div>
            <div style="font-size: 11px; color: #2563eb; font-weight: 600; margin-top: 2px;">
              End: ${escapeHtml(sess.endTime || 'In Progress')} (${escapeHtml(sess.endSourceTag || 'Recorded')})
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 5px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              ${escapeHtml(sess.startLocationLabel)}<br/>
              <span style="font-family: monospace; font-size: 10.5px;">${sess.startLat.toFixed(5)}, ${sess.startLng.toFixed(5)}</span>
            </div>
          </div>
        `);
        auditorMarkersRef.current.push(marker);
        auditorMarkersByKeyRef.current.set(`${sess.id}:start`, marker);
        auditorMarkersByKeyRef.current.set(`${sess.id}:end`, marker);
        return;
      }

      if (hasStart) {
        const startMarker = L.marker([sess.startLat, sess.startLng], {
          icon: makeBadgeIcon('S', '#059669'),
        }).addTo(map);
        startMarker.bindPopup(`
          <div style="font-family: var(--font-sans); min-width: 210px; padding: 2px;">
            <div style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">
              AUDIT START GPS • ${escapeHtml(sess.startSourceTag)}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(sess.auditor)} • ${escapeHtml(sess.storeName)}
            </div>
            <div style="font-size: 11.5px; color: #059669; font-weight: 700; margin-top: 4px;">
              Start Time: ${escapeHtml(sess.startTime || '—')} (${escapeHtml(sess.date)})
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              ${escapeHtml(sess.startLocationLabel)}
            </div>
            <div style="font-family: monospace; font-size: 10.5px; color: #64748b; margin-top: 3px;">
              ${sess.startLat.toFixed(5)}, ${sess.startLng.toFixed(5)}
            </div>
          </div>
        `);
        auditorMarkersRef.current.push(startMarker);
        auditorMarkersByKeyRef.current.set(`${sess.id}:start`, startMarker);
      }

      if (hasEnd) {
        const endMarker = L.marker([sess.endLat, sess.endLng], {
          icon: makeBadgeIcon('E', '#2563eb'),
        }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-family: var(--font-sans); min-width: 210px; padding: 2px;">
            <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">
              AUDIT END GPS • ${escapeHtml(sess.endSourceTag || 'Recorded')}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(sess.auditor)} • ${escapeHtml(sess.storeName)}
            </div>
            <div style="font-size: 11.5px; color: #2563eb; font-weight: 700; margin-top: 4px;">
              End Time: ${escapeHtml(sess.endTime || '—')} (${escapeHtml(sess.date)})
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              ${escapeHtml(sess.endLocationLabel)}
            </div>
            <div style="font-family: monospace; font-size: 10.5px; color: #64748b; margin-top: 3px;">
              ${sess.endLat.toFixed(5)}, ${sess.endLng.toFixed(5)}
              ${sess.distanceLabel ? ` • ${escapeHtml(sess.distanceLabel)} from start` : ''}
            </div>
          </div>
        `);
        auditorMarkersRef.current.push(endMarker);
        auditorMarkersByKeyRef.current.set(`${sess.id}:end`, endMarker);
      }

      if (hasStart && hasEnd) {
        const line = L.polyline(
          [[sess.startLat, sess.startLng], [sess.endLat, sess.endLng]],
          { color: '#2563eb', weight: 2.5, dashArray: '6, 6', opacity: 0.75 }
        ).addTo(map);
        auditorMarkersRef.current.push(line);
      }
    });
  }, [activitySessions, showAuditorLogs]);

  const handleFocusActivityPin = (lat, lng, markerKey) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setShowAuditorLogs(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.9 });
      setTimeout(() => {
        const marker = auditorMarkersByKeyRef.current.get(markerKey);
        if (marker) marker.openPopup();
      }, 450);
    }
  };

  const handleSelectStore = (st) => {
    setActiveStore(st);
    if (mapInstanceRef.current && st.lat && st.lng) {
      mapInstanceRef.current.flyTo([st.lat, st.lng], 15, { duration: 1.0 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([53.5, -2.2], 6, { duration: 0.9 });
    }
  };

  const handleDeviceGpsCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    toast.loading('Acquiring high-accuracy GPS signal...', { id: 'gps-toast' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null;
        const addressLabel = await reverseGeocodeClient(latitude, longitude);
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const dateStr = now.toISOString().split('T')[0];

        await addGpsLog({
          auditor: currentUser?.fullName || currentUser?.username || 'HFA Admin',
          storeName: activeStore ? activeStore.name : 'Live Field Check-In',
          branchCode: activeStore?.branchCode || '',
          activity: 'Live GPS Check-In',
          eventType: 'start',
          date: dateStr,
          time: timeStr,
          startTime: timeStr,
          startDate: dateStr,
          lat: latitude,
          lng: longitude,
          startLat: latitude,
          startLng: longitude,
          accuracy,
          startAccuracy: accuracy,
          gpsSource: 'gps',
          startGpsSource: 'gps',
          location: addressLabel,
          startLocation: addressLabel,
        });

        setShowAuditorLogs(true);
        setSidebarTab('activity');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.1 });
        }
        toast.success(
          `GPS Check-In logged (${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracy ? `, ±${accuracy}m` : ''})`,
          { id: 'gps-toast' }
        );
      },
      (err) => {
        toast.error(
          err?.code === 1
            ? 'Location permission denied. Enable browser location access for accurate GPS check-in.'
            : 'Could not obtain a live GPS lock. Please check your device location settings.',
          { id: 'gps-toast' }
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Map</h1>
          <div className="dash-subtitle">
            <span>{filteredStores.length} of {stores.length} stores mapped</span>
          </div>
        </div>

        <div className="dash-controls">
          <button
            type="button"
            onClick={handleDeviceGpsCheckIn}
            className="btn btn-primary btn-sm"
            style={{ height: 36 }}
          >
            <Navigation size={14} />
            <span>Check In My GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditorLogs(!showAuditorLogs)}
            className={`btn btn-sm ${showAuditorLogs ? 'btn-outline' : 'btn-ghost'}`}
            style={{ height: 36, borderColor: showAuditorLogs ? '#bfdbfe' : undefined, background: showAuditorLogs ? '#eff6ff' : undefined, color: showAuditorLogs ? '#1d4ed8' : undefined }}
          >
            <Radio size={14} />
            <span>Auditor Pings ({showAuditorLogs ? 'ON' : 'OFF'})</span>
          </button>

          <button type="button" onClick={handleResetView} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Crosshair size={14} />
            <span>UK Overview</span>
          </button>
        </div>
      </div>

      {/* Filter & Map Layer Toolbar */}
      <div className="dash-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: '1 1 240px', minWidth: 0 }}>
            <div className="search-input-wrapper" style={{ flex: '1 1 220px', maxWidth: 320 }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search store, postcode, franchisee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              className="filter-select"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="ALL">All UK Cities &amp; Regions</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Halal Statuses</option>
              <option value="Passed">Certified Halal (Pass)</option>
              <option value="Due for Audit">Due for Audit</option>
              <option value="Under Review">Under Review</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} color="#64748b" />
            <div className="segmented-tabs">
              {Object.entries(TILE_PROVIDERS).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTileMode(key)}
                  className={`segmented-tab ${tileMode === key ? 'active' : ''}`}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Store Inspector */}
      <div className="map-layout-grid" style={{ marginBottom: 0 }}>
        {/* Left: Leaflet Interactive Map */}
        <div className="page-surface" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
          <div
            ref={mapContainerRef}
            className="map-page-canvas"
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '10px',
            padding: '4px 6px 0',
            fontSize: '12px',
            color: '#475569'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                <span>Certified Halal ({stores.filter(s => s.status === 'Passed' || s.halalCertified).length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e4002b', display: 'inline-block' }} />
                <span>Inspection Due / NC ({stores.filter(s => s.status !== 'Passed' && !s.halalCertified).length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', border: '1.5px solid #047857', display: 'inline-block' }} />
                <span>Start GPS (S)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                <span>End GPS (E)</span>
              </div>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Live Device GPS &amp; UK ONS Geocoding</span>
          </div>
        </div>

        {/* Right: Active Store Profile & Quick Branch Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeStore && (
            <div className="dash-card" style={{ gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Store Details
                  </div>
                  <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                    {activeStore.name}
                  </h3>
                  <div style={{ marginTop: 4 }}>
                    <span className="code-chip">{activeStore.branchCode}</span>
                  </div>
                </div>

                {activeStore.status === 'Passed' || activeStore.halalCertified ? (
                  <span className="badge badge-pass"><span className="badge-dot" /> Certified</span>
                ) : (
                  <span className="badge badge-fail"><span className="badge-dot" /> Due for Audit</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={15} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{activeStore.address}</div>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>{activeStore.postcode}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={15} color="#64748b" style={{ flexShrink: 0 }} />
                  <span>Franchise Partner: <strong style={{ color: '#0f172a' }}>{activeStore.franchisee}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#64748b" style={{ flexShrink: 0 }} />
                  <span>Last On-Site Audit: <strong className="tabular-nums">{activeStore.lastAuditDate || 'N/A'}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={15} color="#059669" style={{ flexShrink: 0 }} />
                  <span>Cert: <code className="code-chip" style={{ padding: '1px 6px' }}>{activeStore.certificateNumber || `HFA-KFC-${activeStore.branchCode}-2026`}</code></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crosshair size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span className="tabular-nums" style={{ color: '#475569' }}>
                    GPS: <strong>{activeStore.lat?.toFixed(5)}, {activeStore.lng?.toFixed(5)}</strong>
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSelectStore(activeStore)}
                  className="btn btn-primary btn-sm"
                >
                  <ZoomIn size={13} />
                  <span>Zoom Branch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuditStoreId(activeStore.id)}
                  className="btn btn-outline btn-sm"
                >
                  <ClipboardCheck size={13} color="#e4002b" />
                  <span>Audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/certificates?storeId=${encodeURIComponent(activeStore.id)}`)}
                  className="btn btn-outline btn-sm"
                >
                  <Award size={13} color="#059669" />
                  <span>Certificate</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`KFC ${activeStore.name} ${activeStore.postcode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  <ExternalLink size={13} />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
          )}

          {/* Tabbed Auditor Activity (Start/End GPS) & Matching Branches Panel */}
          <div className="page-surface" style={{ display: 'flex', flexDirection: 'column', maxHeight: '420px' }}>
            <div style={{
              padding: '10px 12px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <div className="segmented-tabs" style={{ width: '100%', padding: 3 }}>
                <button
                  type="button"
                  onClick={() => setSidebarTab('activity')}
                  className={`segmented-tab ${sidebarTab === 'activity' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', padding: '5px 8px', fontSize: '11.5px' }}
                >
                  <Activity size={12} />
                  <span>Auditor Activity ({activitySessions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('branches')}
                  className={`segmented-tab ${sidebarTab === 'branches' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', padding: '5px 8px', fontSize: '11.5px' }}
                >
                  <Store size={12} />
                  <span>Branches ({filteredStores.length})</span>
                </button>
              </div>
            </div>

            {sidebarTab === 'activity' ? (
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activitySessions.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                    No auditor GPS activity recorded yet.
                  </div>
                ) : (
                  activitySessions.slice(0, 25).map((sess, idx) => (
                    <div
                      key={`map-sess-${sess.id}-${idx}`}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>
                          {sess.auditor}
                        </span>
                        <span className="tabular-nums" style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {sess.date}{sess.durationLabel ? ` • ${sess.durationLabel}` : ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sess.branchCode ? `${sess.branchCode} • ` : ''}{sess.storeName}
                      </div>

                      {/* Start Time + Start Location */}
                      <div style={{
                        padding: '6px 8px',
                        borderRadius: 7,
                        background: '#f0fdf4',
                        border: '1px solid #dcfce7',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: '#047857', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Play size={10} fill="#059669" color="#059669" />
                            <span>Start:</span>
                            <span className="tabular-nums" style={{ color: '#0f172a' }}>{sess.startTime || 'Not recorded'}</span>
                          </span>
                          {Number.isFinite(sess.startLat) && Number.isFinite(sess.startLng) && (
                            <button
                              type="button"
                              onClick={() => handleFocusActivityPin(sess.startLat, sess.startLng, `${sess.id}:start`)}
                              className="dashv2-coord-btn"
                              title={`Zoom to Start GPS (${sess.startSourceTag})`}
                            >
                              <MapPin size={10} />
                              <span>{sess.startLat.toFixed(4)}, {sess.startLng.toFixed(4)}</span>
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: '#334155' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sess.startLocationLabel}</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: sess.startGpsSource === 'gps' ? '#047857' : '#64748b', flexShrink: 0 }}>
                            {sess.startSourceTag}
                          </span>
                        </div>
                      </div>

                      {/* End Time + End Location */}
                      <div style={{
                        padding: '6px 8px',
                        borderRadius: 7,
                        background: sess.endTime ? '#eff6ff' : '#f8fafc',
                        border: sess.endTime ? '1px solid #dbeafe' : '1px dashed #cbd5e1',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: sess.endTime ? '#1d4ed8' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Flag size={10} color={sess.endTime ? '#2563eb' : '#94a3b8'} />
                            <span>End:</span>
                            <span className="tabular-nums" style={{ color: sess.endTime ? '#0f172a' : '#64748b' }}>
                              {sess.endTime || 'In Progress'}
                            </span>
                          </span>
                          {Number.isFinite(sess.endLat) && Number.isFinite(sess.endLng) && (
                            <button
                              type="button"
                              onClick={() => handleFocusActivityPin(sess.endLat, sess.endLng, `${sess.id}:end`)}
                              className="dashv2-coord-btn"
                              style={{ borderColor: '#bfdbfe', color: '#1d4ed8' }}
                              title={`Zoom to End GPS (${sess.endSourceTag})`}
                            >
                              <MapPin size={10} />
                              <span>{sess.endLat.toFixed(4)}, {sess.endLng.toFixed(4)}</span>
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: '#334155' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sess.endLocationLabel}</span>
                          {sess.endSourceTag && (
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: sess.endGpsSource === 'gps' ? '#1d4ed8' : '#64748b', flexShrink: 0 }}>
                              {sess.endSourceTag}
                            </span>
                          )}
                        </div>
                      </div>

                      {sess.distanceLabel && (
                        <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{sess.activity}</span>
                          <span className="tabular-nums" style={{ fontWeight: 600, color: sess.distanceMeters > 250 ? '#d97706' : '#059669' }}>
                            Start → End: {sess.distanceLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
                {filteredStores.slice(0, 40).map((st, idx) => {
                  const isAct = activeStore && String(activeStore.id) === String(st.id);
                  return (
                    <div
                      key={`map-st-${st.id}-${idx}`}
                      onClick={() => handleSelectStore(st)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        marginBottom: '2px',
                        cursor: 'pointer',
                        background: isAct ? '#ecfdf5' : 'transparent',
                        borderLeft: isAct ? '3px solid #059669' : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {st.branchCode} • {st.postcode} • {st.franchisee}
                        </div>
                      </div>
                      {st.status === 'Passed' || st.halalCertified ? (
                        <span className="badge badge-pass" style={{ fontSize: '10.5px', padding: '2px 7px' }}>Pass</span>
                      ) : (
                        <span className="badge badge-warn" style={{ fontSize: '10.5px', padding: '2px 7px' }}>Due</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {auditStoreId && (
        <NewAuditModal
          isOpen={Boolean(auditStoreId)}
          onClose={() => setAuditStoreId(null)}
          defaultStoreId={auditStoreId}
        />
      )}
    </div>
  );
}
