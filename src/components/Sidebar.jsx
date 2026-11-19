import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  LayoutDashboard, MapPin, Store, Building2, Package, ClipboardCheck,
  CheckCircle2, Clock, AlertTriangle, AlertOctagon, Calendar, Inbox,
  MessageSquare, ShieldAlert, Award, Users, LogOut,
  ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    section: 'EXECUTIVE OVERVIEW',
    items: [
      { id: 'dashboard', path: '/dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    section: 'RESTAURANT NETWORK',
    items: [
      {
        id: 'network-group',
        label: 'Stores & Network',
        icon: Store,
        children: [
          { path: '/stores', label: 'All KFC Stores (249)', icon: Store },
          { path: '/franchisees', label: 'Franchise Partners (34)', icon: Building2 },
          { path: '/map', label: 'Interactive UK Map', icon: MapPin },
        ]
      },
      { id: 'products', path: '/products', label: 'Approved Halal Products', icon: Package },
    ]
  },
  {
    section: 'CERTIFICATION & AUDITING',
    items: [
      {
        id: 'audits-group',
        label: 'Halal Audits Pipeline',
        icon: ClipboardCheck,
        badgeKey: 'auditsAction',
        children: [
          { path: '/audits', label: 'Master Audit Registry', icon: ClipboardCheck, end: true },
          { path: '/audits/recommend-pass', label: 'Recommend For Pass', icon: Clock, subBadgeKey: 'rfp' },
          { path: '/audits/review', label: 'Review List', icon: AlertTriangle, subBadgeKey: 'review' },
          { path: '/audits/passed', label: 'Passed & Certified', icon: CheckCircle2 },
          { path: '/audits/other-fail', label: 'Other Fail (Minor NC)', icon: AlertTriangle, subBadgeKey: 'otherFail' },
          { path: '/audits/critical-fail', label: 'L3 Critical Fail', icon: AlertOctagon, subBadgeKey: 'l3' },
        ]
      },
      { id: 'assignments', path: '/assignments', label: 'Audit Assignments', icon: Calendar },
      { id: 'certificates', path: '/certificates', label: 'Certificate Studio', icon: Award },
    ]
  },
  {
    section: 'WORKFLOWS & GOVERNANCE',
    items: [
      { id: 'requests', path: '/requests', label: 'Store & Franchise Requests', icon: Inbox, badgeKey: 'requests' },
      { id: 'appeals', path: '/appeals', label: 'Auditor Appeals Hub', icon: ShieldAlert, badgeKey: 'appeals' },
      { id: 'feedback', path: '/feedback', label: 'Restaurant Feedback', icon: MessageSquare },
      { id: 'users', path: '/users', label: 'Portal Access & Staff', icon: Users },
    ]
  },
];

