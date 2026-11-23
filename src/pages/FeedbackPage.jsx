import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import {
  MessageSquare, Star, Plus, CheckCircle2,
  Clock, Search, X, Calendar
} from 'lucide-react';

export default function FeedbackPage() {
  const { feedback, stores, addFeedback } = useKfc();

  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    siteName: stores[0]?.name || 'Bolton - Derby Street',
    auditDate: new Date().toISOString().split('T')[0],
    rating: 5,
    procedureExplained: 'Yes',
    auditorPunctual: 'Yes',
    professionalConduct: 'Very Professional',
    outcomeDiscussed: 'Yes',
    recommendation: 'Auditor was exceptionally thorough and polite.'
  });

  const avgRating = (feedback.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / (feedback.length || 1)).toFixed(1);
  const explainedPct = feedback.length > 0
    ? Math.round((feedback.filter(f => String(f.procedureExplained).toLowerCase() === 'yes').length / feedback.length) * 100)
    : 100;
  const punctualPct = feedback.length > 0
    ? Math.round((feedback.filter(f => String(f.auditorPunctual).toLowerCase() === 'yes').length / feedback.length) * 100)
    : 100;

  const filtered = feedback.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      item.siteName?.toLowerCase().includes(q) ||
      item.recommendation?.toLowerCase().includes(q) ||
      item.professionalConduct?.toLowerCase().includes(q);
    const matchesRating = ratingFilter === 'ALL' || Number(item.rating || 5) === Number(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addFeedback(form);
    setIsModalOpen(false);
  };

  return (
    <div className="page-shell">
      {/* Executive Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Restaurant Audit Feedback</h1>
          <div className="dash-subtitle">
            <span>Independent post-inspection evaluations submitted by KFC UK store managers</span>
          </div>
        </div>

        <div className="dash-controls">
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 14px' }}>
            <Plus size={15} />
            <span>Submit Store Evaluation</span>
          </button>
        </div>
      </div>

      {/* 3 Precision KPI Cards */}
      <div className="dash-kpi-grid-3">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Average Auditor Rating</span>
            <div className="dash-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value-row">
              <span className="dash-kpi-value">{avgRating}</span>
              <span className="dash-kpi-denom">/ 5.0</span>
            </div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${Math.min(100, (Number(avgRating) / 5) * 100)}%`, background: '#f59e0b' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Across {feedback.length} restaurant evaluations</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Procedure Clarification</span>
            <div className="dash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value" style={{ color: '#059669' }}>{explainedPct}%</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${explainedPct}%`, background: '#059669' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Store teams briefed prior to inspection</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">Auditor Punctuality</span>
            <div className="dash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="dash-kpi-value">{punctualPct}%</div>
            <div className="dash-kpi-track">
              <div className="dash-kpi-fill" style={{ width: `${punctualPct}%`, background: '#2563eb' }} />
            </div>
          </div>
          <div className="dash-kpi-foot">
            <span>Arrived within scheduled audit window</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="dash-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 280px', maxWidth: 440 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search store name or manager comment..."
            />
          </div>

          <select
            className="filter-select"
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
          >
            <option value="ALL">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Feedback Cards Grid */}
      {filtered.length === 0 ? (
        <div className="page-surface empty-state">
          No restaurant evaluations match your current search or rating filter.
        </div>
      ) : (
        <div className="card-grid-3">
          {filtered.map((item, idx) => (
            <div key={`fb-card-${item.id}-${idx}`} className="dash-card" style={{ justifyContent: 'space-between', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {item.siteName}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    flexShrink: 0
                  }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < (item.rating || 5) ? '#f59e0b' : '#e2e8f0'}
                        color={i < (item.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                </div>

                <div className="tabular-nums" style={{ fontSize: '11.5px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                  <Calendar size={12} /> Audit Date: {item.auditDate}{item.time ? ` • ${item.time}` : ''}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  marginBottom: 12
                }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Procedure Explained</div>
                    <strong style={{ color: '#0f172a' }}>{item.procedureExplained}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Auditor Punctual</div>
                    <strong style={{ color: '#0f172a' }}>{item.auditorPunctual}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Professional Conduct</div>
                    <strong style={{ color: '#059669' }}>{item.professionalConduct}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Findings Discussed</div>
                    <strong style={{ color: '#0f172a' }}>{item.outcomeDiscussed}</strong>
                  </div>
                </div>
              </div>

              {item.recommendation && (
                <div style={{
                  fontSize: '12.5px',
                  fontStyle: 'italic',
                  color: '#475569',
                  paddingLeft: 10,
                  borderLeft: '2px solid #cbd5e1'
                }}>
                  &ldquo;{item.recommendation}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Feedback Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={19} color="#059669" />
                <h3 className="card-title">Submit Post-Audit Evaluation</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">KFC Store Site Name *</label>
                  <select
                    className="form-select"
                    value={form.siteName}
                    onChange={e => setForm({ ...form, siteName: e.target.value })}
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.name}>{s.branchCode} — {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Audit Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.auditDate}
                      onChange={e => setForm({ ...form, auditDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Overall Rating (1 - 5 Stars) *</label>
                    <select
                      className="form-select"
                      value={form.rating}
                      onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Good</option>
                      <option value={3}>3 Stars - Satisfactory</option>
                      <option value={2}>2 Stars - Needs Improvement</option>
                      <option value={1}>1 Star - Unsatisfactory</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Store Manager Feedback Comments</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={form.recommendation}
                    onChange={e => setForm({ ...form, recommendation: e.target.value })}
                    placeholder="Enter observations on auditor conduct and professionalism..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
