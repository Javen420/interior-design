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

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 100,
            height: 34,
            padding: 2,
            flexShrink: 0,
          }}
        >
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
                  borderRadius: 100,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  fontWeight: active ? 600 : 400,
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "auto",
                  minWidth: "auto",
                }}
              >
                {mode === "homeowner" ? "Homeowner" : "Business"}
              </button>
            );
          })}
        </div>

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