export default function Sidebar({ collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
  const { currentUser, logout, audits, appeals, requests } = useKfc();
  const location = useLocation();
  const navigate = useNavigate();

  // Compute live action counts
  const rfpCount = audits.filter(a => a.category === 'Recommend For Pass').length;
  const reviewCount = audits.filter(a => a.category === 'Review List').length;
  const otherFailCount = audits.filter(a => a.category === 'Other Fail').length;
  const l3Count = audits.filter(a => a.category === 'L3 Critical Fail').length;
  const appealCount = appeals.filter(ap => ap.status === 'Under Investigation').length;
  const requestCount = requests.filter(r => r.status === 'Pending' || r.status?.toLowerCase().includes('pending')).length;

  const badgeCounts = {
    auditsAction: rfpCount + reviewCount + l3Count,
    rfp: rfpCount,
    review: reviewCount,
    otherFail: otherFailCount,
    l3: l3Count,
    appeals: appealCount,
    requests: requestCount,
  };

  const [openMenus, setOpenMenus] = useState({
    'network-group': true,
    'audits-group': true,
  });

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGroupActive = (item) => {
    if (!item.children) return false;
    return item.children.some(ch =>
      ch.end ? location.pathname === ch.path : (location.pathname === ch.path || location.pathname.startsWith(ch.path + '/'))
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#ffffff',
            border: '2px solid rgba(52, 211, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: collapsed ? 'pointer' : 'default',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            padding: 3
          }}
          onClick={collapsed ? onToggleCollapse : undefined}
          title={collapsed ? 'Expand sidebar' : undefined}
        >
          <img
            src="/hfa-logo.png"
            alt="HFA Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="font-weight:800;font-size:13px;color:#059669">HFA</span>';
            }}
          />
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>
                HFA KFC UK
              </h2>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: 4,
                background: '#e4002b',
                color: '#fff',
                letterSpacing: '0.04em'
              }}>
                PORTAL
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'block', marginTop: 2 }}>
              Halal Certification & Audit
            </span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-collapse-btn"
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((sec, secIdx) => (
          <div key={sec.section} className="nav-section-group">
            {secIdx > 0 && <div className="nav-section-divider" />}
            {!collapsed && <div className="nav-section-label-v2">{sec.section}</div>}
            {sec.items.map(item => {
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? (badgeCounts[item.badgeKey] || 0) : 0;

              if (!item.children) {
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? `${item.label}${badgeCount > 0 ? ` (${badgeCount})` : ''}` : undefined}
                    className={({ isActive }) =>
                      `nav-item-v2 ${isActive ? 'active' : ''} ${collapsed ? 'nav-item-collapsed' : ''}`
                    }
                  >
                    <Icon size={18} className="nav-icon" />
                    {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!collapsed && badgeCount > 0 && (
                      <span style={{
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: 999,
                        background: item.badgeKey === 'appeals' ? '#ef4444' : '#3b82f6',
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              }

              const isOpen = !!openMenus[item.id];
              const groupActive = isGroupActive(item);

              if (collapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onToggleCollapse && onToggleCollapse();
                      setOpenMenus(prev => ({ ...prev, [item.id]: true }));
                    }}
                    title={`${item.label}${badgeCount > 0 ? ` (${badgeCount})` : ''}`}
                    className={`nav-item-v2 nav-parent nav-item-collapsed ${groupActive ? 'group-active' : ''}`}
                  >
                    <Icon size={18} className="nav-icon" />
                  </button>
                );
              }

              return (
                <div key={item.id} className="nav-expandable">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`nav-item-v2 nav-parent ${groupActive ? 'group-active' : ''}`}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {badgeCount > 0 && (
                      <span style={{
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: 999,
                        background: 'rgba(59, 130, 246, 0.25)',
                        border: '1px solid rgba(96, 165, 250, 0.4)',
                        color: '#93c5fd',
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 4,
                      }}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    <span className="nav-chevron">
                      {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                  </button>

                  <div className={`nav-children ${isOpen ? 'open' : ''}`}>
                    {item.children.map(child => {
                      const ChildIcon = child.icon;
                      const subCount = child.subBadgeKey ? (badgeCounts[child.subBadgeKey] || 0) : 0;
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end={child.end}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `nav-sub-item ${isActive ? 'active' : ''}`
                          }
                        >
                          <ChildIcon size={14} className="nav-sub-icon" />
                          <span style={{ flex: 1 }}>{child.label}</span>
                          {subCount > 0 && (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 999,
                              background: child.subBadgeKey === 'l3' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(59, 130, 246, 0.22)',
                              color: child.subBadgeKey === 'l3' ? '#fca5a5' : '#93c5fd',
                            }}>
                              {subCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer User Profile Dock */}
      <div className="sidebar-footer">
        {!collapsed && currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '10px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
              flexShrink: 0
            }}>
              {(currentUser.fullName || currentUser.username || 'T').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.fullName || currentUser.username}
              </div>
              <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.role || 'Operations Manager'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            color: '#fca5a5',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.14)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out of Portal</span>}
        </button>
      </div>
    </aside>
  );
}
