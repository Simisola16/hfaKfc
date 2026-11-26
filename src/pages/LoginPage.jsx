import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import {
  ShieldCheck, Lock, User, Eye, EyeOff, KeyRound,
  X, CheckCircle, ClipboardCheck, UserCheck, ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, stores, franchisees, audits } = useKfc();

  const [username, setUsername] = useState('Taoheed');
  const [password, setPassword] = useState('@abc123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotSuccess(true);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Left Sidebar Brand Panel */}
        <div className="auth-sidebar">
          <div style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
            overflow: 'hidden',
            padding: 8
          }}>
            <img
              src="/hfa-logo.png"
              alt="HFA Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span style="font-weight:800;font-size:20px;color:#059669">HFA</span>';
              }}
            />
          </div>

          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6ee7b7',
            marginBottom: 8
          }}>
            Halal Food Authority UK
          </div>

          <h2>Halal Food Authority (KFC Admin)</h2>
          <p>
            HFA staff portal for managing KFC stores, franchisees, products, and Halal audits.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            marginBottom: '26px',
            background: 'rgba(255,255,255,0.07)',
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.14)'
          }}>
            <div>
              <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                {stores.length}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>KFC Stores</div>
            </div>
            <div>
              <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                {franchisees.length}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Franchisees</div>
            </div>
            <div>
              <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                {audits.length}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Halal Audits</div>
            </div>
          </div>

          <div className="auth-badge">
            <ShieldCheck size={15} /> Authorised Personnel Only
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-main">
          <div className="auth-tabs">
            <div className="auth-tab active">Staff Portal Login</div>
          </div>

          <div className="auth-header">
            <h1>Staff Login</h1>
            <p>Enter your username and password to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <User size={17} className="input-icon" />
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Enter your username (e.g. Taoheed)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={17} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="form-control"
                  style={{ paddingRight: '42px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotSuccess(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>{loading ? 'Signing in...' : 'Login'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Staff Role Presets (Lucide Icons Only) */}
          <div style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px' }}>
              Quick Role Presets
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { u: 'Taoheed', label: 'Taoheed • Lead Admin', icon: ShieldCheck },
                { u: 'Rashid', label: 'Rashid • Field Auditor', icon: ClipboardCheck },
                { u: 'Builder', label: 'Builder • SuperAdmin', icon: UserCheck },
              ].map(preset => {
                const Icon = preset.icon;
                const selected = username === preset.u;
                return (
                  <button
                    key={preset.u}
                    type="button"
                    onClick={() => handlePreset(preset.u, '@abc123')}
                    className="btn btn-outline btn-sm"
                    style={{
                      fontSize: '12px',
                      borderColor: selected ? '#059669' : '#e2e8f0',
                      background: selected ? '#ecfdf5' : '#ffffff',
                      color: selected ? '#047857' : '#475569'
                    }}
                  >
                    <Icon size={13} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            Authorised HFA access only. Contact your system administrator for credential provisioning.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '430px', padding: '26px', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: 14, right: 14, padding: 6 }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '11px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Reset Password</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>HFA Staff Account Recovery</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div style={{
                padding: '18px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <CheckCircle size={30} color="#059669" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#064e3b', marginBottom: '6px' }}>
                  Recovery Instructions Sent
                </div>
                <div style={{ fontSize: '13px', color: '#047857', lineHeight: 1.5, marginBottom: '16px' }}>
                  If a staff account matching <strong>{forgotInput}</strong> exists, password reset instructions have been sent.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-auth"
                  style={{ height: 42 }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  Enter your HFA staff username or corporate email address to receive a password reset link.
                </p>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Username or Email Address</label>
                  <div className="input-with-icon">
                    <User size={17} className="input-icon" />
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Taoheed or staff@halalfoodauthority.com"
                      value={forgotInput}
                      onChange={e => setForgotInput(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
