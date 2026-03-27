"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { useDesignStore } from "@/store/designStore";

// Dynamically imported — uses WebXR + Three.js Canvas, must be client-only
const ARWalkthrough = dynamic(
  () => import("@/components/ARWalkthrough").then((m) => ({ default: m.ARWalkthrough })),
  { ssr: false },
);

// ── model-viewer custom element types ────────────────────────────────────────
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & {
          src?: string;
          alt?: string;
          /** USDZ for iOS Safari Quick Look. Add when you have a .usdz asset. */
          "ios-src"?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "ar-scale"?: string;
          "ar-placement"?: string;
          "xr-environment"?: boolean;
          "camera-controls"?: boolean;
          "camera-orbit"?: string;
          "camera-target"?: string;
          "field-of-view"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "min-field-of-view"?: string;
          "max-field-of-view"?: string;
          "shadow-intensity"?: string;
          exposure?: string;
          "touch-action"?: string;
          poster?: string;
          slot?: string;
          style?: React.CSSProperties;
        };
      }
    }
  }
}

type ModelViewerElement = HTMLElement & {
  src: string;
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
};

// ── AR model source ───────────────────────────────────────────────────────────
//
// WHERE TO PUT THE GLB
// ─────────────────────
// Place a pre-baked apartment model at:   public/models/apartment.glb
// Place an iOS USDZ model at:             public/models/apartment.usdz
//
// FUTURE: DYNAMIC EXPORT
// ───────────────────────
// When GLTFExporter-based export is implemented in ARViewer.tsx, replace the
// static path below with a Blob URL created from the exported R3F scene:
//
//   const blob = await exportSceneAsGLB(sceneRef);          // future helper
//   const url  = URL.createObjectURL(blob);
//   setModelSrc(url);
//   // remember to call URL.revokeObjectURL(url) on unmount
//
// CONNECTING TO THE CURRENT DESIGN
// ─────────────────────────────────
// The model could also be per-design if you store exported GLBs server-side:
//   const modelSrc = `/api/export-glb?designId=${design.id}`;
// For now a single shared static file keeps the AR page simple and functional.
const STATIC_MODEL_PATH = "/models/apartment.glb";
// iOS USDZ path (not yet used): public/models/apartment.usdz
// Uncomment ios-src on <model-viewer> below when the file is ready.

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// ── ViewerContent — hoisted outside ARDemoPage so React sees a stable component
// type across re-renders. If defined inside the parent, every state change
// (e.g. orbitReadout updating on camera move) unmounts and remounts model-viewer,
// which restarts the GLB load.
interface ViewerContentProps {
  viewerReady: boolean;
  modelError: boolean;
  viewerRef: React.RefObject<ModelViewerElement | null>;
}

