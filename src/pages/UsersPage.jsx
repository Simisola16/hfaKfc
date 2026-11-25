import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  Users, Plus, UserCheck, Key, UserX,
  Search, ShieldCheck, ClipboardCheck, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import ActionMenu from '../components/ActionMenu';

export default function UsersPage() {
  const { users, addUser, toggleUserActive } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [form, setForm] = useState({
    username: 'TestAuditor',
    fullName: 'Test Auditor Name',
    role: 'Auditor',
    email: 'test.auditor@hfa-portals.com',
    department: 'Field Audit'
  });

  const activeCount = users.filter(u => u.active).length;
  const fieldAndOpsCount = users.filter(u =>
    u.role?.toLowerCase().includes('auditor') || u.role?.toLowerCase().includes('operations')
  ).length;
  const roles = Array.from(new Set(users.map(u => u.role))).filter(Boolean);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addUser(form);
    setIsAddUserOpen(false);
  };

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Portal Access &amp; Staff</h1>
          <div className="dash-subtitle">
            <span>Provision HFA staff credentials, manage field auditor accounts, and control access status</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={() => setIsAddUserOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Create Portal User</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Staff Accounts</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{users.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Provisioned portal operators</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Connected / Active</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#059669' }}>{activeCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${users.length ? Math.round((activeCount / users.length) * 100) : 0}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Authorized to sign in &amp; approve</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Field Auditors &amp; Ops</span>
            <div className="dash-kpi-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{fieldAndOpsCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${users.length ? Math.round((fieldAndOpsCount / users.length) * 100) : 0}%`, background: '#334155' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Inspection &amp; certification staff</span>
          </div>
        </div>
      </div>

      {/* Unified Users Table Surface */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search full name, username, role, department..."
            />
          </div>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Portal Roles</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Username &amp; Email</th>
                <th>Portal Role</th>
                <th>Department</th>
                <th>Access Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No staff accounts match your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={`usr-row-${u.id}-${idx}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 34,
                          height: 34,
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
                          {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.fullName}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>@{u.username}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#475569' }}>
                        {u.department || 'Compliance & Audit'}
                      </div>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="badge badge-pass"><span className="badge-dot" /> Connected</span>
                      ) : (
                        <span className="badge badge-fail"><span className="badge-dot" /> Disconnected</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={[
                          {
                            label: u.active ? 'Disconnect Account' : 'Connect Account',
                            icon: u.active ? UserX : UserCheck,
                            danger: Boolean(u.active),
                            color: '#059669',
                            onClick: () => toggleUserActive(u.id)
                          },
                          {
                            label: 'Send Password Reset',
                            icon: Key,
                            color: '#2563eb',
                            onClick: () => toast.success(`Password reset link sent to ${u.email || u.username}`)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={19} color="#059669" />
                <h3 className="card-title">Create New Portal User</h3>
              </div>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
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
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
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
                      <option value="IT Manager">IT Manager</option>
                      <option value="Auditor">Field Auditor</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Franchisee">Franchisee Representative</option>
                      <option value="Store Manager">Store Manager</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
