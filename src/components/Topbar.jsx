import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import { NAV_SECTIONS } from './Sidebar';
import {
  Plus, RotateCcw, Bell, CheckCheck, Clock, AlertTriangle,
  AlertOctagon, Inbox, ShieldAlert, Menu, X, ChevronRight
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
  const { currentUser, audits, appeals, requests, resetToOfficialDatabase } = useKfc();

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build live notifications from KFC compliance queues
  const liveNotifications = [
    ...audits
      .filter(a => a.category === 'L3 Critical Fail')
      .slice(0, 4)
      .map(a => ({
        id: `l3-${a.id}`,
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
      .map(a => ({
        id: `rfp-${a.id}`,
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
      .map(ap => ({
        id: `app-${ap.id}`,
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
      .map(r => ({
        id: `req-${r.id}`,
        title: `Store Request: ${r.storeName || r.franchisee}`,
        message: `${r.requestType || 'Branch Conversion'} — submitted by ${r.requestedBy || 'Franchisee'}`,
        path: '/requests',
        time: r.requestDate || 'Pending',
        color: '#00853b',
        bg: '#f0fdf4',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
        <span className="breadcrumb-section" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          HFA KFC Admin
        </span>
        {bc.group && (
          <>
            <span className="breadcrumb-group" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>›</span>
            <span className="breadcrumb-group" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {bc.group}
            </span>
          </>
        )}
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>›</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {bc.label}
        </span>
      </div>

      {/* Right: Quick Actions + Notification Bell + Admin User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Reset Demo Data */}
        <button
          onClick={resetToOfficialDatabase}
          className="btn btn-outline btn-sm"
          title="Restore official MSSQL export snapshot"
          style={{ fontSize: '12px', padding: '6px 10px' }}
        >
          <RotateCcw size={13} />
          <span className="topbar-user-info">Reset Data</span>
        </button>

        {/* New Store Button */}
        {onNewStoreClick && (
          <button
            onClick={onNewStoreClick}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', padding: '6px 12px' }}
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
            style={{ fontSize: '12px', padding: '6px 14px', background: '#00853b' }}
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
            style={{
              position: 'relative',
              background: notifOpen ? '#f0fdf4' : 'transparent',
              border: '1px solid',
              borderColor: notifOpen ? '#bbf7d0' : '#e2e8f0',
              borderRadius: '10px',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: notifOpen ? '#00853b' : '#475569'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: '#ef4444',
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
              width: 380,
              maxHeight: 480,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#dcfce7',
                      color: '#166534',
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
                      color: '#00853b',
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

              {/* List */}
              <div style={{ overflowY: 'auto', maxHeight: 400 }}>
                {liveNotifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>No notifications yet</div>
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
                        onMouseEnter={e => e.currentTarget.style.background = isRead ? '#f8fafc' : '#dcfce7'}
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
                            fontSize: 13,
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
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#e6f4ea',
            color: '#00853b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            flexShrink: 0
          }}>
            {(currentUser?.fullName || currentUser?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-info" style={{ fontSize: '13px', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
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
