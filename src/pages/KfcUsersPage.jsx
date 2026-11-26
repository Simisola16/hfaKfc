import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, ShieldCheck, UserX, UserCheck,
  Search, Trash2, Building2, Lock, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function KfcUsersPage() {
  const [kfcUsers, setKfcUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'KFC HQ Manager',
    password: ''
  });

  const loadKfcUsers = useCallback(async () => {
    setLoading(true);
    const res = await api.getKfcUsers();
    if (res?.success && Array.isArray(res.data)) {
      setKfcUsers(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadKfcUsers();
  }, [loadKfcUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.fullName.trim() || !form.password.trim()) {
      toast.error('Username, full name, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const res = await api.createKfcUser(form);
    setSubmitting(false);

    if (res?.success && res.data) {
      setKfcUsers(prev => [res.data, ...prev]);
      setIsAddOpen(false);
      setForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'KFC HQ Manager',
        password: ''
      });
      toast.success(`KFC HQ user "${res.data.username}" created!`);
    } else {
      toast.error(res?.error || 'Could not create KFC HQ user.');
    }
  };

  const handleToggle = async (u) => {
    const id = u._id || u.id;
    const res = await api.toggleKfcUser(id);
    if (res?.success && res.data) {
      setKfcUsers(prev => prev.map(item => ((item._id || item.id) === id ? res.data : item)));
      toast.success(`${res.data.username} is now ${res.data.active ? 'Active' : 'Suspended'}.`);
    } else {
      toast.error(res?.error || 'Failed to update status.');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Remove KFC HQ user "${u.username}" permanently?`)) return;
    const id = u._id || u.id;
    const res = await api.deleteKfcUser(id);
    if (res?.success) {
      setKfcUsers(prev => prev.filter(item => (item._id || item.id) !== id));
      toast.success(`Removed "${u.username}".`);
    } else {
      toast.error(res?.error || 'Failed to delete user.');
    }
  };

  const activeCount = kfcUsers.filter(u => u.active).length;
  const filtered = kfcUsers.filter(u => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-shell">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manage KFC Users</h1>
          <div className="dash-subtitle">
            <span>Manage KFC Headquarters user accounts</span>
          </div>
        </div>

        <div className="dash-controls">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ height: 36, padding: '0 14px' }}
          >
            <Plus size={15} />
            <span>New KFC User</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total KFC HQ Users</span>
            <div className="dash-kpi-icon" style={{ background: '#fef2f2', color: '#c8102e' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="dash-kpi-value">{kfcUsers.length}</div>
          <div className="dash-kpi-foot"><span>Exclusive KFC HQ portal accounts</span></div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Active Access</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="dash-kpi-value" style={{ color: '#059669' }}>{activeCount}</div>
          <div className="dash-kpi-foot"><span>Authorized to sign in to KFC HQ</span></div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Suspended</span>
            <div className="dash-kpi-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <UserX size={18} />
            </div>
          </div>
          <div className="dash-kpi-value" style={{ color: '#ea580c' }}>{kfcUsers.length - activeCount}</div>
          <div className="dash-kpi-foot"><span>Blocked from KFC HQ sign-in</span></div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="toolbar" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-box" style={{ maxWidth: 340 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search KFC username, full name, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                    Loading KFC Headquarters users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                    No KFC HQ users created yet. Click <strong>Add KFC User</strong> above.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u._id || u.id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{u.username}</td>
                    <td>{u.fullName}</td>
                    <td><span className="badge badge-neutral">{u.role}</span></td>
                    <td style={{ fontSize: 12.5, color: '#475569' }}>
                      <div>{u.email || '—'}</div>
                      <div style={{ color: '#94a3b8' }}>{u.phone || ''}</div>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="badge badge-pass"><span className="badge-dot" /> Active</span>
                      ) : (
                        <span className="badge badge-fail"><span className="badge-dot" /> Suspended</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleToggle(u)}
                          className="btn btn-outline btn-sm"
                          title={u.active ? 'Suspend account' : 'Activate account'}
                        >
                          {u.active ? <UserX size={14} /> : <UserCheck size={14} />}
                          <span>{u.active ? 'Suspend' : 'Activate'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#dc2626' }}
                          title="Delete KFC user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create KFC User Modal */}
      {isAddOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#c8102e" />
                <h3 className="card-title">Create KFC Headquarters User</h3>
              </div>
              <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. kfc.director"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Full name"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@kfc.co.uk"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+44 ..."
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="KFC HQ Director">KFC HQ Director</option>
                      <option value="KFC HQ Manager">KFC HQ Manager</option>
                      <option value="KFC Request Coordinator">KFC Request Coordinator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password (min 6 chars) *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="Set login password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Lock size={14} />
                  <span>{submitting ? 'Creating...' : 'Create KFC User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
