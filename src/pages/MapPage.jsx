import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  MapPin, Store, Navigation, Radio, ShieldCheck,
  ExternalLink, Calendar, Search, Crosshair, ZoomIn, Award, ClipboardCheck, Layers
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import NewAuditModal from '../components/NewAuditModal';

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
  const { stores, gpsLogs, currentUser } = useKfc();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [tileMode, setTileMode] = useState('osm');
  const [activeStore, setActiveStore] = useState(null);
  const [showAuditorLogs, setShowAuditorLogs] = useState(true);
  const [liveCheckIns, setLiveCheckIns] = useState([]);
  const [auditStoreId, setAuditStoreId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const storeMarkersRef = useRef([]);
  const auditorMarkersRef = useRef([]);

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

  // Sync Auditor GPS Pings
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    auditorMarkersRef.current.forEach(m => m.remove());
    auditorMarkersRef.current = [];

    if (!showAuditorLogs) return;

    const allPings = [...liveCheckIns, ...gpsLogs.slice(0, 20)];

    allPings.forEach(log => {
      if (!log.lat || !log.lng) return;

      const auditorIconHtml = `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.55);
          cursor: pointer;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: auditorIconHtml,
        className: 'auditor-gps-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([log.lat, log.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: var(--font-sans); min-width: 180px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">
            LIVE AUDITOR GPS PING
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${log.auditor}
          </div>
          <div style="font-size: 11px; color: #475569; margin: 4px 0;">
            Site: ${log.storeName}
          </div>
          <div style="font-size: 10px; color: #64748b;">
            ${log.activity} • ${log.date} ${log.time}
          </div>
        </div>
      `);

      auditorMarkersRef.current.push(marker);
    });
  }, [gpsLogs, liveCheckIns, showAuditorLogs]);

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
    toast.loading('Acquiring device GPS signal...', { id: 'gps-toast' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ping = {
          id: `live-${Date.now()}`,
          auditor: currentUser?.fullName || 'Taoheed HFA',
          storeName: activeStore ? `${activeStore.name} (Field Check-In)` : 'Live Device Location',
          activity: 'On-Site GPS Check-In',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lat: latitude,
          lng: longitude
        };
        setLiveCheckIns(prev => [ping, ...prev]);
        setShowAuditorLogs(true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.1 });
        }
        toast.success(`Live GPS Check-In logged (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, { id: 'gps-toast' });
      },
      () => {
        const target = activeStore || stores[0];
        if (target) {
          const ping = {
            id: `live-${Date.now()}`,
            auditor: currentUser?.fullName || 'Taoheed HFA',
            storeName: target.name,
            activity: 'Verified Branch GPS Check-In',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lat: target.lat + 0.0005,
            lng: target.lng - 0.0005
          };
          setLiveCheckIns(prev => [ping, ...prev]);
          setShowAuditorLogs(true);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([target.lat, target.lng], 15, { duration: 1.0 });
          }
          toast.success(`Checked in at ${target.name} (${target.postcode})`, { id: 'gps-toast' });
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">UK Geographic Coverage &amp; GPS Telemetry</h1>
          <div className="dash-subtitle">
            <span>{filteredStores.length} of {stores.length} stores mapped via UK ONS Postcode coordinates</span>
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
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                <span>Auditor GPS Check-Ins</span>
              </div>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>UK ONS Postcode Geocoding</span>
          </div>
        </div>

        {/* Right: Active Store Profile & Quick Branch Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeStore && (
            <div className="dash-card" style={{ gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Store Telemetry Profile
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

          {/* Matching Branches List */}
          <div className="page-surface" style={{ display: 'flex', flexDirection: 'column', maxHeight: '300px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
              Matching UK Branches ({filteredStores.length})
            </div>
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
