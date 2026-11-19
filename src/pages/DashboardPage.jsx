import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import AuditDetailModal from '../components/AuditDetailModal';
import {
  Store, Building2, ClipboardCheck, Package, CheckCircle2,
  Clock, AlertTriangle, AlertOctagon, ArrowRight, ShieldCheck,
  TrendingUp, MapPin, RefreshCw, Search, Filter, X,
  Award, Plus, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const { currentUser, stores, franchisees, audits, products, appeals, requests, gpsLogs } = useKfc();

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // Action Required Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [actionSearch, setActionSearch] = useState('');
  const [actionRoleFilter, setActionRoleFilter] = useState('all');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 350);
  };

  // Core Metrics
  const totalStores = stores.length;
  const certifiedStores = stores.filter(s => s.status === 'Passed').length;
  const dueStores = stores.filter(s => s.status === 'Due for Audit').length;

  const passedAudits = audits.filter(a => a.category === 'Passed').length;
  const rfpAudits = audits.filter(a => a.category === 'Recommend For Pass').length;
  const reviewAudits = audits.filter(a => a.category === 'Review List').length;
  const otherFailAudits = audits.filter(a => a.category === 'Other Fail').length;
  const criticalFailAudits = audits.filter(a => a.category === 'L3 Critical Fail').length;
  const pendingReviewTotal = rfpAudits + reviewAudits;
  const totalFailedAudits = otherFailAudits + criticalFailAudits;

  const passRate = ((passedAudits / (audits.length || 1)) * 100).toFixed(1);

  const totalAuditsCount = audits.length || 1;
  const activePct = Math.round((passedAudits / totalAuditsCount) * 100);
  const expiringPct = Math.round((pendingReviewTotal / totalAuditsCount) * 100);
  const expiredPct = Math.max(0, 100 - activePct - expiringPct);

  // Unified Action Required Queue
  const actionItems = [
    ...audits
      .filter(a => a.category === 'L3 Critical Fail')
      .map((a, idx) => ({
        id: `act-l3-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Score: ${a.score}%`,
        category: 'critical',
        stageLabel: 'Critical L3 Fail',
        stageBg: '#fef2f2',
        stageColor: '#dc2626',
        waitingFor: 'Compliance Committee Escalation',
        role: 'compliance',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/critical-fail',
      })),
    ...audits
      .filter(a => a.category === 'Recommend For Pass')
      .map((a, idx) => ({
        id: `act-rfp-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Auditor: ${a.auditor} (${a.score}%)`,
        category: 'rfp',
        stageLabel: 'Recommend For Pass',
        stageBg: '#eff6ff',
        stageColor: '#2563eb',
        waitingFor: 'Certification Sign-Off',
        role: 'certification',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/recommend-pass',
      })),
    ...audits
      .filter(a => a.category === 'Review List')
      .map((a, idx) => ({
        id: `act-rev-${a.id}-${idx}`,
        title: a.storeName,
        sub: `${a.franchisee} • Auditor: ${a.auditor}`,
        category: 'review',
        stageLabel: 'Under Review',
        stageBg: '#fffbeb',
        stageColor: '#d97706',
        waitingFor: 'Lead Auditor Clarification',
        role: 'auditor',
        date: a.auditDate,
        auditObj: a,
        path: '/audits/review',
      })),
    ...appeals
      .filter(ap => ap.status === 'Under Investigation')
      .map((ap, idx) => ({
        id: `act-app-${ap.id}-${idx}`,
        title: ap.storeName,
        sub: `${ap.franchisee} • ${ap.appealCategory || 'Audit Dispute'}`,
        category: 'appeals',
        stageLabel: 'Pending Appeal',
        stageBg: '#fef3c7',
        stageColor: '#b45309',
        waitingFor: 'Appeals Panel Adjudication',
        role: 'compliance',
        date: ap.submittedDate,
        path: '/appeals',
      })),
    ...requests
      .filter(r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending'))
      .map((r, idx) => ({
        id: `act-req-${r.id}-${idx}`,
        title: r.storeName || r.franchisee,
        sub: `${r.requestType || 'Store Request'} • By ${r.requestedBy || 'Franchisee'}`,
        category: 'requests',
        stageLabel: 'Store Request',
        stageBg: '#ecfdf5',
        stageColor: '#059669',
        waitingFor: 'Operations Approval',
        role: 'operations',
        date: r.requestDate,
        path: '/requests',
      })),
  ];

  const filteredActionItems = actionItems.filter(item => {
    if (actionFilter !== 'all' && item.category !== actionFilter) return false;
    if (actionRoleFilter !== 'all' && item.role !== actionRoleFilter) return false;
    if (actionSearch.trim()) {
      const q = actionSearch.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.sub?.toLowerCase().includes(q) ||
        item.stageLabel?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Top Franchisees Chart Data
  const topFranchisees = [...franchisees]
    .sort((a, b) => b.storesCount - a.storesCount)
    .slice(0, 6)
    .map(f => ({
      name: f.name.length > 15 ? f.name.substring(0, 14) + '…' : f.name,
      stores: f.storesCount
    }));

  // Audits by Session Data
  const sessionMap = {};
  audits.forEach(a => {
    const s = a.session || 'Round Two 2026';
    sessionMap[s] = (sessionMap[s] || 0) + 1;
  });
  const sessionChartData = Object.entries(sessionMap).slice(0, 5).map(([name, count]) => ({
    name,
    audits: count
  }));

  const getStatusBadge = (category) => {
    switch (category) {
      case 'Passed':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Passed' };
      case 'Recommend For Pass':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Recommend Pass' };
      case 'Review List':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'In Review' };
      case 'L3 Critical Fail':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'L3 Critical Fail' };
      default:
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: category || 'Other Fail' };
    }
  };

  return (
    <div>
      {/* Executive Command Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1528 0%, #064e3b 60%, #047857 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '24px',
        color: '#ffffff',
        boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(52, 211, 153, 0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(52, 211, 153, 0.35)', padding: '5px 12px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, color: '#6ee7b7', marginBottom: '12px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            HFA KFC UK LIVE COMPLIANCE COMMAND
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
            Welcome back, {currentUser?.fullName || currentUser?.username || 'Taoheed HFA'}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: '640px' }}>
            Monitoring <strong>{totalStores} UK KFC restaurants</strong> across <strong>{franchisees.length} franchise partners</strong> and <strong>{audits.length} recorded Halal inspections</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <MapPin size={15} />
            <span>UK Live Map</span>
          </button>

          <button
            onClick={() => navigate('/certificates')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Award size={15} />
            <span>Certificate Studio</span>
          </button>

          {outletCtx.openNewAuditModal && (
            <button
              onClick={outletCtx.openNewAuditModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: '#ffffff',
                border: 'none',
                color: '#064e3b',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Plus size={16} />
              <span>Conduct Halal Audit</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title={`Last synced: ${lastUpdated.toLocaleTimeString()}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="kpi-grid-4">
        {/* Card 1: Total KFC Stores */}
        <div
          onClick={() => navigate('/stores')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #2563eb',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
              TOTAL KFC STORES
            </span>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={21} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {totalStores.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <TrendingUp size={12} /> {certifiedStores} Certified
            </span>
            <span style={{ color: '#64748b', fontWeight: 500 }}>{dueStores} due for audit</span>
          </div>
        </div>

        {/* Card 2: Pending Audit Reviews */}
        <div
          onClick={() => navigate('/audits/recommend-pass')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #f59e0b',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
              PENDING REVIEWS (RFP)
            </span>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={21} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {pendingReviewTotal}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#d97706', fontWeight: 700 }}>
            <AlertTriangle size={14} /> {rfpAudits} RFP • {reviewAudits} In Review
          </div>
        </div>

        {/* Card 3: Passed Halal Audits */}
        <div
          onClick={() => navigate('/audits/passed')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #059669',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
              PASSED HALAL AUDITS
            </span>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={21} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {passedAudits.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <TrendingUp size={12} /> {passRate}%
            </span>
            <span style={{ color: '#64748b', fontWeight: 500 }}>compliance pass rate</span>
          </div>
        </div>

        {/* Card 4: Approved Halal Products */}
        <div
          onClick={() => navigate('/products')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #e4002b',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
              APPROVED PRODUCTS
            </span>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#e4002b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={21} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {products.length.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              background: '#fef2f2',
              color: '#b91c1c',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              {franchisees.length} Franchisees
            </span>
            <span style={{ color: '#64748b', fontWeight: 500 }}>verified supply chain</span>
          </div>
        </div>
      </div>

      {/* Action Required Command Alert Banner */}
      {actionItems.length > 0 && (
        <div
          onClick={() => setShowActionModal(true)}
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '16px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: '#fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              🔔
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#78350f' }}>
                Action Required — {actionItems.length} Compliance Item(s) Need Your Sign-Off
              </div>
              <div style={{ fontSize: '12.5px', color: '#92400e', marginTop: '2px', fontWeight: 500 }}>
                {rfpAudits} Recommend For Pass • {criticalFailAudits} Critical L3 Fails • {reviewAudits} Review List • {appeals.filter(a => a.status === 'Under Investigation').length} Appeals
              </div>
            </div>
          </div>
          <button
            style={{
              background: '#b45309',
              color: 'white',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(180, 83, 9, 0.25)'
            }}
          >
            Review Action Queue <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Action Required Pop-Up Modal */}
      {showActionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowActionModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '880px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              padding: '20px 24px',
              borderBottom: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🔔</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#78350f' }}>
                    Action Required Queue ({filteredActionItems.length} of {actionItems.length})
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#92400e' }}>
                    Click any audit item to open the full inspection dossier & sign-off controls
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                style={{
                  background: 'rgba(120, 53, 15, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#78350f'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search store name, franchisee, or auditor..."
                    value={actionSearch}
                    onChange={e => setActionSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} style={{ color: '#64748b' }} />
                  <select
                    value={actionRoleFilter}
                    onChange={e => setActionRoleFilter(e.target.value)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#334155',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">👤 All Teams</option>
                    <option value="certification">📜 Certification Sign-Off</option>
                    <option value="compliance">⚠️ Compliance Committee</option>
                    <option value="auditor">🕵️ Lead Auditor</option>
                    <option value="operations">🏢 Operations</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All Items', count: actionItems.length },
                  { key: 'rfp', label: 'Recommend For Pass', count: actionItems.filter(i => i.category === 'rfp').length },
                  { key: 'critical', label: 'Critical L3 Fail', count: actionItems.filter(i => i.category === 'critical').length },
                  { key: 'review', label: 'Review List', count: actionItems.filter(i => i.category === 'review').length },
                  { key: 'appeals', label: 'Appeals', count: actionItems.filter(i => i.category === 'appeals').length },
                  { key: 'requests', label: 'Store Requests', count: actionItems.filter(i => i.category === 'requests').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActionFilter(tab.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: actionFilter === tab.key ? '1.5px solid #b45309' : '1px solid #e2e8f0',
                      background: actionFilter === tab.key ? '#fef3c7' : 'white',
                      color: actionFilter === tab.key ? '#78350f' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {tab.label}
                    <span style={{
                      background: actionFilter === tab.key ? '#b45309' : '#e2e8f0',
                      color: actionFilter === tab.key ? 'white' : '#475569',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredActionItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowActionModal(false);
                      if (item.auditObj) {
                        setSelectedAudit(item.auditObj);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                      <span style={{
                        background: item.stageBg,
                        color: item.stageColor,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}>
                        {item.stageLabel}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{item.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{item.sub}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                        ⏳ {item.waitingFor}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Inspect <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: Live Halal Audit Submissions & Compliance Statistics */}
      <div className="dashboard-mid-grid">
        {/* Left Card: Recent Halal Audit Submissions */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Halal Audit Submissions</h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0' }}>
                Latest UK KFC restaurant inspection reports — click any row to inspect & approve
              </p>
            </div>
            <button
              onClick={() => navigate('/audits')}
              className="btn btn-outline btn-sm"
            >
              <span>Master Registry</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>KFC Store & Franchisee</th>
                  <th>Auditor / Round</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Score / Action</th>
                </tr>
              </thead>
              <tbody>
                {audits.slice(0, 6).map((a, idx) => {
                  const badge = getStatusBadge(a.category);
                  return (
                    <tr
                      key={`dash-aud-${a.id}-${idx}`}
                      onClick={() => setSelectedAudit(a)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.storeName}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{a.franchisee}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{a.auditor}</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{a.session} • {a.auditDate}</div>
                      </td>
                      <td>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'inline-block'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: a.score >= 85 ? '#059669' : '#dc2626' }}>
                            {a.score}%
                          </span>
                          <span className="btn btn-outline btn-sm" style={{ padding: '4px 9px' }}>
                            <Eye size={13} />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Halal Compliance & Certificate Statistics */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Compliance & Certificate Standing</h2>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0' }}>
                  Distribution of UK KFC audits across certification pipeline stages
                </p>
              </div>
              <button
                onClick={() => navigate('/certificates')}
                className="btn btn-outline btn-sm"
              >
                <Award size={14} />
                <span>Studio</span>
              </button>
            </div>

            {/* Multi-segment progress bar */}
            <div style={{
              height: '14px',
              width: '100%',
              background: '#f1f5f9',
              borderRadius: '999px',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '16px'
            }}>
              <div style={{ width: `${activePct}%`, background: '#059669', height: '100%', transition: 'width 0.5s' }} />
              <div style={{ width: `${expiringPct}%`, background: '#f59e0b', height: '100%', transition: 'width 0.5s' }} />
              <div style={{ width: `${expiredPct}%`, background: '#ef4444', height: '100%', transition: 'width 0.5s' }} />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', fontSize: '12px', color: '#475569', fontWeight: 600, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#059669' }} />
                Passed ({passedAudits})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
                Pending Review ({pendingReviewTotal})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
                Non-Conformity ({totalFailedAudits})
              </div>
            </div>
          </div>

          {/* 3 Colored Status Boxes */}
          <div className="cert-stat-grid-3">
            <div
              onClick={() => navigate('/audits/passed')}
              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#047857', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>
                Passed <CheckCircle2 size={15} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#064e3b' }}>{passedAudits}</div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: 2 }}>Certified Halal</div>
            </div>

            <div
              onClick={() => navigate('/audits/recommend-pass')}
              style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#b45309', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>
                Review / RFP <Clock size={15} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#78350f' }}>{pendingReviewTotal}</div>
              <div style={{ fontSize: '11px', color: '#b45309', marginTop: 2 }}>Awaiting Sign-Off</div>
            </div>

            <div
              onClick={() => navigate('/audits/critical-fail')}
              style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#b91c1c', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>
                Failed / L3 <AlertOctagon size={15} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#7f1d1d' }}>{totalFailedAudits}</div>
              <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: 2 }}>{criticalFailAudits} Critical L3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="dashboard-mid-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Franchise Partners by Store Count</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Largest registered KFC UK halal franchise groups
              </p>
            </div>
            <button onClick={() => navigate('/franchisees')} className="btn btn-ghost btn-sm" style={{ color: '#059669' }}>
              <span>View All 34</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFranchisees} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="stores" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Audits Volume by Inspection Round</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Completed store inspections grouped by audit session
              </p>
            </div>
            <button onClick={() => navigate('/map')} className="btn btn-ghost btn-sm" style={{ color: '#059669' }}>
              <MapPin size={14} />
              <span>UK Map</span>
            </button>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="audits" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: 4-Column Summary Stats */}
      <div className="summary-grid-4">
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Certified KFC Stores</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{certifiedStores} / {totalStores}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Franchise Partners</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{franchisees.length}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Certificates</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{certifiedStores}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef2f2', color: '#e4002b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>GPS Field Check-Ins</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{gpsLogs.length}</div>
          </div>
        </div>
      </div>

      <AuditDetailModal
        audit={selectedAudit}
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
      />
    </div>
  );
}
