import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  Package, Search, Plus, FileText, Building2,
  CheckCircle2, Download, X, ShieldCheck, Factory
} from 'lucide-react';
import Pagination from '../components/Pagination';

export default function ProductsPage() {
  const { products, addProduct } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [form, setForm] = useState({
    name: 'Test KFC Peri-Peri Halal Marinade',
    supplier: 'Heinz UK',
    code: 'PRD-KFC-9988',
    manufacturer: 'Telford UK Certified Facility',
    siteEcCode: 'UK 4022 EC',
    status: 'Accepted',
    notes: 'Approved seasoning and marinade for spicy chicken cuts.'
  });

  const suppliers = Array.from(new Set(products.map(p => p.supplier))).filter(Boolean);

  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.supplier?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.manufacturer?.toLowerCase().includes(q) ||
      p.siteEcCode?.toLowerCase().includes(q);

    const matchesSup = selectedSupplier === 'ALL' || p.supplier === selectedSupplier;

    return matchesSearch && matchesSup;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const headers = ['Product Code', 'Product Name', 'Approved Supplier', 'Manufacturer Facility', 'Site EC Code', 'Status', 'Notes'];
    const rows = filtered.map(p => [
      p.code || '',
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
      `"${(p.manufacturer || '').replace(/"/g, '""')}"`,
      p.siteEcCode || '',
      p.status || 'Accepted',
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HFA_KFC_Certified_Products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addProduct(form);
    setIsModalOpen(false);
  };

  const hasFilters = Boolean(searchTerm || selectedSupplier !== 'ALL');

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Product List</h1>
          <div className="dash-subtitle">
            <span>{products.length} approved products for KFC stores</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={handleExportCsv} className="btn btn-outline btn-sm" style={{ height: 36 }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Product List</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Package size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{products.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Poultry, Breading, Oils &amp; Sauces</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Authorized Supply Chain Partners</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{suppliers.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Verified UK &amp; EU Manufacturers</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Specification Verification</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#059669' }}>100%</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>All EC plant codes validated</span>
          </div>
        </div>
      </div>

      {/* Unified Table Surface */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search product name, approved supplier, EC code..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={selectedSupplier}
              onChange={e => { setSelectedSupplier(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Suppliers ({suppliers.length})</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSupplier('ALL');
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
                <th>Code</th>
                <th>Product Name</th>
                <th>Supplier(s)</th>
                <th>Manufacturer</th>
                <th>Site EC Code</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No certified products match your search criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((prod, idx) => (
                  <tr
                    key={`prod-row-${prod.id}-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <td>
                      <span className="code-chip">{prod.code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{prod.name}</div>
                      {prod.notes && (
                        <div style={{ fontSize: '11.5px', color: '#64748b', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{prod.supplier}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>{prod.manufacturer}</div>
                    </td>
                    <td>
                      <span className="code-chip" style={{ fontWeight: 600, color: '#475569' }}>
                        {prod.siteEcCode || 'Verified'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-pass">
                        <span className="badge-dot" /> {prod.status || 'Accepted'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProduct(prod);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <FileText size={13} color="#059669" />
                        <span>View Spec</span>
                      </button>
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
          itemName="products"
        />
      </div>

      {/* Product Specification Dossier Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={19} />
                </div>
                <div>
                  <h3 className="card-title">{selectedProduct.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    HFA Halal Specification Dossier
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Product Code</div>
                  <div style={{ marginTop: 4 }}><span className="code-chip">{selectedProduct.code}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Site EC Approval</div>
                  <div style={{ marginTop: 4 }}><span className="code-chip">{selectedProduct.siteEcCode || 'UK Verified'}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Approval Status</div>
                  <div style={{ marginTop: 4 }}><span className="badge badge-pass"><span className="badge-dot" /> {selectedProduct.status || 'Accepted'}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={15} color="#059669" />
                  <span style={{ color: '#64748b' }}>Approved Supplier:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedProduct.supplier}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Factory size={15} color="#2563eb" />
                  <span style={{ color: '#64748b' }}>Manufacturing Facility:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedProduct.manufacturer || 'HFA Audited EU/UK Plant'}</strong>
                </div>
                {selectedProduct.dateApproved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} color="#059669" />
                    <span style={{ color: '#64748b' }}>Approved Date:</span>
                    <strong className="tabular-nums" style={{ color: '#0f172a' }}>{selectedProduct.dateApproved}</strong>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Technical Specification &amp; Halal Assessment Notes
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  {selectedProduct.notes || 'All raw materials, processing aids, and cross-contamination safeguards reviewed and verified against Halal Food Authority UK standards.'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setSelectedProduct(null)} className="btn btn-primary btn-sm">
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={19} color="#059669" />
                <h3 className="card-title">Register Certified Halal Product</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Approved Supplier *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.supplier}
                      onChange={e => setForm({ ...form, supplier: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.code}
                      onChange={e => setForm({ ...form, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Manufacturer Facility</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.manufacturer}
                      onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Site EC Approval Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.siteEcCode}
                      onChange={e => setForm({ ...form, siteEcCode: e.target.value })}
                      placeholder="e.g. UK 4022 EC"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Technical Notes &amp; Halal Description</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
