import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  Store, Search, Plus, MapPin, User, Award, ClipboardCheck,
  Edit, Trash2, CheckCircle2, Clock, AlertTriangle, Download, X, ChevronRight
} from 'lucide-react';
import NewStoreModal from '../components/NewStoreModal';
import NewAuditModal from '../components/NewAuditModal';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

export default function StoresPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stores, franchisees, updateStore, deleteStore } = useKfc();

  const initialFran = searchParams.get('franchisee') || 'ALL';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState(initialFran);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [auditStoreId, setAuditStoreId] = useState(null);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    const f = searchParams.get('franchisee');
    if (f) {
      setSelectedFranchise(f);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const filtered = stores.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.branchCode?.toLowerCase().includes(q) ||
      s.postcode?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.franchisee?.toLowerCase().includes(q);

    const matchesFran = selectedFranchise === 'ALL' || s.franchisee === selectedFranchise;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

    return matchesSearch && matchesFran && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const certifiedCount = stores.filter(s => s.status === 'Passed' || s.halalCertified).length;
  const dueCount = stores.filter(s => s.status === 'Due for Audit').length;
  const reviewCount = stores.filter(s => s.status === 'Under Review').length;
  const certifiedPct = stores.length > 0 ? Math.round((certifiedCount / stores.length) * 100) : 0;
  const hasFilters = Boolean(searchTerm || selectedFranchise !== 'ALL' || selectedStatus !== 'ALL');

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFranchise('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
    if (searchParams.has('franchisee')) {
      searchParams.delete('franchisee');
      setSearchParams(searchParams);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Branch Code', 'Store Name', 'Franchise Partner', 'Address', 'Postcode', 'Contact Person', 'Phone', 'Status', 'Last Audit Date'];
    const rows = filtered.map(s => [
      s.branchCode,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.franchisee || '').replace(/"/g, '""')}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.postcode,
      `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
      s.contactPhone,
      s.status,
      s.lastAuditDate
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HFA_KFC_Stores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Passed':
        return <span className="badge badge-pass"><span className="badge-dot" /> Certified Halal</span>;
      case 'Due for Audit':
        return <span className="badge badge-warn"><span className="badge-dot" /> Audit Due</span>;
      case 'Under Review':
        return <span className="badge badge-blue"><span className="badge-dot" /> Under Review</span>;
      case 'Critical Fail':
      case 'Action Required':
        return <span className="badge badge-fail"><span className="badge-dot" /> Action Required</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingStore) return;
    updateStore(editingStore.id, editingStore);
    setEditingStore(null);
  };

  return (
    <div className="page-shell">
      {/* Executive Page Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">KFC Store Directory</h1>
          <div className="dash-subtitle">
            <span>Master registry of {stores.length} UK certified KFC restaurants across {franchisees.length} Franchise</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsAddStoreOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Register Store</span>
          </button>
        </div>
      </div>

      {/* 4 Precision Clickable Filter KPI Cards */}
      <div className="dash-kpi-grid">
        <div
          className={`dash-kpi-card ${selectedStatus === 'ALL' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total UK KFC Stores</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Store size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value">{stores.length}</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Across {franchisees.length} Franchise</span>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Passed' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Passed'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Certified Halal</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value">{certifiedCount}</span>
              <span className="dash-kpi-denom">/ {stores.length}</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${certifiedPct}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>{certifiedPct}% active HFA certificate</span>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Under Review' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Under Review'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Under Review</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value">{reviewCount}</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${stores.length ? Math.round((reviewCount / stores.length) * 100) : 0}%`, background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Pending compliance sign-off</span>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Due for Audit' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Due for Audit'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Due for Audit</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value">{dueCount}</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${stores.length ? Math.round((dueCount / stores.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Next surveillance cycle queue</span>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
        </div>
      </div>

      {/* Unified Table Surface with Integrated Toolbar */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search branch code, store name, postcode, city..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={selectedFranchise}
              onChange={e => {
                setSelectedFranchise(e.target.value);
                setCurrentPage(1);
                if (e.target.value === 'ALL') {
                  searchParams.delete('franchisee');
                  setSearchParams(searchParams);
                }
              }}
            >
              <option value="ALL">All Franchise ({franchisees.length})</option>
              {franchisees.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Passed">Certified Halal (Passed)</option>
              <option value="Due for Audit">Due for Audit</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Required">Action Required</option>
            </select>

            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">
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
                <th>Store / Contact</th>
                <th>Address &amp; Postcode</th>
                <th>Franchise Partner</th>
                <th>Compliance Status</th>
                <th>Last Inspected</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No KFC branches match your current filters.
                  </td>
                </tr>
              ) : (
                paginated.map((store, idx) => (
                  <tr key={`store-row-${store.id}-${idx}`}>
                    <td>
                      <span className="code-chip">{store.branchCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{store.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 2 }}>
                        <User size={12} />
                        <span>{store.contactPerson} ({store.contactPhone})</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px' }}>
                        <MapPin size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ color: '#334155' }}>{store.address}</div>
                          <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#64748b' }}>{store.postcode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{store.franchisee}</div>
                    </td>
                    <td>{getStatusBadge(store.status)}</td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>{store.lastAuditDate}</div>
                      <div className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b' }}>Next: {store.nextAuditDueDate}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={[
                          {
                            label: 'Conduct Halal Audit',
                            icon: ClipboardCheck,
                            color: '#e4002b',
                            onClick: () => setAuditStoreId(store.id)
                          },
                          {
                            label: 'View / Print Certificate',
                            icon: Award,
                            color: '#059669',
                            onClick: () => navigate(`/certificates?storeId=${encodeURIComponent(store.id)}`)
                          },
                          {
                            label: 'Edit Store Details',
                            icon: Edit,
                            color: '#2563eb',
                            onClick: () => setEditingStore({ ...store })
                          },
                          {
                            label: 'Locate on UK Map',
                            icon: MapPin,
                            color: '#059669',
                            onClick: () => navigate('/map')
                          },
                          { divider: true },
                          {
                            label: 'Delete Store',
                            icon: Trash2,
                            danger: true,
                            onClick: () => deleteStore(store.id)
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
          itemName="stores"
        />
      </div>

      <NewStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
      />

      {auditStoreId && (
        <NewAuditModal
          isOpen={Boolean(auditStoreId)}
          onClose={() => setAuditStoreId(null)}
          defaultStoreId={auditStoreId}
        />
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="modal-backdrop" onClick={() => setEditingStore(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="#059669" />
                <h3 className="card-title">Edit KFC Store — {editingStore.branchCode}</h3>
              </div>
              <button type="button" onClick={() => setEditingStore(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Branch Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editingStore.branchCode || ''}
                      onChange={e => setEditingStore({ ...editingStore, branchCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Store / Branch Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editingStore.name || ''}
                      onChange={e => setEditingStore({ ...editingStore, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Franchise Partner *</label>
                    <select
                      className="form-select"
                      value={editingStore.franchisee || ''}
                      onChange={e => setEditingStore({ ...editingStore, franchisee: e.target.value })}
                    >
                      {franchisees.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Compliance Status *</label>
                    <select
                      className="form-select"
                      value={editingStore.status || 'Passed'}
                      onChange={e => setEditingStore({ ...editingStore, status: e.target.value, halalCertified: e.target.value === 'Passed' })}
                    >
                      <option value="Passed">Certified Halal (Passed)</option>
                      <option value="Due for Audit">Due for Audit</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Action Required">Action Required</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingStore.address || ''}
                    onChange={e => setEditingStore({ ...editingStore, address: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Postcode *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editingStore.postcode || ''}
                      onChange={e => setEditingStore({ ...editingStore, postcode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingStore.contactPerson || ''}
                      onChange={e => setEditingStore({ ...editingStore, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telephone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingStore.contactPhone || ''}
                      onChange={e => setEditingStore({ ...editingStore, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingStore(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Store Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
