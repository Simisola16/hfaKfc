import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  Printer, QrCode, Search, Building2, CheckCircle2, Clock
} from 'lucide-react';

export default function CertificatesPage() {
  const { stores } = useKfc();
  const [searchParams] = useSearchParams();

  const certifiedStores = stores.filter(s => s.status === 'Passed' || s.halalCertified);
  const [scopeFilter, setScopeFilter] = useState('certified');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    const paramId = searchParams.get('storeId');
    if (paramId) return String(paramId);
    return String(certifiedStores[0]?.id || stores[0]?.id || '1');
  });

  useEffect(() => {
    const paramId = searchParams.get('storeId');
    if (paramId) {
      setSelectedStoreId(String(paramId));
      const st = stores.find(s => String(s.id) === String(paramId));
      if (st && st.status !== 'Passed' && !st.halalCertified) {
        setScopeFilter('all');
      }
    }
  }, [searchParams, stores]);

  const baseList = scopeFilter === 'certified' ? certifiedStores : stores;
  const displayList = baseList.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q ||
      s.name?.toLowerCase().includes(q) ||
      s.branchCode?.toLowerCase().includes(q) ||
      s.postcode?.toLowerCase().includes(q) ||
      s.franchisee?.toLowerCase().includes(q);
  });

  const currentStore = stores.find(s => String(s.id) === String(selectedStoreId)) || certifiedStores[0] || stores[0];
  if (!currentStore) return null;

  const isCertified = currentStore.status === 'Passed' || currentStore.halalCertified;
  const certNumber = currentStore.certificateNumber || `HFA-KFC-${(currentStore.branchCode || 'UK').replace(/[^a-zA-Z0-9]/g, '')}-2026`;
  const issueDate = currentStore.lastAuditDate || '15 August 2026';
  const expiryDate = currentStore.nextAuditDueDate || '14 August 2027';

  return (
    <div className="page-shell">
      {/* Executive Header - Hidden on Print */}
      <div className="dash-header no-print">
        <div>
          <h1 className="dash-title">Halal Certificate Studio</h1>
          <div className="dash-subtitle">
            <span>{certifiedStores.length} certified UK KFC branches ready for official certificate issuance &amp; A4 print</span>
          </div>
        </div>

        <div className="dash-controls">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary btn-sm"
            style={{ height: 36, padding: '0 16px' }}
          >
            <Printer size={15} />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>

      {/* 2-Column Workspace: Left Branch Picker + Right Live Certificate */}
      <div className="cert-workspace-grid">
        {/* Left Branch Selector Rail */}
        <div className="page-surface no-print" style={{ display: 'flex', flexDirection: 'column', maxHeight: '760px' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="segmented-tabs" style={{ width: '100%' }}>
              <button
                type="button"
                onClick={() => setScopeFilter('certified')}
                className={`segmented-tab ${scopeFilter === 'certified' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
              >
                <CheckCircle2 size={13} color="#059669" />
                <span>Certified ({certifiedStores.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`segmented-tab ${scopeFilter === 'all' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
              >
                <span>All ({stores.length})</span>
              </button>
            </div>

            <div className="search-input-wrapper">
              <Search className="search-icon" size={14} />
              <input
                type="text"
                placeholder="Search branch code or store..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ padding: '8px 10px 8px 34px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {displayList.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 12px' }}>
                No matching stores found.
              </div>
            ) : (
              displayList.map((s, idx) => {
                const selected = String(s.id) === String(currentStore.id);
                const passed = s.status === 'Passed' || s.halalCertified;
                return (
                  <div
                    key={`cert-st-${s.id}-${idx}`}
                    onClick={() => setSelectedStoreId(String(s.id))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 9,
                      marginBottom: 3,
                      cursor: 'pointer',
                      background: selected ? '#ecfdf5' : 'transparent',
                      borderLeft: selected ? '3px solid #059669' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span className="code-chip" style={{ fontSize: '10.5px', padding: '2px 6px' }}>{s.branchCode}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: passed ? '#059669' : '#d97706'
                      }}>
                        {passed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {passed ? 'Certified' : s.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginTop: 5 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {s.franchisee} • {s.postcode}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Official Certificate Document Preview */}
        <div className="cert-document" style={{
          background: '#ffffff',
          border: '12px double #059669',
          borderRadius: '14px',
          padding: 'clamp(1.5rem, 4vw, 3.25rem)',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          position: 'relative',
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.035,
            pointerEvents: 'none',
            fontSize: 'clamp(140px, 22vw, 260px)',
            fontWeight: 900,
            color: '#059669',
            fontFamily: 'var(--font-sans)',
            userSelect: 'none'
          }}>
            HFA
          </div>

          {!isCertified && (
            <div className="no-print" style={{
              marginBottom: 16,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#b45309',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Preview Notice: This branch currently holds status &ldquo;{currentStore.status}&rdquo;. Approve its inspection audit to activate official validity.
            </div>
          )}

          {/* Decorative Top Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '14px',
                background: '#ffffff',
                border: '2px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
              }}>
                <img
                  src="/hfa-logo.png"
                  alt="HFA"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span style="font-weight:900;color:#059669">HFA</span>';
                  }}
                />
              </div>

              <div style={{
                background: '#e4002b',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 900,
                letterSpacing: '0.12em',
                fontSize: '1.15rem'
              }}>
                KFC UK
              </div>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
              fontWeight: 900,
              color: '#047857',
              letterSpacing: '0.04em',
              margin: '0 0 0.25rem'
            }}>
              HALAL FOOD AUTHORITY
            </h2>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}>
              United Kingdom &amp; Global Halal Certification Scheme
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', letterSpacing: '0.06em' }}>
              REGULATED BY ISLAMIC JURISPRUDENCE • LONDON • WWW.HALALFOODAUTHORITY.COM
            </div>
          </div>

          {/* Certificate Body */}
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#475569',
              fontWeight: 800,
              marginBottom: '0.5rem'
            }}>
              OFFICIAL CERTIFICATE OF HALAL CONFORMITY
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Certificate Reference Identification Number:
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#059669',
              letterSpacing: '0.05em',
              margin: '0.25rem 0 1.25rem'
            }}>
              {certNumber}
            </div>

            <p style={{ fontSize: '0.95rem', color: '#334155', maxWidth: 620, margin: '0 auto' }}>
              This is to formally certify that the premises, kitchens, and food preparation operations of:
            </p>

            <h1 style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
              fontWeight: 900,
              color: '#e4002b',
              letterSpacing: '-0.02em',
              margin: '0.75rem 0 0.25rem'
            }}>
              KFC {(currentStore.name || '').toUpperCase()}
            </h1>

            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              Branch Code: <span style={{ fontFamily: 'var(--font-mono)' }}>{currentStore.branchCode}</span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 540, margin: '0.35rem auto 1rem' }}>
              {currentStore.address}, {currentStore.postcode}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 1.25rem',
              background: '#f1f5f9',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <Building2 size={14} color="#64748b" />
              <span>Authorized Franchise Partner: {currentStore.franchisee}</span>
            </div>

            <p style={{
              fontSize: '0.88rem',
              color: '#334155',
              maxWidth: 680,
              margin: '0 auto',
              lineHeight: '1.8'
            }}>
              have undergone rigorous physical audit, supply chain validation, and verification by the Halal Food Authority inspection team. All poultry items supplied to this restaurant originate exclusively from certified HFA slaughter facilities with verified tamper seals. All cooking oils are 100% pure vegetable origin in segregated fryers, and breading marinades strictly conform with Halal dietary jurisprudence.
            </p>

            {/* Dates & Validity Table */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2.5rem',
              flexWrap: 'wrap',
              marginTop: '2rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              maxWidth: 520,
              margin: '2rem auto 0'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Date of Certification
                </div>
                <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {issueDate}
                </div>
              </div>

              <div style={{ width: 1, background: '#cbd5e1' }} />

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Certificate Expiry Date
                </div>
                <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {expiryDate}
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Signatories & Official Seal Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            alignItems: 'flex-end',
            gap: '1.5rem',
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Brush Script MT", "Caveat", cursive',
                fontSize: '1.75rem',
                color: '#0f172a',
                marginBottom: '-6px'
              }}>
                Dr. A. M. Hameed
              </div>
              <div style={{ width: '160px', height: '1.5px', background: '#0f172a', margin: '0 auto 6px' }} />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>Dr. A. M. Hameed</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Executive Director &amp; Chairman, HFA</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 82,
                height: 82,
                borderRadius: '50%',
                border: '3px double #d97706',
                background: 'radial-gradient(circle, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.4rem',
                color: '#92400e',
                fontWeight: 900,
                fontSize: '0.72rem',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                lineHeight: '1.15'
              }}>
                <span>OFFICIAL</span>
                <span style={{ fontSize: '0.85rem', color: '#78350f' }}>HFA SEAL</span>
                <span style={{ fontSize: '0.65rem' }}>2026/2027</span>
              </div>

              <div style={{
                fontSize: '0.68rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}>
                <QrCode size={13} color="#059669" />
                <span>Scan to Verify Online</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Brush Script MT", "Caveat", cursive',
                fontSize: '1.75rem',
                color: '#0f172a',
                marginBottom: '-6px'
              }}>
                Mufti M. S. Akhtar
              </div>
              <div style={{ width: '160px', height: '1.5px', background: '#0f172a', margin: '0 auto 6px' }} />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>Mufti Dr. M. S. Akhtar</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Head of Shariah Affairs &amp; Compliance</div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body { background: #ffffff !important; }
                .no-print, .sidebar, .topbar { display: none !important; }
                .main-wrapper, .main-content { margin: 0 !important; padding: 0 !important; }
                .cert-workspace-grid { display: block !important; }
                .cert-document {
                  box-shadow: none !important;
                  border: 10px double #059669 !important;
                  margin: 0 !important;
                  padding: 2rem !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  page-break-after: avoid;
                }
              }
            `
          }} />
        </div>
      </div>
    </div>
  );
}
