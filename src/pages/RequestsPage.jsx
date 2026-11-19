import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { Inbox, Store, Building2, Package, Search, CheckCircle2, XCircle, Plus, Clock } from 'lucide-react';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

export default function RequestsPage() {
  const { requests, stores, franchisees, addRequest, updateRequestStatus } = useKfc();

  const [activeTab, setActiveTab] = useState('stores');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Categorize requests by tab
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

  const filtered = activeList.filter(r => {
    const q = searchTerm.toLowerCase();
    return !q ||
      r.storeName?.toLowerCase().includes(q) ||
      r.branchCode?.toLowerCase().includes(q) ||
      r.franchisee?.toLowerCase().includes(q) ||
      r.requestType?.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addRequest(form);
    setActiveTab(form.categoryTab);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => { setActiveTab('stores'); setCurrentPage(1); }}
          className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
        >
          <Store size={16} />
          <span>Store Requests (Opening, Closure, Conversion) ({storeRequests.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('franchise'); setCurrentPage(1); }}
          className={`tab-btn ${activeTab === 'franchise' ? 'active' : ''}`}
        >
          <Building2 size={16} />
          <span>Franchise Requests (Ownership, Contact) ({franchiseRequests.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('products'); setCurrentPage(1); }}
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          <Package size={16} />
          <span>Product Clearance & Change Inquiries ({productRequests.length})</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search request type, branch code, store or partner name..."
            />
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Submit New Request</span>
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference Code</th>
                <th>Target Site / Item Name</th>
                <th>Franchise / Partner</th>
                <th>Request Type</th>
                <th>Submission Date</th>
                <th>Target Date</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((req) => (
                <tr key={req.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: 'var(--slate-100)',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      {req.branchCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{req.storeName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{req.address}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.franchisee}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                      {req.requestType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{req.date}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{req.openingDate || '-'}</div>
                  </td>
                  <td>
                    {req.status === 'Accepted' || req.status === 'Approved' ? (
                      <span className="badge badge-pass"><span className="badge-dot" /> Approved</span>
                    ) : req.status === 'Pending' ? (
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

      {/* Submit New Request Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Inbox size={20} color="#059669" />
                <h3 className="card-title">Submit Store, Franchise or Product Request</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                ×
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
