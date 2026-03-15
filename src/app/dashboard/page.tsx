'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Circle, AlertTriangle, DollarSign, Info, Mail, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Project {
  id: number; name: string; client: string; designer: string;
  flatType: string; roomType: string; style: string; status: string;
  startDate: string; estimatedEnd: string;
  milestones: { stage: string; status: string; date: string; description: string }[];
  progressUpdates: { date: string; text: string }[];
  budget: { total: number; breakdown: { category: string; estimated: number; actual: number }[] };
}

const timelineStages = ['Design', 'Procurement', 'Demolition', 'Carpentry', 'Electrical', 'Painting', 'Styling', 'Handover'];

export default function DashboardPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects/1').then(r => r.json()).then(d => { setProject(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  if (!project) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Project not found</p></div>;

  const totalEstimated = project.budget.breakdown.reduce((s, b) => s + b.estimated, 0);
  const totalActual = project.budget.breakdown.reduce((s, b) => s + b.actual, 0);
  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedMilestones / project.milestones.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Project Header Card */}
        <motion.div className="card" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, marginBottom: 32, padding: 0, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, #3d3d5c, #1a1a2e)', height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(196,162,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>🏠</div>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>{project.name}</h1>
              <span className="chip chip-accent" style={{ fontSize: 11, fontWeight: 700 }}>IN PROGRESS</span>
            </div>
            <p style={{ color: 'var(--color-accent)', fontWeight: 500, marginBottom: 16 }}>Lead Designer: {project.designer}</p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Overall Completion</span>
                <span style={{ fontWeight: 700 }}>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <span>📅 Est. Handover: {project.estimatedEnd}</span>
              <span>📍 Singapore</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline Stepper */}
        <motion.div className="card" style={{ marginBottom: 32 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', padding: '8px 0' }}>
            {timelineStages.map((stage, i) => {
              const milestone = project.milestones.find(m => m.stage.toLowerCase().includes(stage.toLowerCase()));
              const status = milestone?.status || 'upcoming';
              const isCompleted = status === 'completed';
              const isActive = status === 'in-progress';
              return (
                <div key={stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 100 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isCompleted ? 'var(--color-accent)' : isActive ? 'var(--color-accent)' : 'var(--color-bg)',
                    border: `2px solid ${isCompleted || isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                  }}>
                    {isCompleted ? <CheckCircle2 size={16} style={{ color: '#fff' }} /> : isActive ? <Clock size={16} style={{ color: '#fff' }} /> : <Circle size={12} style={{ color: 'var(--color-text-muted)' }} />}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8, color: isCompleted || isActive ? 'var(--color-text)' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>{stage}</div>
                  {i < timelineStages.length - 1 && (
                    <div style={{ position: 'absolute', top: 20, left: '50%', width: '100%', height: 2, background: isCompleted ? 'var(--color-accent)' : 'var(--color-border)', zIndex: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Activity Feed */}
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>🔔 Site Activity Feed</h2>
              <span style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 340, overflowY: 'auto' }}>
              {project.progressUpdates.slice().reverse().map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{u.text.split('.')[0]}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-accent)' }}>{u.date}</div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{u.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Budget */}
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>💰 Project Budget</h2>
            {project.budget.breakdown.map(b => (
              <div key={b.category} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                  <span>{b.category}</span>
                  <span>${b.actual.toLocaleString()} / ${b.estimated.toLocaleString()}</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, (b.actual / b.estimated) * 100)}%`, background: b.actual > b.estimated ? 'var(--color-warning)' : 'var(--color-accent)' }} />
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Spent</span>
                <span style={{ fontSize: 28, fontWeight: 800 }}>${totalActual.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Remaining Budget</span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>${(totalEstimated - totalActual).toLocaleString()}</span>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              📄 View Detailed Billing
            </button>
          </motion.div>
        </div>

        {/* Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', title: 'Weather Delay', desc: 'Outdoor patio prep delayed 24h' },
            { icon: CheckCircle2, color: 'var(--color-success)', bg: 'var(--color-success-bg)', title: 'Permit Approved', desc: 'Structural changes cleared' },
            { icon: Info, color: 'var(--color-info)', bg: 'rgba(74,143,212,0.08)', title: 'New Document', desc: 'Lighting plan v3 uploaded' },
            { icon: Mail, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', title: 'Message from Sarah', desc: 'Review selection samples' },
          ].map((alert, i) => (
            <motion.div key={alert.title} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: alert.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <alert.icon size={16} style={{ color: alert.color }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{alert.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{alert.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
