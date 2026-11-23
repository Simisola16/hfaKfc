import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import { NAV_SECTIONS } from './Sidebar';
import {
  Plus, RotateCcw, Bell, CheckCheck, Clock, AlertOctagon,
  Inbox, ShieldAlert, Menu, X, Search, Store, ClipboardCheck, Award
} from 'lucide-react';

function getBreadcrumb(pathname) {
  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if (item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))) {
        return { section: sec.section, label: item.label };
      }
      if (item.children) {
        for (const ch of item.children) {
          if (ch.end ? pathname === ch.path : (pathname === ch.path || pathname.startsWith(ch.path + '/'))) {
            return { section: sec.section, group: item.label, label: ch.label };
          }
        }
      }
    }
  }
  return { section: 'OVERVIEW', label: 'Dashboard' };
}

export default function Topbar({ onNewAuditClick, onNewStoreClick, onToggleMobileSidebar, mobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, stores, audits, appeals, requests, resetToOfficialDatabase } = useKfc();

  const [quickQuery, setQuickQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kfc_read_notifs') || '[]');
    } catch {
      return [];
    }
  });
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const q = quickQuery.trim().toLowerCase();
  const matchingStores = q
    ? stores.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.branchCode?.toLowerCase().includes(q) ||
        s.postcode?.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchingAudits = q
    ? audits.filter(a =>
        a.storeName?.toLowerCase().includes(q) ||
        a.auditor?.toLowerCase().includes(q) ||
        a.branchCode?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const liveNotifications = [
    ...audits
      .filter(a => a.category === 'L3 Critical Fail')
      .slice(0, 4)
      .map((a, idx) => ({
        id: `notif-l3-${a.id}-${idx}`,
        title: `Critical L3 Fail: ${a.storeName}`,
        message: `Immediate escalation required (${a.session || 'Round Two'} - ${a.auditor})`,
        path: '/audits/critical-fail',
        time: a.auditDate || 'Recent',
        color: '#dc2626',
        bg: '#fef2f2',
        icon: AlertOctagon,
      })),
    ...audits
      .filter(a => a.category === 'Recommend For Pass')
      .slice(0, 5)
      .map((a, idx) => ({
        id: `notif-rfp-${a.id}-${idx}`,
        title: `RFP Sign-Off Needed: ${a.storeName}`,
        message: `Field audit completed by ${a.auditor} (${a.score}%) — awaiting certification pass`,
        path: '/audits/recommend-pass',
        time: a.auditDate || 'Recent',
        color: '#2563eb',
        bg: '#eff6ff',
        icon: Clock,
      })),
    ...appeals
      .filter(ap => ap.status === 'Under Investigation')
      .slice(0, 3)
      .map((ap, idx) => ({
        id: `notif-app-${ap.id}-${idx}`,
        title: `Auditor Appeal: ${ap.storeName}`,
        message: `${ap.franchisee} disputed finding (${ap.appealCategory || 'Audit Dispute'})`,
        path: '/appeals',
        time: ap.submittedDate || 'Pending',
        color: '#d97706',
        bg: '#fffbeb',
        icon: ShieldAlert,
      })),
    ...requests
      .filter(r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending'))
      .slice(0, 3)
      .map((r, idx) => ({
        id: `notif-req-${r.id}-${idx}`,
        title: `Store Request: ${r.storeName || r.franchisee}`,
        message: `${r.requestType || 'Branch Conversion'} — submitted by ${r.requestedBy || 'Franchisee'}`,
        path: '/requests',
        time: r.requestDate || 'Pending',
        color: '#059669',
        bg: '#ecfdf5',
        icon: Inbox,
      })),
  ];

  const unreadCount = liveNotifications.filter(n => !readIds.includes(n.id)).length;

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('kfc_read_notifs', JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const all = liveNotifications.map(n => n.id);
    setReadIds(all);
    localStorage.setItem('kfc_read_notifs', JSON.stringify(all));
  };

  const bc = getBreadcrumb(location.pathname);

  return (
    <header className="topbar">
      {/* Left: Mobile toggle + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="mobile-menu-toggle"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px',
              marginRight: '4px',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <span className="breadcrumb-section" style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          HFA KFC Admin
        </span>
        {bc.group && (
          <>
            <span className="breadcrumb-group" style={{ fontSize: '12.5px', color: '#cbd5e1' }}>/</span>
            <span className="breadcrumb-group" style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {bc.group}
            </span>
          </>
        )}
        <span style={{ fontSize: '12.5px', color: '#cbd5e1' }}>/</span>
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bc.label}
        </span>
      </div>

      {/* Right: Global Quick-Search + Quick Actions + Notification Bell + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Global Quick-Search */}
        <div ref={searchRef} className="topbar-search">
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Quick search store, postcode, auditor..."
            value={quickQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={e => {
              setQuickQuery(e.target.value);
              setSearchOpen(true);
            }}
          />
          {quickQuery && (
            <button
              type="button"
              onClick={() => setQuickQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={13} />
            </button>
          )}

          {searchOpen && q.length > 0 && (
            <div className="topbar-search-dropdown">
              {matchingStores.length === 0 && matchingAudits.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                  No stores or audits matching &ldquo;{quickQuery}&rdquo;
                </div>
              ) : (
                <>
                  {matchingStores.length > 0 && (
                    <div style={{ padding: '8px' }}>
                      <div style={{ padding: '4px 8px', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        KFC Branches ({matchingStores.length})
                      </div>
                      {matchingStores.map(st => (
                        <div
                          key={`qs-store-${st.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setQuickQuery('');
                            navigate('/stores');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            <Store size={15} color="#059669" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {st.branchCode} • {st.postcode}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSearchOpen(false);
                              setQuickQuery('');
                              navigate(`/certificates?storeId=${encodeURIComponent(st.id)}`);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <Award size={12} color="#059669" /> Cert
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingAudits.length > 0 && (
                    <div style={{ padding: '8px', borderTop: matchingStores.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ padding: '4px 8px', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Audit Reports ({matchingAudits.length})
                      </div>
                      {matchingAudits.map((au, idx) => (
                        <div
                          key={`qs-aud-${au.id}-${idx}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setQuickQuery('');
                            navigate('/audits');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            <ClipboardCheck size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {au.storeName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {au.auditor} • {au.category}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: au.score >= 85 ? '#059669' : '#dc2626' }}>
                            {au.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Restore Database Snapshot Icon Button */}
        <button
          onClick={resetToOfficialDatabase}
          className="topbar-icon-btn"
          title="Restore official MSSQL database snapshot"
        >
          <RotateCcw size={15} />
        </button>

        {/* New Store Button */}
        {onNewStoreClick && (
          <button
            onClick={onNewStoreClick}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', height: 36, padding: '0 12px' }}
          >
            <Plus size={14} />
            <span className="topbar-user-info">New Store</span>
          </button>
        )}

        {/* Conduct Audit Primary CTA */}
        {onNewAuditClick && (
          <button
            onClick={onNewAuditClick}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '12px', height: 36, padding: '0 13px' }}
          >
            <Plus size={14} />
            <span>Conduct Audit</span>
          </button>
        )}

        {/* Notification Bell & Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications & Action Queue"
            className="topbar-icon-btn"
            style={{
              background: notifOpen ? '#ecfdf5' : '#ffffff',
              borderColor: notifOpen ? '#a7f3d0' : '#e2e8f0',
              color: notifOpen ? '#059669' : '#475569'
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -5,
                right: -5,
                minWidth: 17,
                height: 17,
                padding: '0 4px',
                borderRadius: 999,
                background: '#dc2626',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 370,
              maxHeight: 460,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 16px 40px -10px rgba(15, 23, 42, 0.16)',
              border: '1px solid #e2e8f0',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '13px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                {liveNotifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Bell size={26} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>All caught up</div>
                  </div>
                ) : (
                  liveNotifications.map(n => {
                    const isRead = readIds.includes(n.id);
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          setNotifOpen(false);
                          navigate(n.path);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f1f5f9',
                          background: isRead ? '#fff' : '#f0fdf4',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = isRead ? '#fff' : '#f0fdf4'}
                      >
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: n.bg,
                          color: n.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2
                        }}>
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12.5,
                            fontWeight: isRead ? 500 : 700,
                            color: '#0f172a',
                            marginBottom: 2,
                          }}>
                            {n.title}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: '#64748b',
                            lineHeight: 1.4,
                          }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>
                            {n.time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingLeft: '10px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '9px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '12.5px',
            flexShrink: 0
          }}>
            {(currentUser?.fullName || currentUser?.username || 'T').charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-info" style={{ fontSize: '12.5px', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentUser?.fullName || currentUser?.username || 'Admin'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {currentUser?.role || 'Administrator'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
