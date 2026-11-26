import React, { useState, useEffect, useMemo } from 'react';
import { useKfc } from '../context/KfcContext';
import { X, ClipboardCheck, Calendar, Building2, Store, UserCheck, Layers } from 'lucide-react';

const ROUND_OPTIONS = ['Round One', 'Round Two', 'Round Three', 'Surveillance'];
const YEAR_OPTIONS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

export default function NewAuditModal({
  isOpen,
  onClose,
  defaultStoreId,
  title = 'Assign',
  subtitle = 'Select session, franchisee, store, auditor, and date',
  submitLabel = 'Assign',
}) {
  const { stores, franchisees, audits, assignments, users, currentUser, addAssignment } = useKfc();

  const today = new Date().toISOString().split('T')[0];

  const franchiseeOptions = useMemo(() => {
    const names = new Set();
    franchisees.forEach(f => { if (f.name) names.add(f.name); });
    stores.forEach(s => { if (s.franchisee) names.add(s.franchisee); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [franchisees, stores]);

  const auditorOptions = useMemo(() => {
    const names = new Set(['Builder', 'Taoheed', 'Rashid', 'Moin', 'Mansur', 'Amir', 'Haris', 'Ali', 'Abu Yusha']);
    users.forEach(u => {
      if (u.username) names.add(u.username);
    });
    audits.forEach(a => {
      if (a.auditor) names.add(a.auditor);
    });
    assignments.forEach(a => {
      if (a.auditor) names.add(a.auditor);
    });
    if (currentUser?.username) names.add(currentUser.username);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [users, audits, assignments, currentUser]);

  const defaultStore = useMemo(
    () => stores.find(s => String(s.id) === String(defaultStoreId)) || stores[0] || null,
    [stores, defaultStoreId]
  );

  const [sessionRound, setSessionRound] = useState('Round Two');
  const [sessionYear, setSessionYear] = useState('2026');
  const [selectedFranchisee, setSelectedFranchisee] = useState(
    defaultStore?.franchisee || franchiseeOptions[0] || ''
  );
  const [storeId, setStoreId] = useState(defaultStore ? String(defaultStore.id) : '');
  const [auditor, setAuditor] = useState(
    currentUser?.username || auditorOptions[0] || 'Builder'
  );
  const [beginningDate, setBeginningDate] = useState(today);
  const [endingDate, setEndingDate] = useState(today);

  // Sync defaults when modal opens or defaultStoreId changes
  useEffect(() => {
    if (!isOpen) return;
    const target = stores.find(s => String(s.id) === String(defaultStoreId)) || stores[0];
    if (target) {
      setSelectedFranchisee(target.franchisee || franchiseeOptions[0] || '');
      setStoreId(String(target.id));
    } else if (franchiseeOptions.length > 0 && !selectedFranchisee) {
      setSelectedFranchisee(franchiseeOptions[0]);
    }
    const freshToday = new Date().toISOString().split('T')[0];
    setBeginningDate(freshToday);
    setEndingDate(freshToday);
  }, [isOpen, defaultStoreId, stores, franchiseeOptions]);

  // Stores filtered to the chosen Franchisee
  const filteredStores = useMemo(() => {
    if (!selectedFranchisee) return stores;
    return stores.filter(s => s.franchisee === selectedFranchisee);
  }, [stores, selectedFranchisee]);

  // Keep storeId valid whenever selectedFranchisee changes
  useEffect(() => {
    if (filteredStores.length === 0) {
      setStoreId('');
      return;
    }
    const stillExists = filteredStores.some(s => String(s.id) === String(storeId));
    if (!stillExists) {
      setStoreId(String(filteredStores[0].id));
    }
  }, [filteredStores, storeId]);

  if (!isOpen) return null;

  const currentSelectedStore =
    filteredStores.find(s => String(s.id) === String(storeId)) ||
    stores.find(s => String(s.id) === String(storeId)) ||
    null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentSelectedStore || !sessionRound || !sessionYear || !auditor || !beginningDate) return;

    const finalEndDate = endingDate && endingDate >= beginningDate ? endingDate : beginningDate;

    addAssignment({
      storeId: currentSelectedStore.id,
      storeName: currentSelectedStore.name,
      branchCode: currentSelectedStore.branchCode,
      franchisee: selectedFranchisee || currentSelectedStore.franchisee,
      auditor,
      date: beginningDate,
      startDate: beginningDate,
      endDate: finalEndDate,
      session: `${sessionRound} ${sessionYear}`,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 660, maxHeight: '92vh', overflowY: 'auto' }}
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
              <ClipboardCheck size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Row 1: Session (Round + Year) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} color="#059669" />
                <span>Session *</span>
              </label>
              <div className="form-row">
                <select
                  required
                  className="form-select"
                  value={sessionRound}
                  onChange={e => setSessionRound(e.target.value)}
                >
                  <option value="">Select Round...</option>
                  {ROUND_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <select
                  required
                  className="form-select"
                  value={sessionYear}
                  onChange={e => setSessionYear(e.target.value)}
                >
                  <option value="">Select Year...</option>
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Franchisee + Store */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} color="#059669" />
                  <span>Franchisee *</span>
                </label>
                <select
                  required
                  className="form-select"
                  value={selectedFranchisee}
                  onChange={e => setSelectedFranchisee(e.target.value)}
                >
                  <option value="">Select Franchisee...</option>
                  {franchiseeOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Store size={14} color="#059669" />
                    <span>Store *</span>
                  </span>
                  <span className="tabular-nums" style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    {filteredStores.length} branch{filteredStores.length === 1 ? '' : 'es'}
                  </span>
                </label>
                <select
                  required
                  className="form-select"
                  value={String(storeId)}
                  onChange={e => setStoreId(String(e.target.value))}
                  disabled={filteredStores.length === 0}
                >
                  {filteredStores.length === 0 ? (
                    <option value="">No stores under this franchisee</option>
                  ) : (
                    filteredStores.map(s => (
                      <option key={s.id} value={String(s.id)}>
                        {s.branchCode} • {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Row 3: Auditor */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={14} color="#059669" />
                <span>Auditor *</span>
              </label>
              <select
                required
                className="form-select"
                value={auditor}
                onChange={e => setAuditor(e.target.value)}
              >
                <option value="">Select Auditor...</option>
                {auditorOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Row 4: Date (Beginning Date + Ending Date) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#059669" />
                <span>Date *</span>
              </label>
              <div className="form-row">
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Beginning Date
                  </span>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={beginningDate}
                    onChange={e => {
                      const val = e.target.value;
                      setBeginningDate(val);
                      if (endingDate && val && endingDate < val) {
                        setEndingDate(val);
                      }
                    }}
                  />
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Ending Date
                  </span>
                  <input
                    type="date"
                    required
                    className="form-input"
                    min={beginningDate || undefined}
                    value={endingDate}
                    onChange={e => setEndingDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!currentSelectedStore}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
