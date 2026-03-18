"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDesignStore } from "@/store/designStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  CheckCircle2,
  X,
} from "lucide-react";

const STEPS = [
  "FLAT TYPE",
  "STYLE",
  "COLORS",
  "PRIORITIES",
  "BUDGET",
  "INSPIRATION",
];

const flatTypes = [
  { id: "3room-bto", label: "3-Room BTO", desc: "~65-68 sqm" },
  { id: "4room-bto", label: "4-Room BTO", desc: "~90-93 sqm" },
  { id: "5room-bto", label: "5-Room BTO", desc: "~110-113 sqm" },
  { id: "resale-hdb", label: "Resale HDB", desc: "Standard Layout" },
];
const roomTypes = [
  { id: "living-room", label: "Living Room" },
  { id: "bedroom", label: "Master Bedroom" },
  { id: "kitchen", label: "Kitchen" },
];
const styleOptions = [
  {
    id: "Scandinavian",
    label: "Scandinavian",
    tagline: "Clean lines, natural warmth",
    gradient: "linear-gradient(135deg, #F5F0E8, #D4B896)",
  },
  {
    id: "Minimalist",
    label: "Minimalist",
    tagline: "Less is more",
    gradient: "linear-gradient(135deg, #f0f0f0, #d4d4d4)",
  },
  {
    id: "Industrial",
    label: "Industrial",
    tagline: "Raw textures, urban",
    gradient: "linear-gradient(135deg, #8B8B8B, #4a4a4a)",
  },
  {
    id: "Japandi",
    label: "Japandi",
    tagline: "Eastern calm, Nordic function",
    gradient: "linear-gradient(135deg, #F7F3ED, #C8B89A)",
  },
  {
    id: "Mid-Century Modern",
    label: "Mid-Century Modern",
    tagline: "Retro elegance",
    gradient: "linear-gradient(135deg, #D4763C, #2D5F4E)",
  },
  {
    id: "Contemporary",
    label: "Contemporary",
    tagline: "Bold statements",
    gradient: "linear-gradient(135deg, #1A1A2E, #D4A574)",
  },
];
const colorTones = [
  {
    id: "warm",
    label: "Warm Tones",
    colors: ["#F5E6D3", "#D4B896", "#C9A87C", "#8B7355"],
  },
  {
    id: "cool",
    label: "Cool Tones",
    colors: ["#E0E8F0", "#A0B8C8", "#6B8BA4", "#334155"],
  },
  {
    id: "neutral",
    label: "Neutral Tones",
    colors: ["#F0F0F0", "#D4D4D4", "#9CA3AF", "#4B5563"],
  },
];
const priorityOptions = [
  {
    id: "maximize-space",
    label: "Maximize Space",
    desc: "Make the room feel bigger",
  },
  {
    id: "budget-friendly",
    label: "Budget-Friendly",
    desc: "Best value for money",
  },
  {
    id: "family-friendly",
    label: "Family-Friendly",
    desc: "Safe & practical for families",
  },
  {
    id: "aesthetic-first",
    label: "Aesthetic First",
    desc: "Visual impact above all",
  },
  {
    id: "natural-materials",
    label: "Natural Materials",
    desc: "Eco-friendly & organic",
  },
  {
    id: "smart-storage",
    label: "Smart Storage",
    desc: "Clever hidden storage",
  },
];

const loadingMessages = [
  { text: "Analyzing your preferences...", icon: "🔍" },
  { text: "Selecting furniture pieces...", icon: "🪑" },
  { text: "Optimizing room layout...", icon: "📐" },
  { text: "Calculating cost estimates...", icon: "💰" },
];

