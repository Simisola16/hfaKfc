import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useKfc } from '../context/KfcContext';
import AuditDetailModal from '../components/AuditDetailModal';
import {
  Store, Package, Clock, AlertTriangle, AlertOctagon, ArrowRight,
  ShieldCheck, MapPin, RefreshCw, Search, Filter, X, Plus, Eye,
  Download, Inbox, ShieldAlert, ChevronRight, Activity, Award,
  Navigation, Layers, CalendarCheck, Crosshair, Building2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const TILE_CONFIGS = {
  osm: {
    label: 'Street',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors • HFA Portal',
  },
  esri: {
    label: 'Roads',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri • HFA Portal',
  },
};

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const displayLabel = payload[0]?.payload?.fullName || label;
  return (
    <div className="dash-custom-tooltip">
      {displayLabel && (
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#ffffff' }}>
          {displayLabel}
        </div>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: '#cbd5e1' }}>{entry.name}:</span>
          <strong className="tabular-nums" style={{ color: '#ffffff', marginLeft: 'auto' }}>
            {entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const {
    dbConnected, stores, franchisees, audits, products,
    assignments = [], appeals, requests, gpsLogs, syncFromBackend
  } = useKfc();

  // Dashboard Filters & UI State
  const [analyticsTab, setAnalyticsTab] = useState('velocity'); // 'velocity' | 'franchise'
  const [queueTab, setQueueTab] = useState('all'); // 'all' | 'critical' | 'rfp' | 'appeals' | 'requests'
  const [opsTab, setOpsTab] = useState('pings'); // 'pings' | 'scheduled'
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');

  // Embedded Map State
  const [mapStatusFilter, setMapStatusFilter] = useState('ALL'); // 'ALL' | 'CERTIFIED' | 'DUE'
  const [showMapPings, setShowMapPings] = useState(true);
  const [mapLayer, setMapLayer] = useState('osm'); // 'osm' | 'esri'
  const [focusedStoreId, setFocusedStoreId] = useState(null);

  // Modals & Data Refresh
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [actionSearch, setActionSearch] = useState('');
  const [actionRoleFilter, setActionRoleFilter] = useState('all');

  // Leaflet Refs
  const mapPanelRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (syncFromBackend) await syncFromBackend();
    } finally {
      setLastUpdated(new Date());
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  const filteredAudits = audits;

  // Network & Compliance Metrics
  const totalStores = stores.length;
  const certifiedStores = stores.filter(s => s.status === 'Passed' || s.halalCertified).length;
  const dueStores = stores.filter(s => s.status !== 'Passed' && !s.halalCertified).length;
  const certifiedPct = totalStores > 0 ? Math.round((certifiedStores / totalStores) * 100) : 0;

  const passedAudits = filteredAudits.filter(a => a.category === 'Passed').length;
  const rfpAudits = filteredAudits.filter(a => a.category === 'Recommend For Pass').length;
  const reviewAudits = filteredAudits.filter(a => a.category === 'Review List').length;
  const otherFailAudits = filteredAudits.filter(a => a.category === 'Other Fail').length;
  const criticalFailAudits = filteredAudits.filter(a => a.category === 'L3 Critical Fail').length;
  const totalAuditsCount = filteredAudits.length || 1;
  const passRate = filteredAudits.length > 0
    ? ((passedAudits / filteredAudits.length) * 100).toFixed(1)
    : '0.0';

  const activeAssignments = useMemo(
    () => assignments.filter(a => a.status === 'Scheduled' || a.status === 'In Progress'),
    [assignments]
  );

  const pendingAppealsCount = appeals.filter(ap => ap.status === 'Under Investigation').length;
  const pendingRequestsCount = requests.filter(
    r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending')
  ).length;

  // Radial Gauge SVG geometry
  const gaugeRadius = 48;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const clampedPass = Math.max(0, Math.min(100, Number(passRate) || 0));
  const gaugeDashOffset = gaugeCircumference * (1 - clampedPass / 100);

  // 5-Stage Pipeline Breakdown
  const pipelineStages = useMemo(() => [
    {
      key: 'Passed',
      name: 'Passed & Certified',
      shortName: 'Passed',
      value: passedAudits,
      color: '#059669',
      path: '/audits/passed',
    },
    {
      key: 'Recommend For Pass',
      name: 'Recommend For Pass',
      shortName: 'Rec. Pass',
      value: rfpAudits,
      color: '#2563eb',
      path: '/audits/recommend-pass',
    },
    {
      key: 'Review List',
      name: 'Under Review',
      shortName: 'Under Review',
      value: reviewAudits,
      color: '#f59e0b',
      path: '/audits/review',
    },
    {
      key: 'Other Fail',
      name: 'Other Fail',
      shortName: 'Other Fail',
      value: otherFailAudits,
      color: '#f97316',
      path: '/audits/other-fail',
    },
    {
      key: 'L3 Critical Fail',
      name: 'Critical L3 Fail',
      shortName: 'Critical L3',
      value: criticalFailAudits,
      color: '#dc2626',
      path: '/audits/critical-fail',
    },
  ], [passedAudits, rfpAudits, reviewAudits, otherFailAudits, criticalFailAudits]);

  // Unified Action Queue Items
  const actionItems = useMemo(() => [
    ...audits
      .filter(a => a.category === 'L3 Critical Fail')
      .map((a, idx) => ({
        id: `act-l3-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Auditor: ${a.auditor} (${a.score}%)`,
        category: 'critical',
        stageLabel: 'Critical L3',
        stageBg: '#fef2f2',
        stageColor: '#dc2626',
        waitingFor: 'Compliance Escalation',
        role: 'compliance',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/critical-fail',
        icon: AlertOctagon,
      })),
    ...audits
      .filter(a => a.category === 'Recommend For Pass')
      .map((a, idx) => ({
        id: `act-rfp-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Auditor: ${a.auditor} (${a.score}%)`,
        category: 'rfp',
        stageLabel: 'Rec. Pass',
        stageBg: '#eff6ff',
        stageColor: '#2563eb',
        waitingFor: 'Certification Sign-Off',
        role: 'certification',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/recommend-pass',
        icon: Clock,
      })),
    ...audits
      .filter(a => a.category === 'Review List')
      .map((a, idx) => ({
        id: `act-rev-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Auditor: ${a.auditor} (${a.score}%)`,
        category: 'review',
        stageLabel: 'In Review',
        stageBg: '#fffbeb',
        stageColor: '#d97706',
        waitingFor: 'Supervisor Clarification',
        role: 'auditor',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/review',
        icon: AlertTriangle,
      })),
    ...appeals
      .filter(ap => ap.status === 'Under Investigation')
      .map((ap, idx) => ({
        id: `act-app-${ap.id}-${idx}`,
        title: ap.storeAddress || ap.branchCode,
        sub: `${ap.auditorName || 'Auditor'} • ${ap.submittedBy || 'Franchise Appeal'}`,
        category: 'appeals',
        stageLabel: 'Appeal',
        stageBg: '#fef3c7',
        stageColor: '#b45309',
        waitingFor: 'Appeals Panel Adjudication',
        role: 'compliance',
        date: ap.appealDate || ap.date,
        path: '/appeals',
        icon: ShieldAlert,
      })),
    ...requests
      .filter(r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending'))
      .map((r, idx) => ({
        id: `act-req-${r.id}-${idx}`,
        title: r.storeName || r.franchisee,
        sub: `${r.requestType || 'Store Request'} • ${r.franchisee}`,
        category: 'requests',
        stageLabel: 'Request',
        stageBg: '#ecfdf5',
        stageColor: '#059669',
        waitingFor: 'Operations Approval',
        role: 'operations',
        date: r.date || r.requestDate,
        path: '/requests',
        icon: Inbox,
      })),
  ], [audits, appeals, requests]);

  const inlineQueueItems = useMemo(() => {
    const list = queueTab === 'all' ? actionItems : actionItems.filter(i => i.category === queueTab);
    return list.slice(0, 5);
  }, [actionItems, queueTab]);

  const filteredActionItems = useMemo(() => {
    return actionItems.filter(item => {
      if (actionFilter !== 'all' && item.category !== actionFilter) return false;
      if (actionRoleFilter !== 'all' && item.role !== actionRoleFilter) return false;
      if (actionSearch.trim()) {
        const q = actionSearch.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.sub?.toLowerCase().includes(q) ||
          item.stageLabel?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [actionItems, actionFilter, actionRoleFilter, actionSearch]);

  // Top Franchise Ranked Leaderboard
  const franchiseLeaderboard = useMemo(() => {
    const byName = {};
    stores.forEach(s => {
      const key = s.franchisee || 'Independent';
      if (!byName[key]) byName[key] = { total: 0, passed: 0 };
      byName[key].total += 1;
      if (s.status === 'Passed' || s.halalCertified) byName[key].passed += 1;
    });

    return franchisees
      .map(f => {
        const live = byName[f.name];
        const total = live?.total || f.storesCount || 0;
        const passed = live ? live.passed : Math.round(total * 0.85);
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
        return {
          id: f.id,
          name: f.name,
          total,
          passed,
          pct,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [franchisees, stores]);

  // Compliance Velocity Data by Round (for AreaChart)
  const sessionTrendData = useMemo(() => {
    const map = {};
    audits.forEach(a => {
      const s = a.session || 'Round Two 2026';
      if (!map[s]) {
        map[s] = {
          name: s.replace('Round ', 'R').replace('20', '\''),
          fullName: s,
          Passed: 0,
          Review: 0,
          Failed: 0,
          total: 0,
        };
      }
      map[s].total += 1;
      if (a.category === 'Passed') map[s].Passed += 1;
      else if (a.category === 'Recommend For Pass' || a.category === 'Review List') map[s].Review += 1;
      else map[s].Failed += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6).reverse();
  }, [audits]);

  // Recent Audits Table Filtering
  const recentTableAudits = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return filteredAudits.filter(a => {
      if (tableStatusFilter !== 'ALL' && a.category !== tableStatusFilter) return false;
      if (!q) return true;
      return (
        a.storeName?.toLowerCase().includes(q) ||
        a.branchCode?.toLowerCase().includes(q) ||
        a.franchisee?.toLowerCase().includes(q) ||
        a.auditor?.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [filteredAudits, tableSearch, tableStatusFilter]);

  // Filtered Map Stores (valid coordinates only)
  const mapStores = useMemo(() => {
    return stores.filter(s => {
      const lat = Number(s.lat);
      const lng = Number(s.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      const isCertified = s.status === 'Passed' || s.halalCertified;
      if (mapStatusFilter === 'CERTIFIED') return isCertified;
      if (mapStatusFilter === 'DUE') return !isCertified;
      return true;
    });
  }, [stores, mapStatusFilter]);

  // Focused Store for Docked Inspector Bar
  const focusedStore = useMemo(() => {
    if (focusedStoreId) {
      const match = mapStores.find(s => String(s.id) === String(focusedStoreId));
      if (match) return match;
    }
    return mapStores[0] || stores[0] || null;
  }, [focusedStoreId, mapStores, stores]);

  const flyToLocation = useCallback((lat, lng, zoom = 11) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return;
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([numLat, numLng], zoom, { duration: 0.7 });
    }
    if (mapPanelRef.current && window.innerWidth < 1240) {
      mapPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // Initialize Embedded Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [53.4, -2.0],
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
    });

    const cfg = TILE_CONFIGS.osm;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Swap tile layer smoothly when mapLayer toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [mapLayer]);

  // Sync Store & GPS Ping circleMarkers onto embedded map
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    mapStores.forEach(st => {
      const lat = Number(st.lat);
      const lng = Number(st.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const isCertified = st.status === 'Passed' || st.halalCertified;
      const isSelected = focusedStore && String(focusedStore.id) === String(st.id);

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 8 : 5.5,
        color: isSelected ? '#0f172a' : '#ffffff',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: isCertified ? '#059669' : '#dc2626',
        fillOpacity: 0.92,
      });

      marker.bindPopup(`
        <div style="font-family: var(--font-sans); min-width: 190px; padding: 2px;">
          <div style="font-size: 10.5px; font-weight: 800; color: ${isCertified ? '#059669' : '#dc2626'}; text-transform: uppercase;">
            ${escapeHtml(st.branchCode)} • ${isCertified ? 'Certified' : 'Action Due'}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 2px 0;">
            ${escapeHtml(st.name)}
          </div>
          <div style="font-size: 11.5px; color: #475569;">
            ${escapeHtml(st.franchisee)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Last Audit: <strong>${escapeHtml(st.lastAuditDate || 'Pending')}</strong>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setFocusedStoreId(st.id);
      });

      marker.addTo(layer);
    });

    if (showMapPings) {
      gpsLogs.slice(0, 15).forEach(log => {
        const lat = Number(log.lat);
        const lng = Number(log.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const ping = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: '#2563eb',
          fillOpacity: 0.95,
        });

        ping.bindPopup(`
          <div style="font-family: var(--font-sans); min-width: 170px;">
            <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">
              Auditor GPS Ping
            </div>
            <div style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(log.auditor)}
            </div>
            <div style="font-size: 11.5px; color: #475569;">
              ${escapeHtml(log.storeName)}
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 3px;">
              ${escapeHtml(log.activity)} • ${escapeHtml(log.time)}
            </div>
          </div>
        `);

        ping.addTo(layer);
      });
    }
  }, [mapStores, focusedStore, showMapPings, gpsLogs]);

  const handleExportBrief = () => {
    const headers = ['Branch Code', 'KFC Store', 'Franchisee', 'Auditor', 'Session Round', 'Audit Date', 'Score', 'Status'];
    const rows = filteredAudits.map(a => [
      a.branchCode,
      `"${(a.storeName || '').replace(/"/g, '""')}"`,
      `"${(a.franchisee || '').replace(/"/g, '""')}"`,
      `"${(a.auditor || '').replace(/"/g, '""')}"`,
      `"${(a.session || '').replace(/"/g, '""')}"`,
      a.auditDate,
      `${a.score}%`,
      `"${a.category}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HFA_KFC_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (cat) => {
    switch (cat) {
      case 'Passed':
        return <span className="badge badge-pass"><span className="badge-dot" /> Passed</span>;
      case 'Recommend For Pass':
        return <span className="badge badge-blue"><span className="badge-dot" /> Rec. Pass</span>;
      case 'Review List':
        return <span className="badge badge-warn"><span className="badge-dot" /> In Review</span>;
      case 'L3 Critical Fail':
        return <span className="badge badge-fail"><span className="badge-dot" /> Critical L3</span>;
      default:
        return <span className="badge badge-warn"><span className="badge-dot" /> {cat || 'Other Fail'}</span>;
    }
  };

  return (
    <div className="dashv2-shell">
      {/* 1. Top Dashboard Overview Banner */}
      <section className="dashv2-hero">
        <div>
          <div className="dashv2-hero-eyebrow">
            <span className="dashv2-live-pill">
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: dbConnected ? '#34d399' : '#fbbf24',
              }} />
              {dbConnected ? 'HFA KFC UK • Live' : 'HFA KFC UK • Local'}
            </span>
            <span className="tabular-nums" style={{ color: '#94a3b8' }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h1 className="dashv2-hero-title">KFC UK Dashboard</h1>
          <p className="dashv2-hero-sub">
            <strong className="tabular-nums" style={{ color: '#ffffff' }}>{totalStores}</strong> stores •{' '}
            <strong className="tabular-nums" style={{ color: '#ffffff' }}>{franchisees.length}</strong> franchisees •{' '}
            <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{certifiedStores} Halal certified</span>
          </p>

          <div className="dashv2-hero-toolbar">
            <button type="button" onClick={handleExportBrief} className="dashv2-btn-ghost">
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="dashv2-btn-ghost"
              style={{ width: 34, padding: 0 }}
              title="Refresh data"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            </button>

            {outletCtx.openNewAuditModal && (
              <button
                type="button"
                onClick={outletCtx.openNewAuditModal}
                className="dashv2-btn-emerald"
              >
                <Plus size={14} />
                <span>Conduct Audit</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Right: Radial Compliance Gauge + 2x2 Micro-Telemetry Tiles */}
        <div className="dashv2-hero-telemetry">
          <div className="dashv2-gauge-box">
            <svg viewBox="0 0 120 120" width="118" height="118" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r={gaugeRadius}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={gaugeRadius}
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeDashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="dashv2-gauge-center">
              <span className="tabular-nums" style={{ fontSize: '21px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {passRate}%
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#a7f3d0', marginTop: 4 }}>
                Pass Rate
              </span>
            </div>
          </div>

          <div className="dashv2-micro-grid">
            <button type="button" onClick={() => navigate('/stores')} className="dashv2-micro-tile">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Certified Stores</span>
                <Store size={14} color="#34d399" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {certifiedStores}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> / {totalStores}</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600 }}>
                {certifiedPct}% network compliant
              </span>
            </button>

            <button type="button" onClick={() => setShowActionModal(true)} className="dashv2-micro-tile">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Open Sign-Offs</span>
                <Clock size={14} color="#fbbf24" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {actionItems.length}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> open</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#fde68a', fontWeight: 600 }}>
                {criticalFailAudits} L3 • {rfpAudits} RFP
              </span>
            </button>

            <button type="button" onClick={() => navigate('/assignments')} className="dashv2-micro-tile">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Active Assignments</span>
                <CalendarCheck size={14} color="#60a5fa" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {activeAssignments.length}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> live</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: 600 }}>
                of {assignments.length} scheduled
              </span>
            </button>

            <button type="button" onClick={() => navigate('/products')} className="dashv2-micro-tile">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Certified Products</span>
                <Package size={14} color="#a7f3d0" />
              </div>
              <div className="tabular-nums" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {products.length}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> SKUs</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
                {franchisees.length} franchise partners
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Conditional Critical Level 3 Escalation Alert Bar */}
      {criticalFailAudits > 0 && (
        <div className="dashv2-escalation">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#ffe4e6',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertOctagon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#9f1239' }}>
                {criticalFailAudits} Critical Level 3 Halal Breach{criticalFailAudits > 1 ? 'es' : ''} Flagged
              </div>
              <div style={{ fontSize: '12px', color: '#be123c' }}>
                Immediate compliance committee escalation required for supplier seal or cross-contamination findings.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/audits/critical-fail')}
            className="btn btn-kfc btn-sm"
          >
            <span>Review Escalations</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. Two-Column Executive Split Workspace */}
      <div className="dashv2-workspace">
        {/* LEFT PRIMARY WORKSPACE */}
        <div className="dashv2-primary">
          {/* Panel A: Embedded Live UK Store Compliance Map */}
          <div ref={mapPanelRef} className="dashv2-panel">
            <div className="dashv2-panel-head">
              <div>
                <h2 className="dashv2-panel-title">Live UK Store Compliance Map</h2>
                <p className="dashv2-panel-sub">
                  Showing <strong className="tabular-nums" style={{ color: '#0f172a' }}>{mapStores.length}</strong> geocoded stores • Click markers or GPS pings to inspect
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <div className="segmented-tabs" style={{ padding: 3 }}>
                  {[
                    { key: 'ALL', label: `All (${stores.length})` },
                    { key: 'CERTIFIED', label: `Certified (${certifiedStores})` },
                    { key: 'DUE', label: `Due (${dueStores})` },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMapStatusFilter(tab.key)}
                      className={`segmented-tab ${mapStatusFilter === tab.key ? 'active' : ''}`}
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMapPings(p => !p)}
                  className={`btn btn-sm ${showMapPings ? 'btn-primary' : 'btn-outline'}`}
                  style={{ height: 32 }}
                >
                  <Navigation size={13} />
                  <span>Pings ({gpsLogs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapLayer(prev => (prev === 'osm' ? 'esri' : 'osm'))}
                  className="btn btn-outline btn-sm"
                  style={{ height: 32 }}
                  title="Switch map tile provider"
                >
                  <Layers size={13} />
                  <span>{TILE_CONFIGS[mapLayer].label}</span>
                </button>

                <button
                  type="button"
                  onClick={() => flyToLocation(53.4, -2.0, 6)}
                  className="btn btn-outline btn-sm"
                  style={{ height: 32 }}
                  title="Reset map to UK overview"
                >
                  <Crosshair size={13} />
                  <span>Reset UK</span>
                </button>
              </div>
            </div>

            <div className="dashv2-map-wrap">
              <div ref={mapContainerRef} className="dashv2-map-canvas" />
              <div className="dashv2-map-legend">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                  Certified ({certifiedStores})
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                  Due / NC ({dueStores})
                </span>
                {showMapPings && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                    Auditor GPS Pings
                  </span>
                )}
              </div>
            </div>

            {focusedStore && (
              <div className="dashv2-store-dock">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 280px' }}>
                  <span className="code-chip">{focusedStore.branchCode}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {focusedStore.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {focusedStore.franchisee} • Last audit: {focusedStore.lastAuditDate || 'Pending'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {(focusedStore.status === 'Passed' || focusedStore.halalCertified) ? (
                    <span className="badge badge-pass"><span className="badge-dot" /> Certified</span>
                  ) : (
                    <span className="badge badge-fail"><span className="badge-dot" /> Due for Audit</span>
                  )}

                  <button
                    type="button"
                    onClick={() => flyToLocation(focusedStore.lat, focusedStore.lng, 13)}
                    className="btn btn-outline btn-sm"
                  >
                    <MapPin size={13} />
                    <span>Focus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/stores')}
                    className="btn btn-outline btn-sm"
                  >
                    <Store size={13} />
                    <span>Stores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/certificates')}
                    className="btn btn-primary btn-sm"
                  >
                    <Award size={13} />
                    <span>Certificate</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel B: Compliance Velocity & Franchise Benchmark */}
          <div className="dashv2-panel">
            <div className="dashv2-panel-head">
              <div>
                <h2 className="dashv2-panel-title">
                  {analyticsTab === 'velocity' ? 'Compliance Velocity & Audit Pipeline' : 'Franchise Compliance Benchmark'}
                </h2>
                <p className="dashv2-panel-sub">
                  {analyticsTab === 'velocity'
                    ? 'Multi-round inspection trends and live 5-stage certification pipeline'
                    : `Top franchise groups ranked by branch footprint across ${franchisees.length} partners`}
                </p>
              </div>

              <div className="segmented-tabs" style={{ padding: 3 }}>
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('velocity')}
                  className={`segmented-tab ${analyticsTab === 'velocity' ? 'active' : ''}`}
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                >
                  Velocity &amp; Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('franchise')}
                  className={`segmented-tab ${analyticsTab === 'franchise' ? 'active' : ''}`}
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                >
                  Franchise Benchmark
                </button>
              </div>
            </div>

            <div className="dashv2-panel-body">
              {analyticsTab === 'velocity' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Inspection Outcomes Across Rounds
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> Passed
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Review / RFP
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} /> Non-Conformity
                      </span>
                    </div>
                  </div>

                  <div style={{ height: 230, width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sessionTrendData} margin={{ top: 8, right: 10, left: -20, bottom: 2 }}>
                        <defs>
                          <linearGradient id="dashv2GradPassed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="dashv2GradReview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="dashv2GradFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Passed"
                          stroke="#059669"
                          strokeWidth={2.4}
                          fill="url(#dashv2GradPassed)"
                          dot={{ r: 3, fill: '#059669' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Review"
                          name="Review / RFP"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fill="url(#dashv2GradReview)"
                          dot={{ r: 3, fill: '#f59e0b' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Failed"
                          name="Non-Conformity"
                          stroke="#dc2626"
                          strokeWidth={2}
                          fill="url(#dashv2GradFailed)"
                          dot={{ r: 3, fill: '#dc2626' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Proportional 5-Stage Pipeline Bar + Clickable Mini-Cards */}
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                        Audit Status Overview
                      </span>
                      <span className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                        {filteredAudits.length} audits
                      </span>
                    </div>

                    <div className="dashv2-pipeline-bar">
                      {pipelineStages.map(stage => {
                        const pct = (stage.value / totalAuditsCount) * 100;
                        if (stage.value <= 0) return null;
                        return (
                          <div
                            key={stage.key}
                            title={`${stage.name}: ${stage.value} (${Math.round(pct)}%)`}
                            style={{ width: `${pct}%`, background: stage.color, height: '100%' }}
                          />
                        );
                      })}
                    </div>

                    <div className="dashv2-pipeline-chips">
                      {pipelineStages.map(stage => {
                        const pct = Math.round((stage.value / totalAuditsCount) * 100);
                        return (
                          <button
                            key={stage.key}
                            type="button"
                            onClick={() => navigate(stage.path)}
                            className="dashv2-pipeline-chip"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color }} />
                              <span className="tabular-nums" style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>
                                {pct}%
                              </span>
                            </div>
                            <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                              {stage.value}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                              {stage.shortName}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {franchiseLeaderboard.map((fran, idx) => (
                    <div
                      key={`fran-rank-${fran.id}-${idx}`}
                      onClick={() => navigate(`/stores?franchisee=${encodeURIComponent(fran.name)}`)}
                      className="dash-leader-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span
                            className="tabular-nums"
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 7,
                              background: idx === 0 ? '#ecfdf5' : '#f1f5f9',
                              color: idx === 0 ? '#059669' : '#475569',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {fran.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span className="tabular-nums" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                            {fran.passed} / {fran.total} certified
                          </span>
                          <span className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', width: 38, textAlign: 'right' }}>
                            {fran.pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 5, width: '100%', background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${fran.pct}%`, height: '100%', background: '#059669', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" onClick={() => navigate('/franchisees')} className="btn btn-outline btn-sm">
                      <Building2 size={13} />
                      <span>View All {franchisees.length} Partners</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel C: Recent Halal Audit Submissions Ledger */}
          <div className="dashv2-panel">
            <div className="dashv2-panel-head">
              <div>
                <h2 className="dashv2-panel-title">Recent Halal Audit Submissions</h2>
                <p className="dashv2-panel-sub">Click any row to open the full 36-point compliance dossier</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ width: 195 }}>
                  <Search className="search-icon" size={14} />
                  <input
                    type="text"
                    className="search-input"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Search store or auditor..."
                    style={{ padding: '6px 10px 6px 32px', fontSize: '12px', height: 34 }}
                  />
                </div>

                <select
                  className="filter-select"
                  value={tableStatusFilter}
                  onChange={e => setTableStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', height: 34 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Passed">Passed</option>
                  <option value="Recommend For Pass">Recommend For Pass</option>
                  <option value="Review List">Review List</option>
                  <option value="Other Fail">Other Fail</option>
                  <option value="L3 Critical Fail">L3 Critical Fail</option>
                </select>

                <button type="button" onClick={() => navigate('/audits')} className="btn btn-outline btn-sm" style={{ height: 34 }}>
                  <span>All Audits</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>KFC Store &amp; Branch</th>
                    <th>Auditor &amp; Round</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTableAudits.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No audits match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    recentTableAudits.map((a, idx) => (
                      <tr
                        key={`dashv2-aud-${a.id}-${idx}`}
                        onClick={() => setSelectedAudit(a)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="code-chip">{a.branchCode}</span>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.storeName}</div>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>{a.franchisee}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{a.auditor}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{a.session} • {a.auditDate}</div>
                        </td>
                        <td>
                          <div className="dash-score-pill">
                            <span
                              className="tabular-nums"
                              style={{
                                fontWeight: 800,
                                fontSize: '13px',
                                color: a.score >= 85 ? '#059669' : a.score >= 70 ? '#d97706' : '#dc2626',
                              }}
                            >
                              {a.score}%
                            </span>
                            <div style={{ width: 42, height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, a.score || 0)}%`,
                                  height: '100%',
                                  background: a.score >= 85 ? '#059669' : a.score >= 70 ? '#f59e0b' : '#dc2626',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(a.category)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedAudit(a);
                            }}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT STICKY OPERATIONAL RAIL */}
        <aside className="dashv2-rail">
          {/* Card 1: Triage & Sign-Off Desk */}
          <div className="dashv2-panel">
            <div className="dashv2-panel-head" style={{ padding: '14px 16px' }}>
              <div>
                <h2 className="dashv2-panel-title">Triage &amp; Sign-Off Desk</h2>
                <p className="dashv2-panel-sub">Prioritized manager approvals</p>
              </div>
              <span className="badge badge-warn tabular-nums">{actionItems.length} Open</span>
            </div>

            <div className="dashv2-panel-body" style={{ padding: '12px 14px 14px' }}>
              <div className="dash-queue-tabs" style={{ marginBottom: 10 }}>
                {[
                  { key: 'all', label: 'All', count: actionItems.length },
                  { key: 'critical', label: 'L3', count: actionItems.filter(i => i.category === 'critical').length },
                  { key: 'rfp', label: 'RFP', count: actionItems.filter(i => i.category === 'rfp').length },
                  { key: 'appeals', label: 'Appeals', count: pendingAppealsCount },
                  { key: 'requests', label: 'Req', count: pendingRequestsCount },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setQueueTab(t.key)}
                    className={`dash-queue-tab ${queueTab === t.key ? 'active' : ''}`}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <span>{t.label}</span>
                    <span className="tabular-nums" style={{ opacity: 0.75 }}>{t.count}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {inlineQueueItems.length === 0 ? (
                  <div style={{ padding: '22px 12px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                    Queue clear for this category.
                  </div>
                ) : (
                  inlineQueueItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.auditObj) setSelectedAudit(item.auditObj);
                          else navigate(item.path);
                        }}
                        className="dashv2-triage-row"
                        style={{ borderLeftColor: item.stageColor }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: item.stageBg,
                            color: item.stageColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={14} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.sub}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: item.stageBg,
                            color: item.stageColor,
                          }}>
                            {item.stageLabel}
                          </span>
                          <ChevronRight size={13} color="#94a3b8" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowActionModal(true)}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', marginTop: 10 }}
              >
                <span>Open Full Action Queue ({actionItems.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: Live Field Ops Feed (GPS Pings + Scheduled Assignments) */}
          <div className="dashv2-panel">
            <div className="dashv2-panel-head" style={{ padding: '14px 16px' }}>
              <div>
                <h3 className="dashv2-panel-title">Live Field Ops Feed</h3>
                <p className="dashv2-panel-sub">Click coordinates to fly map to ping</p>
              </div>
              <div className="segmented-tabs" style={{ padding: 2 }}>
                <button
                  type="button"
                  onClick={() => setOpsTab('pings')}
                  className={`segmented-tab ${opsTab === 'pings' ? 'active' : ''}`}
                  style={{ padding: '4px 9px', fontSize: '11px' }}
                >
                  GPS Pings
                </button>
                <button
                  type="button"
                  onClick={() => setOpsTab('scheduled')}
                  className={`segmented-tab ${opsTab === 'scheduled' ? 'active' : ''}`}
                  style={{ padding: '4px 9px', fontSize: '11px' }}
                >
                  Scheduled ({activeAssignments.length})
                </button>
              </div>
            </div>

            <div className="dashv2-panel-body" style={{ padding: '10px 16px 14px' }}>
              {opsTab === 'pings' ? (
                <div>
                  {gpsLogs.slice(0, 6).map((log, idx) => (
                    <div key={`dashv2-ping-${log.id}-${idx}`} className="dashv2-ops-feed-row">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 2,
                      }}>
                        {(log.auditor || 'A').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{log.auditor}</span>
                          <span className="tabular-nums" style={{ fontSize: '10.5px', color: '#94a3b8' }}>{log.time}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.storeName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Activity size={11} /> {log.activity}
                          </span>
                          {Number.isFinite(Number(log.lat)) && Number.isFinite(Number(log.lng)) && (
                            <button
                              type="button"
                              onClick={() => flyToLocation(log.lat, log.lng, 12)}
                              className="dashv2-coord-btn"
                              title="Focus map on auditor GPS coordinates"
                            >
                              <MapPin size={10} />
                              <span>{Number(log.lat).toFixed(2)}, {Number(log.lng).toFixed(2)}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigate('/map')}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: 10 }}
                  >
                    <MapPin size={13} color="#059669" />
                    <span>Open Full UK Map Workspace</span>
                  </button>
                </div>
              ) : (
                <div>
                  {activeAssignments.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                      No pending field assignments.
                    </div>
                  ) : (
                    activeAssignments.slice(0, 6).map((asg, idx) => (
                      <div
                        key={`dashv2-asg-${asg.id}-${idx}`}
                        onClick={() => navigate('/assignments')}
                        className="dashv2-ops-feed-row"
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {asg.storeName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {asg.auditor} • {asg.date} • {asg.session}
                          </div>
                        </div>
                        <span className={`badge ${asg.status === 'In Progress' ? 'badge-blue' : 'badge-warn'}`}>
                          {asg.status}
                        </span>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/assignments')}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: 10 }}
                  >
                    <CalendarCheck size={13} color="#059669" />
                    <span>Manage All Assignments</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Quick Operations Dock */}
          <div className="dashv2-panel">
            <div className="dashv2-panel-head" style={{ padding: '12px 16px' }}>
              <h3 className="dashv2-panel-title">Quick Operations</h3>
            </div>
            <div className="dashv2-panel-body" style={{ padding: '12px 14px' }}>
              <div className="dashv2-quick-grid">
                <button
                  type="button"
                  onClick={() => (outletCtx.openNewAuditModal ? outletCtx.openNewAuditModal() : navigate('/audits'))}
                  className="dashv2-quick-btn"
                >
                  <ShieldCheck size={15} color="#059669" />
                  <span>Conduct Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => (outletCtx.openNewStoreModal ? outletCtx.openNewStoreModal() : navigate('/stores'))}
                  className="dashv2-quick-btn"
                >
                  <Store size={15} color="#2563eb" />
                  <span>Register Store</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/certificates')}
                  className="dashv2-quick-btn"
                >
                  <Award size={15} color="#d97706" />
                  <span>Certificates</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="dashv2-quick-btn"
                >
                  <Package size={15} color="#059669" />
                  <span>Certified Products</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Full Action Required Queue Modal */}
      {showActionModal && (
        <div className="modal-backdrop" onClick={() => setShowActionModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 880, maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={19} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#0f172a' }}>
                    Action Required Queue ({filteredActionItems.length} of {actionItems.length})
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Click any record to inspect the full Halal audit dossier or approve workflow requests
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowActionModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ flex: '1 1 220px', minWidth: '180px' }}>
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search store name, franchisee, or auditor..."
                    value={actionSearch}
                    onChange={e => setActionSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} style={{ color: '#64748b' }} />
                  <select
                    value={actionRoleFilter}
                    onChange={e => setActionRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Responsible Teams</option>
                    <option value="certification">Certification Sign-Off</option>
                    <option value="compliance">Compliance Committee</option>
                    <option value="auditor">Lead Auditor</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All Items', count: actionItems.length },
                  { key: 'rfp', label: 'Recommend For Pass', count: actionItems.filter(i => i.category === 'rfp').length },
                  { key: 'critical', label: 'Critical L3 Fail', count: actionItems.filter(i => i.category === 'critical').length },
                  { key: 'review', label: 'Review List', count: actionItems.filter(i => i.category === 'review').length },
                  { key: 'appeals', label: 'Appeals', count: actionItems.filter(i => i.category === 'appeals').length },
                  { key: 'requests', label: 'Store Requests', count: actionItems.filter(i => i.category === 'requests').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActionFilter(tab.key)}
                    className={`dash-queue-tab ${actionFilter === tab.key ? 'active' : ''}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: actionFilter === tab.key ? '1px solid #059669' : '1px solid #e2e8f0',
                      background: actionFilter === tab.key ? '#ecfdf5' : '#ffffff',
                      color: actionFilter === tab.key ? '#047857' : '#475569',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      className="tabular-nums"
                      style={{
                        background: actionFilter === tab.key ? '#059669' : '#e2e8f0',
                        color: actionFilter === tab.key ? '#ffffff' : '#475569',
                        padding: '1px 7px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredActionItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowActionModal(false);
                      if (item.auditObj) {
                        setSelectedAudit(item.auditObj);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className="dash-queue-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                      <span
                        style={{
                          background: item.stageBg,
                          color: item.stageColor,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.stageLabel}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{item.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{item.sub}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="#d97706" /> {item.waitingFor}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Inspect <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AuditDetailModal
        audit={selectedAudit}
        onClose={() => setSelectedAudit(null)}
      />
    </div>
  );
}
