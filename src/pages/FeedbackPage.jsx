import React, { useState } from 'react';
import { useKfc } from '../context/KfcContext';
import { MessageSquare, Star, Plus, CheckCircle2, User, Store, Calendar } from 'lucide-react';

export default function FeedbackPage() {
  const { feedback, stores, addFeedback } = useKfc();

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

  const avgRating = (feedback.reduce((acc, f) => acc + (f.rating || 5), 0) / (feedback.length || 1)).toFixed(1);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addFeedback(form);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Metric Summary */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="metric-card">
          <div>
            <div className="metric-label">Average Auditor Rating</div>
            <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
              <span>{avgRating}</span>
              <Star size={24} fill="#f59e0b" color="#f59e0b" />
            </div>
            <div className="metric-sub">Across {feedback.length} restaurant submissions</div>
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Procedure Clarification</div>
            <div className="metric-value" style={{ color: '#15803d' }}>100%</div>
            <div className="metric-sub">Store managers briefed prior to inspection</div>
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Auditor Punctuality</div>
            <div className="metric-value" style={{ color: '#15803d' }}>98.5%</div>
            <div className="metric-sub">Arrived within designated audit window</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="card-title">Restaurant Manager Audit Feedback</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Independent post-audit evaluations submitted by store teams
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Submit Store Evaluation</span>
          </button>
        </div>
      </div>

      {/* Feedback Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {feedback.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)' }}>
                  {item.siteName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < (item.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                      color={i < (item.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                    />
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                Audit Date: {item.auditDate} at {item.time}
              </div>

              <div style={{
                background: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                fontSize: '0.8rem',
                lineHeight: '1.6',
                color: 'var(--slate-700)',
                marginBottom: '0.75rem'
              }}>
                <div><strong>Procedure Explained:</strong> {item.procedureExplained}</div>
                <div><strong>Auditor Punctual:</strong> {item.auditorPunctual}</div>
                <div><strong>Professional Conduct:</strong> {item.professionalConduct}</div>
                <div><strong>Findings Discussed:</strong> {item.outcomeDiscussed}</div>
              </div>

              {item.recommendation && (
                <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--slate-600)' }}>
                  "{item.recommendation}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Feedback Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="#15803d" />
                <h3 className="card-title">Submit Post-Audit Evaluation</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-icon">
                &times;
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

