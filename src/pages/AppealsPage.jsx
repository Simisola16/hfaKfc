import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  ShieldAlert, Plus, CheckCircle2, XCircle,
  Search, FileText, Clock, X, User, Calendar
} from 'lucide-react';

export default function AppealsPage() {
  const { appeals, stores, addAppeal, updateAppealStatus } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    storeId: String(stores[0]?.id || '1'),
    storeName: stores[0]?.name || 'Bolton - Derby Street',
    franchisee: stores[0]?.franchisee || 'Adil Group',
    auditorName: 'Rashid',
    branchCode: stores[0]?.branchCode || 'KFC-8706',
    storeAddress: stores[0]?.address || '85 Derby Street, Bolton',
    appealDate: new Date().toISOString().split('T')[0],
    reasons: 'Delivery seal note was temporarily misfiled in receiving office during auditor visit; seal intactness confirmed with Moy Park delivery manifest.',
    evidence: 'Moy Park Certified Halal Delivery Note & CCTV Seal Log #MP-4401',
    submittedBy: 'Franchise QA Lead'
  });

  const investigatingCount = appeals.filter(a => a.status === 'Under Investigation').length;
  const resolvedCount = appeals.filter(a => a.status === 'Upheld' || a.status === 'Resolved' || a.status === 'Dismissed').length;

  const filtered = appeals.filter(ap => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      ap.branchCode?.toLowerCase().includes(q) ||
      ap.auditorName?.toLowerCase().includes(q) ||
      ap.storeAddress?.toLowerCase().includes(q) ||
      ap.reasons?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || ap.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addAppeal(form);
    setIsModalOpen(false);
  };

  const handleStoreChange = (e) => {
    const sId = String(e.target.value);
    const s = stores.find(st => String(st.id) === sId);
    if (s) {
      setForm({
        ...form,
        storeId: sId,
        storeName: s.name,
        franchisee: s.franchisee,
        branchCode: s.branchCode,
        storeAddress: s.address
      });
    }
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Auditor Appeals Hub</h1>
          <div className="dash-subtitle">
            <span>Formal compliance disputes filed by KFC franchise QA leads with documentary verification</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-kfc btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>File Audit Appeal</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card" onClick={() => setStatusFilter('ALL')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Filed Appeals</span>
            <div className="dash-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{appeals.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#dc2626' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>All formal audit disputes logged</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => setStatusFilter('Under Investigation')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Under Investigation</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#d97706' }}>{investigatingCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${appeals.length ? Math.round((investigatingCount / appeals.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Awaiting appeals committee ruling</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => setStatusFilter('Upheld')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Resolved &amp; Adjudicated</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#059669' }}>{resolvedCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${appeals.length ? Math.round((resolvedCount / appeals.length) * 100) : 0}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Upheld or formally dismissed</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="dash-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 440 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search branch code, auditor, appeal grounds..."
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Committee Statuses</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Upheld">Upheld</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Appeals Case Grid */}
      {filtered.length === 0 ? (
        <div className="page-surface empty-state">
          No audit appeals match your filter criteria.
        </div>
      ) : (
        <div className="card-grid-3">
          {filtered.map((appeal, idx) => (
            <div
              key={`appeal-card-${appeal.id}-${idx}`}
              className="dash-card"
              style={{ justifyContent: 'space-between', gap: 14 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="code-chip">{appeal.branchCode}</span>
                      <span className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {appeal.appealDate}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: 8, color: '#0f172a' }}>
                      {appeal.storeAddress}
                    </h3>
                  </div>

                  <span className={`badge ${appeal.status === 'Resolved' || appeal.status === 'Upheld' ? 'badge-pass' : appeal.status === 'Dismissed' ? 'badge-fail' : 'badge-warn'}`}>
                    <span className="badge-dot" /> {appeal.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <User size={13} color="#64748b" /> Auditor: <strong style={{ color: '#0f172a' }}>{appeal.auditorName}</strong>
                  </span>
                  <span>•</span>
                  <span>Appellant: <strong style={{ color: '#0f172a' }}>{appeal.submittedBy}</strong></span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12.5px',
                  lineHeight: 1.55,
                  color: '#334155',
                  marginBottom: 10
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: 4 }}>
                    Grounds for Appeal
                  </div>
                  <div>{appeal.reasons}</div>
                </div>

                {appeal.evidence && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#047857',
                    fontWeight: 600,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0'
                  }}>
                    <FileText size={14} style={{ flexShrink: 0 }} />
                    <span>{appeal.evidence}</span>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #f1f5f9'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Committee Decision
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {appeal.status !== 'Upheld' && (
                    <button
                      type="button"
                      onClick={() => updateAppealStatus(appeal.id, 'Upheld')}
                      className="btn btn-outline btn-sm"
                    >
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Uphold</span>
                    </button>
                  )}

                  {appeal.status !== 'Dismissed' && (
                    <button
                      type="button"
                      onClick={() => updateAppealStatus(appeal.id, 'Dismissed')}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#dc2626' }}
                    >
                      <XCircle size={13} />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Appeal Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={19} color="#dc2626" />
                <h3 className="card-title">File Halal Audit Appeal</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">KFC Store Branch *</label>
                  <select
                    className="form-select"
                    value={String(form.storeId)}
                    onChange={handleStoreChange}
                  >
                    {stores.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.branchCode} — {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Inspecting Auditor *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.auditorName}
                      onChange={e => setForm({ ...form, auditorName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Audit Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.appealDate}
                      onChange={e => setForm({ ...form, appealDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Grounds &amp; Reasons for Appeal *</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    value={form.reasons}
                    onChange={e => setForm({ ...form, reasons: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supporting Evidence &amp; Supplier Documents</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.evidence}
                    onChange={e => setForm({ ...form, evidence: e.target.value })}
                    placeholder="e.g. Supplier Manifest Note #1002, Batch Certificate"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-kfc">
                  Submit Formal Appeal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
