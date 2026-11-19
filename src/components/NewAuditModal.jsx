import React, { useState, useEffect } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  X, ClipboardCheck, ShieldCheck, Camera, Trash2, Plus, Sparkles, CheckSquare
} from 'lucide-react';
import SignaturePad from './SignaturePad';

export default function NewAuditModal({ isOpen, onClose, defaultStoreId }) {
  const { stores, currentUser, addAudit } = useKfc();

  const initialStore = stores.find(s => String(s.id) === String(defaultStoreId)) || stores[0];
  const [storeId, setStoreId] = useState(String(initialStore?.id || '1'));
  const [session, setSession] = useState('Round Two 2026');
  const [auditor, setAuditor] = useState(currentUser?.fullName || 'Taoheed HFA');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeIn, setTimeIn] = useState('10:30');
  const [timeOut, setTimeOut] = useState('12:45');
  const [storeRepresentative, setStoreRepresentative] = useState('T. Bradley (General Manager)');
  const [category, setCategory] = useState('Recommend For Pass');
  const [score, setScore] = useState(96);
  const [notes, setNotes] = useState('Comprehensive inspection conducted. All poultry verified from HFA approved suppliers with intact delivery seals. 100% vegetable oil segregation confirmed in dedicated fryers.');

  const [signatureAuditor, setSignatureAuditor] = useState('');
  const [signatureStoreRep, setSignatureStoreRep] = useState('');

  const [evidencePhotos, setEvidencePhotos] = useState([
    {
      id: 1,
      title: 'Poultry Delivery Tamper Seal',
      category: 'Raw Poultry',
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      title: 'Dedicated Vegetable Oil Fryers',
      category: 'Fryer Segregation',
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  const [checks, setChecks] = useState({
    rawPoultrySegregation: true,
    approvedBreadingUse: true,
    fryerVegetableOilSegregation: true,
    packagingAndStickers: true,
    halalCertificateDisplayed: true,
    staffTrainingCertified: true
  });

  useEffect(() => {
    if (defaultStoreId) {
      setStoreId(String(defaultStoreId));
    }
  }, [defaultStoreId]);

  if (!isOpen) return null;

  const currentSelectedStore = stores.find(s => String(s.id) === String(storeId)) || stores[0];

  const handleToggleCheck = (key, checked) => {
    const updated = { ...checks, [key]: checked };
    setChecks(updated);
    const totalChecked = Object.values(updated).filter(Boolean).length;
    const computedScore = Math.round((totalChecked / 6) * 100);
    setScore(computedScore);
    if (!updated.rawPoultrySegregation || !updated.fryerVegetableOilSegregation) {
      setCategory('L3 Critical Fail');
    } else if (totalChecked < 6) {
      setCategory('Other Fail');
    } else {
      setCategory('Recommend For Pass');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEvidencePhotos(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            title: file.name,
            category: 'On-Site Evidence',
            url: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addPresetEvidence = (title, cat, url) => {
    setEvidencePhotos(prev => [
      ...prev,
      { id: Date.now() + Math.random(), title, category: cat, url }
    ]);
  };

  const removeEvidence = (id) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentSelectedStore) return;
    addAudit({
      storeId: currentSelectedStore.id,
      storeName: currentSelectedStore.name,
      branchCode: currentSelectedStore.branchCode,
      address: currentSelectedStore.address,
      postcode: currentSelectedStore.postcode,
      franchisee: currentSelectedStore.franchisee,
      franchiseeId: currentSelectedStore.franchiseeId,
      auditor,
      auditDate,
      timeIn,
      timeOut,
      session,
      category,
      score: Number(score),
      storeRepresentative,
      signatureAuditor,
      signatureStoreRep,
      evidencePhotos: evidencePhotos.map(p => p.url),
      complianceSummary: {
        ...checks,
        auditorNotes: notes
      }
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ClipboardCheck size={22} color="#059669" />
            <div>
              <h3 className="card-title">Conduct On-Site Halal Audit</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--slate-500)', margin: 0 }}>
                HFA Standard Operating Procedure • KFC UK & Ireland Halal Assurance Protocol
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target KFC Restaurant *</label>
                <select
                  className="form-select"
                  value={String(storeId)}
                  onChange={e => setStoreId(String(e.target.value))}
                >
                  {stores.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.branchCode} • {s.name} ({s.franchisee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Session / Surveillance Round *</label>
                <select
                  className="form-select"
                  value={session}
                  onChange={e => setSession(e.target.value)}
                >
                  <option value="Round One 2026">Round One 2026</option>
                  <option value="Round Two 2026">Round Two 2026</option>
                  <option value="Round Three 2026">Round Three 2026</option>
                  <option value="Special Surveillance 2026">Special Surveillance 2026</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lead HFA Auditor *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={auditor}
                  onChange={e => setAuditor(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Store General Manager / Rep *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={storeRepresentative}
                  onChange={e => setStoreRepresentative(e.target.value)}
                  placeholder="e.g. John Doe (General Manager)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Audit Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={auditDate}
                  onChange={e => setAuditDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time In</label>
                <input
                  type="time"
                  className="form-input"
                  value={timeIn}
                  onChange={e => setTimeIn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Out</label>
                <input
                  type="time"
                  className="form-input"
                  value={timeOut}
                  onChange={e => setTimeOut(e.target.value)}
                />
              </div>
            </div>

            {/* Halal Compliance Standards Checklist */}
            <div style={{
              background: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'var(--slate-900)'
              }}>
                <ShieldCheck size={18} color="#059669" />
                <span>Halal Assurance System & Compliance Verification (Tap to Toggle)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {[
                  { key: 'rawPoultrySegregation', label: 'Raw Poultry Supplier Seal Verification (Critical)' },
                  { key: 'approvedBreadingUse', label: 'Approved KFC Breading & Marinades Only' },
                  { key: 'fryerVegetableOilSegregation', label: 'Dedicated Fryer 100% Vegetable Oil (Critical)' },
                  { key: 'packagingAndStickers', label: 'HFA Approved Packaging & Tamper Stickers' },
                  { key: 'halalCertificateDisplayed', label: 'Valid Original Halal Certificate On Public Display' },
                  { key: 'staffTrainingCertified', label: 'Staff Halal Protocol & Training Logs Verified' },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: checks[item.key] ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${checks[item.key] ? '#a7f3d0' : '#fecaca'}`,
                      fontWeight: 600,
                      color: checks[item.key] ? '#064e3b' : '#991b1b'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checks[item.key]}
                      onChange={e => handleToggleCheck(item.key, e.target.checked)}
                      style={{ width: 17, height: 17, accentColor: '#059669' }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Decision & Score */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Audit Decision / Recommendation *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => {
                    const c = e.target.value;
                    setCategory(c);
                    if (c === 'Passed') setScore(98);
                    else if (c === 'Recommend For Pass') setScore(94);
                    else if (c === 'Review List') setScore(85);
                    else if (c === 'Other Fail') setScore(72);
                    else if (c === 'L3 Critical Fail') setScore(48);
                  }}
                >
                  <option value="Recommend For Pass">Recommend For Pass (RFP - Standard)</option>
                  <option value="Passed">Passed (Immediate Approval & Certification)</option>
                  <option value="Review List">Review List (Technical Review Required)</option>
                  <option value="Other Fail">Other Fail (Minor Non-Conformity)</option>
                  <option value="L3 Critical Fail">L3 Critical Fail (Halal Non-Compliance)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Score (0 - 100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="form-input"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Auditor Observations & Assessment Notes *</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter detailed inspection summary and findings..."
              />
            </div>

            {/* Photo Evidence Section */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--slate-300)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={18} color="#059669" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                    Inspection Photo Evidence ({evidencePhotos.length} attached)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <Plus size={13} />
                    <span>Upload Device Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addPresetEvidence('Approved Marinade Mix', 'Ingredients', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Sparkles size={12} />
                    <span>+ Quick Sample</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {evidencePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--slate-200)',
                      background: '#ffffff',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '0.35rem 0.4rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {photo.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                        {photo.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(photo.id)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove Photo"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive HTML5 Canvas Signatures Section */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={17} color="#059669" />
                <span>Dual Digital Signatures & Sign-Off Verification</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <SignaturePad
                  label="Store Representative / GM Signature"
                  signerName={storeRepresentative}
                  roleTitle="General Manager"
                  onChange={setSignatureStoreRep}
                  initialValue={signatureStoreRep}
                />

                <SignaturePad
                  label="Lead HFA Auditor Signature"
                  signerName={auditor}
                  roleTitle="Lead Halal Auditor"
                  onChange={setSignatureAuditor}
                  initialValue={signatureAuditor}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Audit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
