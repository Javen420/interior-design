'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: number; name: string; client: string; designer: string;
  flatType: string; roomType: string; style: string; status: string;
  startDate: string; estimatedEnd: string;
  milestones: { stage: string; status: string; date: string; description: string }[];
  budget: { total: number; breakdown: { category: string; estimated: number; actual: number }[] };
}

const statusFilters = ['All', 'In Progress', 'Completed', 'On Hold'] as const;

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => { setProjects(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;

  const filtered = projects.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Progress') return p.status === 'in-progress';
    if (activeFilter === 'Completed') return p.status === 'completed';
    if (activeFilter === 'On Hold') return p.status === 'on-hold';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Header */}
        <motion.div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>Active Projects</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Manage and monitor all ongoing renovation projects</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statusFilters.map(f => (
              <button key={f}
                className={`chip ${activeFilter === f ? 'chip-accent' : ''}`}
                onClick={() => setActiveFilter(f)}
                style={{ cursor: 'pointer', border: activeFilter === f ? undefined : '1px solid var(--color-border)' }}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
          {filtered.map((project, i) => {
            const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
            const progress = Math.round((completedMilestones / project.milestones.length) * 100);
            const totalEstimated = project.budget.breakdown.reduce((s, b) => s + b.estimated, 0);
            const totalActual = project.budget.breakdown.reduce((s, b) => s + b.actual, 0);
            const statusLabel = project.status === 'in-progress' ? 'IN PROGRESS' : project.status === 'completed' ? 'COMPLETED' : 'ON HOLD';
            const statusStyle = project.status === 'completed'
              ? { background: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'rgba(45,159,91,0.2)' }
              : { background: 'var(--color-accent-light)', color: 'var(--color-accent-hover)', borderColor: 'rgba(196,162,101,0.25)' };

            return (
              <motion.div key={project.id} className="card" style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => window.location.href = `/business/projects/${project.id}`}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{project.name}</h3>
                  <span className="chip" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', ...statusStyle }}>{statusLabel}</span>
                </div>

                {/* Client & designer */}
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Client: {project.client} · Designer: {project.designer}
                </p>

                {/* Detail chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span className="chip" style={{ fontSize: 11 }}>{project.flatType}</span>
                  <span className="chip" style={{ fontSize: 11 }}>{project.roomType}</span>
                  <span className="chip" style={{ fontSize: 11 }}>{project.style}</span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Overall Progress</span>
                    <span style={{ fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Budget */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Budget: SGD ${totalActual.toLocaleString()} / ${totalEstimated.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, (totalActual / totalEstimated) * 100)}%`, background: totalActual > totalEstimated ? 'var(--color-warning)' : 'var(--color-accent)' }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Est. Handover: {project.estimatedEnd}</span>
                  <Link href={`/business/projects/${project.id}`}
                    style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}>
                    View Details <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: 16 }}>No projects match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
