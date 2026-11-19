import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  ClipboardCheck, Clock, CheckCircle2, AlertTriangle, AlertOctagon,
  Search, Plus, Eye, Download, TrendingUp
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
        return <span className="badge badge-warn"><span className="badge-dot" /> Review</span>;
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

  return (
    <div>
      {/* KPI Summary Strip */}
      <div className="kpi-grid-4">
        <div className="metric-card">
          <div>
            <div className="metric-label">Matching Audits</div>
            <div className="metric-value">{filtered.length}</div>
            <div className="metric-sub">Out of {audits.length} total reports</div>
          </div>
          <div className="metric-icon-box blue"><ClipboardCheck size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Passed & Certified</div>
            <div className="metric-value" style={{ color: '#059669' }}>
              {audits.filter(a => a.category === 'Passed').length}
            </div>
            <div className="metric-sub">100% HFA Standard Met</div>
          </div>
          <div className="metric-icon-box green"><CheckCircle2 size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Awaiting Sign-Off</div>
            <div className="metric-value" style={{ color: '#d97706' }}>
              {audits.filter(a => a.category === 'Recommend For Pass' || a.category === 'Review List').length}
            </div>
            <div className="metric-sub">RFP & Review List Queue</div>
          </div>
          <div className="metric-icon-box amber"><Clock size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Average Inspection Score</div>
            <div className="metric-value" style={{ color: '#0f172a' }}>{avgScore}%</div>
            <div className="metric-sub">Current filtered view</div>
          </div>
          <div className="metric-icon-box green"><TrendingUp size={22} /></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => handleTabClick('ALL', '/audits')}
          className={`tab-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
        >
          <ClipboardCheck size={16} />
          <span>All Audits ({audits.length})</span>
        </button>

        <button
          onClick={() => handleTabClick('Recommend For Pass', '/audits/recommend-pass')}
          className={`tab-btn ${activeCategory === 'Recommend For Pass' ? 'active' : ''}`}
        >
          <Clock size={16} color="#2563eb" />
          <span>Recommend For Pass ({audits.filter(a => a.category === 'Recommend For Pass').length})</span>
        </button>

        <button
          onClick={() => handleTabClick('Review List', '/audits/review')}
          className={`tab-btn ${activeCategory === 'Review List' ? 'active' : ''}`}
        >
          <Clock size={16} color="#d97706" />
          <span>Review List ({audits.filter(a => a.category === 'Review List').length})</span>
        </button>

        <button
          onClick={() => handleTabClick('Passed', '/audits/passed')}
          className={`tab-btn ${activeCategory === 'Passed' ? 'active' : ''}`}
        >
          <CheckCircle2 size={16} color="#059669" />
          <span>Passed ({audits.filter(a => a.category === 'Passed').length})</span>
        </button>

        <button
          onClick={() => handleTabClick('Other Fail', '/audits/other-fail')}
          className={`tab-btn ${activeCategory === 'Other Fail' ? 'active' : ''}`}
        >
          <AlertTriangle size={16} color="#ea580c" />
          <span>Other Fail ({audits.filter(a => a.category === 'Other Fail').length})</span>
        </button>

        <button
          onClick={() => handleTabClick('L3 Critical Fail', '/audits/critical-fail')}
          className={`tab-btn ${activeCategory === 'L3 Critical Fail' ? 'active' : ''}`}
        >
          <AlertOctagon size={16} color="#dc2626" />
          <span>Critical L3 ({audits.filter(a => a.category === 'L3 Critical Fail').length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 260px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search store name, branch code, auditor, franchisee..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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

            <button onClick={handleExportCsv} className="btn btn-outline">
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button onClick={() => setIsNewAuditOpen(true)} className="btn btn-kfc">
              <Plus size={16} />
              <span>Record Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audits Table */}
      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Store / Branch Name</th>
                <th>Auditor</th>
                <th>Franchise Partner</th>
                <th>Inspection Date</th>
                <th>Score</th>
                <th>Status Category</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((audit) => (
                <tr key={audit.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAudit(audit)}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      background: 'var(--slate-100)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      {audit.branchCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {audit.storeName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                      {audit.address}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {audit.auditor}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                      {audit.session}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{audit.franchisee}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{audit.auditDate}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{audit.timeIn} - {audit.timeOut}</div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: audit.score >= 85 ? '#059669' : audit.score >= 70 ? '#b45309' : '#b91c1c'
                    }}>
                      {audit.score}%
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(audit.category)}
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filtered.length}
          currentPage={currentPage}
          rowsPerPage={pageSize}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setPageSize}
        />
      </div>

      {/* Modals */}
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
