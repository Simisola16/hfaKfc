import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKfc } from '../context/KfcContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, X, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useKfc();

  const [username, setUsername] = useState('Taoheed');
  const [password, setPassword] = useState('@abc123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      setLoading(false);
      if (ok) {
        navigate('/dashboard');
      }
    }, 350);
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
        {/* Left Sidebar Panel */}
        <div className="auth-sidebar">
          <div style={{
            width: 84,
            height: 84,
            borderRadius: 16,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            padding: 8
          }}>
            <img
              src="/hfa-logo.png"
              alt="HFA Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span style="font-weight:800;font-size:22px;color:#00853b">HFA</span>';
              }}
            />
          </div>

          <h2>HFA KFC Admin Portal</h2>
          <p>
            Authorised portal for Halal Food Authority staff, auditors, and certification officers managing UK KFC restaurant compliance, audits, and certificates.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.08)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.14)'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>250</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>KFC Stores</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>34</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>Franchisees</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>351</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>Halal Audits</div>
            </div>
          </div>

          <div className="auth-badge">
            <ShieldCheck size={16} /> Authorised Personnel Only
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-main">
          <div className="auth-tabs">
            <div className="auth-tab active">Staff Login</div>
          </div>

          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in with your HFA staff credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
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

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="form-control"
                  style={{ paddingRight: '40px' }}
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
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    color: '#00853b',
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
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Role Switcher Presets */}
          <div style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
              Quick Staff Role Presets:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handlePreset('Taoheed', '@abc123')}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderColor: username === 'Taoheed' ? '#00853b' : '#e2e8f0',
                  background: username === 'Taoheed' ? '#f0fdf4' : '#fff',
                  color: username === 'Taoheed' ? '#00853b' : '#475569'
                }}
              >
                👑 Taoheed (Lead Admin)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('Rashid', '@abc123')}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderColor: username === 'Rashid' ? '#00853b' : '#e2e8f0',
                  background: username === 'Rashid' ? '#f0fdf4' : '#fff',
                  color: username === 'Rashid' ? '#00853b' : '#475569'
                }}
              >
                🕵️ Rashid (Field Auditor)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('Builder', '@abc123')}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderColor: username === 'Builder' ? '#00853b' : '#e2e8f0',
                  background: username === 'Builder' ? '#f0fdf4' : '#fff',
                  color: username === 'Builder' ? '#00853b' : '#475569'
                }}
              >
                🛡️ Builder (SuperAdmin)
              </button>
            </div>
          </div>

          <div className="auth-footer" style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            Authorized access only. Need an account? Contact your HFA System Administrator.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00853b'
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Reset Password</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>HFA Staff Account Recovery</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div style={{
                padding: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <CheckCircle size={32} color="#16a34a" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '6px' }}>
                  Recovery Instructions Sent
                </div>
                <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5, marginBottom: '16px' }}>
                  If a staff account matching <strong>{forgotInput}</strong> exists, password reset instructions have been sent.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-auth"
                  style={{ width: '100%', padding: '10px' }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  Enter your HFA staff username or email address to receive a temporary password reset link.
                </p>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Username or Email Address</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
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
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-auth"
                    style={{ flex: 1, padding: '11px', margin: 0 }}
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
