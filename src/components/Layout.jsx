import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NewStoreModal from './NewStoreModal';
import NewAuditModal from './NewAuditModal';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('kfc_sidebar_collapsed') === 'true';
  });
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
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
        <Topbar
          onNewStoreClick={() => setIsStoreModalOpen(true)}
          onNewAuditClick={() => setIsAuditModalOpen(true)}
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
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
