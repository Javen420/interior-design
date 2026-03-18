"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { GeneratedDesign } from "@/store/designStore";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ar-placement"?: string;
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
        slot?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

type ModelViewerElement = HTMLElement & {
  src: string;
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
};

const MINIMALIST_DEMO_DESIGN: GeneratedDesign = {
  styleApplied: "Minimalist",
  totalCost: 8500,
  averageCost: 425,
  room: {
    width: 5,
    length: 4.5,
    walls: [
      { x1: 0, y1: 0, x2: 5, y2: 0 },
      { x1: 5, y1: 0, x2: 5, y2: 4.5 },
      { x1: 5, y1: 4.5, x2: 0, y2: 4.5 },
      { x1: 0, y1: 4.5, x2: 0, y2: 0 },
    ],
    doors: [{ x: 2.5, y: 0, width: 1, side: "top" }],
    windows: [{ x: 0.5, y: 0, width: 1.5, side: "top" }],
  },
  items: [
    {
      id: "sofa-1",
      name: "Modern L-Shape Sofa",
      catalogId: "sofa-1",
      category: "Seating",
      x: 0.3,
      y: 0.8,
      width: 2.5,
      depth: 1.2,
      color: "#e8dcc8",
      price: 1200,
      rotation: 0,
    },
    {
      id: "armchair-1",
      name: "Scandinavian Armchair",
      catalogId: "armchair-1",
      category: "Seating",
      x: 3.2,
      y: 1.5,
      width: 1.3,
      depth: 0.9,
      color: "#c9a87c",
      price: 520,
      rotation: 0,
    },
    {
      id: "table-1",
      name: "Walnut Coffee Table",
      catalogId: "table-1",
      category: "Tables",
      x: 1.2,
      y: 2.2,
      width: 1.8,
      depth: 0.9,
      color: "#6b4423",
      price: 480,
      rotation: 0,
    },
    {
      id: "side-table-1",
      name: "Natural Oak Side Table",
      catalogId: "side-table-1",
      category: "Tables",
      x: 3.5,
      y: 3.0,
      width: 0.8,
      depth: 0.6,
      color: "#a0795f",
      price: 240,
      rotation: 0,
    },
    {
      id: "shelves-1",
      name: "Floating Shelving Unit",
      catalogId: "shelves-1",
      category: "Storage",
      x: 4.0,
      y: 0.4,
      width: 0.9,
      depth: 0.35,
      color: "#f8f6f2",
      price: 580,
      rotation: 0,
    },
    {
      id: "bookshelf-1",
      name: "Minimalist Bookshelf",
      catalogId: "bookshelf-1",
      category: "Storage",
      x: 0.2,
      y: 3.0,
      width: 1.2,
      depth: 0.35,
      color: "#d0c9be",
      price: 450,
      rotation: 0,
    },
    {
      id: "pendant-1",
      name: "Brass Pendant Light",
      catalogId: "pendant-1",
      category: "Lighting",
      x: 1.5,
      y: 2.5,
      width: 0.25,
      depth: 0.25,
      color: "#d4a574",
      price: 280,
      rotation: 0,
    },
    {
      id: "floor-lamp-1",
      name: "Arc Floor Lamp",
      catalogId: "floor-lamp-1",
      category: "Lighting",
      x: 3.8,
      y: 2.0,
      width: 0.2,
      depth: 0.2,
      color: "#333333",
      price: 320,
      rotation: 0,
    },
    {
      id: "rug-1",
      name: "Jute & Wool Blend Rug",
      catalogId: "rug-1",
      category: "Decor",
      x: 0.8,
      y: 1.5,
      width: 2.8,
      depth: 2.2,
      color: "#d9cfc3",
      price: 680,
      rotation: 0,
    },
    {
      id: "plant-1",
      name: "Tall Snake Plant",
      catalogId: "plant-1",
      category: "Decor",
      x: 0.1,
      y: 0.2,
      width: 0.4,
      depth: 0.4,
      color: "#1a3a1a",
      price: 95,
      rotation: 0,
    },
    {
      id: "plant-2",
      name: "Fiddle Leaf Fig",
      catalogId: "plant-2",
      category: "Decor",
      x: 4.4,
      y: 3.8,
      width: 0.5,
      depth: 0.5,
      color: "#2d5016",
      price: 120,
      rotation: 0,
    },
    {
      id: "plant-3",
      name: "Pothos Plant Pot",
      catalogId: "plant-3",
      category: "Decor",
      x: 4.0,
      y: 3.5,
      width: 0.35,
      depth: 0.35,
      color: "#3a6b3a",
      price: 85,
      rotation: 0,
    },
    {
      id: "wall-art-1",
      name: "Abstract Wall Art",
      catalogId: "wall-art-1",
      category: "Decor",
      x: 0.3,
      y: 0.5,
      width: 1.0,
      depth: 0.05,
      color: "#c9a87c",
      price: 240,
      rotation: 0,
    },
    {
      id: "cushion-1",
      name: "Linen Throw Cushions",
      catalogId: "cushion-1",
      category: "Decor",
      x: 1.8,
      y: 0.9,
      width: 0.5,
      depth: 0.5,
      color: "#a88c5d",
      price: 160,
      rotation: 0,
    },
    {
      id: "side-decor-1",
      name: "Ceramic Vase Trio",
      catalogId: "side-decor-1",
      category: "Decor",
      x: 4.1,
      y: 0.7,
      width: 0.6,
      depth: 0.2,
      color: "#e8dcc8",
      price: 185,
      rotation: 0,
    },
  ],
  colorPalette: ["#e8dcc8", "#d9cfc3", "#c9a87c", "#6b4423", "#1a3a1a"],
};

