import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, ChevronDown } from 'lucide-react';

export default function ActionMenu({ items = [], label = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: false });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = items.length * 40 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

      setCoords({
        top: openUpward ? rect.top - 6 : rect.bottom + 6,
        left: Math.max(12, rect.right - 210),
        openUpward
      });
    }
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClose = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => setOpen(false);

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleMenu}
        className="btn btn-outline btn-sm"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontWeight: 700,
          fontSize: '12.5px',
          borderRadius: '8px',
          background: open ? '#ecfdf5' : '#ffffff',
          borderColor: open ? '#059669' : 'var(--slate-300)',
          color: open ? '#059669' : 'var(--slate-700)',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }}
      >
        <MoreVertical size={14} />
        <span>{label}</span>
        <ChevronDown
          size={13}
          style={{
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: coords.openUpward ? 'translateY(-100%)' : 'none',
            width: 210,
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 14px 34px -6px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            padding: '6px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={`div-${idx}`} style={{ height: 1, background: '#f1f5f9', margin: '4px 6px' }} />;
            }
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  if (item.onClick) item.onClick();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: item.danger ? '#dc2626' : '#1e293b',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f8fafc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {Icon && (
                  <Icon
                    size={15}
                    color={item.danger ? '#dc2626' : item.color || '#059669'}
                    style={{ flexShrink: 0 }}
                  />
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
