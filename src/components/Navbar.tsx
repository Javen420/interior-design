"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Palette,
  Hammer,
  Eye,
  FolderOpen,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

const homeownerItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/design/wizard", label: "Design Tool", icon: Palette },
  { href: "/renovation", label: "My Renovation", icon: Hammer },
  { href: "/ar-demo", label: "AR Demo", icon: Eye },
];

const businessItems = [
  { href: "/business/projects", label: "Projects", icon: FolderOpen },
  { href: "/business/analytics", label: "Contractor Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isBusinessRoute = pathname.startsWith("/business");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isBusinessRoute ? businessItems : homeownerItems;

  const handleToggle = (mode: "homeowner" | "business") => {
    if (mode === "business" && !isBusinessRoute) {
      router.push("/business/projects");
    } else if (mode === "homeowner" && isBusinessRoute) {
      router.push("/");
    }
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-main nav-inner">
          {/* Brand */}
          <Link href="/" className="brand" style={{ marginLeft: -160 }} onClick={() => setMobileOpen(false)}>
            <div>K</div>
            <span className="brand-text" style={{ fontWeight: 600, fontFamily: "var(--font-heading)" }}>
              Kairos Interior Studio
            </span>
          </Link>

          {/* View toggle — desktop only (also rendered inside mobile drawer) */}
          <div className="view-toggle" style={{ marginLeft: 30 }}>
            {(["homeowner", "business"] as const).map((mode) => {
              const active =
                (mode === "business" && isBusinessRoute) ||
                (mode === "homeowner" && !isBusinessRoute);
              return (
                <button
                  key={mode}
                  onClick={() => handleToggle(mode)}
                  style={{
                    padding: "0 16px",
                    height: 28,
                    minWidth: 90,
                    borderRadius: 100,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    background: active ? "var(--color-accent)" : "transparent",
                    color: active ? "var(--color-bg)" : "var(--color-text-secondary)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {mode === "homeowner" ? "Homeowner" : "Business"}
                </button>
              );
            })}
          </div>

          {/* Nav links — inline on desktop, drawer on mobile */}
          <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${active ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-link-icon" style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}>
                    <Icon size={20} />
                  </span>
                  {label}
                </Link>
              );
            })}

            {/* View toggle inside drawer — mobile only */}
            <div className="nav-mobile-toggle">
              <div className="nav-mobile-toggle-label">Switch view</div>
              <div className="nav-mobile-toggle-row">
                {(["homeowner", "business"] as const).map((mode) => {
                  const active =
                    (mode === "business" && isBusinessRoute) ||
                    (mode === "homeowner" && !isBusinessRoute);
                  return (
                    <button
                      key={mode}
                      onClick={() => handleToggle(mode)}
                      className={`nav-mobile-toggle-btn ${active ? "active" : ""}`}
                    >
                      {mode === "homeowner" ? "Homeowner" : "Business"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Backdrop — closes menu when tapping outside */}
      {mobileOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
