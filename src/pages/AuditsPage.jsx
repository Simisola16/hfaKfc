import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  ClipboardCheck, Clock, CheckCircle2, AlertTriangle, AlertOctagon,
  Search, Plus, Eye, Download, TrendingUp, X
} from 'lucide-react';
import AuditDetailModal from '../components/AuditDetailModal';
import NewAuditModal from '../components/NewAuditModal';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

export default function AuditsPage({ fixedCategory }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { audits, updateAuditCategory } = useKfc();

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
  const [selectedAuditor, setSelectedAuditor] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isNewAuditOpen, setIsNewAuditOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(getCategoryFromPath());
    setCurrentPage(1);
  }, [location.pathname, fixedCategory]);

  const auditors = Array.from(new Set(audits.map(a => a.auditor))).filter(Boolean);
  const sessions = Array.from(new Set(audits.map(a => a.session))).filter(Boolean);

  const filtered = audits.filter(a => {
    const matchesCat = activeCategory === 'ALL' || a.category === activeCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      a.storeName?.toLowerCase().includes(q) ||
      a.branchCode?.toLowerCase().includes(q) ||
      a.franchisee?.toLowerCase().includes(q) ||
      a.auditor?.toLowerCase().includes(q);

    const matchesAud = selectedAuditor === 'ALL' || a.auditor === selectedAuditor;
    const matchesSess = selectedSession === 'ALL' || a.session === selectedSession;

    return matchesCat && matchesSearch && matchesAud && matchesSess;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const avgScore = filtered.length > 0
    ? (filtered.reduce((acc, a) => acc + (Number(a.score) || 90), 0) / filtered.length).toFixed(1)
    : '0.0';

  const passedTotal = audits.filter(a => a.category === 'Passed').length;
  const awaitingTotal = audits.filter(a => a.category === 'Recommend For Pass' || a.category === 'Review List').length;
  const hasFilters = Boolean(searchTerm || selectedAuditor !== 'ALL' || selectedSession !== 'ALL');

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
      `"${a.category}"`
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

  const pageHeading = activeCategory === 'ALL' ? 'Master Audit Registry' : activeCategory;

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{pageHeading}</h1>
          <div className="dash-subtitle">
            <span>Physical restaurant inspection reports, compliance checklists, and supervisory sign-off pipeline</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsNewAuditOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Record Audit</span>
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
            { cat: 'ALL', route: '/audits', label: 'All Audits', count: audits.length, dot: '#475569' },
            { cat: 'Recommend For Pass', route: '/audits/recommend-pass', label: 'Recommend For Pass', count: audits.filter(a => a.category === 'Recommend For Pass').length, dot: '#2563eb' },
            { cat: 'Review List', route: '/audits/review', label: 'Review List', count: audits.filter(a => a.category === 'Review List').length, dot: '#f59e0b' },
            { cat: 'Passed', route: '/audits/passed', label: 'Passed', count: audits.filter(a => a.category === 'Passed').length, dot: '#059669' },
            { cat: 'Other Fail', route: '/audits/other-fail', label: 'Other Fail', count: audits.filter(a => a.category === 'Other Fail').length, dot: '#f97316' },
            { cat: 'L3 Critical Fail', route: '/audits/critical-fail', label: 'Critical L3', count: audits.filter(a => a.category === 'L3 Critical Fail').length, dot: '#dc2626' },
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
                color: '#475569'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Unified Audits Table Surface */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search store name, branch code, auditor, franchisee..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={selectedAuditor}
              onChange={e => { setSelectedAuditor(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Field Auditors ({auditors.length})</option>
              {auditors.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedSession}
              onChange={e => { setSelectedSession(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Inspection Rounds</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAuditor('ALL');
                  setSelectedSession('ALL');
                  setCurrentPage(1);
                }}
                className="btn btn-ghost btn-sm"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
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
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>{audit.auditDate}</div>
                      <div className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b' }}>{audit.timeIn} - {audit.timeOut}</div>
                    </td>
                    <td>
                      <div className="dash-score-pill">
                        <span style={{
                          fontWeight: 800,
                          fontSize: '13px',
                          color: audit.score >= 85 ? '#059669' : audit.score >= 70 ? '#d97706' : '#dc2626'
                        }}>
                          {audit.score}%
                        </span>
                        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, audit.score || 0)}%`,
                            height: '100%',
                            background: audit.score >= 85 ? '#059669' : audit.score >= 70 ? '#f59e0b' : '#dc2626'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>{getStatusBadge(audit.category)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={[
                          {
                            label: 'Inspect Audit Dossier',
                            icon: Eye,
                            color: '#059669',
                            onClick: () => setSelectedAudit(audit)
                          },
                          {
                            label: 'Approve & Issue Pass',
                            icon: CheckCircle2,
                            color: '#059669',
                            onClick: () => updateAuditCategory(audit.id, 'Passed')
                          },
                          {
                            label: 'Move to Review List',
                            icon: Clock,
                            color: '#d97706',
                            onClick: () => updateAuditCategory(audit.id, 'Review List')
                          },
                          {
                            label: 'Flag Other Fail (NC)',
                            icon: AlertTriangle,
                            color: '#ea580c',
                            onClick: () => updateAuditCategory(audit.id, 'Other Fail')
                          },
                          { divider: true },
                          {
                            label: 'Escalate Critical L3',
                            icon: AlertOctagon,
                            danger: true,
                            onClick: () => updateAuditCategory(audit.id, 'L3 Critical Fail')
                          }
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
          itemName="audits"
        />
      </div>

      {selectedAudit && (
        <AuditDetailModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      <NewAuditModal
        isOpen={isNewAuditOpen}
        onClose={() => setIsNewAuditOpen(false)}
      />
    </div>
  );
}
