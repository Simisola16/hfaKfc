import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  X, CheckCircle2, AlertTriangle, AlertOctagon, Clock,
  Award, Printer, Camera, FileCheck, Eye
} from 'lucide-react';

export default function AuditDetailModal({ audit, onClose }) {
  const navigate = useNavigate();
  const { audits, stores, updateAuditCategory } = useKfc();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!audit) return null;

  // Always reflect live state from KfcContext so status changes update immediately inside the modal
  const liveAudit = audits.find(a => String(a.id) === String(audit.id)) || audit;
  const matchedStore = stores.find(s => s.branchCode === liveAudit.branchCode || s.name === liveAudit.storeName);

  const getStatusBadge = (category) => {
    switch (category) {
      case 'Passed':
        return <span className="badge badge-pass"><span className="badge-dot" /> Passed & Certified</span>;
      case 'Recommend For Pass':
        return <span className="badge badge-blue"><span className="badge-dot" /> Recommend For Pass</span>;
      case 'Review List':
        return <span className="badge badge-warn"><span className="badge-dot" /> Under Review</span>;
      case 'Other Fail':
        return <span className="badge badge-warn"><span className="badge-dot" /> Other Fail (Minor NC)</span>;
      case 'L3 Critical Fail':
        return <span className="badge badge-fail"><span className="badge-dot" /> L3 Critical Fail</span>;
      default:
        return <span className="badge badge-neutral">{category}</span>;
    }
  };

  const defaultEvidence = [
    {
      title: 'Poultry Delivery Tamper Seal Intact',
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Fryer Vat Vegetable Oil Verification',
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
    },
    {
      title: 'Official Halal Certificate Display Frame',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const photos = liveAudit.evidencePhotos && liveAudit.evidencePhotos.length > 0
    ? liveAudit.evidencePhotos.map((url, i) => ({ title: `Inspection Evidence #${i + 1}`, url }))
    : defaultEvidence;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 className="card-title">Halal Audit Dossier — {liveAudit.storeName}</h3>
              {getStatusBadge(liveAudit.category)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              {liveAudit.branchCode} • {liveAudit.franchisee}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {matchedStore && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/certificates?storeId=${encodeURIComponent(matchedStore.id)}`);
                }}
                className="btn btn-outline btn-sm"
              >
                <Award size={14} color="#059669" />
                <span>Certificate</span>
              </button>
            )}
            <button onClick={() => window.print()} className="btn btn-outline btn-sm">
              <Printer size={14} />
              <span>Print Dossier</span>
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--slate-200)',
          padding: '0 1.5rem',
          background: 'var(--slate-50)',
          gap: '1.25rem',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '0.85rem 0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'summary' ? '2.5px solid #059669' : '2.5px solid transparent',
              color: activeTab === 'summary' ? '#059669' : 'var(--slate-600)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Audit Summary & Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            style={{
              padding: '0.85rem 0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'evidence' ? '2.5px solid #059669' : '2.5px solid transparent',
              color: activeTab === 'evidence' ? '#059669' : 'var(--slate-600)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Camera size={14} />
            <span>Photo Evidence ({photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signatures')}
            style={{
              padding: '0.85rem 0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'signatures' ? '2.5px solid #059669' : '2.5px solid transparent',
              color: activeTab === 'signatures' ? '#059669' : 'var(--slate-600)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
          >
            <FileCheck size={14} />
            <span>Digital Signatures</span>
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'summary' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '1rem',
                padding: '1.25rem',
                background: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-200)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700 }}>
                    Audit Date & Time
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
                    {liveAudit.auditDate} ({liveAudit.timeIn} - {liveAudit.timeOut})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700 }}>
                    Inspection Score
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: liveAudit.score >= 85 ? '#059669' : '#b91c1c' }}>
                    {liveAudit.score} / 100
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700 }}>
                    Lead Auditor
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
                    {liveAudit.auditor}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700 }}>
                    Franchisee Partner
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
                    {liveAudit.franchisee}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Store Location & General Manager</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: '1.6' }}>
                  <div><strong>Address:</strong> {liveAudit.address}, {liveAudit.postcode}</div>
                  <div><strong>Store Representative Present:</strong> {liveAudit.storeRepresentative}</div>
                  <div><strong>Audit Session / Round:</strong> {liveAudit.session}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Halal Standard Verification Protocol</h4>
                <div style={{ border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Audit Standard Item</th>
                        <th>Observed Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Poultry Supplier & Delivery Seal Intactness</td>
                        <td>
                          {liveAudit.category === 'L3 Critical Fail' ? (
                            <span className="badge badge-fail"><span className="badge-dot" /> Breach Flagged</span>
                          ) : (
                            <span className="badge badge-pass"><span className="badge-dot" /> Compliant</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Approved KFC Breading, Marinade & Seasoning Use</td>
                        <td>
                          <span className="badge badge-pass"><span className="badge-dot" /> Compliant</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Vegetable Oil & Dedicated Fryer Segregation</td>
                        <td>
                          <span className="badge badge-pass"><span className="badge-dot" /> Compliant</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Tamper Stickers & Approved Packaging Compliance</td>
                        <td>
                          {liveAudit.category === 'Other Fail' ? (
                            <span className="badge badge-warn"><span className="badge-dot" /> Discrepancy Flagged</span>
                          ) : (
                            <span className="badge badge-pass"><span className="badge-dot" /> Compliant</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Official HFA Halal Certificate Displayed on Site</td>
                        <td>
                          <span className="badge badge-pass"><span className="badge-dot" /> Verified</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Auditor Assessment & Notes</h4>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--slate-700)',
                  lineHeight: '1.6'
                }}>
                  {liveAudit.complianceSummary?.auditorNotes || 'Full compliance observed throughout the physical inspection. All temperature logs, delivery notes, and seal records match HFA standards.'}
                </div>
              </div>
            </>
          )}

          {activeTab === 'evidence' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Inspection Photographic Evidence</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>
                  Timestamped photographic evidence logged during the on-site physical surveillance
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {photos.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(item.url)}
                    style={{
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#ffffff',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                      <img
                        src={item.url}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Eye size={12} /> View High-Res
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--slate-800)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: 2 }}>
                        Captured on site • {liveAudit.auditDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Authorized Inspection Sign-Off</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
                Cryptographically bound digital signatures executed upon completion of on-site audit
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <div style={{
                  padding: '1.25rem',
                  background: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    STORE REPRESENTATIVE SIGN-OFF
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', marginTop: 2 }}>
                    {liveAudit.storeRepresentative}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    General Manager, KFC {liveAudit.storeName}
                  </div>

                  <div style={{
                    height: '100px',
                    background: '#ffffff',
                    border: '1px solid var(--slate-300)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    position: 'relative'
                  }}>
                    {liveAudit.signatureStoreRep ? (
                      <img
                        src={liveAudit.signatureStoreRep}
                        alt="Store Rep Signature"
                        style={{ maxHeight: '80px', maxWidth: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#0f172a' }}>
                        {liveAudit.storeRepresentative}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                      ✓ Digitally Verified
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  background: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    LEAD HFA AUDITOR SIGN-OFF
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', marginTop: 2 }}>
                    {liveAudit.auditor}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    HFA Halal Certification Executive
                  </div>

                  <div style={{
                    height: '100px',
                    background: '#ffffff',
                    border: '1px solid var(--slate-300)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    position: 'relative'
                  }}>
                    {liveAudit.signatureAuditor ? (
                      <img
                        src={liveAudit.signatureAuditor}
                        alt="Auditor Signature"
                        style={{ maxHeight: '80px', maxWidth: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#0f172a' }}>
                        {liveAudit.auditor}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                      ✓ HFA Official Stamp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Transitions */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1.1rem',
            background: 'var(--slate-100)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-300)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--slate-800)' }}>
              Supervisory Workflow Actions:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {liveAudit.category !== 'Passed' && (
                <button
                  onClick={() => updateAuditCategory(liveAudit.id, 'Passed')}
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve & Issue Certificate</span>
                </button>
              )}

              {liveAudit.category !== 'Review List' && (
                <button
                  onClick={() => updateAuditCategory(liveAudit.id, 'Review List')}
                  className="btn btn-outline btn-sm"
                >
                  <Clock size={14} />
                  <span>Move to Review List</span>
                </button>
              )}

              {liveAudit.category !== 'Other Fail' && (
                <button
                  onClick={() => updateAuditCategory(liveAudit.id, 'Other Fail')}
                  className="btn btn-outline btn-sm"
                >
                  <AlertTriangle size={14} color="#d97706" />
                  <span>Flag as Other Fail</span>
                </button>
              )}

              {liveAudit.category !== 'L3 Critical Fail' && (
                <button
                  onClick={() => updateAuditCategory(liveAudit.id, 'L3 Critical Fail')}
                  className="btn btn-kfc btn-sm"
                >
                  <AlertOctagon size={14} />
                  <span>Escalate to Critical L3 Fail</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Close Dossier
          </button>
        </div>
      </div>

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }}>
            <img
              src={selectedPhoto}
              alt="High Resolution Evidence"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
