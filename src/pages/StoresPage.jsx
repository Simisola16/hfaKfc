import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  Store, Search, Plus, MapPin, User, Award, ClipboardCheck,
  Edit, Trash2, CheckCircle2, Clock, AlertTriangle, Download, X
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

  // Filter stores
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

  const certifiedCount = stores.filter(s => s.status === 'Passed').length;
  const dueCount = stores.filter(s => s.status === 'Due for Audit').length;
  const reviewCount = stores.filter(s => s.status === 'Under Review').length;

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
    <div>
      {/* KPI Summary Strip */}
      <div className="kpi-grid-4">
        <div className="metric-card" onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <div>
            <div className="metric-label">Total UK KFC Stores</div>
            <div className="metric-value">{stores.length}</div>
            <div className="metric-sub">Across {franchisees.length} Franchise Partners</div>
          </div>
          <div className="metric-icon-box blue"><Store size={22} /></div>
        </div>

        <div className="metric-card" onClick={() => { setSelectedStatus('Passed'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <div>
            <div className="metric-label">Certified Halal (Passed)</div>
            <div className="metric-value" style={{ color: '#059669' }}>{certifiedCount}</div>
            <div className="metric-sub">Active HFA Certificate Issued</div>
          </div>
          <div className="metric-icon-box green"><CheckCircle2 size={22} /></div>
        </div>

        <div className="metric-card" onClick={() => { setSelectedStatus('Under Review'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <div>
            <div className="metric-label">Under Supervisory Review</div>
            <div className="metric-value" style={{ color: '#2563eb' }}>{reviewCount}</div>
            <div className="metric-sub">Pending compliance sign-off</div>
          </div>
          <div className="metric-icon-box blue"><Clock size={22} /></div>
        </div>

        <div className="metric-card" onClick={() => { setSelectedStatus('Due for Audit'); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
          <div>
            <div className="metric-label">Scheduled / Due for Audit</div>
            <div className="metric-value" style={{ color: '#d97706' }}>{dueCount}</div>
            <div className="metric-sub">Next surveillance cycle</div>
          </div>
          <div className="metric-icon-box amber"><AlertTriangle size={22} /></div>
        </div>
      </div>

      {/* Table Toolbar / Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          {/* Search */}
          <div className="search-input-wrapper" style={{ flex: '1 1 260px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search branch code, store name, postcode, city..."
            />
          </div>

          {/* Filters & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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
              <option value="ALL">All Franchise Partners ({franchisees.length})</option>
              {franchisees.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Compliance Statuses</option>
              <option value="Passed">Certified Halal (Passed)</option>
              <option value="Due for Audit">Due for Audit</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Required">Action Required</option>
            </select>

            <button onClick={handleExportCsv} className="btn btn-outline" title="Export filtered stores to CSV">
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button onClick={() => setIsAddStoreOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Register Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Store / Branch Name</th>
                <th>Address & Postcode</th>
                <th>Franchise Partner</th>
                <th>Compliance Status</th>
                <th>Last Inspected</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((store) => (
                <tr key={store.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'var(--slate-900)',
                      background: 'var(--slate-100)',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      {store.branchCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {store.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: 2 }}>
                      <User size={12} />
                      <span>{store.contactPerson} ({store.contactPhone})</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <MapPin size={14} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div>{store.address}</div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-500)' }}>{store.postcode}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {store.franchisee}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(store.status)}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{store.lastAuditDate}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Next: {store.nextAuditDueDate}</div>
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
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={19} color="#059669" />
                <h3 className="card-title">Edit KFC Store — {editingStore.branchCode}</h3>
              </div>
              <button onClick={() => setEditingStore(null)} className="btn btn-ghost btn-sm">
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
