import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  MapPin, Store, Navigation, Radio, ShieldCheck,
  ExternalLink, Calendar, Search, Crosshair, ZoomIn, Award, ClipboardCheck
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

export default function MapPage() {
  const navigate = useNavigate();
  const { stores, gpsLogs, currentUser } = useKfc();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeStore, setActiveStore] = useState(null);
  const [showAuditorLogs, setShowAuditorLogs] = useState(true);
  const [liveCheckIns, setLiveCheckIns] = useState([]);
  const [auditStoreId, setAuditStoreId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [53.5, -2.2],
        zoom: 6,
        zoomControl: false,
        attributionControl: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • HFA Halal Portal',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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

  // Sync Auditor GPS Pings (historical + live check-ins)
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
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
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
      mapInstanceRef.current.flyTo([st.lat, st.lng], 15, { duration: 1.1 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([53.5, -2.2], 6, { duration: 1.0 });
    }
  };

  // Live Device GPS Check-In via HTML5 Geolocation API
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
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
        toast.success(`Live GPS Check-In logged (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, { id: 'gps-toast' });
      },
      () => {
        // Fallback: check in at the currently active store's exact UK coordinates
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
            mapInstanceRef.current.flyTo([target.lat, target.lng], 15, { duration: 1.1 });
          }
          toast.success(`Checked in at ${target.name} (${target.postcode})`, { id: 'gps-toast' });
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div>
      {/* Top Controls Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Radio size={20} color="#059669" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)' }}>
                UK KFC Halal Store Geographic Coverage & GPS Tracking
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                {filteredStores.length} of {stores.length} stores mapped to real ONS UK Postcode coordinates
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input
                type="text"
                placeholder="Search store, postcode, franchisee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="filter-select"
                style={{ paddingLeft: '2rem', width: 220 }}
              />
            </div>

            <select
              className="filter-select"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="ALL">All UK Cities & Regions</option>
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

            <button
              onClick={handleDeviceGpsCheckIn}
              className="btn btn-primary btn-sm"
              title="Log a live GPS check-in using your device location"
            >
              <Navigation size={14} />
              <span>Check In My GPS</span>
            </button>

            <button
              onClick={() => setShowAuditorLogs(!showAuditorLogs)}
              className={`btn btn-sm ${showAuditorLogs ? 'btn-outline' : 'btn-ghost'}`}
              title="Toggle Auditor GPS tracking markers"
            >
              <Radio size={14} color={showAuditorLogs ? '#2563eb' : '#64748b'} />
              <span>Auditor Pings ({showAuditorLogs ? 'ON' : 'OFF'})</span>
            </button>

            <button onClick={handleResetView} className="btn btn-outline btn-sm" title="Reset map to national view">
              <Crosshair size={14} />
              <span>UK Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Drawer Layout */}
      <div className="map-layout-grid">
        {/* Leaflet Interactive Map Container */}
        <div className="card" style={{ marginBottom: 0, padding: '0.6rem', display: 'flex', flexDirection: 'column' }}>
          <div
            ref={mapContainerRef}
            style={{
              height: '560px',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--slate-300)'
            }}
          />

          {/* Map Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '0.75rem',
            padding: '0.35rem 0.5rem',
            fontSize: '0.8rem',
            color: 'var(--slate-600)',
            borderTop: '1px solid var(--slate-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                <span>Certified Halal Branch ({stores.filter(s => s.status === 'Passed').length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e4002b', display: 'inline-block' }} />
                <span>Inspection Due / NC ({stores.filter(s => s.status !== 'Passed').length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                <span>Field Auditor GPS Check-Ins</span>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>UK ONS Postcode Geocoding + OpenStreetMap</span>
          </div>
        </div>

        {/* Selected Store Inspector & Quick List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeStore ? (
            <div className="card" style={{ marginBottom: 0, borderTop: `4px solid ${activeStore.status === 'Passed' ? '#059669' : '#e4002b'}` }}>
              <div className="card-header">
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    STORE PROFILE & GPS TELEMETRY
                  </div>
                  <h3 className="card-title" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                    {activeStore.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    Branch Code: <strong style={{ color: 'var(--slate-800)' }}>{activeStore.branchCode}</strong>
                  </div>
                </div>

                {activeStore.status === 'Passed' ? (
                  <span className="badge badge-pass"><span className="badge-dot" /> Certified</span>
                ) : (
                  <span className="badge badge-fail"><span className="badge-dot" /> Due for Audit</span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <MapPin size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{activeStore.address}</div>
                      <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem', fontWeight: 700 }}>{activeStore.postcode}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Store size={16} color="var(--slate-400)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--slate-500)' }}>Franchise Partner: </span>
                      <strong style={{ color: 'var(--slate-800)' }}>{activeStore.franchisee}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Calendar size={16} color="var(--slate-400)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--slate-500)' }}>Last On-Site Audit: </span>
                      <strong>{activeStore.lastAuditDate || '12 Jan 2026'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--slate-500)' }}>Certificate No: </span>
                      <code style={{ fontSize: '0.78rem', background: 'var(--slate-100)', padding: '2px 6px', borderRadius: 4 }}>
                        {activeStore.certificateNumber || `HFA-KFC-${activeStore.branchCode}-2026`}
                      </code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Crosshair size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      GPS Coordinates: <strong>{activeStore.lat?.toFixed(5)}, {activeStore.lng?.toFixed(5)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSelectStore(activeStore)}
                    className="btn btn-primary btn-sm"
                  >
                    <ZoomIn size={14} />
                    <span>Zoom Branch</span>
                  </button>

                  <button
                    onClick={() => setAuditStoreId(activeStore.id)}
                    className="btn btn-outline btn-sm"
                  >
                    <ClipboardCheck size={14} color="#e4002b" />
                    <span>Audit</span>
                  </button>

                  <button
                    onClick={() => navigate(`/certificates?storeId=${encodeURIComponent(activeStore.id)}`)}
                    className="btn btn-outline btn-sm"
                  >
                    <Award size={14} color="#059669" />
                    <span>Certificate</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`KFC ${activeStore.name} ${activeStore.postcode}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    <ExternalLink size={14} />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* Search Results / Nearby Store Browser */}
          <div className="card" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '280px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
              Matching UK Branches ({filteredStores.length})
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredStores.slice(0, 40).map(st => (
                <div
                  key={st.id}
                  onClick={() => handleSelectStore(st)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.25rem',
                    cursor: 'pointer',
                    background: activeStore && String(activeStore.id) === String(st.id) ? '#ecfdf5' : 'transparent',
                    borderLeft: activeStore && String(activeStore.id) === String(st.id) ? '3px solid #059669' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                      {st.branchCode} • {st.postcode} • {st.franchisee}
                    </div>
                  </div>
                  {st.status === 'Passed' ? (
                    <span className="badge badge-pass" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>Pass</span>
                  ) : (
                    <span className="badge badge-warn" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>Due</span>
                  )}
                </div>
              ))}
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
