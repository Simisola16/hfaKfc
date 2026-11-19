import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { X, Store, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewStoreModal({ isOpen, onClose }) {
  const { franchisees, addStore } = useKfc();
  const [geocoding, setGeocoding] = useState(false);

  const [form, setForm] = useState({
    branchCode: 'KFC-TEST-' + Math.floor(100 + Math.random() * 900),
    name: 'Test KFC Branch - High Street',
    address: '100 High Street, Test City',
    postcode: 'BL3 6HE',
    franchisee: franchisees[0]?.name || 'Adil Group',
    franchiseeId: String(franchisees[0]?.id || '8'),
    contactPerson: 'Taoheed / Test Manager',
    contactPhone: '+44 20 7946 0999',
    lat: 53.57289,
    lng: -2.43479,
    status: 'Due for Audit',
    halalCertified: true
  });

  if (!isOpen) return null;

  const handleLookupPostcode = async (pcInput) => {
    const pc = (pcInput || form.postcode || '').trim();
    if (!pc) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
      const json = await res.json();
      if (json.status === 200 && json.result) {
        setForm(prev => ({
          ...prev,
          lat: Number(json.result.latitude.toFixed(5)),
          lng: Number(json.result.longitude.toFixed(5))
        }));
        toast.success(`GPS coordinates resolved for ${json.result.postcode}`);
      } else {
        toast.error('Postcode not found in UK ONS registry');
      }
    } catch (e) {
      toast.error('Could not reach UK Postcode geocoder');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addStore(form);
    onClose();
  };

  const handleFranchiseChange = (e) => {
    const franId = String(e.target.value);
    const found = franchisees.find(f => String(f.id) === franId);
    setForm(prev => ({
      ...prev,
      franchiseeId: franId,
      franchisee: found ? found.name : ''
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={20} color="#059669" />
            <h3 className="card-title">Register New KFC Store</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Branch Code *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.branchCode}
                  onChange={e => setForm({ ...form, branchCode: e.target.value })}
                  placeholder="e.g. KFC-8706"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Franchise Partner *</label>
                <select
                  className="form-select"
                  value={String(form.franchiseeId)}
                  onChange={handleFranchiseChange}
                >
                  {franchisees.map(f => (
                    <option key={f.id} value={String(f.id)}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Store / Branch Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Bolton - Derby Street"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 85 Derby Street, Bolton"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">UK Postal Code *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.postcode}
                    onChange={e => setForm({ ...form, postcode: e.target.value })}
                    onBlur={e => handleLookupPostcode(e.target.value)}
                    placeholder="e.g. BL3 6HE"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupPostcode(form.postcode)}
                    disabled={geocoding}
                    className="btn btn-outline btn-sm"
                    title="Auto-detect Latitude & Longitude from UK Postcode"
                  >
                    <Crosshair size={14} />
                    <span>{geocoding ? '...' : 'Auto-GPS'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value, halalCertified: e.target.value === 'Passed' })}
                >
                  <option value="Passed">Passed (Certified)</option>
                  <option value="Due for Audit">Due for Audit</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Action Required">Action Required</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="e.g. Store General Manager"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Telephone</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="e.g. +44 20 7946 0912"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude (Auto-filled from Postcode)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude (Auto-filled from Postcode)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
