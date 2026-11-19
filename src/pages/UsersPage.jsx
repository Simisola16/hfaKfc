import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { Users, Plus, UserCheck, Key, UserX, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ActionMenu from '../components/ActionMenu';

export default function UsersPage() {
  const { users, addUser, toggleUserActive } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [form, setForm] = useState({
    username: 'TestAuditor',
    fullName: 'Test Auditor Name',
    role: 'Auditor',
    email: 'test.auditor@hfa-portals.com',
    department: 'Field Audit'
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addUser(form);
    setIsAddUserOpen(false);
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search user name, username, role, department..."
            />
          </div>

          <button onClick={() => setIsAddUserOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Portal User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'var(--slate-50)',
          borderBottom: '1px solid var(--slate-200)',
          fontSize: '0.8rem',
          color: 'var(--slate-600)'
        }}>
          Showing <strong>{filtered.length}</strong> authorized HFA staff & auditor accounts
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Username & Email</th>
                <th>Portal Role</th>
                <th>Department</th>
                <th>Access Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{u.fullName}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>@{u.username}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{u.department || 'Compliance & Audit'}</div>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#059669" />
                <h3 className="card-title">Create New Portal User</h3>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="btn btn-ghost btn-sm">
                ×
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
                      <option value="Operations Manager">Operations Manager</option>
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
