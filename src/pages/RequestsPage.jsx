import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  Inbox, Store, Building2, Package, Search,
  CheckCircle2, XCircle, Plus, Clock, X
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

export default function RequestsPage() {
  const { requests, stores, franchisees, addRequest, updateRequestStatus } = useKfc();

  const [activeTab, setActiveTab] = useState('stores');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    categoryTab: 'stores',
    branchCode: stores[0]?.branchCode || 'KFC-8706',
    storeName: stores[0]?.name || 'Bolton - Derby Street',
    address: stores[0]?.address || '85 Derby Street, Bolton',
    franchisee: franchisees[0]?.name || 'Adil Group',
    requestType: 'New Store Halal Conversion',
    openingDate: new Date().toISOString().split('T')[0]
  });

  const storeRequests = requests.filter(r => !r.categoryTab || r.categoryTab === 'stores');
  const franchiseRequests = [
    ...requests.filter(r => r.categoryTab === 'franchise'),
    ...franchisees.slice(0, 12).map((f, i) => ({
      id: `fran-req-${f.id}`,
      branchCode: `FRN-${100 + i}`,
      storeName: f.name,
      address: `${f.address}, ${f.postcode}`,
      franchisee: f.name,
      requestType: i % 2 === 0 ? 'Corporate Contact & QA Representative Update' : 'Multi-Site Halal Renewal Application',
      date: f.dateEntered || '2026-02-15',
      openingDate: '2026-06-01',
      status: i < 3 ? 'Pending' : 'Approved'
    }))
  ];
  const productRequests = [
    ...requests.filter(r => r.categoryTab === 'products'),
    {
      id: 'prod-req-1',
      branchCode: 'PRD-8801',
      storeName: 'Spicy Zinger Marinade Batch #44',
      address: 'Telford UK Certified Facility (UK 4022 EC)',
      franchisee: 'KFC UK Supply Chain QA',
      requestType: 'New Ingredient Halal Clearance',
      date: '2026-03-10',
      openingDate: '2026-04-01',
      status: 'Pending'
    },
    {
      id: 'prod-req-2',
      branchCode: 'PRD-8802',
      storeName: 'Moy Park Fresh Halal 9-Piece Cuts',
      address: 'Craigavon Poultry Plant (NI 9012 EC)',
      franchisee: 'Moy Park Ltd',
      requestType: 'Slaughterhouse Certificate Annual Renewal',
      date: '2026-03-04',
      openingDate: '2026-03-20',
      status: 'Approved'
    },
    {
      id: 'prod-req-3',
      branchCode: 'PRD-8803',
      storeName: '100% Rapeseed Frying Shortening Oil',
      address: 'Cargill UK Refinery',
      franchisee: 'KFC UK Central Procurement',
      requestType: 'Supplier Specification Verification',
      date: '2026-02-25',
      openingDate: '2026-03-15',
      status: 'Approved'
    }
  ];

  const activeList = activeTab === 'stores' ? storeRequests : activeTab === 'franchise' ? franchiseRequests : productRequests;

  const pendingCount = activeList.filter(r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending')).length;
  const approvedCount = activeList.filter(r => r.status === 'Accepted' || r.status === 'Approved').length;
  const approvalPct = activeList.length > 0 ? Math.round((approvedCount / activeList.length) * 100) : 0;

  const filtered = activeList.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      r.storeName?.toLowerCase().includes(q) ||
      r.branchCode?.toLowerCase().includes(q) ||
      r.franchisee?.toLowerCase().includes(q) ||
      r.requestType?.toLowerCase().includes(q);

    const normalizedStatus = (r.status === 'Accepted' || r.status === 'Approved') ? 'Approved' : (r.status === 'Pending' || r.status?.toLowerCase().includes('pending')) ? 'Pending' : r.status;
    const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addRequest(form);
    setActiveTab(form.categoryTab);
    setCurrentPage(1);
    setIsModalOpen(false);
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Request List</h1>
          <div className="dash-subtitle">
            <span>Manage store, franchisee, and product requests</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card" onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Requests (Active Tab)</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Inbox size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{activeList.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Across {activeTab === 'stores' ? 'branch operations' : activeTab === 'franchise' ? 'franchise governance' : 'ingredient clearances'}</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Pending Review</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#d97706' }}>{pendingCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${activeList.length ? Math.round((pendingCount / activeList.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Awaiting HFA operations decision</span>
          </div>
        </div>

        <div className="dash-kpi-card" onClick={() => { setStatusFilter('Approved'); setCurrentPage(1); }}>
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Approved Requests</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value" style={{ color: '#059669' }}>{approvedCount}</span>
              <span className="dash-kpi-denom">({approvalPct}%)</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${approvalPct}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Cleared and authorized</span>
          </div>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div>
        <div className="segmented-tabs">
          <button
            type="button"
            onClick={() => { setActiveTab('stores'); setCurrentPage(1); }}
            className={`segmented-tab ${activeTab === 'stores' ? 'active' : ''}`}
          >
            <Store size={14} color="#059669" />
            <span>Request List (Store)</span>
            <span className="tabular-nums" style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 6, background: activeTab === 'stores' ? '#f1f5f9' : 'rgba(15,23,42,0.06)' }}>
              {storeRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('franchise'); setCurrentPage(1); }}
            className={`segmented-tab ${activeTab === 'franchise' ? 'active' : ''}`}
          >
            <Building2 size={14} color="#2563eb" />
            <span>Request List (Franchisee)</span>
            <span className="tabular-nums" style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 6, background: activeTab === 'franchise' ? '#f1f5f9' : 'rgba(15,23,42,0.06)' }}>
              {franchiseRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('products'); setCurrentPage(1); }}
            className={`segmented-tab ${activeTab === 'products' ? 'active' : ''}`}
          >
            <Package size={14} color="#d97706" />
            <span>Request List (Products)</span>
            <span className="tabular-nums" style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 6, background: activeTab === 'products' ? '#f1f5f9' : 'rgba(15,23,42,0.06)' }}>
              {productRequests.length}
            </span>
          </button>
        </div>
      </div>

      {/* Unified Requests Table Surface */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search request type, reference code, store or partner name..."
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference Code</th>
                <th>Target Site / Item Name</th>
                <th>Franchise / Partner</th>
                <th>Request Type</th>
                <th>Submitted</th>
                <th>Target Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No requests match your current filters.
                  </td>
                </tr>
              ) : (
                paginated.map((req, idx) => (
                  <tr key={`req-row-${req.id}-${idx}`}>
                    <td>
                      <span className="code-chip">{req.branchCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.storeName}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{req.address}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{req.franchisee}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {req.requestType}
                      </span>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600 }}>{req.date}</div>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', color: '#475569' }}>{req.openingDate || '-'}</div>
                    </td>
                    <td>
                      {req.status === 'Accepted' || req.status === 'Approved' ? (
                        <span className="badge badge-pass"><span className="badge-dot" /> Approved</span>
                      ) : req.status === 'Pending' || req.status?.toLowerCase().includes('pending') ? (
                        <span className="badge badge-warn"><span className="badge-dot" /> Pending Review</span>
                      ) : (
                        <span className="badge badge-fail"><span className="badge-dot" /> {req.status}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={[
                          {
                            label: 'Approve Request',
                            icon: CheckCircle2,
                            color: '#059669',
                            onClick: () => updateRequestStatus(req.id, 'Approved')
                          },
                          {
                            label: 'Mark Pending Review',
                            icon: Clock,
                            color: '#d97706',
                            onClick: () => updateRequestStatus(req.id, 'Pending')
                          },
                          { divider: true },
                          {
                            label: 'Reject Request',
                            icon: XCircle,
                            danger: true,
                            onClick: () => updateRequestStatus(req.id, 'Rejected')
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
          itemName="requests"
        />
      </div>

      {/* Submit New Request Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Inbox size={19} color="#059669" />
                <h3 className="card-title">Submit Store, Franchise or Product Request</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Request Category *</label>
                    <select
                      className="form-select"
                      value={form.categoryTab}
                      onChange={e => setForm({ ...form, categoryTab: e.target.value })}
                    >
                      <option value="stores">Store Request (Opening, Closure, Conversion)</option>
                      <option value="franchise">Franchise Request (Ownership, Contact)</option>
                      <option value="products">Product Clearance Inquiry</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Request Type *</label>
                    <select
                      className="form-select"
                      value={form.requestType}
                      onChange={e => setForm({ ...form, requestType: e.target.value })}
                    >
                      <option value="New Store Halal Conversion">New Store Halal Conversion</option>
                      <option value="New Branch Opening">New Branch Opening</option>
                      <option value="Temporary Refurbishment Closure">Temporary Refurbishment Closure</option>
                      <option value="Franchise Ownership Transfer">Franchise Ownership Transfer</option>
                      <option value="New Ingredient Halal Clearance">New Ingredient Halal Clearance</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Branch / Reference Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.branchCode}
                      onChange={e => setForm({ ...form, branchCode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Franchise Partner *</label>
                    <select
                      className="form-select"
                      value={form.franchisee}
                      onChange={e => setForm({ ...form, franchisee: e.target.value })}
                    >
                      {franchisees.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Store / Product Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.storeName}
                    onChange={e => setForm({ ...form, storeName: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Address / Facility Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Effective Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.openingDate}
                      onChange={e => setForm({ ...form, openingDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