function ViewerContent({ viewerReady, modelError, viewerRef }: ViewerContentProps) {
  if (!viewerReady) {
    return (
      <div style={centreStyle}>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Loading 3D viewer…
        </p>
      </div>
    );
  }

  return (
    <>
      <model-viewer
        ref={(node) => {
          viewerRef.current = node as ModelViewerElement | null;
        }}
        src={STATIC_MODEL_PATH}
        // ── iOS Quick Look ──────────────────────────────────────────────────
        // Provide public/models/apartment.usdz then uncomment:
        // ios-src="/models/apartment.usdz"
        alt="3D apartment preview"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        exposure="1"
        ar
        xr-environment
        ar-modes="scene-viewer webxr quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        camera-orbit="25deg 65deg auto"
        camera-target="auto"
        field-of-view="45deg"
        min-camera-orbit="auto auto 2m"
        max-camera-orbit="auto auto 20m"
        min-field-of-view="30deg"
        max-field-of-view="80deg"
        style={{ width: "100%", height: "100%", background: "#f5f3f0" }}
      >
        <button
          slot="ar-button"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            zIndex: 5,
            background: "#111",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          View in AR
        </button>
      </model-viewer>

      {/* ── No-model overlay ───────────────────────────────────────────────── */}
      {modelError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(245,243,240,0.96)",
            gap: 12,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>🏠</div>
          <h3 style={{ margin: 0 }}>AR Model Not Yet Available</h3>
          <p
            style={{
              color: "var(--color-text-secondary)",
              maxWidth: 420,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            The AR viewer needs a pre-baked{" "}
            <code>apartment.glb</code> file to display the model. Until then,
            the 3D configurator tab gives you a fully interactive view of your
            design.
          </p>
          <div
            style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "12px 20px",
              textAlign: "left",
              fontSize: 13,
              maxWidth: 380,
            }}
          >
            <strong>To enable AR:</strong>
            <ol
              style={{
                margin: "8px 0 0 0",
                paddingLeft: 20,
                color: "var(--color-text-secondary)",
                lineHeight: 2,
              }}
            >
              <li>Export a GLB from the 3D viewer (GLTFExporter — coming soon)</li>
              <li>
                Place it at <code>public/models/apartment.glb</code>
              </li>
              <li>
                Optionally add <code>apartment.usdz</code> for iOS Quick Look
              </li>
            </ol>
          </div>
          <a
            href="/design/configurator"
            className="btn-primary no-underline"
            style={{ marginTop: 8 }}
          >
            Back to 3D Configurator
          </a>
        </div>
      )}
    </>
  );
}

