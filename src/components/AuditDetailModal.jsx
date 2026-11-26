import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Award,
  Printer,
  Camera,
  Eye,
  ShieldCheck,
  FileText,
  Activity,
  Share2,
  FolderOpen,
  UserCheck,
  Building2,
  RefreshCw,
  MapPin
} from 'lucide-react';

const CHECKLIST_POINTS = [
  { code: '1.1', scoreKey: 'ScoreCommentsA1', commentKey: 'MsgA1' },
  { code: '1.2', scoreKey: 'ScoreCommentsA2', commentKey: 'MsgA2' },
  { code: '1.3', scoreKey: 'ScoreCommentsA3', commentKey: 'MsgA3' },
  { code: '1.4', scoreKey: 'ScoreCommentsA4', commentKey: 'MsgA4' },
  { code: '2.1', scoreKey: 'ScoreCommentsB1', commentKey: 'MsgB1' },
  { code: '2.2', scoreKey: 'ScoreCommentsB2', commentKey: 'MsgB2' },
  { code: '2.3', scoreKey: 'ScoreCommentsB3', commentKey: 'MsgB3' },
  { code: '3.1', scoreKey: 'ScoreCommentsC1', commentKey: 'MsgC1' },
  { code: '3.2', scoreKey: 'ScoreCommentsC2', commentKey: 'MsgC2' },
  { code: '4.1', scoreKey: 'ScoreCommentsD1', commentKey: 'MsgD1' }
];

const SCORING_MATRIX_RULES = [
  'The higher the number, the more severe, for each audit point',
  '1 x L3 = fail & potential loss of license if found to sell non-halal chicken. In case of fail with no loss of license then 2 follow up audits.',
  '2 x L2 = Fail & 2 follow up audits',
  '2 x L1 & 1 x L2 = Fail & 1 follow up audit',
  '3 x L1 = Fail & 1 follow up audit'
];

const FINAL_JUDGMENT_ACTIONS = [
  {
    id: 'PASS',
    label: 'Pass',
    category: 'Passed',
    confirmMessage: 'Are you sure you want to issue the final judgment as Pass?',
    bg: '#059669',
    hoverBg: '#047857',
    icon: CheckCircle2
  },
  {
    id: 'OTHER_FAIL',
    label: 'Other Fail',
    category: 'Other Fail',
    confirmMessage: 'Are you sure you want to issue the final judgment as Other Fail?',
    bg: '#d97706',
    hoverBg: '#b45309',
    icon: AlertTriangle
  },
  {
    id: 'L3_FAIL',
    label: 'L3 Fail',
    category: 'L3 Critical Fail',
    confirmMessage: 'Are you sure you want to issue the final judgment as L3 Fail?',
    bg: '#dc2626',
    hoverBg: '#b91c1c',
    icon: AlertOctagon
  }
];

