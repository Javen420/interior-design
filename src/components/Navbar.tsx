"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Palette,
  LayoutDashboard,
  BarChart3,
  Eye,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/design/wizard", label: "Design Tool", icon: Palette },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ar-demo", label: "AR Demo", icon: Eye },
];

export default function Navbar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container-main nav-inner">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--color-accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
            }}
          >
            Kairos Interior Studio
          </span>
        </Link>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
          {navItems.map(({ href, label }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
