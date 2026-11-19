import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { ShieldAlert, Plus, CheckCircle2, XCircle, Search, FileText } from 'lucide-react';

export default function AppealsPage() {
  const { appeals, stores, addAppeal, updateAppealStatus } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
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

  const filtered = appeals.filter(ap =>
    ap.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ap.auditorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ap.storeAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ap.reasons?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div>
      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search branch code, auditor, appeal grounds..."
            />
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-kfc">
            <Plus size={16} />
            <span>File Audit Appeal</span>
          </button>
        </div>
      </div>

      {/* Appeals List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((appeal) => (
          <div key={appeal.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      background: 'var(--slate-100)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      {appeal.branchCode}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                      Filed: {appeal.appealDate}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--slate-900)' }}>
                    {appeal.storeAddress}
                  </h3>
                </div>

                <span className={`badge ${appeal.status === 'Resolved' || appeal.status === 'Upheld' ? 'badge-pass' : appeal.status === 'Dismissed' ? 'badge-fail' : 'badge-warn'}`}>
                  <span className="badge-dot" /> {appeal.status}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
                <div><strong>Auditor:</strong> {appeal.auditorName} • <strong>Inspection Date:</strong> {appeal.appealDate}</div>
                <div><strong>Appellant:</strong> {appeal.submittedBy}</div>
              </div>

              <div style={{
                background: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                color: 'var(--slate-700)',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: 'var(--slate-900)' }}>
                  Grounds for Appeal:
                </div>
                <div>{appeal.reasons}</div>
              </div>

              {appeal.evidence && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  color: '#059669',
                  fontWeight: 600,
                  marginBottom: '1rem'
                }}>
                  <FileText size={14} />
                  <span>Evidence: {appeal.evidence}</span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--slate-100)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                Committee Decision
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {appeal.status !== 'Upheld' && (
                  <button
                    onClick={() => updateAppealStatus(appeal.id, 'Upheld')}
                    className="btn btn-outline btn-sm"
                  >
                    <CheckCircle2 size={13} color="#059669" />
                    <span>Uphold Appeal</span>
                  </button>
                )}

                {appeal.status !== 'Dismissed' && (
                  <button
                    onClick={() => updateAppealStatus(appeal.id, 'Dismissed')}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444' }}
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

      {/* New Appeal Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#e4002b" />
                <h3 className="card-title">File Halal Audit Appeal</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                ×
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
                  <label className="form-label">Grounds & Reasons for Appeal *</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    value={form.reasons}
                    onChange={e => setForm({ ...form, reasons: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supporting Evidence & Supplier Documents</label>
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
