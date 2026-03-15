'use client';
import { useEffect, useState } from 'react';
import { useDesignStore } from '@/store/designStore';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, ArrowRight, Sparkles, Clock, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MatchedDesigner {
  id: string; name: string; title: string; photo: string;
  specializations: string[]; projectTypes: string[];
  yearsExperience: number; projectsCompleted: number;
  bio: string; rating: number; matchScore: number; reasons: string[];
}

export default function DesignerMatchPage() {
  const router = useRouter();
  const { savedDesign } = useDesignStore();
  const [designers, setDesigners] = useState<MatchedDesigner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!savedDesign) { setLoading(false); return; }
    fetch('/api/designer-match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        style: savedDesign.design.styleApplied,
        budgetTotal: savedDesign.canvasItems.reduce((s, i) => s + i.price, 0),
        flatType: savedDesign.preferences.flatType,
        roomType: savedDesign.preferences.roomType,
      }),
    }).then(r => r.json()).then(d => { setDesigners(d.designers); setLoading(false); }).catch(() => setLoading(false));
  }, [savedDesign]);

  if (!savedDesign) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Sparkles size={48} style={{ color: 'var(--color-accent)' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>No saved design</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Save a design from the configurator first</p>
        <button onClick={() => router.push('/design/wizard')} className="btn-primary" style={{ marginTop: 16 }}>Start Designing</button>
      </div>
    );
  }

  const totalCost = savedDesign.canvasItems.reduce((s, i) => s + i.price, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #2d2d44, #1a1a2e)', padding: '40px 0', color: '#fff' }}>
        <div className="container-main">
          <div className="chip" style={{ background: 'rgba(196,162,101,0.2)', border: 'none', color: 'var(--color-accent)', marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE SEARCH</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.3 }}>
            Based on your {savedDesign.design.styleApplied} design<br />
            for a {savedDesign.preferences.flatType.replace(/-/g,' ').replace('bto','BTO').replace('hdb','HDB')} — <span style={{ color: 'var(--color-accent)' }}>SGD ${totalCost.toLocaleString()}</span>
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div style={{ borderBottom: '1px solid var(--color-border)', background: '#fff' }}>
        <div className="container-main" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
          {savedDesign.preferences.styles.map(s => <span key={s} className="chip">{s}</span>)}
          <span className="chip">${(savedDesign.preferences.budgetMin / 1000).toFixed(0)}k – ${(savedDesign.preferences.budgetMax / 1000).toFixed(0)}k</span>
          <span className="chip">{savedDesign.preferences.flatType.replace(/-/g,' ').replace('bto','BTO').replace('hdb','HDB')}</span>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Top Designer Matches</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>We&apos;ve found {designers.length} designers that fit your aesthetic and budget perfectly.</p>
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>Sorted by Compatibility</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {designers.map((d, i) => (
              <motion.div key={d.id} className="card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 260px', gap: 32, padding: 28 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                {/* Left: Avatar + info */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${['#e8d5b8','#b8c9d8','#c8d8b8'][i]}, ${['#d4b896','#8ba4b8','#a4b89a'][i]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>
                      {d.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>{d.matchScore}%</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{d.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    {Array.from({ length: 5 }).map((_, si) => <Star key={si} size={12} fill={si < Math.floor(d.rating) ? '#c4a265' : 'none'} style={{ color: '#c4a265' }} />)}
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4 }}>{d.rating}</span>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '10px 16px', marginBottom: 6 }}>
                    Book Consultation
                  </button>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}>
                    View Portfolio
                  </button>
                </div>

                {/* Center: Why this match */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: 12 }}>WHY THIS MATCH</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {d.reasons.map((r, ri) => (
                      <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--color-text)' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} /> {r}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {d.specializations.map(s => <span key={s} className="chip" style={{ fontSize: 11, padding: '4px 10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>{s}</span>)}
                  </div>
                </div>

                {/* Right: Stats */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 12 }}>RECENT PROJECTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: 'var(--color-bg)', borderRadius: 12, height: 80 }} />
                    <div style={{ background: 'var(--color-bg)', borderRadius: 12, height: 80 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.03em', marginBottom: 2 }}>PROJECTS</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{d.projectsCompleted}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.03em', marginBottom: 2 }}>YEARS</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{d.yearsExperience}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.03em', marginBottom: 2 }}>RESPONSE</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{i === 0 ? '2h' : i === 1 ? '24h' : '5h'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn-secondary" style={{ fontSize: 14 }}>Load More Designers</button>
        </div>
      </div>
    </div>
  );
}
