import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  Calendar, Search, Plus, CheckCircle2, Clock,
  ClipboardCheck, PlayCircle, X
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';
import NewAuditModal from '../components/NewAuditModal';

export default function AssignmentsPage() {
  const { assignments, stores, addAssignment, updateAssignmentStatus } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditStoreId, setAuditStoreId] = useState(null);

  const todayIso = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    storeId: String(stores[0]?.id || '1'),
    auditor: 'Rashid',
    startDate: todayIso,
    endDate: todayIso,
    session: 'Round Two 2026'
  });

  const auditors = ['Rashid', 'Moin', 'Mansur', 'Amir', 'Haris', 'Ali', 'Abu Yusha', 'Taoheed'];
  const sessions = ['Round One 2026', 'Round Two 2026', 'Round Three 2026', 'Surveillance 2026'];

  const scheduledCount = assignments.filter(a => a.status !== 'Completed' && a.status !== 'In Progress').length;
  const inProgressCount = assignments.filter(a => a.status === 'In Progress').length;
  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const completionPct = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  const filtered = assignments.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      a.storeName?.toLowerCase().includes(q) ||
      a.auditor?.toLowerCase().includes(q) ||
      a.franchisee?.toLowerCase().includes(q) ||
      a.branchCode?.toLowerCase().includes(q);

    const matchesSess = selectedSession === 'ALL' || a.session === selectedSession;
    const matchesStatus = selectedStatus === 'ALL' || (a.status || 'Scheduled') === selectedStatus;

    return matchesSearch && matchesSess && matchesStatus;
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
      date: form.startDate,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      session: form.session
    });
    setIsModalOpen(false);
  };

  const launchLiveAuditForAssignment = (asg) => {
    const match = stores.find(s => s.branchCode === asg.branchCode || s.name === asg.storeName);
    setAuditStoreId(match ? match.id : stores[0]?.id);
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Audit Scheduling &amp; Assignments</h1>
          <div className="dash-subtitle">
            <span>Deploy field auditors to UK KFC branches and track inspection completion across rounds</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Schedule Assignment</span>
          </button>
        </div>
      </div>

      {/* 4 Precision KPI Cards */}
      <div className="dash-kpi-grid">
        <div
          className={`dash-kpi-card ${selectedStatus === 'ALL' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Total Assignments</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{assignments.length}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: '100%', background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>All scheduled audit deployments</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Scheduled' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Scheduled'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Scheduled</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#d97706' }}>{scheduledCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${assignments.length ? Math.round((scheduledCount / assignments.length) * 100) : 0}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Awaiting field visit</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'In Progress' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('In Progress'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">In Progress</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <PlayCircle size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#2563eb' }}>{inProgressCount}</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${assignments.length ? Math.round((inProgressCount / assignments.length) * 100) : 0}%`, background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Auditors currently on-site</span>
          </div>
        </div>

        <div
          className={`dash-kpi-card ${selectedStatus === 'Completed' ? 'is-selected' : ''}`}
          onClick={() => { setSelectedStatus('Completed'); setCurrentPage(1); }}
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Completed</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value" style={{ color: '#059669' }}>{completedCount}</span>
              <span className="dash-kpi-denom">({completionPct}%)</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${completionPct}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Inspections submitted to HFA</span>
          </div>
        </div>
      </div>

      {/* Unified Table Surface */}
      <div className="page-surface">
        <div className="surface-toolbar">
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 420 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search store name, branch code, auditor, franchise..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Target KFC Store</th>
                <th>Franchise Partner</th>
                <th>Assigned Auditor</th>
                <th>Scheduled Date</th>
                <th>Session Round</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No audit assignments match your active filters.
                  </td>
                </tr>
              ) : (
                paginated.map((asg, idx) => (
                  <tr key={`asg-row-${asg.id}-${idx}`}>
                    <td>
                      <span className="code-chip">{asg.branchCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{asg.storeName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#334155' }}>{asg.franchisee}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: '#ecfdf5',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {(asg.auditor || 'A').charAt(0).toUpperCase()}
                        </span>
                        <span>{asg.auditor}</span>
                      </div>
                    </td>
                    <td>
                      <div className="tabular-nums" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                        {asg.startDate && asg.endDate && asg.startDate !== asg.endDate
                          ? `${asg.startDate} → ${asg.endDate}`
                          : asg.startDate || asg.date}
                      </div>
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
                      <ActionMenu
                        items={[
                          {
                            label: 'Conduct Live Audit',
                            icon: ClipboardCheck,
                            color: '#e4002b',
                            onClick: () => launchLiveAuditForAssignment(asg)
                          },
                          {
                            label: 'Mark In Progress',
                            icon: PlayCircle,
                            color: '#2563eb',
                            onClick: () => updateAssignmentStatus(asg.id, 'In Progress')
                          },
                          {
                            label: 'Mark Completed',
                            icon: CheckCircle2,
                            color: '#059669',
                            onClick: () => updateAssignmentStatus(asg.id, 'Completed')
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

        <Pagination
          totalItems={filtered.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="assignments"
        />
      </div>

      {/* New Assignment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={19} color="#059669" />
                <h3 className="card-title">Schedule New Audit Assignment</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Beginning Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.startDate}
                      onChange={e => {
                        const nextStart = e.target.value;
                        setForm(prev => ({
                          ...prev,
                          startDate: nextStart,
                          endDate: prev.endDate && prev.endDate < nextStart ? nextStart : prev.endDate
                        }));
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ending Date *</label>
                    <input
                      type="date"
                      required
                      min={form.startDate}
                      className="form-input"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
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

      {auditStoreId && (
        <NewAuditModal
          isOpen={Boolean(auditStoreId)}
          onClose={() => setAuditStoreId(null)}
          defaultStoreId={auditStoreId}
        />
      )}
    </div>
  );
}