export default function ARDemoPage() {
  // ── Real design from store ─────────────────────────────────────────────────
  const { generatedDesign, canvasItems } = useDesignStore();

  // Prefer the live generated design; fall back to null (empty state shown).
  const design = generatedDesign;

  // Use canvasItems for item count and cost — they reflect user edits
  // (drag, add, remove) made in the configurator after generation.
  const itemCount = canvasItems.length > 0
    ? canvasItems.length
    : design?.items.length ?? 0;
  const totalCost = canvasItems.length > 0
    ? canvasItems.reduce((s, i) => s + i.price, 0)
    : design?.totalCost ?? 0;

  const roomArea = useMemo(() => {
    if (!design) return null;
    return (design.room.width * design.room.length).toFixed(1);
  }, [design]);

  // ── model-viewer state ─────────────────────────────────────────────────────
  const [viewerReady, setViewerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [orbitReadout, setOrbitReadout] = useState("auto");
  const [loadTime, setLoadTime] = useState("-");
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arStatusMsg, setArStatusMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const loadStartRef = useRef<number>(0);

  // Start outside the model at a comfortable overview distance.
  // theta=25 gives a slight angle; phi=65 is ~25° above horizon.
  // radius=10 works for typical apartment models (6–10 m wide); auto-framing
  // via camera-orbit="auto" also handles this but we need a JS fallback value.
  const cameraState = useRef({ theta: 25, phi: 65, radius: 10 });

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      const ms = performance.now() - loadStartRef.current;
      setStatus("Model loaded");
      setLoadTime(`${ms.toFixed(0)} ms`);
      setIsLoaded(true);
      setModelError(false);
      // Check AR support after the model is ready
      setArSupported(viewer.canActivateAR ?? false);
      setTimeout(resetCamera, 300);
    };

    const handleError = () => {
      setStatus("AR model not available");
      setIsLoaded(false);
      setModelError(true);
    };

    // ar-status fires when the AR session starts, fails, or is not supported
    const handleArStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ status: string }>).detail;
      switch (detail.status) {
        case "not-presenting":
          setArStatusMsg(null);
          break;
        case "session-started":
          setArStatusMsg("AR session started");
          break;
        case "failed":
          setArStatusMsg(
            "AR failed to start. Ensure ARCore is installed, you are on HTTPS, and your device supports AR.",
          );
          break;
        default:
          setArStatusMsg(detail.status);
      }
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    viewer.addEventListener("ar-status", handleArStatus);
    loadStartRef.current = performance.now();
    setStatus("Loading model…");

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
      viewer.removeEventListener("ar-status", handleArStatus);
    };
  }, [viewerReady]);

  const updateCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const { theta, phi, radius } = cameraState.current;
    const orbitValue = `${theta}deg ${phi}deg ${radius}m`;
    viewer.setAttribute("camera-orbit", orbitValue);
    setOrbitReadout(orbitValue);
  };

  const resetCamera = () => {
    cameraState.current = { theta: 25, phi: 65, radius: 10 };
    updateCamera();
  };

  const rotateLeft = () => {
    if (!isLoaded) return;
    cameraState.current.theta += 15;
    updateCamera();
  };
  const rotateRight = () => {
    if (!isLoaded) return;
    cameraState.current.theta -= 15;
    updateCamera();
  };
  const tiltUp = () => {
    if (!isLoaded) return;
    cameraState.current.phi = clamp(cameraState.current.phi - 8, 20, 120);
    updateCamera();
  };
  const tiltDown = () => {
    if (!isLoaded) return;
    cameraState.current.phi = clamp(cameraState.current.phi + 8, 20, 120);
    updateCamera();
  };

  const launchAR = async () => {
    const viewer = viewerRef.current;
    if (!viewer?.activateAR) {
      setArStatusMsg("AR is not supported in this browser or on this device.");
      return;
    }
    if (viewer.canActivateAR === false) {
      setArStatusMsg(
        "AR is not available. Make sure ARCore is installed and you are using Chrome on Android.",
      );
      return;
    }
    try {
      await viewer.activateAR();
    } catch (err) {
      console.error("AR launch failed:", err);
      setArStatusMsg(
        `AR launch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // ── Page ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setViewerReady(true)}
      />

      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, #23233b 55%, #2b2b45 100%)",
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="container-main"
          style={{ paddingTop: 48, paddingBottom: 48 }}
        >
          <div className="max-w-3xl">
            <div className="chip chip-accent mb-4">AR Interior Viewer</div>
            <h1 className="mb-4" style={{ color: "white", maxWidth: "12ch" }}>
              Visualize your design in AR
            </h1>
            <p
              className="mb-6"
              style={{ color: "rgba(255,255,255,0.78)", maxWidth: "720px" }}
            >
              {design
                ? `Your ${design.styleApplied} design is ready. Launch AR on a supported device to preview the layout in your own space.`
                : "Generate a design in the configurator first, then return here to view it in AR."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {design ? (
                <a href="#demo" className="btn-primary no-underline">
                  View in AR
                </a>
              ) : (
                <a
                  href="/design/wizard"
                  className="btn-primary no-underline"
                >
                  Create Your Design
                </a>
              )}
              <a
                href="/design/configurator"
                className="btn-secondary no-underline"
              >
                Open 3D Configurator
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        className="container-main"
        style={{ paddingTop: 48, paddingBottom: 48 }}
        id="demo"
      >
        {/* No-design state */}
        {!design && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 32px",
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: 20,
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛋️</div>
            <h2 style={{ marginBottom: 12 }}>No design yet</h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                maxWidth: 480,
                margin: "0 auto 24px",
                lineHeight: 1.6,
              }}
            >
              Complete the design wizard to generate your apartment layout.
              Once it's ready you can view it in 3D and launch it in AR on
              supported devices.
            </p>
            <a href="/design/wizard" className="btn-primary no-underline">
              Start Design Wizard
            </a>
          </div>
        )}

        {/* Viewer */}
        <div className="mb-8">
          <div className="chip mb-4">LIVE 3D / AR PREVIEW</div>
          <h2 className="mb-2">Interactive Room Visualization</h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: 720 }}>
            {design
              ? `Explore your ${design.styleApplied} apartment in 3D. On a supported mobile device the "View in AR" button places the model in your physical space.`
              : "Your design will appear here once generated."}
          </p>
        </div>

        <div
          ref={containerRef}
          className={isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl"}
          style={{
            height: isFullscreen ? "100vh" : 600,
            background: "#f5f3f0",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            marginBottom: 20,
            position: "relative",
          }}
        >
          <ViewerContent
            viewerReady={viewerReady}
            modelError={modelError}
            viewerRef={viewerRef}
          />
        </div>

        {/* Camera controls */}
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}
        >
          {[
            { label: "Rotate Left", fn: rotateLeft },
            { label: "Rotate Right", fn: rotateRight },
            { label: "Tilt Up", fn: tiltUp },
            { label: "Tilt Down", fn: tiltDown },
            { label: "Reset View", fn: resetCamera },
            { label: "Launch AR", fn: launchAR },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="btn-secondary"
              type="button"
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleFullscreen}
            style={{
              padding: "10px 16px",
              background: "var(--color-accent)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
            type="button"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        {/* Status card */}
        <div className="card mb-8">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>STATUS</small>
              <div
                className="mt-2 font-semibold"
                style={{ color: modelError ? "var(--color-danger)" : undefined }}
              >
                {status}
              </div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>LOAD TIME</small>
              <div className="mt-2 font-semibold">{loadTime}</div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>AR SUPPORT</small>
              <div
                className="mt-2 font-semibold"
                style={{
                  color:
                    arSupported === true
                      ? "var(--color-success)"
                      : arSupported === false
                        ? "var(--color-danger)"
                        : undefined,
                }}
              >
                {arSupported === null
                  ? "Checking…"
                  : arSupported
                    ? "Available"
                    : "Not available on this device/browser"}
              </div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>CAMERA ORBIT</small>
              <div className="mt-2 font-semibold" style={{ wordBreak: "break-word" }}>
                {orbitReadout}
              </div>
            </div>
          </div>
          {/* AR status message — shown when AR session fires an event */}
          {arStatusMsg && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: arStatusMsg.includes("started")
                  ? "var(--color-success-bg)"
                  : "var(--color-warning-bg)",
                border: `1px solid ${arStatusMsg.includes("started") ? "rgba(45,159,91,0.2)" : "rgba(212,160,23,0.2)"}`,
                borderRadius: 10,
                fontSize: 14,
                color: "var(--color-text-primary)",
              }}
            >
              {arStatusMsg}
            </div>
          )}
        </div>

        {/* ── AR Walkthrough ──────────────────────────────────────────────── */}
        {design && (
          <div className="mb-8">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className="chip mb-0">AR WALKTHROUGH</div>
              <span
                style={{
                  background: "var(--color-success-bg)",
                  color: "var(--color-success)",
                  border: "1px solid rgba(45,159,91,0.2)",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                NEW
              </span>
            </div>
            <h2 className="mb-2">Walk Through Your Room in AR</h2>
            <p style={{ color: "var(--color-text-secondary)", maxWidth: 680, marginBottom: 20 }}>
              Place your virtual room in your real space and physically walk around it at 1:1 scale.
              Requires a supported mobile device — point at the floor and tap to anchor.
            </p>
            <ARWalkthrough design={design} />
          </div>
        )}

        {/* Design metadata — sourced from real store ───────────────────────── */}
        {design && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card">
                <small style={{ color: "var(--color-text-muted)" }}>DESIGN STYLE</small>
                <div className="mt-3 font-semibold text-lg">{design.styleApplied}</div>
              </div>
              <div className="card">
                <small style={{ color: "var(--color-text-muted)" }}>TOTAL BUDGET</small>
                <div className="mt-3 font-semibold text-lg">
                  ${totalCost.toLocaleString()}
                </div>
              </div>
              <div className="card">
                <small style={{ color: "var(--color-text-muted)" }}>ROOM SIZE</small>
                <div className="mt-3 font-semibold text-lg">
                  {design.room.width}m × {design.room.length}m
                  {roomArea && (
                    <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 4 }}>
                      ({roomArea}m²)
                    </span>
                  )}
                </div>
              </div>
              <div className="card">
                <small style={{ color: "var(--color-text-muted)" }}>FURNITURE</small>
                <div className="mt-3 font-semibold text-lg">
                  {itemCount} {itemCount === 1 ? "piece" : "pieces"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="mb-4">Design Summary</h3>
                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 16,
                  }}
                >
                  {[
                    ["Style", design.styleApplied],
                    ["Room", `${design.room.width}m × ${design.room.length}m`],
                    ["Total cost", `$${totalCost.toLocaleString()}`],
                    ["Avg item cost", `$${design.averageCost.toLocaleString()}`],
                    ["Furniture pieces", String(itemCount)],
                    [
                      "Spaces",
                      design.room.spaces
                        ? String(design.room.spaces.length)
                        : "1",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <small style={{ color: "var(--color-text-muted)" }}>
                        {label}
                      </small>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4">Color Palette</h3>
                <div className="space-y-3">
                  {design.colorPalette.map((color, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px",
                        background: "var(--color-surface-hover)",
                        borderRadius: "var(--radius)",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: color,
                          border: "2px solid var(--color-border)",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <small
                          style={{
                            color: "var(--color-text-muted)",
                            display: "block",
                          }}
                        >
                          Tone {idx + 1}
                        </small>
                        <code style={{ fontSize: 12, fontWeight: 600 }}>
                          {color}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* How to interact */}
        <div
          className="card"
          style={{
            background: "var(--color-accent-bg)",
            borderColor: "rgba(196, 162, 101, 0.22)",
          }}
        >
          <h3 className="mb-4">How to Interact</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
            }}
          >
            {[
              ["🔄 Rotate", "Drag or use the rotate buttons to inspect the space"],
              ["🔍 Zoom", "Scroll or pinch to zoom in and out"],
              [
                "📱 AR",
                "On a supported Android or iOS device, tap \"View in AR\" to place the model in your room",
              ],
              ["⇗ Fullscreen", "Expand the viewer for a more immersive preview"],
            ].map(([title, desc]) => (
              <div key={title as string}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
                <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features strip */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg-alt)",
        }}
      >
        <div
          className="container-main"
          style={{ paddingTop: 48, paddingBottom: 48 }}
        >
          <div className="mb-8">
            <div className="chip mb-4">FEATURES</div>
            <h2 className="mb-2">AR Capabilities</h2>
            <p style={{ color: "var(--color-text-secondary)", maxWidth: 680 }}>
              View your apartment design in augmented reality directly in your
              physical space on any ARCore (Android) or ARKit (iOS) device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="card"
              style={{
                background: "var(--color-success-bg)",
                borderColor: "rgba(45, 159, 91, 0.18)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
              <h3 className="mb-3" style={{ color: "var(--color-success)" }}>
                Android AR
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Uses WebXR or Google Scene Viewer to place the full apartment
                model in your real environment.
              </p>
            </div>

            <div
              className="card"
              style={{
                background: "var(--color-accent-bg)",
                borderColor: "rgba(196, 162, 101, 0.22)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>◉</div>
              <h3 className="mb-3" style={{ color: "var(--color-accent)" }}>
                iOS Quick Look
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Provide a <code>.usdz</code> file at{" "}
                <code>public/models/apartment.usdz</code> and add{" "}
                <code>ios-src</code> to <code>{"<model-viewer>"}</code> for
                native Safari AR.
              </p>
            </div>

            <div
              className="card"
              style={{
                background: "var(--color-warning-bg)",
                borderColor: "rgba(212, 160, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>≡</div>
              <h3 className="mb-3" style={{ color: "var(--color-warning)" }}>
                Dynamic Export
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                The next step is wiring Three.js{" "}
                <code>GLTFExporter</code> to the R3F scene in{" "}
                <code>ARViewer.tsx</code> so the live apartment is
                exported to GLB on demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const centreStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
