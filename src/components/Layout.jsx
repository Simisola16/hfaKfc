import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NewStoreModal from './NewStoreModal';
import NewAuditModal from './NewAuditModal';

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('kfc_sidebar_collapsed') === 'true';
  });
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('kfc_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobileViewport(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close mobile drawer when navigating routes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock background scroll while mobile navigation drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const effectiveCollapsed = isMobileViewport ? false : collapsed;

  return (
    <div className="app-layout">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={effectiveCollapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${effectiveCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <Topbar
          onNewStoreClick={() => setIsStoreModalOpen(true)}
          onNewAuditClick={() => setIsAuditModalOpen(true)}
          onToggleMobileSidebar={() => setMobileOpen(prev => !prev)}
          mobileOpen={mobileOpen}
        />
        <main className="main-content">
          <Outlet context={{
            openNewStoreModal: () => setIsStoreModalOpen(true),
            openNewAuditModal: () => setIsAuditModalOpen(true),
          }} />
        </main>
      </div>

      <NewStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />

      <NewAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
