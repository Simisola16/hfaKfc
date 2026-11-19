import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { Calendar, Search, Plus, User, CheckCircle2, Mail } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function AssignmentsPage() {
  const { assignments, stores, addAssignment, updateAssignmentStatus } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    storeId: String(stores[0]?.id || '1'),
    auditor: 'Rashid',
    date: new Date().toISOString().split('T')[0],
    session: 'Round Two 2026'
  });

  const auditors = ['Rashid', 'Moin', 'Mansur', 'Amir', 'Haris', 'Ali', 'Abu Yusha', 'Taoheed'];
  const sessions = ['Round One 2026', 'Round Two 2026', 'Round Three 2026', 'Surveillance 2026'];

  const filtered = assignments.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      a.storeName?.toLowerCase().includes(q) ||
      a.auditor?.toLowerCase().includes(q) ||
      a.franchisee?.toLowerCase().includes(q) ||
      a.branchCode?.toLowerCase().includes(q);

    const matchesSess = selectedSession === 'ALL' || a.session === selectedSession;

    return matchesSearch && matchesSess;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const st = stores.find(s => String(s.id) === String(form.storeId)) || stores[0];
    addAssignment({
      storeName: st.name,
      branchCode: st.branchCode,
      franchisee: st.franchisee,
      auditor: form.auditor,
      date: form.date,
      session: form.session
    });
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 280px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search store name, branch code, auditor, franchise..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={selectedSession}
              onChange={e => { setSelectedSession(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Inspection Rounds</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Schedule Audit Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Target Store</th>
                <th>Franchise Partner</th>
                <th>Assigned Auditor</th>
                <th>Scheduled Date</th>
                <th>Session Round</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((asg) => (
                <tr key={asg.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {asg.storeName}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--slate-500)' }}>
                      {asg.branchCode}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{asg.franchisee}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                      <User size={14} color="#059669" />
                      <span>{asg.auditor}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{asg.date}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{asg.session}</span>
                  </td>
                  <td>
                    {asg.status === 'Completed' ? (
                      <span className="badge badge-pass"><span className="badge-dot" /> Completed</span>
                    ) : asg.status === 'In Progress' ? (
                      <span className="badge badge-blue"><span className="badge-dot" /> In Progress</span>
                    ) : (
                      <span className="badge badge-warn"><span className="badge-dot" /> Scheduled</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {asg.status !== 'Completed' ? (
                      <button
                        onClick={() => updateAssignmentStatus(asg.id, 'Completed')}
                        className="btn btn-outline btn-sm"
                      >
                        <CheckCircle2 size={13} color="#059669" />
                        <span>Mark Complete</span>
                      </button>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        <Mail size={13} />
                        <span>Verified</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filtered.length}
          currentPage={currentPage}
          rowsPerPage={pageSize}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setPageSize}
        />
      </div>

      {/* New Assignment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#059669" />
                <h3 className="card-title">Schedule New Audit Assignment</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select KFC Store *</label>
                  <select
                    className="form-select"
                    value={String(form.storeId)}
                    onChange={e => setForm({ ...form, storeId: String(e.target.value) })}
                  >
                    {stores.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.branchCode} — {s.name} ({s.franchisee})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Field Auditor *</label>
                    <select
                      className="form-select"
                      value={form.auditor}
                      onChange={e => setForm({ ...form, auditor: e.target.value })}
                    >
                      {auditors.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Round *</label>
                    <select
                      className="form-select"
                      value={form.session}
                      onChange={e => setForm({ ...form, session: e.target.value })}
                    >
                      {sessions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Target Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Deploy Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
