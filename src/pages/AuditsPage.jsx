import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  ClipboardCheck, Clock, CheckCircle2, AlertTriangle, AlertOctagon,
  Search, Plus, Eye, Pencil, Trash2, Download, TrendingUp, X, Layers, Building2, Store, UserCheck, Calendar
} from 'lucide-react';
import AuditDetailModal from '../components/AuditDetailModal';
import EditAuditModal from '../components/EditAuditModal';
import NewAuditModal from '../components/NewAuditModal';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

const ROUND_OPTIONS = ['Round One', 'Round Two', 'Round Three',];

function parseAuditDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const dmy = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{4})$/);
  if (dmy) {
    const m = months[dmy[2].slice(0, 3).toLowerCase()];
    if (m !== undefined) return new Date(Number(dmy[3]), m, Number(dmy[1])).getTime();
  }
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function AuditsPage({ fixedCategory }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { audits, stores, franchisees, users, updateAuditCategory, deleteAudit } = useKfc();

  const getCategoryFromPath = () => {
    if (fixedCategory) return fixedCategory;
    if (location.pathname.includes('/recommend-pass')) return 'Recommend For Pass';
    if (location.pathname.includes('/review')) return 'Review List';
    if (location.pathname.includes('/passed')) return 'Passed';
    if (location.pathname.includes('/other-fail')) return 'Other Fail';
    if (location.pathname.includes('/critical-fail')) return 'L3 Critical Fail';
    return 'ALL';
  };

  const [activeCategory, setActiveCategory] = useState(getCategoryFromPath);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedFranchisee, setSelectedFranchisee] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedAuditor, setSelectedAuditor] = useState('ALL');
  const [beginningDate, setBeginningDate] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [editingAudit, setEditingAudit] = useState(null);
  const [deletingAudit, setDeletingAudit] = useState(null);
  const [isNewAuditOpen, setIsNewAuditOpen] = useState(false);
  const isRecommendForPass = activeCategory === 'Recommend For Pass';

  useEffect(() => {
    setActiveCategory(getCategoryFromPath());
    setCurrentPage(1);
  }, [location.pathname, fixedCategory]);

  // Dynamic dropdown option lists
  const yearOptions = useMemo(() => {
    const yrs = new Set(['2026', '2025', '2024', '2023', '2022', '2021', '2020']);
    audits.forEach(a => {
      const m = String(a.session || '').match(/\b(20\d{2})\b/);
      if (m) yrs.add(m[1]);
    });
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [audits]);

  const franchiseeOptions = useMemo(() => {
    const names = new Set();
    franchisees.forEach(f => { if (f.name) names.add(f.name); });
    stores.forEach(s => { if (s.franchisee) names.add(s.franchisee); });
    audits.forEach(a => { if (a.franchisee) names.add(a.franchisee); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [franchisees, stores, audits]);

  const storeOptions = useMemo(() => {
    const map = new Map();
    stores.forEach(s => {
      if (selectedFranchisee !== 'ALL' && s.franchisee !== selectedFranchisee) return;
      if (s.name) map.set(s.name, { name: s.name, branchCode: s.branchCode || '' });
    });
    audits.forEach(a => {
      if (selectedFranchisee !== 'ALL' && a.franchisee !== selectedFranchisee) return;
      if (a.storeName && !map.has(a.storeName)) {
        map.set(a.storeName, { name: a.storeName, branchCode: a.branchCode || '' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, audits, selectedFranchisee]);

  // Reset selectedStore if franchisee filter narrows it out
  useEffect(() => {
    if (selectedStore !== 'ALL' && !storeOptions.some(s => s.name === selectedStore)) {
      setSelectedStore('ALL');
    }
  }, [storeOptions, selectedStore]);

  const auditorOptions = useMemo(() => {
    const names = new Set();
    audits.forEach(a => { if (a.auditor) names.add(a.auditor); });
    users.forEach(u => { if (u.username) names.add(u.username); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [audits, users]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const startMs = beginningDate ? parseAuditDate(beginningDate) : null;
    const endMs = endingDate ? parseAuditDate(endingDate) : null;

    return audits.filter(a => {
      if (activeCategory !== 'ALL' && a.category !== activeCategory) return false;

      const sess = String(a.session || '').toLowerCase();
      if (selectedRound !== 'ALL' && !sess.includes(selectedRound.toLowerCase())) return false;
      if (selectedYear !== 'ALL' && !sess.includes(selectedYear)) return false;

      if (selectedFranchisee !== 'ALL' && a.franchisee !== selectedFranchisee) return false;
      if (selectedStore !== 'ALL' && a.storeName !== selectedStore) return false;
      if (selectedAuditor !== 'ALL' && a.auditor !== selectedAuditor) return false;

      if (startMs !== null || endMs !== null) {
        const audMs = parseAuditDate(a.auditDate);
        if (audMs === null) return false;
        if (startMs !== null && audMs < startMs) return false;
        if (endMs !== null && audMs > endMs) return false;
      }

      if (q) {
        return (
          a.storeName?.toLowerCase().includes(q) ||
          a.branchCode?.toLowerCase().includes(q) ||
          a.franchisee?.toLowerCase().includes(q) ||
          a.auditor?.toLowerCase().includes(q) ||
          a.session?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    audits, activeCategory, selectedRound, selectedYear,
    selectedFranchisee, selectedStore, selectedAuditor,
    beginningDate, endingDate, searchTerm,
  ]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const avgScore = filtered.length > 0
    ? (filtered.reduce((acc, a) => acc + (Number(a.score) || 90), 0) / filtered.length).toFixed(1)
    : '0.0';

  const passedTotal = audits.filter(a => a.category === 'Passed').length;
  const awaitingTotal = audits.filter(a => a.category === 'Recommend For Pass' || a.category === 'Review List').length;

  const hasFilters = Boolean(
    searchTerm ||
    selectedRound !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedFranchisee !== 'ALL' ||
    selectedStore !== 'ALL' ||
    selectedAuditor !== 'ALL' ||
    beginningDate ||
    endingDate
  );

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedRound('ALL');
    setSelectedYear('ALL');
    setSelectedFranchisee('ALL');
    setSelectedStore('ALL');
    setSelectedAuditor('ALL');
    setBeginningDate('');
    setEndingDate('');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    const headers = ['Branch Code', 'Store Name', 'Franchise Partner', 'Auditor', 'Session', 'Date', 'Score', 'Status Category'];
    const rows = filtered.map(a => [
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
    link.download = `HFA_KFC_Audits_${activeCategory.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (category) => {
    switch (category) {
      case 'Passed':
        return <span className="badge badge-pass"><span className="badge-dot" /> Passed</span>;
      case 'Recommend For Pass':
        return <span className="badge badge-blue"><span className="badge-dot" /> Rec. For Pass</span>;
      case 'Review List':
        return <span className="badge badge-warn"><span className="badge-dot" /> In Review</span>;
      case 'Other Fail':
        return <span className="badge badge-warn"><span className="badge-dot" /> Other Fail</span>;
      case 'L3 Critical Fail':
        return <span className="badge badge-fail"><span className="badge-dot" /> Critical L3</span>;
      default:
        return <span className="badge badge-neutral">{category}</span>;
    }
  };

  const handleTabClick = (cat, route) => {
    setActiveCategory(cat);
    navigate(route);
  };

  const getPageHeading = () => {
    switch (activeCategory) {
      case 'Passed':
        return 'Passed List';
      case 'Other Fail':
        return 'Other Fail List';
      case 'L3 Critical Fail':
        return 'Failed List';
      case 'Recommend For Pass':
        return 'Recommend For Pass';
      case 'Review List':
        return 'Review List';
      default:
        return 'Audit List';
    }
  };
  const pageHeading = getPageHeading();

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{pageHeading}</h1>
          <div className="dash-subtitle">
            <span>Search audits by session, franchisee, store, auditor, and date</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsNewAuditOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Assign</span>
          </button>
        </div>
      </div>

      {/* 4 Precision KPI Cards */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Matching Audits</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{filtered.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${audits.length ? Math.round((filtered.length / audits.length) * 100) : 0}%`, background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Out of {audits.length} recorded inspections</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => handleTabClick('Passed', '/audits/passed')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Passed &amp; Certified</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#059669' }}>{passedTotal}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${audits.length ? Math.round((passedTotal / audits.length) * 100) : 0}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>100% HFA Halal standard met</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => handleTabClick('Recommend For Pass', '/audits/recommend-pass')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Awaiting Sign-Off</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#d97706' }}>{awaitingTotal}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${audits.length ? Math.round((awaitingTotal / audits.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>RFP &amp; Review List queue</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Average Inspection Score</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{avgScore}%</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${Math.min(100, Number(avgScore))}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Current filtered dataset mean</span>
          </div>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div>
        <div className="segmented-tabs">
          {[
            { cat: 'ALL', route: '/audits', label: 'Audit List', count: audits.length, dot: '#475569' },
            { cat: 'Recommend For Pass', route: '/audits/recommend-pass', label: 'Recommend For Pass', count: audits.filter(a => a.category === 'Recommend For Pass').length, dot: '#2563eb' },
            { cat: 'Review List', route: '/audits/review', label: 'Review List', count: audits.filter(a => a.category === 'Review List').length, dot: '#f59e0b' },
            { cat: 'Passed', route: '/audits/passed', label: 'Passed Audits', count: audits.filter(a => a.category === 'Passed').length, dot: '#059669' },
            { cat: 'Other Fail', route: '/audits/other-fail', label: 'Other Fail', count: audits.filter(a => a.category === 'Other Fail').length, dot: '#f97316' },
            { cat: 'L3 Critical Fail', route: '/audits/critical-fail', label: 'L3 Fail Audits', count: audits.filter(a => a.category === 'L3 Critical Fail').length, dot: '#dc2626' },
          ].map(tab => (
            <button
              key={tab.cat}
              type="button"
              onClick={() => handleTabClick(tab.cat, tab.route)}
              className={`segmented-tab ${activeCategory === tab.cat ? 'active' : ''}`}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tab.dot }} />
              <span>{tab.label}</span>
              <span className="tabular-nums" style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 6,
                background: activeCategory === tab.cat ? '#f1f5f9' : 'rgba(15, 23, 42, 0.06)',
                color: '#475569',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Structured Audit List Search & Filter Panel + Table Surface */}
      <div className="page-surface">
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Row 1: Session (Round + Year) + Keyword Quick Search */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <Layers size={13} color="#059669" />
                <span>Session (Round &amp; Year)</span>
              </label>
              <div className="audit-session-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select
                  className="filter-select"
                  value={selectedRound}
                  onChange={e => { setSelectedRound(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Rounds</option>
                  {ROUND_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={selectedYear}
                  onChange={e => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Years</option>
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <Search size={13} color="#059669" />
                <span>Quick Keyword Filter</span>
              </label>
              <div className="search-input-wrapper" style={{ width: '100%' }}>
                <Search className="search-icon" size={14} />
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Branch code, store, auditor, franchisee..."
                />
              </div>
            </div>
          </div>

          {/* Row 2: Franchisee + Store */}
          <div
            className="audit-filter-grid-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <Building2 size={13} color="#059669" />
                <span>Franchisee</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className="filter-select"
                  value={selectedFranchisee}
                  onChange={e => { setSelectedFranchisee(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="ALL">All Franchisees ({franchiseeOptions.length})</option>
                  {franchiseeOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-primary btn-sm"
                  style={{ height: 38, padding: '0 12px' }}
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <Store size={13} color="#059669" />
                <span>Store</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className="filter-select"
                  value={selectedStore}
                  onChange={e => { setSelectedStore(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="ALL">All Stores ({storeOptions.length})</option>
                  {storeOptions.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.branchCode ? `${s.branchCode} • ${s.name}` : s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-primary btn-sm"
                  style={{ height: 38, padding: '0 12px' }}
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Auditor + Date Range (Beginning Date -> Ending Date) */}
          <div
            className="audit-filter-grid-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <UserCheck size={13} color="#059669" />
                <span>Auditor</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className="filter-select"
                  value={selectedAuditor}
                  onChange={e => { setSelectedAuditor(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="ALL">All Auditors ({auditorOptions.length})</option>
                  {auditorOptions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-primary btn-sm"
                  style={{ height: 38, padding: '0 12px' }}
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                <Calendar size={13} color="#059669" />
                <span>Date Range (Beginning Date — Ending Date)</span>
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="form-input"
                  value={beginningDate}
                  onChange={e => { setBeginningDate(e.target.value); setCurrentPage(1); }}
                  title="Beginning Date"
                  style={{ flex: '1 1 130px', height: 38, padding: '6px 10px' }}
                />
                <input
                  type="date"
                  className="form-input"
                  value={endingDate}
                  min={beginningDate || undefined}
                  onChange={e => { setEndingDate(e.target.value); setCurrentPage(1); }}
                  title="Ending Date"
                  style={{ flex: '1 1 130px', height: 38, padding: '6px 10px' }}
                />
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-primary btn-sm"
                  style={{ height: 38, padding: '0 12px' }}
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="btn btn-outline btn-sm"
                    style={{ height: 38 }}
                  >
                    <X size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Store / Branch Name</th>
                <th>Auditor / Round</th>
                <th>Franchise Partner</th>
                <th>Inspection Date</th>
                <th>Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No inspection audits match your active filters.
                  </td>
                </tr>
              ) : (
                paginated.map((audit, idx) => (
                  <tr
                    key={`aud-row-${audit.id}-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedAudit(audit)}
                  >
                    <td>
                      <span className="code-chip">{audit.branchCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{audit.storeName}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{audit.address}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{audit.auditor}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{audit.session}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#334155' }}>{audit.franchisee}</div>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                        {audit.auditDate}
                        {audit.endDate && audit.endDate !== audit.auditDate ? ` – ${audit.endDate}` : ''}
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {audit.timeIn} - {audit.timeOut}
                      </div>
                    </td>
                    <td>
                      <div className="dash-score-pill">
                        <span style={{
                          fontWeight: 800,
                          fontSize: '13px',
                          color: audit.score >= 85 ? '#059669' : audit.score >= 70 ? '#d97706' : '#dc2626',
                        }}>
                          {audit.score}%
                        </span>
                        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, audit.score || 0)}%`,
                            height: '100%',
                            background: audit.score >= 85 ? '#059669' : audit.score >= 70 ? '#f59e0b' : '#dc2626',
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>{getStatusBadge(audit.category)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={
                          isRecommendForPass
                            ? [
                                {
                                  label: 'View',
                                  icon: Eye,
                                  color: '#059669',
                                  onClick: () => setSelectedAudit(audit),
                                },
                                {
                                  label: 'Edit',
                                  icon: Pencil,
                                  color: '#2563eb',
                                  onClick: () => setEditingAudit(audit),
                                },
                                { divider: true },
                                {
                                  label: 'Delete',
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => setDeletingAudit(audit),
                                },
                              ]
                            : [
                                {
                                  label: 'Inspect Audit Dossier',
                                  icon: Eye,
                                  color: '#059669',
                                  onClick: () => setSelectedAudit(audit),
                                },
                                {
                                  label: 'Approve & Issue Pass',
                                  icon: CheckCircle2,
                                  color: '#059669',
                                  onClick: () => updateAuditCategory(audit.id, 'Passed'),
                                },
                                {
                                  label: 'Move to Review List',
                                  icon: Clock,
                                  color: '#d97706',
                                  onClick: () => updateAuditCategory(audit.id, 'Review List'),
                                },
                                {
                                  label: 'Flag Other Fail (NC)',
                                  icon: AlertTriangle,
                                  color: '#ea580c',
                                  onClick: () => updateAuditCategory(audit.id, 'Other Fail'),
                                },
                                { divider: true },
                                {
                                  label: 'Escalate Critical L3',
                                  icon: AlertOctagon,
                                  danger: true,
                                  onClick: () => updateAuditCategory(audit.id, 'L3 Critical Fail'),
                                },
                              ]
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filtered.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="audits"
        />
      </div>

      {selectedAudit && (
        <AuditDetailModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      {editingAudit && (
        <EditAuditModal
          audit={editingAudit}
          onClose={() => setEditingAudit(null)}
        />
      )}

      {deletingAudit && (
        <div className="modal-backdrop" onClick={() => setDeletingAudit(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Delete Audit</h3>
                  <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setDeletingAudit(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.55 }}>
                Are you sure you want to permanently delete the audit for{' '}
                <strong style={{ color: '#0f172a' }}>{deletingAudit.storeName}</strong>{' '}
                ({deletingAudit.branchCode}) recorded on{' '}
                <strong style={{ color: '#0f172a' }}>{deletingAudit.auditDate}</strong>?
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setDeletingAudit(null)} className="btn btn-outline">
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: '1px solid #dc2626',
                }}
                onClick={async () => {
                  const idToRemove = deletingAudit.id;
                  await deleteAudit(idToRemove);
                  if (selectedAudit && String(selectedAudit.id) === String(idToRemove)) {
                    setSelectedAudit(null);
                  }
                  setDeletingAudit(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <NewAuditModal
        isOpen={isNewAuditOpen}
        onClose={() => setIsNewAuditOpen(false)}
      />
    </div>
  );
}