export default function WizardPage() {
  const router = useRouter();
  const {
    preferences,
    updatePreferences,
    wizardStep,
    setWizardStep,
    setGeneratedDesign,
  } = useDesignStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [styleDetectResult, setStyleDetectResult] = useState<{
    style: string;
    confidence: number;
    colorPalette: string[];
  } | null>(null);
  const [detectingStyle, setDetectingStyle] = useState(false);
  const step = wizardStep;

  const canNext = useCallback(() => {
    switch (step) {
      case 0:
        return !!preferences.flatType;
      case 1:
        return preferences.styles.length > 0;
      case 2:
        return !!preferences.colorTone;
      case 3:
        return preferences.priorities.length >= 1;
      case 4:
        return preferences.budgetMax > preferences.budgetMin;
      default:
        return true;
    }
  }, [step, preferences]);

  const isLastStep = step === STEPS.length - 1;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 800);
    const t2 = setTimeout(() => setLoadingStep(2), 1600);
    const t3 = setTimeout(() => setLoadingStep(3), 2200);
    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoadingStep(4);
      await new Promise((r) => setTimeout(r, 600));
      setGeneratedDesign(data);
      router.push("/design/configurator");
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const handleInspirationUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetectingStyle(true);
    try {
      const res = await fetch("/api/style-detect", { method: "POST" });
      const data = await res.json();
      setStyleDetectResult(data);
      updatePreferences({ inspirationStyle: data.style });
    } catch (err) {
      console.error(err);
    }
    setDetectingStyle(false);
  };

  const toggleStyle = (id: string) => {
    const c = preferences.styles;
    if (c.includes(id))
      updatePreferences({ styles: c.filter((s) => s !== id) });
    else if (c.length < 2) updatePreferences({ styles: [...c, id] });
  };

  const togglePriority = (id: string) => {
    const c = preferences.priorities;
    if (c.includes(id))
      updatePreferences({ priorities: c.filter((p) => p !== id) });
    else if (c.length < 3) updatePreferences({ priorities: [...c, id] });
  };

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="s0"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 30,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Choose Your Flat
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 20,
                fontSize: 15,
              }}
            >
              Select your property type to begin the custom design process.
            </p>
            <div className="wizard-grid-3" style={{ marginBottom: 20 }}>
              {flatTypes.map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => updatePreferences({ flatType: ft.id })}
                  style={{
                    background:
                      preferences.flatType === ft.id
                        ? "var(--color-accent-bg)"
                        : "var(--color-bg)",
                    border: `2px solid ${preferences.flatType === ft.id ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: 14,
                    padding: "14px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  {preferences.flatType === ft.id && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 10,
                        background: "var(--color-accent)",
                        color: "#fff",
                        fontSize: 10,
                        padding: "2px 9px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      SELECTED
                    </span>
                  )}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      margin: "0 auto 10px",
                      background: "var(--color-accent-light)",
                      borderRadius: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{ color: "var(--color-accent)", fontSize: 18 }}
                    >
                      🏠
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color:
                        preferences.flatType === ft.id
                          ? "var(--color-accent)"
                          : "var(--color-text)",
                      marginBottom: 3,
                    }}
                  >
                    {ft.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {ft.desc}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "var(--color-accent)",
                  marginBottom: 10,
                }}
              >
                SELECT FOCUS AREAS (OPTIONAL)
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {roomTypes.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() =>
                      updatePreferences({
                        roomType: preferences.roomType === rt.id ? "" : rt.id,
                      })
                    }
                    style={{
                      padding: "9px 20px",
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      background:
                        preferences.roomType === rt.id
                          ? "var(--color-accent)"
                          : "transparent",
                      color:
                        preferences.roomType === rt.id
                          ? "#fff"
                          : "var(--color-text-secondary)",
                      border: `1px solid ${preferences.roomType === rt.id ? "var(--color-accent)" : "var(--color-border)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="s1"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Pick Your Style
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              Select 1–2 styles that inspire you
            </p>
            <div className="wizard-grid-3">
              {styleOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStyle(s.id)}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `2px solid ${preferences.styles.includes(s.id) ? "var(--color-accent)" : "var(--color-border)"}`,
                    height: 140,
                    transition: "all 0.2s",
                    background: "transparent",
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: s.gradient,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: 16,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                    }}
                  >
                    <div
                      style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}
                    >
                      {s.tagline}
                    </div>
                  </div>
                  {preferences.styles.includes(s.id) && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <CheckCircle2
                        size={22}
                        style={{ color: "var(--color-accent)" }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="s2"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Choose Color Tone
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              This guides the palette of your room
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              {colorTones.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => updatePreferences({ colorTone: ct.id })}
                  className="card"
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    border: `2px solid ${preferences.colorTone === ct.id ? "var(--color-accent)" : "var(--color-border)"}`,
                    background:
                      preferences.colorTone === ct.id
                        ? "var(--color-accent-bg)"
                        : "#fff",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    {ct.colors.map((c) => (
                      <div
                        key={c}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: c,
                          border: "1px solid var(--color-border-light)",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {ct.label}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="s3"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              What Matters Most?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              Pick up to 3 priorities (ranked by selection order)
            </p>
            <div
              className="wizard-grid-2"
              style={{ maxWidth: 600, margin: "0 auto" }}
            >
              {priorityOptions.map((p) => {
                const idx = preferences.priorities.indexOf(p.id);
                const sel = idx !== -1;
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePriority(p.id)}
                    className="card"
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 16,
                      position: "relative",
                      border: `2px solid ${sel ? "var(--color-accent)" : "var(--color-border)"}`,
                      background: sel ? "var(--color-accent-bg)" : "#fff",
                    }}
                  >
                    {sel && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "var(--color-accent)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </div>
                    )}
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {p.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="s4"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Set Your Budget
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              Drag to set your comfortable range (SGD)
            </p>
            <div
              className="card"
              style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Minimum
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "var(--color-accent)",
                    }}
                  >
                    ${preferences.budgetMin.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Maximum
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "var(--color-accent)",
                    }}
                  >
                    ${preferences.budgetMax.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Min Budget
                </label>
                <input
                  type="range"
                  min={3000}
                  max={40000}
                  step={500}
                  value={preferences.budgetMin}
                  onChange={(e) =>
                    updatePreferences({
                      budgetMin: Math.min(
                        parseInt(e.target.value),
                        preferences.budgetMax - 1000,
                      ),
                    })
                  }
                  style={{ width: "100%", accentColor: "var(--color-accent)" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Max Budget
                </label>
                <input
                  type="range"
                  min={5000}
                  max={60000}
                  step={500}
                  value={preferences.budgetMax}
                  onChange={(e) =>
                    updatePreferences({
                      budgetMax: Math.max(
                        parseInt(e.target.value),
                        preferences.budgetMin + 1000,
                      ),
                    })
                  }
                  style={{ width: "100%", accentColor: "var(--color-accent)" }}
                />
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="s5"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Upload Inspiration
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              Optional — share an image and our AI will detect the style
            </p>
            <div
              className="card"
              style={{
                maxWidth: 500,
                margin: "0 auto",
                padding: 24,
                textAlign: "center",
              }}
            >
              <label
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "var(--color-accent-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={28} style={{ color: "var(--color-accent)" }} />
                </div>
                <div style={{ fontWeight: 600 }}>Click to upload an image</div>
                <div
                  style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
                >
                  JPG, PNG up to 5MB
                </div>
                <input
                  type="file"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleInspirationUpload}
                />
              </label>
              {detectingStyle && (
                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "var(--color-accent)",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Analyzing style...
                </div>
              )}
              {styleDetectResult && (
                <motion.div
                  className="card"
                  style={{
                    marginTop: 20,
                    background: "var(--color-accent-bg)",
                    textAlign: "center",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Detected: {styleDetectResult.style}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      marginBottom: 12,
                    }}
                  >
                    Confidence: {styleDetectResult.confidence}%
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    {styleDetectResult.colorPalette.map((c) => (
                      <div
                        key={c}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: c,
                          border: "1px solid var(--color-border-light)",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Generate button at end of last step */}
            <div style={{ maxWidth: 500, margin: "32px auto 0" }}>
              <button
                onClick={handleGenerate}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "16px 28px",
                  fontSize: 16,
                  justifyContent: "center",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              >
                <Sparkles size={20} /> Generate My Design
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div
      style={{
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
      }}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ textAlign: "center" }}>
              <motion.div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 32px",
                  borderRadius: 20,
                  background: "var(--color-accent-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={32} style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  alignItems: "flex-start",
                  maxWidth: 280,
                  margin: "0 auto",
                }}
              >
                {loadingMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      opacity: loadingStep >= i ? 1 : 0.3,
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: loadingStep >= i ? 1 : 0.3, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    {loadingStep > i ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <CheckCircle2
                          size={20}
                          style={{ color: "var(--color-success)" }}
                        />
                      </motion.div>
                    ) : loadingStep === i ? (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          border: "2px solid var(--color-accent)",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: "2px solid var(--color-border)",
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 14,
                        color:
                          loadingStep >= i
                            ? "var(--color-text)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {msg.icon} {msg.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step tabs */}
      <div
        style={{
          background: "#fff",
          paddingTop: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-main"
          style={{ display: "flex", gap: 10, marginBottom: 16 }}
        >
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isPast = i < step;
            return (
              <button
                key={s}
                onClick={() => (i <= step ? setWizardStep(i) : null)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: i <= step ? "pointer" : "default",
                  background: isActive
                    ? "#fff"
                    : isPast
                      ? "#faf8f4"
                      : "transparent",
                  border: isActive
                    ? "2px solid var(--color-accent)"
                    : isPast
                      ? "2px solid transparent"
                      : "2px dashed var(--color-border)",
                  borderRadius: 20,
                  color: isActive
                    ? "var(--color-accent)"
                    : isPast
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  boxShadow: isActive
                    ? "0 12px 32px rgba(196,162,101,0.25)"
                    : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  transform: isActive ? "translateY(-4px)" : "none",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    fontSize: 14,
                    fontWeight: 800,
                    background: isActive
                      ? "var(--color-accent)"
                      : isPast
                        ? "var(--color-accent)"
                        : "var(--color-bg)",
                    color:
                      isActive || isPast ? "#fff" : "var(--color-text-muted)",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(196,162,101,0.4)"
                      : "none",
                  }}
                >
                  {isPast ? <CheckCircle2 size={18} /> : i + 1}
                </span>
                {s}
              </button>
            );
          })}
        </div>

        {/* Upgraded Progress Bar */}
        <div className="container-main">
          <div
            style={{
              height: 16,
              background: "#f0ede6",
              borderRadius: 100,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.05)",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((step + 1) / STEPS.length) * 100}%`,
                backgroundImage:
                  "linear-gradient(90deg, #D4B896, #C4A265, #b39257)",
                borderRadius: 100,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "16px 24px 16px",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", maxWidth: 800 }}>
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>
      </div>

      {/* Footer nav */}
      {!isLastStep && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            background: "#fff",
            padding: "16px 0",
          }}
        >
          <div
            className="container-main"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => step > 0 && setWizardStep(step - 1)}
              className="btn-secondary"
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => canNext() && setWizardStep(step + 1)}
              className="btn-primary"
              style={{ opacity: canNext() ? 1 : 0.4 }}
              disabled={!canNext()}
            >
              Next Step <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
