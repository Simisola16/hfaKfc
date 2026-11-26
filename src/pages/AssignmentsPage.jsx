import React, { useState, useEffect, useMemo } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  Calendar, Search, Plus, CheckCircle2, Clock,
  PlayCircle, X, Layers, Building2, Store, UserCheck,
  SlidersHorizontal, Download, ArrowUpDown
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';
import NewAuditModal from '../components/NewAuditModal';

const ROUND_OPTIONS = ['Round One', 'Round Two', 'Round Three', 'Surveillance'];

const SEARCH_BY_OPTIONS = [
  { value: 'all', label: 'All Fields', placeholder: 'Search store, branch code, franchisee, auditor, session...' },
  { value: 'storeName', label: 'Store Name', placeholder: 'Search by store name (e.g. Bolton)...' },
  { value: 'branchCode', label: 'Branch Code', placeholder: 'Search by branch code (e.g. 8706)...' },
  { value: 'franchisee', label: 'Franchisee', placeholder: 'Search by franchisee name...' },
  { value: 'auditor', label: 'Auditor', placeholder: 'Search by auditor name...' },
  { value: 'session', label: 'Session', placeholder: 'Search by session round (e.g. Round Two 2026)...' },
];

function parseDateMs(str) {
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

export default function AssignmentsPage() {
  const { assignments, stores, franchisees, users, updateAssignmentStatus } = useKfc();

  // Search By, Filter, & Sort State
  const [searchBy, setSearchBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedFranchisee, setSelectedFranchisee] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedAuditor, setSelectedAuditor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [beginningDate, setBeginningDate] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditStoreId, setAuditStoreId] = useState(null);

  // Derived Filter Options
  const yearOptions = useMemo(() => {
    const yrs = new Set(['2026', '2025', '2024', '2023', '2022', '2021', '2020']);
    assignments.forEach(a => {
      const m = String(a.session || '').match(/\b(20\d{2})\b/);
      if (m) yrs.add(m[1]);
      const d = String(a.startDate || a.date || '').match(/\b(20\d{2})\b/);
      if (d) yrs.add(d[1]);
    });
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [assignments]);

  const franchiseeOptions = useMemo(() => {
    const names = new Set();
    franchisees.forEach(f => { if (f.name) names.add(f.name); });
    stores.forEach(s => { if (s.franchisee) names.add(s.franchisee); });
    assignments.forEach(a => { if (a.franchisee) names.add(a.franchisee); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [franchisees, stores, assignments]);

  const storeOptions = useMemo(() => {
    const map = new Map();
    stores.forEach(s => {
      if (selectedFranchisee !== 'ALL' && s.franchisee !== selectedFranchisee) return;
      if (s.name) map.set(s.name, { name: s.name, branchCode: s.branchCode || '' });
    });
    assignments.forEach(a => {
      if (selectedFranchisee !== 'ALL' && a.franchisee !== selectedFranchisee) return;
      if (a.storeName && !map.has(a.storeName)) {
        map.set(a.storeName, { name: a.storeName, branchCode: a.branchCode || '' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, assignments, selectedFranchisee]);

  useEffect(() => {
    if (selectedStore !== 'ALL' && !storeOptions.some(s => s.name === selectedStore)) {
      setSelectedStore('ALL');
    }
  }, [storeOptions, selectedStore]);

  const auditorOptions = useMemo(() => {
    const names = new Set(['Rashid', 'Moin', 'Mansur', 'Amir', 'Haris', 'Ali', 'Abu Yusha', 'Taoheed', 'Builder']);
    users.forEach(u => { if (u.username) names.add(u.username); });
    assignments.forEach(a => { if (a.auditor) names.add(a.auditor); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [users, assignments]);

  // KPI Metrics
  const scheduledCount = assignments.filter(a => a.status !== 'Completed' && a.status !== 'In Progress').length;
  const inProgressCount = assignments.filter(a => a.status === 'In Progress').length;
  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const completionPct = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  // Filtered & Sorted Assignments
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filterStartMs = beginningDate ? parseDateMs(beginningDate) : null;
    const filterEndMs = endingDate ? parseDateMs(endingDate) : null;

    const list = assignments.filter(a => {
      const normalizedStatus = a.status || 'Scheduled';
      if (selectedStatus !== 'ALL' && normalizedStatus !== selectedStatus) return false;

      const sess = String(a.session || '').toLowerCase();
      if (selectedRound !== 'ALL' && !sess.includes(selectedRound.toLowerCase())) return false;
      if (selectedYear !== 'ALL' && !sess.includes(selectedYear)) return false;

      if (selectedFranchisee !== 'ALL' && a.franchisee !== selectedFranchisee) return false;
      if (selectedStore !== 'ALL' && a.storeName !== selectedStore) return false;
      if (selectedAuditor !== 'ALL' && a.auditor !== selectedAuditor) return false;

      if (filterStartMs !== null || filterEndMs !== null) {
        const asgStart = parseDateMs(a.startDate || a.date);
        const asgEnd = parseDateMs(a.endDate) ?? asgStart;
        if (asgStart === null) return false;
        if (filterStartMs !== null && asgEnd < filterStartMs) return false;
        if (filterEndMs !== null && asgStart > filterEndMs) return false;
      }

      if (q) {
        if (searchBy === 'storeName') return String(a.storeName || '').toLowerCase().includes(q);
        if (searchBy === 'branchCode') return String(a.branchCode || '').toLowerCase().includes(q);
        if (searchBy === 'franchisee') return String(a.franchisee || '').toLowerCase().includes(q);
        if (searchBy === 'auditor') return String(a.auditor || '').toLowerCase().includes(q);
        if (searchBy === 'session') return String(a.session || '').toLowerCase().includes(q);
        return (
          String(a.storeName || '').toLowerCase().includes(q) ||
          String(a.branchCode || '').toLowerCase().includes(q) ||
          String(a.franchisee || '').toLowerCase().includes(q) ||
          String(a.auditor || '').toLowerCase().includes(q) ||
          String(a.session || '').toLowerCase().includes(q)
        );
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'date-asc') {
        return (parseDateMs(a.startDate || a.date) || 0) - (parseDateMs(b.startDate || b.date) || 0);
      }
      if (sortBy === 'store-asc') {
        return String(a.storeName || '').localeCompare(String(b.storeName || ''));
      }
      if (sortBy === 'auditor-asc') {
        return String(a.auditor || '').localeCompare(String(b.auditor || ''));
      }
      if (sortBy === 'status') {
        return String(a.status || 'Scheduled').localeCompare(String(b.status || 'Scheduled'));
      }
      return (parseDateMs(b.startDate || b.date) || 0) - (parseDateMs(a.startDate || a.date) || 0);
    });
  }, [
    assignments, searchTerm, searchBy, selectedRound, selectedYear,
    selectedFranchisee, selectedStore, selectedAuditor, selectedStatus,
    beginningDate, endingDate, sortBy,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchTerm.trim()) {
      const lbl = SEARCH_BY_OPTIONS.find(o => o.value === searchBy)?.label || 'Search';
      chips.push({ key: 'search', label: `${lbl}: "${searchTerm.trim()}"`, clear: () => setSearchTerm('') });
    }
    if (selectedRound !== 'ALL') {
      chips.push({ key: 'round', label: `Round: ${selectedRound}`, clear: () => setSelectedRound('ALL') });
    }
    if (selectedYear !== 'ALL') {
      chips.push({ key: 'year', label: `Year: ${selectedYear}`, clear: () => setSelectedYear('ALL') });
    }
    if (selectedFranchisee !== 'ALL') {
      chips.push({ key: 'franchisee', label: `Franchisee: ${selectedFranchisee}`, clear: () => setSelectedFranchisee('ALL') });
    }
    if (selectedStore !== 'ALL') {
      chips.push({ key: 'store', label: `Store: ${selectedStore}`, clear: () => setSelectedStore('ALL') });
    }
    if (selectedAuditor !== 'ALL') {
      chips.push({ key: 'auditor', label: `Auditor: ${selectedAuditor}`, clear: () => setSelectedAuditor('ALL') });
    }
    if (selectedStatus !== 'ALL') {
      chips.push({ key: 'status', label: `Status: ${selectedStatus}`, clear: () => setSelectedStatus('ALL') });
    }
    if (beginningDate) {
      chips.push({ key: 'start', label: `From: ${beginningDate}`, clear: () => setBeginningDate('') });
    }
    if (endingDate) {
      chips.push({ key: 'end', label: `To: ${endingDate}`, clear: () => setEndingDate('') });
    }
    return chips;
  }, [
    searchTerm, searchBy, selectedRound, selectedYear,
    selectedFranchisee, selectedStore, selectedAuditor, selectedStatus,
    beginningDate, endingDate,
  ]);

  const resetAllFilters = () => {
    setSearchBy('all');
    setSearchTerm('');
    setSelectedRound('ALL');
    setSelectedYear('ALL');
    setSelectedFranchisee('ALL');
    setSelectedStore('ALL');
    setSelectedAuditor('ALL');
    setSelectedStatus('ALL');
    setBeginningDate('');
    setEndingDate('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const headers = ['Branch Code', 'Store Name', 'Franchisee', 'Auditor', 'Beginning Date', 'Ending Date', 'Session', 'Status'];
    const rows = filtered.map(a => [
      a.branchCode || '',
      `"${(a.storeName || '').replace(/"/g, '""')}"`,
      `"${(a.franchisee || '').replace(/"/g, '""')}"`,
      `"${(a.auditor || '').replace(/"/g, '""')}"`,
      a.startDate || a.date || '',
      a.endDate || a.startDate || a.date || '',
      `"${(a.session || '').replace(/"/g, '""')}"`,
      `"${a.status || 'Scheduled'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HFA_KFC_Assign_List_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const launchLiveAuditForAssignment = (asg) => {
    const match = stores.find(s => s.branchCode === asg.branchCode || s.name === asg.storeName);
    setAuditStoreId(match ? match.id : stores[0]?.id);
  };

  const activeSearchMeta = SEARCH_BY_OPTIONS.find(o => o.value === searchBy) || SEARCH_BY_OPTIONS[0];

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Assign List</h1>
          <div className="dash-subtitle">
            <span>Manage auditor store assignments</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* 4 Precision KPI Cards */}
      <div className="dash-kpi-grid">
        <div
          className={`dash-kpi-card ${selectedStatus === 'ALL' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Assignments</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{assignments.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>All scheduled audit deployments</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Scheduled' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Scheduled'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Scheduled</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#d97706' }}>{scheduledCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${assignments.length ? Math.round((scheduledCount / assignments.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Awaiting field visit</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'In Progress' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('In Progress'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">In Progress</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <PlayCircle size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#2563eb' }}>{inProgressCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${assignments.length ? Math.round((inProgressCount / assignments.length) * 100) : 0}%`, background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Auditors currently on-site</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Completed' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Completed'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Completed</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value" style={{ color: '#059669' }}>{completedCount}</span>
              <span className="dash-kpi-denom">({completionPct}%)</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${completionPct}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Inspections submitted to HFA</span>
          </div>
        </div>
      </div>

      {/* Unified Search By + Filter Console + Table Surface */}
      <div className="page-surface">
        {/* Primary Search By + Sort + Filter Toggle Bar */}
        <div className="surface-toolbar" style={{ gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 360px', flexWrap: 'wrap', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                Search by
              </span>
              <select
                className="filter-select"
                value={searchBy}
                onChange={e => { setSearchBy(e.target.value); setCurrentPage(1); }}
                aria-label="Search by field"
                style={{ height: 38, fontWeight: 600 }}
              >
                {SEARCH_BY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="search-input-wrapper" style={{ flex: '1 1 220px', minWidth: 0 }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                className="search-input"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={activeSearchMeta.placeholder}
                style={{ paddingRight: searchTerm ? 32 : 14 }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpDown size={14} color="#64748b" />
              <select
                className="filter-select"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                aria-label="Sort assignments"
                style={{ height: 38 }}
              >
                <option value="date-desc">Newest Date First</option>
                <option value="date-asc">Oldest Date First</option>
                <option value="store-asc">Store Name (A–Z)</option>
                <option value="auditor-asc">Auditor (A–Z)</option>
                <option value="status">Status</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
              style={{ height: 38, padding: '0 13px' }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeFilterChips.length > 0 && (
                <span
                  className="tabular-nums"
                  style={{
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontSize: '11px',
                    fontWeight: 700,
                    background: showFilters ? 'rgba(255,255,255,0.22)' : '#ecfdf5',
                    color: showFilters ? '#ffffff' : '#047857',
                  }}
                >
                  {activeFilterChips.length}
                </span>
              )}
            </button>

            {activeFilterChips.length > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-ghost btn-sm"
                style={{ height: 38 }}
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Structured Filter Matrix */}
        {showFilters && (
          <div style={{
            padding: '14px 18px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Row 1: Session (Round + Year) + Status */}
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
                  <CheckCircle2 size={13} color="#059669" />
                  <span>Assignment Status</span>
                </label>
                <select
                  className="filter-select"
                  value={selectedStatus}
                  onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Scheduled">Scheduled ({scheduledCount})</option>
                  <option value="In Progress">In Progress ({inProgressCount})</option>
                  <option value="Completed">Completed ({completedCount})</option>
                </select>
              </div>
            </div>

            {/* Row 2: Franchisee + Store (Cascading) */}
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
                <select
                  className="filter-select"
                  value={selectedFranchisee}
                  onChange={e => { setSelectedFranchisee(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Franchisees ({franchiseeOptions.length})</option>
                  {franchiseeOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  <Store size={13} color="#059669" />
                  <span>Store</span>
                </label>
                <select
                  className="filter-select"
                  value={selectedStore}
                  onChange={e => { setSelectedStore(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Stores ({storeOptions.length})</option>
                  {storeOptions.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.branchCode ? `${s.branchCode} • ${s.name}` : s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Auditor + Date Range (Beginning Date — Ending Date) */}
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
                <select
                  className="filter-select"
                  value={selectedAuditor}
                  onChange={e => { setSelectedAuditor(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Auditors ({auditorOptions.length})</option>
                  {auditorOptions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  <Calendar size={13} color="#059669" />
                  <span>Date Range (Beginning Date — Ending Date)</span>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={beginningDate}
                    onChange={e => {
                      const val = e.target.value;
                      setBeginningDate(val);
                      if (endingDate && val && endingDate < val) setEndingDate(val);
                      setCurrentPage(1);
                    }}
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Summary Chips Strip */}
        {activeFilterChips.length > 0 && (
          <div style={{
            padding: '10px 18px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: 4 }}>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}:
              </span>
              {activeFilterChips.map(chip => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => { chip.clear(); setCurrentPage(1); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: '1px solid #a7f3d0',
                    background: '#ecfdf5',
                    color: '#047857',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>{chip.label}</span>
                  <X size={11} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                border: 'none',
                background: 'none',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Clear all
            </button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Store Name</th>
                <th>Franchisee</th>
                <th>Auditor</th>
                <th>Scheduled Date</th>
                <th>Session</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No assignments match your search or active filters.
                  </td>
                </tr>
              ) : (
                paginated.map((asg, idx) => (
                  <tr key={`asg-row-${asg.id}-${idx}`}>
                    <td>
                      <span className="code-chip">{asg.branchCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{asg.storeName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#334155' }}>{asg.franchisee}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: '#ecfdf5',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {(asg.auditor || 'A').charAt(0).toUpperCase()}
                        </span>
                        <span>{asg.auditor}</span>
                      </div>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                        {asg.startDate && asg.endDate && asg.startDate !== asg.endDate
                          ? `${asg.startDate} → ${asg.endDate}`
                          : asg.startDate || asg.date}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{asg.session}</span>
                    </td>
                    <td>
                      {asg.status === 'Completed' ? (
                        <span className="badge badge-pass"><span className="badge-dot" /> Completed</span>
                      ) : asg.status === 'In Progress' ? (
                        <span className="badge badge-blue"><span className="badge-dot" /> In Progress</span>
                      ) : (
                        <span className="badge badge-warn"><span className="badge-dot" /> Scheduled</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={[
                          {
                            label: 'Assign',
                            icon: Plus,
                            color: '#e4002b',
                            onClick: () => launchLiveAuditForAssignment(asg),
                          },
                          {
                            label: 'Mark In Progress',
                            icon: PlayCircle,
                            color: '#2563eb',
                            onClick: () => updateAssignmentStatus(asg.id, 'In Progress'),
                          },
                          {
                            label: 'Mark Completed',
                            icon: CheckCircle2,
                            color: '#059669',
                            onClick: () => updateAssignmentStatus(asg.id, 'Completed'),
                          },
                        ]}
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
          itemName="assignments"
        />
      </div>

      {/* Unified Assign / New Assignment Modal */}
      <NewAuditModal
        isOpen={isModalOpen || Boolean(auditStoreId)}
        onClose={() => {
          setIsModalOpen(false);
          setAuditStoreId(null);
        }}
        defaultStoreId={auditStoreId}
        title={isModalOpen ? 'New Assignment' : 'Assign'}
        submitLabel={isModalOpen ? 'Save Assignment' : 'Assign'}
      />
    </div>
  );
}
