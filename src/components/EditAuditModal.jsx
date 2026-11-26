import React, { useState, useEffect, useMemo } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  X, Pencil, Calendar, Building2, Store, UserCheck,
  Layers, CheckCircle2, Award, Clock, FileText
} from 'lucide-react';

const BASE_ROUNDS = ['Round One', 'Round Two', 'Round Three', 'Surveillance'];
const BASE_YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];
const CATEGORY_OPTIONS = [
  'Recommend For Pass',
  'Passed',
  'Review List',
  'Other Fail',
  'L3 Critical Fail',
];

function toIsoDate(str) {
  if (!str) return '';
  const s = String(str).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dmy = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,})[-/\s](\d{4})$/);
  if (dmy) {
    const m = months[dmy[2].slice(0, 3).toLowerCase()];
    if (m) return `${dmy[3]}-${m}-${String(dmy[1]).padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function parseSession(sessionStr) {
  const s = String(sessionStr || '').trim();
  const yearMatch = s.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2026';
  const round = s.replace(/\b20\d{2}\b/, '').trim() || 'Round Two';
  return { round, year };
}

export default function EditAuditModal({ audit, onClose }) {
  const { stores, franchisees, audits, users, updateAudit } = useKfc();

  const initialSession = parseSession(audit?.session);

  const [sessionRound, setSessionRound] = useState(initialSession.round);
  const [sessionYear, setSessionYear] = useState(initialSession.year);
  const [selectedFranchisee, setSelectedFranchisee] = useState(audit?.franchisee || '');
  const [selectedStoreKey, setSelectedStoreKey] = useState('');
  const [auditor, setAuditor] = useState(audit?.auditor || '');
  const [category, setCategory] = useState(audit?.category || 'Recommend For Pass');
  const [beginningDate, setBeginningDate] = useState(toIsoDate(audit?.auditDate));
  const [endingDate, setEndingDate] = useState(toIsoDate(audit?.endDate || audit?.auditDate));
  const [timeIn, setTimeIn] = useState(audit?.timeIn || '10:00');
  const [timeOut, setTimeOut] = useState(audit?.timeOut || '12:00');
  const [score, setScore] = useState(audit?.score ?? 90);
  const [storeRepresentative, setStoreRepresentative] = useState(audit?.storeRepresentative || '');
  const [auditorNotes, setAuditorNotes] = useState(audit?.complianceSummary?.auditorNotes || '');

  const roundOptions = useMemo(() => {
    const set = new Set(BASE_ROUNDS);
    if (sessionRound) set.add(sessionRound);
    return Array.from(set);
  }, [sessionRound]);

  const yearOptions = useMemo(() => {
    const set = new Set(BASE_YEARS);
    if (sessionYear) set.add(sessionYear);
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [sessionYear]);

  const franchiseeOptions = useMemo(() => {
    const names = new Set();
    franchisees.forEach(f => { if (f.name) names.add(f.name); });
    stores.forEach(s => { if (s.franchisee) names.add(s.franchisee); });
    if (audit?.franchisee) names.add(audit.franchisee);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [franchisees, stores, audit]);

  const auditorOptions = useMemo(() => {
    const names = new Set(['Builder', 'Taoheed', 'Rashid', 'Moin', 'Mansur', 'Amir', 'Haris', 'Ali', 'Abu Yusha']);
    users.forEach(u => { if (u.username) names.add(u.username); });
    audits.forEach(a => { if (a.auditor) names.add(a.auditor); });
    if (audit?.auditor) names.add(audit.auditor);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [users, audits, audit]);

  // Initialize form whenever a different audit is opened
  useEffect(() => {
    if (!audit) return;
    const sess = parseSession(audit.session);
    setSessionRound(sess.round);
    setSessionYear(sess.year);
    setSelectedFranchisee(audit.franchisee || '');
    const matched = stores.find(
      s =>
        (audit.storeId && String(s.id) === String(audit.storeId)) ||
        (audit.branchCode && s.branchCode === audit.branchCode) ||
        (audit.storeName && s.name === audit.storeName)
    );
    setSelectedStoreKey(matched ? String(matched.id) : '__CURRENT__');
    setAuditor(audit.auditor || '');
    setCategory(audit.category || 'Recommend For Pass');
    const startIso = toIsoDate(audit.auditDate);
    setBeginningDate(startIso);
    setEndingDate(toIsoDate(audit.endDate) || startIso);
    setTimeIn(audit.timeIn || '10:00');
    setTimeOut(audit.timeOut || '12:00');
    setScore(audit.score ?? 90);
    setStoreRepresentative(audit.storeRepresentative || '');
    setAuditorNotes(audit.complianceSummary?.auditorNotes || '');
  }, [audit, stores]);

  const filteredStores = useMemo(() => {
    if (!selectedFranchisee) return stores;
    return stores.filter(s => s.franchisee === selectedFranchisee);
  }, [stores, selectedFranchisee]);

  useEffect(() => {
    if (!audit) return;
    if (selectedStoreKey === '__CURRENT__' && selectedFranchisee === (audit.franchisee || '')) return;
    if (filteredStores.length === 0) return;
    const stillValid = filteredStores.some(s => String(s.id) === String(selectedStoreKey));
    if (!stillValid) {
      setSelectedStoreKey(String(filteredStores[0].id));
    }
  }, [filteredStores, selectedStoreKey, selectedFranchisee, audit]);

  if (!audit) return null;

  const matchedStore =
    selectedStoreKey === '__CURRENT__'
      ? null
      : filteredStores.find(s => String(s.id) === String(selectedStoreKey)) ||
        stores.find(s => String(s.id) === String(selectedStoreKey)) ||
        null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionRound || !sessionYear || !auditor || !beginningDate) return;

    const finalEndDate = endingDate && endingDate >= beginningDate ? endingDate : beginningDate;
    const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));

    await updateAudit(audit.id, {
      storeId: matchedStore ? matchedStore.id : audit.storeId,
      storeName: matchedStore ? matchedStore.name : audit.storeName,
      branchCode: matchedStore ? matchedStore.branchCode : audit.branchCode,
      address: matchedStore ? matchedStore.address : audit.address,
      postcode: matchedStore ? matchedStore.postcode : audit.postcode,
      franchisee: selectedFranchisee || (matchedStore ? matchedStore.franchisee : audit.franchisee),
      auditor,
      session: `${sessionRound} ${sessionYear}`,
      auditDate: beginningDate,
      endDate: finalEndDate,
      timeIn,
      timeOut,
      score: clampedScore,
      category,
      storeRepresentative: storeRepresentative.trim() || audit.storeRepresentative || 'Store Duty Manager',
      complianceSummary: {
        ...(audit.complianceSummary || {}),
        auditorNotes: auditorNotes.trim(),
      },
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Pencil size={18} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Edit Audit</h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                {audit.branchCode} • {audit.storeName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {roundOptions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  required
                  className="form-select"
                  value={sessionYear}
                  onChange={e => setSessionYear(e.target.value)}
                >
                  {yearOptions.map(y => (
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
                  value={String(selectedStoreKey)}
                  onChange={e => setSelectedStoreKey(String(e.target.value))}
                >
                  {selectedStoreKey === '__CURRENT__' && (
                    <option value="__CURRENT__">
                      {audit.branchCode} • {audit.storeName}
                    </option>
                  )}
                  {filteredStores.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.branchCode} • {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Auditor + Status / Category */}
            <div className="form-row">
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span>Audit Status *</span>
                </label>
                <select
                  required
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Beginning Date + Ending Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#059669" />
                <span>Inspection Date *</span>
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
                      if (endingDate && val && endingDate < val) setEndingDate(val);
                    }}
                  />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Ending Date
                  </span>
                  <input
                    type="date"
                    className="form-input"
                    min={beginningDate || undefined}
                    value={endingDate}
                    onChange={e => setEndingDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Score + Time In/Out */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="#059669" />
                  <span>Compliance Score (%) *</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  className="form-input tabular-nums"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#059669" />
                  <span>Time In / Time Out</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input tabular-nums"
                    placeholder="10:00"
                    value={timeIn}
                    onChange={e => setTimeIn(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input tabular-nums"
                    placeholder="12:00"
                    value={timeOut}
                    onChange={e => setTimeOut(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Store Representative + Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Store Representative</label>
              <input
                type="text"
                className="form-input"
                placeholder="Store Duty Manager"
                value={storeRepresentative}
                onChange={e => setStoreRepresentative(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color="#059669" />
                <span>Auditor Notes</span>
              </label>
              <textarea
                rows={3}
                className="form-input"
                style={{ resize: 'vertical', minHeight: 74 }}
                placeholder="Summary observations or review comments..."
                value={auditorNotes}
                onChange={e => setAuditorNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
