import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  Award, Printer, QrCode, Search, Building2
} from 'lucide-react';

export default function CertificatesPage() {
  const { stores } = useKfc();
  const [searchParams] = useSearchParams();

  const certifiedStores = stores.filter(s => s.status === 'Passed' || s.halalCertified);
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
    }
  }, [searchParams]);

  const displayList = stores.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q ||
      s.name?.toLowerCase().includes(q) ||
      s.branchCode?.toLowerCase().includes(q) ||
      s.postcode?.toLowerCase().includes(q) ||
      s.franchisee?.toLowerCase().includes(q);
  });

  const currentStore = stores.find(s => String(s.id) === String(selectedStoreId)) || certifiedStores[0] || stores[0];

  if (!currentStore) return null;

  const certNumber = currentStore.certificateNumber || `HFA-KFC-${(currentStore.branchCode || 'UK').replace(/[^a-zA-Z0-9]/g, '')}-2026`;
  const issueDate = currentStore.lastAuditDate || '15 August 2026';
  const expiryDate = currentStore.nextAuditDueDate || '14 August 2027';

  return (
    <div>
      {/* Top Selector Card - Hidden when printing */}
      <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={24} />
            </div>
            <div>
              <h3 className="card-title">KFC Halal Certificate Studio</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                Generate, verify, and print official Halal Food Authority compliance certificates ({certifiedStores.length} certified branches)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input
                type="text"
                placeholder="Filter branch code or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="filter-select"
                style={{ paddingLeft: '2rem', width: 220 }}
              />
            </div>

            <select
              className="filter-select"
              value={String(selectedStoreId)}
              onChange={e => setSelectedStoreId(String(e.target.value))}
              style={{ minWidth: 260, maxWidth: '100%' }}
            >
              {displayList.map(s => (
                <option key={s.id} value={String(s.id)}>
                  {s.branchCode} • {s.name} ({s.franchisee})
                </option>
              ))}
            </select>

            <button onClick={() => window.print()} className="btn btn-primary">
              <Printer size={16} />
              <span>Print Official Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Certificate Document Presentation */}
      <div className="cert-document" style={{
        background: '#ffffff',
        border: '12px double #059669',
        borderRadius: '14px',
        padding: 'clamp(1.5rem, 4vw, 3.25rem)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        position: 'relative',
        maxWidth: '880px',
        margin: '0 auto 2rem',
        overflow: 'hidden'
      }}>
        {/* Certificate Watermark Graphic */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.035,
          pointerEvents: 'none',
          fontSize: 'clamp(140px, 25vw, 280px)',
          fontWeight: 900,
          color: '#059669',
          fontFamily: 'var(--font-sans)',
          userSelect: 'none'
        }}>
          HFA
        </div>

        {/* Certificate Decorative Top Header */}
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
            United Kingdom & Global Halal Certification Scheme
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
            background: 'var(--slate-100)',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '1.5rem',
            border: '1px solid var(--slate-200)'
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
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {issueDate}
              </div>
            </div>

            <div style={{ width: 1, background: '#cbd5e1' }} />

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Certificate Expiry Date
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
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
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Executive Director & Chairman, HFA</div>
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
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Head of Shariah Affairs & Compliance</div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: #ffffff !important; }
              .no-print, .sidebar, .topbar { display: none !important; }
              .main-wrapper, .main-content { margin: 0 !important; padding: 0 !important; }
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
  );
}
