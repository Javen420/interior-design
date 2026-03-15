'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Clock, Star, Search, ChevronDown, ChevronUp, TrendingUp, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

interface Contractor {
  id: string; name: string; specialty: string[];
  projectsCompleted: number; activeProjects: number;
  status: string; satisfactionRating: number;
  avgCompletionDays: number; onTimeRate: number;
  stageDelays: Record<string, number>;
  areaOverruns: Record<string, number>;
  totalRevenue: number; avgProjectCost: number;
}
interface Summary {
  totalProjects: number; totalRevenue: number;
  avgSatisfaction: number; avgOnTime: number;
  activeContractors: number; flaggedContractors: number;
  totalContractors: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Contractor>('satisfactionRating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/summary').then(r => r.json()),
      fetch('/api/analytics/contractors').then(r => r.json()),
    ]).then(([s, c]) => { setSummary(s); setContractors(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSort = (field: keyof Contractor) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortedContractors = useMemo(() => {
    let filtered = contractors.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    filtered.sort((a, b) => {
      const aVal = a[sortField]; const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });
    return filtered;
  }, [contractors, searchQuery, sortField, sortDir]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;

  const delayData = contractors.map(c => ({
    name: c.name.split(' ')[0],
    Demolition: c.stageDelays.demolition, Construction: c.stageDelays.construction,
    Installation: c.stageDelays.installation, Handover: c.stageDelays.handover,
  }));
  const overrunData = contractors.map(c => ({
    name: c.name.split(' ')[0],
    Flooring: Math.round(c.areaOverruns.flooring * 100), Walls: Math.round(c.areaOverruns.walls * 100),
    Electrical: Math.round(c.areaOverruns.electrical * 100), Plumbing: Math.round(c.areaOverruns.plumbing * 100),
  }));

  const SortIcon = ({ field }: { field: keyof Contractor }) => (
    sortField === field ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Header */}
        <motion.div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800 }}>Contractor Performance Analytics</h1>
              <span className="chip chip-accent" style={{ fontSize: 11, fontWeight: 700 }}>Internal</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Enterprise-wide performance tracking and vendor efficiency audit</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 13 }}>📅 Last 180 Days</button>
            <button className="btn-primary" style={{ fontSize: 13 }}><Download size={14} /> Export Report</button>
          </div>
        </motion.div>

        {/* KPIs */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: Clock, label: 'Avg Project Delay', value: '4.2 Days', sub: '↗ -1.2% from last quarter', subColor: 'var(--color-danger)' },
              { icon: DollarSign, label: 'Avg Overrun Rate', value: '12.5%', sub: '↘ +0.5% efficiency gain', subColor: 'var(--color-success)' },
              { icon: Users, label: 'Active Projects', value: summary.totalProjects.toString(), sub: `+ ${summary.activeContractors} new this month`, subColor: 'var(--color-success)' },
              { icon: Star, label: 'Avg Satisfaction', value: `${summary.avgSatisfaction}/5.0`, sub: '↗ +0.2% increase', subColor: 'var(--color-success)' },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{kpi.label}</span>
                  <kpi.icon size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: kpi.subColor, fontWeight: 500 }}>{kpi.sub}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Delay by Project Stage</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)' }}>4.2d</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>average</span>
              <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, marginLeft: 8 }}>-5% vs target</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={delayData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }} />
                <Bar dataKey="Demolition" fill="#f87171" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Construction" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Installation" fill="#4a8fd4" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Handover" fill="#4ade80" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Cost Overrun by Area</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)' }}>12.5%</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>average</span>
              <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, marginLeft: 8 }}>+2% variance</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overrunData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }} />
                <Bar dataKey="Flooring" fill="#c4a265" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Walls" fill="#8B7355" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Electrical" fill="#4a8fd4" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Plumbing" fill="#4ade80" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Contractor Performance Rankings</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contractors..."
                  style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 13, background: 'var(--color-bg)', border: '1px solid var(--color-border)', outline: 'none', width: 200, color: 'var(--color-text)' }} />
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contractor Details</th>
                  <th onClick={() => handleSort('projectsCompleted')}>Projects <SortIcon field="projectsCompleted" /></th>
                  <th onClick={() => handleSort('avgCompletionDays')}>Avg. Delay <SortIcon field="avgCompletionDays" /></th>
                  <th onClick={() => handleSort('onTimeRate')}>Overrun % <SortIcon field="onTimeRate" /></th>
                  <th onClick={() => handleSort('satisfactionRating')}>Rating <SortIcon field="satisfactionRating" /></th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedContractors.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--color-accent)', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{c.specialty.join(' & ')}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.projectsCompleted}</td>
                    <td>{c.avgCompletionDays} Days</td>
                    <td style={{ color: c.onTimeRate >= 0.9 ? 'var(--color-success)' : c.onTimeRate >= 0.8 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                      {Math.round((1 - c.onTimeRate) * 100)}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} style={{ color: '#c4a265' }} fill="#c4a265" /> {c.satisfactionRating}
                      </div>
                    </td>
                    <td>
                      <span className="chip" style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
                        ...(c.status === 'active' ? { background: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'rgba(45,159,91,0.2)' }
                          : { background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderColor: 'rgba(212,64,64,0.2)' })
                      }}>
                        {c.status === 'active' ? 'PREFERRED' : 'ON PROBATION'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