function getScoreBadgeStyle(score) {
  if (score === 'Pass') {
    return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
  }
  if (score === 'L1') {
    return { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
  }
  if (score === 'L2') {
    return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' };
  }
  if (score === 'L3') {
    return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
  }
  return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
}

function formatAuditorRecommendation(audit) {
  if (audit.auditorRecommendation) return audit.auditorRecommendation;
  switch (audit.category) {
    case 'Recommend For Pass':
      return 'For Pass';
    case 'Review List':
      return 'For Review';
    case 'Other Fail':
      return 'Other Fail';
    case 'L3 Critical Fail':
      return 'L3 Critical Fail';
    case 'Passed':
      return 'For Pass';
    default:
      return audit.category || '--';
  }
}

export default function AuditDetailModal({ audit, onClose }) {
  const navigate = useNavigate();
  const { audits, stores, gpsLogs, currentUser, updateAuditCategory, updateAudit } = useKfc();
  const [activeTab, setActiveTab] = useState('outcome');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [adminReason, setAdminReason] = useState('');
  const [pendingJudgment, setPendingJudgment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nested sub-modals for Auditor LogIn/Out, Share List, and View Files
  const [subModal, setSubModal] = useState(null); // 'logs' | 'shares' | 'files' | null
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Always keep admin judgment Reason empty by default when opening/switching audits
  useEffect(() => {
    setAdminReason('');
    setPendingJudgment(null);
    setActiveTab('outcome');
    setSubModal(null);
  }, [audit?.id]);

  if (!audit) return null;

  const liveAudit = audits.find(a => String(a.id) === String(audit.id)) || audit;
  const matchedStore = stores.find(
    s => s.branchCode === liveAudit.branchCode || s.name === liveAudit.storeName
  );

  const outcomeData = liveAudit.outcomeData || {};
  const checklistScores = liveAudit.checklistScores || {};
  const checklistComments = liveAudit.checklistComments || {};

  const branchCode = liveAudit.branchCode || liveAudit.storeId || '—';
  const storeAddress = liveAudit.address || matchedStore?.address || '—';
  const storeRep = outcomeData.storeRep || liveAudit.storeRepresentative || '—';
  const designation = outcomeData.designation || liveAudit.designation || '—';
  const auditorName = outcomeData.auditorName || liveAudit.auditor || '—';
  const auditDate = liveAudit.auditDate || '—';
  const timeIn = outcomeData.timeIn || liveAudit.timeIn || '—';
  const timeOut = liveAudit.timeOut || '—';

  const auditorSignature = outcomeData.ncrSignature || liveAudit.signatureAuditor || '';
  const auditorPrintName = outcomeData.ncrPrintName || auditorName;
  const storeRepSignature = outcomeData.rsrSignature || liveAudit.signatureStoreRep || '';
  const storeRepPrintName = outcomeData.rsrPrintName || storeRep;
  const understoodDate = outcomeData.ncrDate || auditDate;
  const rsrResponse = outcomeData.rsrResponse || '';

  const auditorRecLabel = formatAuditorRecommendation(liveAudit);
  const auditorReason =
    liveAudit.recommendationReason ||
    liveAudit.checklistOverallComment ||
    liveAudit.complianceSummary?.auditorNotes ||
    '';

  const isAlreadyJudged = Boolean(liveAudit.adminJudgedAt) || liveAudit.category === 'Passed';
  const auditStatusDisplay = isAlreadyJudged ? liveAudit.category : '--';

  const photos =
    Array.isArray(liveAudit.evidencePhotos) && liveAudit.evidencePhotos.length > 0
      ? liveAudit.evidencePhotos.map((url, i) => ({
          title: `Inspection Evidence #${i + 1}`,
          url
        }))
      : [];

  const getStatusBadge = (category) => {
    switch (category) {
      case 'Passed':
        return (
          <span className="badge badge-pass">
            <span className="badge-dot" /> Passed &amp; Certified
          </span>
        );
      case 'Recommend For Pass':
        return (
          <span className="badge badge-blue">
            <span className="badge-dot" /> Recommend For Pass
          </span>
        );
      case 'Review List':
        return (
          <span className="badge badge-warn">
            <span className="badge-dot" /> Review List
          </span>
        );
      case 'Other Fail':
        return (
          <span className="badge badge-warn">
            <span className="badge-dot" /> Other Fail
          </span>
        );
      case 'L3 Critical Fail':
        return (
          <span className="badge badge-fail">
            <span className="badge-dot" /> L3 Critical Fail
          </span>
        );
      default:
        return <span className="badge badge-neutral">{category || '--'}</span>;
    }
  };

  const handleConfirmJudgment = async () => {
    if (!pendingJudgment) return;
    setIsSubmitting(true);
    try {
      await updateAuditCategory(liveAudit.id, pendingJudgment.category, {
        adminDecisionReason: adminReason.trim()
      });
      setPendingJudgment(null);
      setAdminReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAuditorLogs = async () => {
    setSubModal('logs');
    setLoadingLogs(true);
    try {
      const res = await api.getMapLogs({
        storeName: liveAudit.storeName || '',
        limit: 100
      });
      const fetched = Array.isArray(res?.data) ? res.data : [];
      if (fetched.length > 0) {
        setActivityLogs(fetched);
      } else {
        // Fallback to context gpsLogs matching store or auditor
        const matched = (gpsLogs || []).filter(
          (l) =>
            String(l.storeName || '').toLowerCase() === String(liveAudit.storeName || '').toLowerCase() ||
            String(l.auditor || '').toLowerCase() === String(liveAudit.auditor || '').toLowerCase()
        );
        setActivityLogs(matched);
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleShareAudit = async (recipientType, recipientLabel) => {
    const newEntry = {
      id: `share-${Date.now()}`,
      recipientType,
      recipient: recipientLabel,
      sharedBy: currentUser?.fullName || currentUser?.username || 'HFA Admin',
      sharedAt: new Date().toLocaleString(),
      status: 'Shared'
    };
    const nextHistory = [newEntry, ...(Array.isArray(liveAudit.shareHistory) ? liveAudit.shareHistory : [])];
    await updateAudit(liveAudit.id, { shareHistory: nextHistory });
    toast.success(`Outcome sheet shared with ${recipientLabel}`);
  };

  const handleUpdateNotes = async () => {
    if (!adminReason.trim()) {
      toast('Enter a reason or note above to update.', { icon: 'ℹ️' });
      return;
    }
    await updateAudit(liveAudit.id, { adminDecisionReason: adminReason.trim() });
    setAdminReason('');
  };

  const attachedFiles = Object.entries(outcomeData.files || {})
    .filter(([, f]) => f && f.name)
    .map(([slot, f], idx) => ({
      id: slot,
      label: `Attachment ${idx + 1}`,
      name: f.name,
      sizeKB: f.sizeKB || 0
    }));

  const shareHistory = Array.isArray(liveAudit.shareHistory) ? liveAudit.shareHistory : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 920, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#059669" />
                <span>Audit Outcome Sheet</span>
              </h3>
              {getStatusBadge(liveAudit.category)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              <strong>Franchisee:</strong> {liveAudit.franchisee || '—'} &nbsp;|&nbsp;{' '}
              <strong>Store:</strong> {liveAudit.storeName || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {matchedStore && (
              <button
                type="button"
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
            <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm">
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Tabs when photo evidence exists */}
        {photos.length > 0 && (
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--slate-200)',
              padding: '0 1.5rem',
              background: 'var(--slate-50)',
              gap: '1.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('outcome')}
              style={{
                padding: '0.8rem 0.5rem',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === 'outcome' ? '2.5px solid #059669' : '2.5px solid transparent',
                color: activeTab === 'outcome' ? '#059669' : 'var(--slate-600)',
                cursor: 'pointer'
              }}
            >
              Outcome Sheet for KFC
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              style={{
                padding: '0.8rem 0.5rem',
                fontWeight: 700,
                fontSize: '0.84rem',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === 'evidence' ? '2.5px solid #059669' : '2.5px solid transparent',
                color: activeTab === 'evidence' ? '#059669' : 'var(--slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Camera size={14} />
              <span>Photo Evidence ({photos.length})</span>
            </button>
          </div>
        )}

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'outcome' && (
            <>
              {/* Official Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #064e2b 0%, #0b663a 100%)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    Outcome Sheet for KFC
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#d1fae5', marginTop: 2 }}>
                    Franchisee: <strong>{liveAudit.franchisee || '—'}</strong> &nbsp;||&nbsp; Store:{' '}
                    <strong>{liveAudit.storeName || '—'}</strong>
                  </div>
                </div>
                {liveAudit.session && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.16)',
                      padding: '4px 10px',
                      borderRadius: 999
                    }}
                  >
                    {liveAudit.session}
                  </span>
                )}
              </div>

              {/* 1. Store & Audit Details Table */}
              <div
                style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#ffffff'
                }}
              >
                <table className="data-table" style={{ margin: 0 }}>
                  <tbody>
                    {[
                      ['Branch Code:', branchCode],
                      ['Store Address:', storeAddress],
                      ['Store Representative:', storeRep],
                      ['Designation:', designation],
                      ['Auditor:', auditorName],
                      ['Audit Date:', auditDate],
                      ['Time In:', timeIn],
                      ['Time Out:', timeOut]
                    ].map(([label, val]) => (
                      <tr key={label}>
                        <td
                          style={{
                            width: '32%',
                            fontWeight: 700,
                            color: '#334155',
                            background: '#f8fafc',
                            borderRight: '1px solid #e2e8f0',
                            padding: '0.55rem 0.9rem',
                            fontSize: '0.82rem'
                          }}
                        >
                          {label}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: '#0f172a',
                            padding: '0.55rem 0.9rem',
                            fontSize: '0.84rem'
                          }}
                        >
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. Summary — All 10 Checklist Audit Points */}
              <div>
                <h4
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  Summary
                </h4>
                <div
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}
                >
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '16%' }}>Audit Point</th>
                        <th style={{ width: '18%' }}>Score</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CHECKLIST_POINTS.map((pt) => {
                        const rawScore = checklistScores[pt.scoreKey];
                        const score =
                          rawScore && rawScore !== 'Select Option' ? rawScore : '—';
                        const comment = checklistComments[pt.commentKey] || '';
                        return (
                          <tr key={pt.code}>
                            <td style={{ fontWeight: 800, color: '#064e2b', fontFamily: 'monospace' }}>
                              {pt.code}
                            </td>
                            <td>
                              <span
                                style={{
                                  ...getScoreBadgeStyle(score),
                                  display: 'inline-block',
                                  padding: '2px 10px',
                                  borderRadius: 999,
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                {score}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                              {comment || <span style={{ color: '#94a3b8' }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Outcome (Auditor Sign-off, Recommendation & Reason) */}
              <div>
                <h4
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  Outcome
                </h4>
                <div
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#ffffff'
                  }}
                >
                  <table className="data-table" style={{ margin: 0 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '36%', fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Signed by HFA Auditor:
                        </td>
                        <td>
                          {auditorSignature ? (
                            <img
                              src={auditorSignature}
                              alt="HFA Auditor Signature"
                              style={{ maxHeight: 72, maxWidth: 240, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, background: '#fff' }}
                            />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No signature recorded</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Print Name:
                        </td>
                        <td style={{ fontWeight: 600 }}>{auditorPrintName}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Auditor&apos;s Recommendation:
                        </td>
                        <td style={{ fontWeight: 700, color: '#064e2b' }}>{auditorRecLabel}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Audit Status:
                        </td>
                        <td style={{ fontWeight: 700 }}>{auditStatusDisplay}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Auditor Recommendation Reason:
                        </td>
                        <td style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                          {auditorReason || <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                      </tr>
                      {liveAudit.adminDecisionReason && (
                        <tr>
                          <td style={{ fontWeight: 700, background: '#ecfdf5', color: '#065f46', borderRight: '1px solid #a7f3d0' }}>
                            Admin Judgment Reason:
                          </td>
                          <td style={{ fontSize: '0.84rem', color: '#065f46', fontWeight: 600 }}>
                            {liveAudit.adminDecisionReason}
                            {liveAudit.adminJudgedBy && (
                              <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: 2 }}>
                                Judged by {liveAudit.adminJudgedBy}
                                {liveAudit.adminJudgedAt ? ` • ${liveAudit.adminJudgedAt}` : ''}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Non-Conformances Raised & Franchisee Acknowledgement */}
              <div>
                <h4
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.55rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  Non-Conformances Raised
                </h4>
                <div
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#ffffff'
                  }}
                >
                  <table className="data-table" style={{ margin: 0 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '44%', fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          I have read and understood the contents of this document on this given day of:
                        </td>
                        <td style={{ fontWeight: 600 }}>{understoodDate}</td>
                      </tr>
                      {rsrResponse && (
                        <tr>
                          <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                            Shift Runner Representation:
                          </td>
                          <td style={{ fontSize: '0.84rem', color: '#334155' }}>{rsrResponse}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Signed by or on behalf of Company / Franchisee:
                        </td>
                        <td>
                          {storeRepSignature ? (
                            <img
                              src={storeRepSignature}
                              alt="Company / Franchisee Signature"
                              style={{ maxHeight: 72, maxWidth: 240, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, background: '#fff' }}
                            />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No signature recorded</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                          Print Name:
                        </td>
                        <td style={{ fontWeight: 600 }}>{storeRepPrintName}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. SCORING MATRIX */}
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#f8fafc'
                }}
              >
                <div
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.6rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  SCORING MATRIX
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: '0.85rem 1.25rem 0.85rem 2rem',
                    fontSize: '0.82rem',
                    color: '#334155',
                    lineHeight: 1.7
                  }}
                >
                  {SCORING_MATRIX_RULES.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              {/* 6. Admin Final Judgment Section */}
              <div
                style={{
                  padding: '1.25rem',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid #cbd5e1',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.75rem'
                  }}
                >
                  <ShieldCheck size={18} color="#059669" />
                  <span>Final Admin Judgment</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="admin-judgment-reason"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '0.4rem'
                    }}
                  >
                    Reason:
                  </label>
                  <textarea
                    id="admin-judgment-reason"
                    rows={3}
                    value={adminReason}
                    onChange={e => setAdminReason(e.target.value)}
                    placeholder="Enter your reason for the final judgment..."
                    className="form-input"
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.85rem',
                      lineHeight: 1.5
                    }}
                  />
                </div>

                {pendingJudgment ? (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {pendingJudgment.confirmMessage}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmJudgment}
                        style={{
                          padding: '0.55rem 1.1rem',
                          borderRadius: 8,
                          border: 'none',
                          background: pendingJudgment.bg,
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSubmitting ? 'Saving...' : `Yes, Confirm ${pendingJudgment.label}`}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setPendingJudgment(null)}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {FINAL_JUDGMENT_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => setPendingJudgment(action)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.6rem 1.35rem',
                            borderRadius: 999,
                            border: 'none',
                            background: action.bg,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(15,23,42,0.12)'
                          }}
                        >
                          <Icon size={15} />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 6 Secondary Action Buttons under Final Admin Judgment */}
                <div
                  style={{
                    marginTop: '1.15rem',
                    paddingTop: '1rem',
                    borderTop: '2px solid #f97316',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleOpenAuditorLogs}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #0f2942',
                      background: '#0c3b6e',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Activity size={14} />
                    <span>Auditor LogIn/Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubModal('shares')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #0f2942',
                      background: '#0c3b6e',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Share2 size={14} />
                    <span>Share List ({shareHistory.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubModal('files')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #0f2942',
                      background: '#0c3b6e',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <FolderOpen size={14} />
                    <span>View Files ({attachedFiles.length + photos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleShareAudit('Store Representative', `Store Representative (${storeRep})`)
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #1d4ed8',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Share Store Representative</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleShareAudit('KFC Headquarters', `KFC HQ (${liveAudit.franchisee || 'KFC'})`)
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #1d4ed8',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Building2 size={14} />
                    <span>Share KFC</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdateNotes}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #1d4ed8',
                      background: '#1d4ed8',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Update</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'evidence' && photos.length > 0 && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Inspection Photographic Evidence
                </h4>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem'
                }}
              >
                {photos.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(item.url)}
                    style={{
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#ffffff'
                    }}
                  >
                    <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                      <img
                        src={item.url}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
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
                        }}
                      >
                        <Eye size={12} /> View High-Res
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.82rem' }}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>

      {/* Nested Sub-Modals: Auditor LogIn/Out, Share List, View Files */}
      {subModal && (
        <div
          onClick={() => setSubModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: subModal === 'logs' ? 1040 : 640,
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.9rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {subModal === 'logs' && <><Activity size={16} color="#38bdf8" /> <span>Auditor LogIn / Out Activity — {liveAudit.storeName}</span></>}
                {subModal === 'shares' && <><Share2 size={16} color="#38bdf8" /> <span>Outcome Sheet Share List</span></>}
                {subModal === 'files' && <><FolderOpen size={16} color="#38bdf8" /> <span>Attached Files &amp; Evidence</span></>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {subModal === 'logs' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubModal(null);
                      onClose();
                      navigate('/map');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={13} />
                    <span>Open Auditors Map</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSubModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
              {subModal === 'logs' && (
                loadingLogs ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    Loading auditor activity logs...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No login/logout or audit activity logs recorded yet for <strong>{liveAudit.storeName}</strong>.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table className="data-table" style={{ margin: 0, minWidth: 880, fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th>Store Name</th>
                          <th>Auditor</th>
                          <th>Time</th>
                          <th>Activities</th>
                          <th>Location</th>
                          <th>IP Address</th>
                          <th>Device</th>
                          <th>Date</th>
                          <th>Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((log, i) => (
                          <tr key={log._id || log.id || i}>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{log.storeName || liveAudit.storeName}</td>
                            <td style={{ fontWeight: 600 }}>{log.auditor}</td>
                            <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.time}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe'
                                }}
                              >
                                {log.activity}
                              </span>
                            </td>
                            <td style={{ maxWidth: 220, fontSize: '0.74rem', color: '#475569' }}>
                              {log.location || (log.lat && log.lng ? `Location: ${log.lat},${log.lng}` : '—')}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0f172a' }}>
                              {log.ipAddress || '—'}
                            </td>
                            <td style={{ maxWidth: 200, fontSize: '0.74rem', color: '#475569' }}>
                              {log.device || '—'}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{log.session || liveAudit.session || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {subModal === 'shares' && (
                shareHistory.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    This outcome sheet has not been shared yet. Use <strong>Share Store Representative</strong> or <strong>Share KFC</strong> to dispatch it.
                  </div>
                ) : (
                  <table className="data-table" style={{ margin: 0, fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Shared By</th>
                        <th>Date &amp; Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareHistory.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ fontWeight: 700 }}>{item.recipient}</td>
                          <td>{item.sharedBy}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.sharedAt}</td>
                          <td><span className="badge badge-pass">{item.status || 'Shared'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {subModal === 'files' && (
                attachedFiles.length === 0 && photos.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No files or photos were attached to this audit.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {attachedFiles.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{f.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {f.label} {f.sizeKB ? `• ${f.sizeKB} KB` : ''}
                          </div>
                        </div>
                        <span className="badge badge-blue">Uploaded</span>
                      </div>
                    ))}
                    {photos.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: 4 }}>
                        {photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={p.url}
                            alt={p.title}
                            onClick={() => setSelectedPhoto(p.url)}
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

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
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px' }}
            />
            <button
              type="button"
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
                fontWeight: 800
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
