'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle2, Clock, Circle, Mail, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProgressUpdate {
  date: string;
  text: string;
  photos?: { id: string; caption: string }[];
  budgetImpact?: { category: string; amount: number; reason: string } | null;
}

interface Project {
  id: number; name: string; client: string; designer: string;
  flatType: string; roomType: string; style: string; status: string;
  startDate: string; estimatedEnd: string;
  milestones: { stage: string; status: string; date: string; description: string }[];
  progressUpdates: ProgressUpdate[];
  budget: { total: number; breakdown: { category: string; estimated: number; actual: number }[] };
}

const timelineStages = ['Design', 'Procurement', 'Demolition', 'Carpentry', 'Electrical', 'Painting', 'Styling', 'Handover'];

const photoColors = ['#DDF7E8', '#F7FFF7', '#DDF7E8', '#F7FFF7', '#DDF7E8', '#F7FFF7'];

function getMilestoneLabel(date: string, milestones: Project['milestones']): string | null {
  for (const m of milestones) {
    const mDate = new Date(m.date);
    const uDate = new Date(date);
    if (Math.abs(mDate.getTime() - uDate.getTime()) < 14 * 24 * 60 * 60 * 1000) {
      return m.stage.replace(' & ', ' & ').toUpperCase();
    }
  }
  return null;
}

export default function RenovationPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  useEffect(() => {
    fetch('/api/projects/1').then(r => r.json()).then(d => { setProject(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  if (!project) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Project not found</p></div>;

  const totalEstimated = project.budget.breakdown.reduce((s, b) => s + b.estimated, 0);
  const totalActual = project.budget.breakdown.reduce((s, b) => s + b.actual, 0);
  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedMilestones / project.milestones.length) * 100);

  // Build cumulative spend data for AreaChart
  const spendData = (() => {
    let cumulative = 0;
    const updates = project.progressUpdates.filter(u => u.budgetImpact);
    // Create data points for each update with budget impact
    const dataPoints: { date: string; actual: number; estimated: number }[] = [];
    const sorted = [...project.progressUpdates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Distribute total actual spend across timeline proportionally
    const totalDays = (new Date(project.estimatedEnd).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);

    sorted.forEach((u, i) => {
      const daysPassed = (new Date(u.date).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);
      const fraction = daysPassed / totalDays;
      cumulative = Math.round(totalActual * Math.min(fraction, 1));
      dataPoints.push({
        date: new Date(u.date).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
        actual: cumulative,
        estimated: totalEstimated,
      });
    });
    return dataPoints;
  })();

  const reversedUpdates = [...project.progressUpdates].reverse();
  const visibleUpdates = showAllUpdates ? reversedUpdates : reversedUpdates.slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Project Hero Card */}
        <motion.div className="card" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, marginBottom: 32, padding: 0, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(247,255,247,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏠</div>
          </div>
          <div style={{ padding: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Your Renovation Journey</h1>
            <p style={{ color: 'var(--color-accent)', fontWeight: 500, marginBottom: 4 }}>{project.name}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>Designed with love by <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{project.designer}</span></p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Overall Progress</span>
                <span style={{ fontWeight: 700 }}>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>📅 Estimated handover: <strong style={{ color: 'var(--color-text)' }}>{project.estimatedEnd}</strong></p>
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
                    {isCompleted ? <CheckCircle2 size={16} style={{ color: 'var(--color-bg)' }} /> : isActive ? <Clock size={16} style={{ color: 'var(--color-bg)' }} /> : <Circle size={12} style={{ color: 'var(--color-text-muted)' }} />}
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

        {/* Construction Updates Section */}
        <motion.div style={{ marginBottom: 32 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Camera size={20} style={{ color: 'var(--color-accent)' }} /> Construction Updates
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleUpdates.map((update, i) => {
              const milestoneLabel = getMilestoneLabel(update.date, project.milestones);
              return (
                <motion.div key={i} className="card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
                  {/* Date header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
                      {new Date(update.date).toLocaleDateString('en-SG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {milestoneLabel && (
                      <span className="chip chip-accent" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>{milestoneLabel}</span>
                    )}
                  </div>

                  {/* Photo grid */}
                  {update.photos && update.photos.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(update.photos.length, 3)}, 1fr)`, gap: 10, marginBottom: 12 }}>
                      {update.photos.map((photo, pi) => (
                        <div key={photo.id} style={{
                          height: 200, borderRadius: 12,
                          background: photoColors[pi % photoColors.length],
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <Camera size={24} style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: '0 12px' }}>{photo.caption}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{update.text}</p>

                  {/* Budget impact */}
                  {update.budgetImpact && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-warning)', fontWeight: 500 }}>
                      💰 Budget impact: +${update.budgetImpact.amount.toLocaleString()} ({update.budgetImpact.category}) — {update.budgetImpact.reason}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {!showAllUpdates && reversedUpdates.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setShowAllUpdates(true)}>
                Load Earlier Updates
              </button>
            </div>
          )}
        </motion.div>

        {/* Live Cost Tracker */}
        <motion.div style={{ marginBottom: 32 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>💰 Live Cost Tracker</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
            {/* Left: Area chart */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Budget Changes Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={spendData}>
                  <defs>
                    <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E8B68" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2E8B68" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                  <ReferenceLine y={totalEstimated} stroke="var(--color-border)" strokeDasharray="6 4" label={{ value: 'Estimated', position: 'right', fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Area type="monotone" dataKey="actual" stroke="#2E8B68" strokeWidth={2} fill="url(#accentGradient)" name="Actual Spend" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Right: Category breakdown */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Category Breakdown</h3>
              {project.budget.breakdown.map(b => {
                const pct = (b.actual / b.estimated) * 100;
                const diff = b.actual - b.estimated;
                let statusColor = 'var(--color-info)';
                let statusText = 'On track';
                let dotColor = 'var(--color-info)';
                if (diff < -100) { statusColor = 'var(--color-success)'; statusText = 'Under budget'; dotColor = 'var(--color-success)'; }
                else if (diff > 0) { statusColor = diff > 200 ? 'var(--color-danger)' : 'var(--color-warning)'; statusText = `Over by $${diff.toLocaleString()}`; dotColor = statusColor; }
                return (
                  <div key={b.category} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                      <span>{b.category}</span>
                      <span>${b.actual.toLocaleString()} / ${b.estimated.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6, marginBottom: 4 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: b.actual > b.estimated ? 'var(--color-warning)' : 'var(--color-accent)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: statusColor }}>{statusText}</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Total Spent</span>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>${totalActual.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Remaining</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>${(totalEstimated - totalActual).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: Mail, color: 'var(--color-primary-light)', bg: 'var(--color-accent-bg)', title: 'Message Designer', desc: 'Send a note to Sarah' },
              { icon: FileText, color: 'var(--color-info)', bg: 'var(--color-info-bg)', title: 'View Documents', desc: 'Plans, invoices & more' },
              { icon: Calendar, color: 'var(--color-accent)', bg: 'var(--color-accent-bg)', title: 'Schedule Visit', desc: 'Book a site visit' },
              { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', title: 'Report Issue', desc: 'Flag a concern' },
            ].map((action, i) => (
              <motion.div key={action.title} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.05 }}
                whileHover={{ y: -2 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <action.icon size={18} style={{ color: action.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{action.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