export default function ARDemoPage() {
  const [viewerReady, setViewerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [orbitReadout, setOrbitReadout] = useState("auto");
  const [loadTime, setLoadTime] = useState("-");
  const [modelSrc] = useState("/models/apartment.glb");

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const loadStartRef = useRef<number>(0);

  const cameraState = useRef({
    theta: 0,
    phi: 75,
    radius: 4,
  });

  const roomArea = useMemo(() => {
    return (
      MINIMALIST_DEMO_DESIGN.room.width * MINIMALIST_DEMO_DESIGN.room.length
    ).toFixed(1);
  }, []);

  useEffect(() => {
    if (!viewerReady) return;

    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      const ms = performance.now() - loadStartRef.current;
      setStatus("Model loaded successfully");
      setLoadTime(`${ms.toFixed(0)} ms`);
      setIsLoaded(true);

      setTimeout(() => {
        resetCamera();
      }, 300);
    };

    const handleError = () => {
      setStatus("Failed to load model");
      setIsLoaded(false);
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    loadStartRef.current = performance.now();
    setStatus("Loading model...");

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [viewerReady, modelSrc]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const updateCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { theta, phi, radius } = cameraState.current;
    const orbitValue = `${theta}deg ${phi}deg ${radius}m`;
    viewer.setAttribute("camera-orbit", orbitValue);
    setOrbitReadout(orbitValue);
  };

  const resetCamera = () => {
    cameraState.current = {
      theta: 0,
      phi: 75,
      radius: 4,
    };
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
    if (!viewer?.activateAR) return;

    try {
      await viewer.activateAR();
    } catch (err) {
      console.error("AR launch failed:", err);
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setViewerReady(true)}
      />

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
            <div className="chip chip-accent mb-4">AR Interior Demo</div>

            <h1
              className="mb-4"
              style={{
                color: "white",
                maxWidth: "12ch",
              }}
            >
              Visualize your design in 3D and AR
            </h1>

            <p
              className="mb-6"
              style={{
                color: "rgba(255,255,255,0.78)",
                maxWidth: "720px",
              }}
            >
              Explore a furnished room in an interactive 3D viewer, then launch
              AR on supported devices to preview the layout in your own space.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#demo" className="btn-primary no-underline">
                View Demo
              </a>
              <a href="/design/wizard" className="btn-secondary no-underline">
                Create Your Design
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
        <div className="mb-8">
          <div className="chip mb-4">LIVE 3D PREVIEW</div>
          <h2 className="mb-2">Interactive Room Visualization</h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: 720 }}>
            Experience the minimalist interior design in a fully interactive 3D
            environment. Explore the space from every angle and see how each
            piece fits together.
          </p>
        </div>

        <div
          ref={containerRef}
          className={`${
            isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl"
          }`}
          style={{
            height: isFullscreen ? "100vh" : 600,
            background: "#f5f3f0",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            marginBottom: 20,
            position: "relative",
          }}
        >
          {viewerReady ? (
            <model-viewer
              ref={(node) => {
                viewerRef.current = node as ModelViewerElement | null;
              }}
              src={modelSrc}
              alt="3D apartment preview"
              camera-controls
              touch-action="pan-y"
              shadow-intensity="1"
              exposure="1"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              ar-placement="floor"
              camera-orbit="auto auto auto"
              camera-target="auto auto auto"
              field-of-view="45deg"
              min-camera-orbit="auto auto 0.5m"
              max-camera-orbit="auto auto 8m"
              min-field-of-view="30deg"
              max-field-of-view="80deg"
              style={{
                width: "100%",
                height: "100%",
                background: "#f5f3f0",
              }}
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
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              Loading 3D viewer...
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <button onClick={rotateLeft} className="btn-secondary" type="button">
            Rotate Left
          </button>
          <button onClick={rotateRight} className="btn-secondary" type="button">
            Rotate Right
          </button>
          <button onClick={tiltUp} className="btn-secondary" type="button">
            Tilt Up
          </button>
          <button onClick={tiltDown} className="btn-secondary" type="button">
            Tilt Down
          </button>
          <button onClick={resetCamera} className="btn-secondary" type="button">
            Reset View
          </button>
          <button onClick={launchAR} className="btn-secondary" type="button">
            Launch AR
          </button>
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
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </button>
        </div>

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
              <div className="mt-2 font-semibold">{status}</div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>
                LOAD TIME
              </small>
              <div className="mt-2 font-semibold">{loadTime}</div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>
                CAMERA ORBIT
              </small>
              <div
                className="mt-2 font-semibold"
                style={{ wordBreak: "break-word" }}
              >
                {orbitReadout}
              </div>
            </div>
            <div>
              <small style={{ color: "var(--color-text-muted)" }}>
                MODEL FILE
              </small>
              <div className="mt-2 font-semibold">{modelSrc}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <small style={{ color: "var(--color-text-muted)" }}>
              DESIGN STYLE
            </small>
            <div className="mt-3 font-semibold text-lg">
              {MINIMALIST_DEMO_DESIGN.styleApplied}
            </div>
          </div>

          <div className="card">
            <small style={{ color: "var(--color-text-muted)" }}>
              TOTAL BUDGET
            </small>
            <div className="mt-3 font-semibold text-lg">
              ${MINIMALIST_DEMO_DESIGN.totalCost.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <small style={{ color: "var(--color-text-muted)" }}>
              ROOM DIMENSIONS
            </small>
            <div className="mt-3 font-semibold text-lg">
              {MINIMALIST_DEMO_DESIGN.room.width}m ×{" "}
              {MINIMALIST_DEMO_DESIGN.room.length}m
            </div>
          </div>

          <div className="card">
            <small style={{ color: "var(--color-text-muted)" }}>
              FURNITURE ITEMS
            </small>
            <div className="mt-3 font-semibold text-lg">
              {MINIMALIST_DEMO_DESIGN.items.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="mb-4">Design Overview</h3>
            <p
              style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}
            >
              A warm minimalist concept using soft neutrals, wood accents, and
              restrained decor to create a calm, premium interior feel.
            </p>

            <div className="space-y-4 mt-6">
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Avg Item Cost
                  </small>
                  <span className="font-semibold">
                    ${MINIMALIST_DEMO_DESIGN.averageCost.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Furniture Pieces
                  </small>
                  <span className="font-semibold">
                    {MINIMALIST_DEMO_DESIGN.items.length}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Room Area
                  </small>
                  <span className="font-semibold">{roomArea}m²</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">Color Palette</h3>
            <div className="space-y-3">
              {MINIMALIST_DEMO_DESIGN.colorPalette.map((color, idx) => (
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
                    <code
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {color}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>🔄 Rotate</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Drag the mouse or use the rotate buttons to inspect the space
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>🔍 Zoom</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Use scroll wheel or pinch gesture to zoom naturally
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📱 AR</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Launch AR on supported mobile devices to place the model in
                space
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                ⇗ Fullscreen
              </div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Expand the viewer for a more immersive preview
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <h2 className="mb-2">Experience the Design</h2>
            <p style={{ color: "var(--color-text-secondary)", maxWidth: 680 }}>
              Our interactive 3D viewer brings your interior design to life.
              Explore every detail, adjust your perspective, and make informed
              decisions before committing to your design.
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
                Interactive Exploration
              </h3>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Rotate, zoom, and navigate through the space to see furniture
                placement from any angle with smooth, responsive controls.
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
                Accurate Proportions
              </h3>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Furniture, colors, and room dimensions are rendered to scale so
                you can visualize the real-world impact of your design.
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
                Detailed Information
              </h3>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                See the complete breakdown of your design including budget,
                items, and color scheme all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
