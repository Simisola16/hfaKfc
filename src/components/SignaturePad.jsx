import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

export default function SignaturePad({
  label = 'Signature',
  signerName = '',
  roleTitle = '',
  onChange,
  initialValue = ''
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High DPI canvas scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Default styles
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialValue;
    }
  }, [initialValue]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onChange) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onChange) onChange('');
  };

  const adoptQuickSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 28px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillText(signerName || 'Authorized Signatory', 30, rect.height / 2 + 8);

    // Decorative underline loop
    ctx.beginPath();
    ctx.moveTo(25, rect.height / 2 + 18);
    ctx.bezierCurveTo(90, rect.height / 2 + 25, 200, rect.height / 2 + 5, rect.width - 40, rect.height / 2 + 15);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    setHasDrawn(true);
    if (onChange) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--slate-300)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-800)' }}>
            {label}
          </span>
          {signerName && (
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', marginLeft: '0.35rem' }}>
              ({signerName} &bull; {roleTitle})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {hasDrawn ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#15803d',
              background: '#dcfce7',
              padding: '2px 8px',
              borderRadius: 999
            }}>
              <Check size={11} /> Digitally Signed
            </span>
          ) : (
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--slate-400)',
              background: 'var(--slate-100)',
              padding: '2px 8px',
              borderRadius: 999
            }}>
              Pending Signature
            </span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{
        position: 'relative',
        background: '#f8fafc',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed var(--slate-300)',
        overflow: 'hidden',
        height: '110px'
      }}>
        {/* Sign line marker */}
        <div style={{
          position: 'absolute',
          bottom: '22px',
          left: '20px',
          right: '20px',
          borderBottom: '1px solid #cbd5e1',
          pointerEvents: 'none'
        }}>
          <span style={{
            position: 'absolute',
            bottom: '2px',
            left: '0',
            fontSize: '0.65rem',
            color: '#94a3b8',
            fontFamily: 'var(--font-mono)'
          }}>
            X SIGN HERE
          </span>
        </div>

        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
        <button
          type="button"
          onClick={clearPad}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--slate-600)' }}
        >
          <Eraser size={12} />
          <span>Clear Signature</span>
        </button>

        <button
          type="button"
          onClick={adoptQuickSignature}
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
        >
          <PenTool size={12} />
          <span>Adopt Signature Stamp</span>
        </button>
      </div>
    </div>
  );
}

