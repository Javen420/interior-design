'use client';
import { motion } from 'framer-motion';
import { Play, Layers, Sun, Maximize2 } from 'lucide-react';
import Link from 'next/link';

export default function ARDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Hero */}
      <div className="container-main" style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 40 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="chip chip-accent" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>INNOVATION IN DESIGN</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Experience Your Design in<br />Augmented Reality
          </h1>
          <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            Step inside your future home before a single brick is laid. Our advanced AR/VR technology allows you to visualize materials, furniture, and lighting in real-time within your actual space.
          </p>
        </motion.div>
      </div>

      {/* Video Player */}
      <div className="container-main">
        <motion.div style={{
          background: 'linear-gradient(135deg, #e8e0d4, #d4ccc0)',
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          aspectRatio: '16/9', maxWidth: 900, margin: '0 auto',
          cursor: 'pointer',
        }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Simulated AR view */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 6 }}>LIVE AR SCANNING</span>
            </div>
            <motion.div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(196,162,101,0.3)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} whileHover={{ scale: 1.1 }} transition={{ type: 'spring' }}>
              <Play size={32} style={{ color: 'var(--color-accent)', marginLeft: 4 }} />
            </motion.div>
          </div>
          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#1a1a2e', opacity: 0.6 }}>🔊</span>
                <span style={{ fontSize: 12, color: '#1a1a2e', opacity: 0.6 }}>⚙</span>
              </div>
              <span style={{ fontSize: 11, color: '#1a1a2e', opacity: 0.6 }}>02:45 / 08:20</span>
            </div>
            <div style={{ height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 2 }}>
              <div style={{ width: '33%', height: '100%', background: 'var(--color-accent)', borderRadius: 2 }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <motion.button className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          📅 Book a Live AR Session
        </motion.button>
      </div>

      {/* Features */}
      <div className="container-main" style={{ paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 800, margin: '0 auto' }}>
          {[
            { icon: Layers, title: 'Material Swap', desc: 'Switch between marble, wood, or tile instantly to find your perfect match.' },
            { icon: Sun, title: 'Shadow Simulation', desc: 'See how natural light interacts with your space throughout the entire day.' },
            { icon: Maximize2, title: 'Real-Scale View', desc: 'Accurate 1:1 scale visualization ensuring furniture fits perfectly in your room.' },
          ].map((f, i) => (
            <motion.div key={f.title} className="card" style={{ textAlign: 'center', padding: 28 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <f.icon size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '20px 0' }}>
        <div className="container-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <span>© 2024 Kairos Interior Studio. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>Instagram</span><span>LinkedIn</span><span>Pinterest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
