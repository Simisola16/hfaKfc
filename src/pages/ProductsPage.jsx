import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { Package, Search, Plus, FileText, Building2, CheckCircle2 } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function ProductsPage() {
  const { products, addProduct } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      p.manufacturer?.toLowerCase().includes(q);

    const matchesSup = selectedSupplier === 'ALL' || p.supplier === selectedSupplier;

    return matchesSearch && matchesSup;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addProduct(form);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* KPI Summary Strip */}
      <div className="kpi-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="metric-card">
          <div>
            <div className="metric-label">Approved Halal Products</div>
            <div className="metric-value">{products.length}</div>
            <div className="metric-sub">Poultry, Breading, Oils & Sauces</div>
          </div>
          <div className="metric-icon-box green"><Package size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Authorized Supply Chain Partners</div>
            <div className="metric-value">{suppliers.length}</div>
            <div className="metric-sub">Verified UK & EU Manufacturers</div>
          </div>
          <div className="metric-icon-box blue"><Building2 size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Specification Verification</div>
            <div className="metric-value" style={{ color: '#059669' }}>100%</div>
            <div className="metric-sub">All EC plant codes validated</div>
          </div>
          <div className="metric-icon-box green"><CheckCircle2 size={22} /></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 280px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search product name, approved supplier, EC code..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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

            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Register Halal Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product / Ingredient Name</th>
                <th>Approved Supplier</th>
                <th>Manufacturer Facility</th>
                <th>Site EC Code</th>
                <th>Status</th>
                <th>Specifications</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((prod) => (
                <tr key={prod.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: 'var(--slate-100)',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px'
                    }}>
                      {prod.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {prod.name}
                    </div>
                    {prod.notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {prod.supplier}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{prod.manufacturer}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                      {prod.siteEcCode}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-pass">
                      <span className="badge-dot" /> {prod.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                      <FileText size={14} />
                      <span>Verified HFA Spec</span>
                    </div>
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

      {/* New Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="#059669" />
                <h3 className="card-title">Register Approved Halal Product</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                ×
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
                  <label className="form-label">Technical Notes & Halal Description</label>
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
