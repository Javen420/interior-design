"use client";

import React, { useState, useRef } from "react";
import { ARViewerContainer } from "@/components/ARViewer";
import { GeneratedDesign } from "@/store/designStore";

// Fixed minimalist design for AR demo
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 px-4 sm:py-16 md:py-20 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Visualize Your Design in 3D & AR
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl">
            See how your design looks in three dimensions. If your device
            supports it, view your room in augmented reality to experience it in
            your actual space.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <>
            {/* Design Visualization Area */}
            <div
              ref={containerRef}
              className={`rounded-lg overflow-hidden shadow-lg ${
                isFullscreen ? "fixed inset-0 rounded-none z-50" : ""
              }`}
              style={{ height: isFullscreen ? "100vh" : "600px" }}
            >
              <ARViewerContainer
                design={MINIMALIST_DEMO_DESIGN}
                onFullscreenRequest={handleFullscreen}
              />
            </div>

            {/* Design Info Card */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  Minimalist Design (Demo)
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Style Applied</dt>
                    <dd className="font-semibold text-gray-900">
                      {MINIMALIST_DEMO_DESIGN.styleApplied}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Total Cost</dt>
                    <dd className="font-semibold text-gray-900">
                      ${MINIMALIST_DEMO_DESIGN.totalCost.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Average Item Cost</dt>
                    <dd className="font-semibold text-gray-900">
                      ${MINIMALIST_DEMO_DESIGN.averageCost.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Room Dimensions</dt>
                    <dd className="font-semibold text-gray-900">
                      {MINIMALIST_DEMO_DESIGN.room.width}m ×{" "}
                      {MINIMALIST_DEMO_DESIGN.room.length}m
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Furniture Items</dt>
                    <dd className="font-semibold text-gray-900">
                      {MINIMALIST_DEMO_DESIGN.items.length}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-lg text-blue-900 mb-4">
                  Color Palette
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {MINIMALIST_DEMO_DESIGN.colorPalette
                    .slice(0, 4)
                    .map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-mono text-gray-700">
                          {color}
                        </span>
                      </div>
                    ))}
                </div>

                <h4 className="font-semibold text-blue-900 text-sm mb-3">
                  3D Controls
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>
                    🖱️ <strong>Drag</strong> to rotate the view
                  </li>
                  <li>
                    📏 <strong>Scroll/Pinch</strong> to zoom in/out
                  </li>
                  <li>
                    🖥️ <strong>Fullscreen</strong> button for immersive view
                  </li>
                  <li>
                    📱 <strong>AR View</strong> (if supported) for real-world
                    preview
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/design/wizard"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your Design
              </a>
            </div>
          </>
        </div>
      </section>

      {/* AR Support Info */}
      <section className="py-8 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            AR Compatibility
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ AR Supported
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• iOS 17+ (iPhone 12 and newer)</li>
                <li>• Android with ARCore (Latest Chrome)</li>
                <li>• Samsung DeX devices</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                💡 3D Fallback
              </h3>
              <p className="text-sm text-yellow-800">
                Don't have AR? Use the interactive 3D viewer to explore your
                design from all angles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
