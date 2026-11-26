import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  Building2, Search, Plus, Store, Phone, MapPin,
  User, CheckCircle2, ArrowRight, Download, X
} from 'lucide-react';

export default function FranchiseesPage() {
  const navigate = useNavigate();
  const { franchisees, stores, addFranchisee } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('branches');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: 'Test KFC Franchise Group Ltd',
    address: '12 Commercial Road, London',
    postcode: 'E1 1LP',
    contactPerson: 'Taoheed Operations Director',
    phone: '+44 20 7183 9900'
  });

  // Compute live branch count & certified count per franchise partner from stores
  const storeMetricsByFran = useMemo(() => {
    const map = {};
    stores.forEach(s => {
      const k = s.franchisee || 'Independent';
      if (!map[k]) map[k] = { total: 0, passed: 0 };
      map[k].total += 1;
      if (s.status === 'Passed' || s.halalCertified) map[k].passed += 1;
    });
    return map;
  }, [stores]);

  const enrichedList = useMemo(() => {
    return franchisees.map(f => {
      const m = storeMetricsByFran[f.name];
      const totalBranches = m?.total || f.storesCount || 0;
      const certifiedBranches = m ? m.passed : totalBranches;
      const compliancePct = totalBranches > 0 ? Math.round((certifiedBranches / totalBranches) * 100) : 100;
      return { ...f, totalBranches, certifiedBranches, compliancePct };
    });
  }, [franchisees, storeMetricsByFran]);

  const totalCertified = stores.filter(s => s.status === 'Passed' || s.halalCertified).length;
  const networkCertPct = stores.length > 0 ? ((totalCertified / stores.length) * 100).toFixed(1) : '100.0';

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const matched = enrichedList.filter(f =>
      !q ||
      f.name?.toLowerCase().includes(q) ||
      f.address?.toLowerCase().includes(q) ||
      f.postcode?.toLowerCase().includes(q) ||
      f.contactPerson?.toLowerCase().includes(q)
    );
    return matched.sort((a, b) => {
      if (sortBy === 'compliance') return b.compliancePct - a.compliancePct;
      if (sortBy === 'alpha') return (a.name || '').localeCompare(b.name || '');
      return b.totalBranches - a.totalBranches;
    });
  }, [enrichedList, searchTerm, sortBy]);

  const handleExportCsv = () => {
    const headers = ['Franchise Partner', 'Headquarters Address', 'Postcode', 'Contact Person', 'Phone', 'Registered Branches', 'Certified Branches', 'Compliance %', 'Status'];
    const rows = filtered.map(f => [
      `"${(f.name || '').replace(/"/g, '""')}"`,
      `"${(f.address || '').replace(/"/g, '""')}"`,
      f.postcode || '',
      `"${(f.contactPerson || '').replace(/"/g, '""')}"`,
      f.phone || '',
      f.totalBranches,
      f.certifiedBranches,
      `${f.compliancePct}%`,
      f.status || 'Active'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HFA_KFC_Franchisees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addFranchisee(form);
    setIsModalOpen(false);
  };

  const getInitials = (name) => {
    const words = String(name || 'KF').trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return String(name || 'KF').slice(0, 2).toUpperCase();
  };

  return (
    <div className="page-shell">
      {/* Executive Page Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Franchisee List</h1>
          <div className="dash-subtitle">
            <span>{franchisees.length} KFC franchisee accounts</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>New Franchisee</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Bento Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Registered Partners</span>
            <div className="dash-kpi-icon" style={{ background: '#fef2f2', color: '#e4002b' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{franchisees.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#e4002b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>UK &amp; Ireland corporate entities</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => navigate('/stores')}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Operated Branches</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Store size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{stores.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Under HFA Halal supervision</span>
            <ArrowRight size={13} color="#94a3b8" />
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Network Certification Rate</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{networkCertPct}%</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${Math.min(100, Number(networkCertPct))}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>{totalCertified} of {stores.length} branches currently certified</span>
          </div>
        </div>
      </div>

      {/* Filter & Sort Toolbar Card */}
      <div className="dash-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 440 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search franchisee name, contact person, city, postcode..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sort by:</span>
            <select
              className="filter-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="branches">Most Branches</option>
              <option value="compliance">Highest Compliance %</option>
              <option value="alpha">Alphabetical A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Franchise Grid */}
      {filtered.length === 0 ? (
        <div className="page-surface empty-state">
          No Franchise match your search criteria.
        </div>
      ) : (
        <div className="card-grid-3">
          {filtered.map((fran, idx) => (
            <div
              key={`fran-card-${fran.id}-${idx}`}
              className="dash-card"
              style={{ justifyContent: 'space-between', gap: 16 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {getInitials(fran.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        {fran.name}
                      </h3>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                        Partner since {fran.dateEntered || '2024'}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-pass" style={{ flexShrink: 0 }}>
                    <span className="badge-dot" /> {fran.status || 'Active'}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <MapPin size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{fran.address}{fran.postcode ? `, ${fran.postcode}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} color="#64748b" style={{ flexShrink: 0 }} />
                    <span>{fran.contactPerson || 'Operations Lead'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} color="#64748b" style={{ flexShrink: 0 }} />
                    <span className="tabular-nums">{fran.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* Live Halal Compliance Ratio Bar */}
                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: 6 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Branch Compliance Standing</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>
                      {fran.certifiedBranches} / {fran.totalBranches} ({fran.compliancePct}%)
                    </span>
                  </div>
                  <div style={{ height: 5, width: '100%', background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${fran.compliancePct}%`, height: '100%', background: '#059669', borderRadius: 999 }} />
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #f1f5f9'
              }}>
                <span className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  {fran.totalBranches} Registered {fran.totalBranches === 1 ? 'Store' : 'Stores'}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/stores?franchisee=${encodeURIComponent(fran.name)}`)}
                  className="btn btn-outline btn-sm"
                >
                  <Store size={13} />
                  <span>View Branches</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Franchise Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={19} color="#059669" />
                <h3 className="card-title">New Franchisee</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Franchise Company Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Corporate Headquarters Address *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Postal Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.postcode}
                      onChange={e => setForm({ ...form, postcode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operations Contact Person</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Telephone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Franchise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
