'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Palette, LayoutDashboard, BarChart3, Eye } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/design/wizard', label: 'Design Tool', icon: Palette },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ar-demo', label: 'AR Demo', icon: Eye },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--color-text)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--color-accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)',
          }}>K</div>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
            Kairos Interior Studio
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                style={{
                  position: 'relative',
                  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  textDecoration: 'none', transition: 'all 0.2s',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}>
                {label}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: -6, left: '10%', right: '10%', height: 6,
                    border: '2px solid var(--color-accent)', borderTop: 'none',
                    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                    pointerEvents: 'none'
                  }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
