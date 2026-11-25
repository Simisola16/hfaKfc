import React, { useState, useEffect, useMemo } from 'react';
import { useKfc } from '../context/KfcContext';
import { X, Store } from 'lucide-react';

export default function NewStoreModal({ isOpen, onClose }) {
  const { franchisees, addStore } = useKfc();
  const [submitting, setSubmitting] = useState(false);

  const sortedFranchisees = useMemo(
    () => [...franchisees].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [franchisees]
  );

  const buildEmptyForm = () => ({
    name: '',
    branchCode: '',
    address: '',
    postcode: '',
    franchiseeId: sortedFranchisees[0] ? String(sortedFranchisees[0].id) : '',
    franchisee: sortedFranchisees[0]?.name || '',
    contactPerson: '',
    contactPhone: '',
  });

  const [form, setForm] = useState(buildEmptyForm);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        branchCode: '',
        address: '',
        postcode: '',
        franchiseeId: sortedFranchisees[0] ? String(sortedFranchisees[0].id) : '',
        franchisee: sortedFranchisees[0]?.name || '',
        contactPerson: '',
        contactPhone: '',
      });
    }
    // Reset only when modal opens so background sync never wipes user input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!form.franchiseeId && sortedFranchisees.length > 0) {
      setForm(prev => ({
        ...prev,
        franchiseeId: String(sortedFranchisees[0].id),
        franchisee: sortedFranchisees[0].name || '',
      }));
    }
  }, [sortedFranchisees, form.franchiseeId]);

  if (!isOpen) return null;

  const handleFranchiseChange = (e) => {
    const franId = String(e.target.value);
    const found = sortedFranchisees.find(f => String(f.id) === franId);
    setForm(prev => ({
      ...prev,
      franchiseeId: franId,
      franchisee: found ? found.name : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let lat = 51.5074;
    let lng = -0.1278;

    // Silently resolve UK postcode coordinates so the new branch appears accurately on the UK Map
    const pc = form.postcode.trim();
    if (pc) {
      try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
        const json = await res.json();
        if (json.status === 200 && json.result) {
          lat = Number(json.result.latitude.toFixed(5));
          lng = Number(json.result.longitude.toFixed(5));
        }
      } catch {
        // Non-blocking fallback to default UK coordinates
      }
    }

    try {
      await addStore({
        name: form.name.trim(),
        branchCode: form.branchCode.trim(),
        address: form.address.trim(),
        postcode: pc.toUpperCase(),
        franchisee: form.franchisee,
        franchiseeId: form.franchiseeId,
        contactPerson: form.contactPerson.trim(),
        contactPhone: form.contactPhone.trim(),
        lat,
        lng,
        status: 'Due for Audit',
        halalCertified: false,
      });
      setForm(buildEmptyForm());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Store size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>New Store</h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                Register a new KFC branch into the HFA Halal network
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Store Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. East Ham - High Street North"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Branch Code *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.branchCode}
                onChange={e => setForm({ ...form, branchCode: e.target.value })}
                placeholder="e.g. 805"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Address *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 137 - 141 High Street North, East Ham, London"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Post Code *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.postcode}
                onChange={e => setForm({ ...form, postcode: e.target.value })}
                placeholder="e.g. E6 1HZ"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Franchisee *</label>
              <select
                required
                className="form-select"
                value={String(form.franchiseeId)}
                onChange={handleFranchiseChange}
              >
                {sortedFranchisees.map(f => (
                  <option key={f.id} value={String(f.id)}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                className="form-input"
                value={form.contactPerson}
                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone No</label>
              <input
                type="text"
                className="form-input"
                value={form.contactPhone}
                onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
