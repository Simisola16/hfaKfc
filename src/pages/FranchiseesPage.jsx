import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import { Building2, Search, Plus, Store, Phone, MapPin, User, CheckCircle2 } from 'lucide-react';

export default function FranchiseesPage() {
  const navigate = useNavigate();
  const { franchisees, stores, addFranchisee } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: 'Test KFC Franchise Group Ltd',
    address: '12 Commercial Road, London',
    postcode: 'E1 1LP',
    contactPerson: 'Taoheed Operations Director',
    phone: '+44 20 7183 9900'
  });

  const filtered = franchisees.filter(f =>
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.postcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addFranchisee(form);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* KPI Summary Strip */}
      <div className="kpi-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="metric-card">
          <div>
            <div className="metric-label">Registered Franchise Partners</div>
            <div className="metric-value">{franchisees.length}</div>
            <div className="metric-sub">UK & Ireland Corporate Entities</div>
          </div>
          <div className="metric-icon-box red"><Building2 size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Total Operated KFC Branches</div>
            <div className="metric-value">{stores.length}</div>
            <div className="metric-sub">Under HFA Halal Supervision</div>
          </div>
          <div className="metric-icon-box blue"><Store size={22} /></div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Active Partner Standing</div>
            <div className="metric-value" style={{ color: '#059669' }}>100%</div>
            <div className="metric-sub">All franchise agreements active</div>
          </div>
          <div className="metric-icon-box green"><CheckCircle2 size={22} /></div>
        </div>
      </div>

      {/* Action & Search Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search franchisee name, contact person, city, postcode..."
            />
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Register Franchise Partner</span>
          </button>
        </div>
      </div>

      {/* Grid of Franchise Partners */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '1.25rem'
      }}>
        {filtered.map((fran) => {
          const liveStoreCount = stores.filter(s => s.franchisee === fran.name).length || fran.storesCount || 0;
          return (
            <div key={fran.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--kfc-light)',
                      color: 'var(--kfc-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {fran.name}
                      </h3>
                      <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                        Registered: {fran.dateEntered}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-pass">
                    <span className="badge-dot" /> {fran.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', lineHeight: '1.6', margin: '0.85rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <MapPin size={14} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{fran.address}, {fran.postcode}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <User size={14} color="var(--slate-500)" />
                    <span>{fran.contactPerson}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Phone size={14} color="var(--slate-500)" />
                    <span>{fran.phone}</span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--slate-100)',
                marginTop: '0.5rem'
              }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                  {liveStoreCount} Registered Stores
                </div>

                <button
                  onClick={() => navigate(`/stores?franchisee=${encodeURIComponent(fran.name)}`)}
                  className="btn btn-outline btn-sm"
                  title="Filter store directory by this franchisee"
                >
                  <Store size={14} />
                  <span>View Branches</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Franchise Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="#059669" />
                <h3 className="card-title">Register New KFC Franchise Partner</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                ×
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
