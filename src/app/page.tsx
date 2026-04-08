"use client";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Home,
  SlidersHorizontal,
  Wand2,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Home,
    title: "Choose Your Flat",
    desc: "Select your floor plan from our HDB database or upload your own architectural drawing.",
  },
  {
    icon: SlidersHorizontal,
    title: "Set Preferences",
    desc: "Pick your favorite styles, materials, and colors. Tell us your budget and living requirements.",
  },
  {
    icon: Wand2,
    title: "AI Designs Room",
    desc: "Our engine generates high-fidelity 2D renders and itemized pricing instantly.",
  },
  {
    icon: MessageSquare,
    title: "Meet Your Designer",
    desc: "Tweak the design yourself or hop on a call with a pro to finalize every detail.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(20, 201, 123, 0.12), transparent 24%), radial-gradient(circle at 85% 18%, rgba(18, 183, 106, 0.1), transparent 20%), linear-gradient(180deg, #fbfffc 0%, #f3fff7 100%)",
          paddingTop: 60,
          paddingBottom: 80,
        }}
      >
        <div className="container-main hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="chip chip-accent" style={{ marginBottom: 20 }}>
              <Sparkles size={14} /> NEXT GEN INTERIOR DESIGN
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 20,
                color: "var(--color-text)",
              }}
            >
              Tell Us Your Style.{" "}
              <span style={{ color: "var(--color-accent)" }}>
                We&apos;ll Design Your Room.
              </span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "#244f3f",
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: 440,
              }}
            >
              Singapore&apos;s first AI-powered renovation planner. Pick your
              preferences, get a complete room design with real prices — in
              seconds.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/design/wizard"
                className="btn-primary"
                style={{
                  textDecoration: "none",
                  fontSize: 15,
                  padding: "14px 28px",
                }}
              >
                Start Designing <ArrowRight size={16} />
              </Link>
              <Link
                href="/ar-demo"
                className="btn-secondary"
                style={{ textDecoration: "none", fontSize: 15 }}
              >
                <Sparkles size={16} /> Watch AR Demo
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div
              className="card"
              style={{
                padding: 20,
                background: "var(--color-surface)",
                boxShadow: "0 20px 54px rgba(15,106,76,0.14)",
                borderRadius: 20,
                border: "1px solid var(--color-border-light)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ff6b6b",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ffd93d",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                    marginLeft: 8,
                  }}
                >
                  STEP 02: PREFERENCES
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "var(--color-bg)",
                    borderRadius: 12,
                    padding: 20,
                    textAlign: "center",
                    border: "1px solid var(--color-border-light)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      margin: "0 auto 8px",
                      background: "var(--color-accent-light)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SlidersHorizontal
                      size={18}
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    Minimalist
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--color-primary)",
                    borderRadius: 12,
                    padding: 16,
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "var(--color-accent)",
                      color: "#0b2b1f",
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    PROPOSED DESIGN
                  </div>
                  <div style={{ marginTop: 30, textAlign: "right" }}>
                    <div
                      style={{ fontSize: 10, color: "rgba(248,255,248,0.82)" }}
                    >
                      Total Estimate
                    </div>
                    <div
                      style={{ fontSize: 18, fontWeight: 700, color: "var(--color-bg)" }}
                    >
                      $32,450.00
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 14,
                  padding: "8px 14px",
                background: "var(--color-accent-bg)",
                border: "1px solid rgba(20, 201, 123, 0.18)",
                borderRadius: 10,
              }}
              >
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Generation Speed
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-text)",
                    }}
                  >
                    4.2 Seconds
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 201, 123, 0.08) 0%, rgba(18, 183, 106, 0.04) 100%)",
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <div className="container-main">
          <motion.div
            style={{ textAlign: "center", marginBottom: 48 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
              How It Works
            </h2>
            <div
              style={{
                width: 48,
                height: 3,
                background: "var(--color-accent)",
                margin: "0 auto",
                borderRadius: 2,
              }}
            />
          </motion.div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="card"
                style={{ textAlign: "left", background: "rgba(255,255,255,0.92)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--color-accent-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <step.icon
                    size={22}
                    style={{ color: "var(--color-accent)" }}
                  />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section
        style={{
          background: "var(--color-bg)",
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <div className="container-main">
          <motion.div
            style={{ textAlign: "center", marginBottom: 48 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
              A Better Way to Renovate
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 16 }}>
              Comparing the old school vs. the Kairos way.
            </p>
          </motion.div>
          <motion.div
            className="card compare-grid"
            style={{ maxWidth: 800, margin: "0 auto", overflow: "hidden" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              style={{
                padding: 32,
                borderRight: "1px solid var(--color-border-light)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "var(--color-text-secondary)",
                  marginBottom: 20,
                }}
              >
                TRADITIONAL PROCESS
              </div>
              {[
                "2–4 weeks for first design concept",
                "Vague estimates that double later",
                "Limited to 3 design revisions",
                "Manual material sourcing headaches",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 14,
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-danger)",
                      fontSize: 16,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </span>{" "}
                  {t}
                </div>
              ))}
            </div>
            <div style={{ padding: 32, background: "var(--color-bg)" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "var(--color-accent)",
                  marginBottom: 20,
                }}
              >
                WITH KAIROS
              </div>
              {[
                "Instant 3D visuals in 10 seconds",
                "Real-time pricing synced with suppliers",
                "Unlimited AI revisions and iterations",
                "Direct procurement at wholesale prices",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 14,
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontSize: 16,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>{" "}
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "var(--color-bg-alt)",
          borderTop: "1px solid var(--color-border)",
          paddingTop: 48,
          paddingBottom: 32,
        }}
      >
        <div
          className="container-main"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 48,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--color-accent)",
                  color: "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                K
              </div>
              <span
                style={{ fontWeight: 700, fontFamily: "var(--font-heading)" }}
              >
                KAIROS
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                maxWidth: 300,
              }}
            >
              Redefining the interior design industry through artificial
              intelligence and augmented reality. Making dream homes accessible
              to everyone.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              Product
            </div>
            {["Design Tool", "AR Visualizer", "Pricing Guide"].map((l) => (
              <div
                key={l}
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              Studio
            </div>
            {["About Us", "Careers", "Contact"].map((l) => (
              <div
                key={l}
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
        <div
          className="container-main"
          style={{
            textAlign: "center",
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid var(--color-border-light)",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            © 2024 Kairos Interior Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
