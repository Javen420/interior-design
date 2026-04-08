"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Text, Group, Line, Arc } from "react-konva";
import {
  FP,
  SCALE as FP_SCALE,
  FurnitureSymbol,
  ArchDoor,
  ArchWindow,
} from "@/lib/floorPlanSymbols";
import { useDesignStore, FurnitureItem } from "@/store/designStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DesignViewer3D } from "@/components/ARViewer";
import {
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Ruler,
  Tag,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Save,
  Download,
  X,
  Image as ImageIcon,
  Grid,
} from "lucide-react";

const SCALE = FP_SCALE;
const GRID = 0.25;

export default function ConfiguratorContent() {
  const router = useRouter();
  const {
    generatedDesign,
    preferences,
    canvasItems,
    setCanvasItems,
    updateCanvasItem,
    removeCanvasItem,
    addCanvasItem,
    pushHistory,
    undo,
    redo,
    history,
    historyIndex,
    zoom,
    setZoom,
    showDimensions,
    toggleDimensions,
    showLabels,
    toggleLabels,
    selectedItemId,
    setSelectedItemId,
    saveDesign,
    setGeneratedDesign,
  } = useDesignStore();

  const [alternatives, setAlternatives] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      width: number;
      depth: number;
      color: string;
      category: string;
    }>
  >([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [fullCatalog, setFullCatalog] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      width: number;
      depth: number;
      color: string;
      styles: string[];
    }>
  >([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [itemsVisible, setItemsVisible] = useState<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [isRendering3D, setIsRendering3D] = useState(false);

  const room = generatedDesign?.room;
  const totalCost = canvasItems.reduce((s, i) => s + i.price, 0);
  const isRug = (item: FurnitureItem) =>
    item.name.toLowerCase().includes("rug") ||
    item.name.toLowerCase().includes(" mat");

  useEffect(() => {
    fetch("/data/furniture-catalog.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setFullCatalog)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Items whose IDs are not yet in itemsVisible need to be revealed.
    // We cannot read itemsVisible here (stale closure) but the functional
    // updater below always receives the latest prev, so duplicates are
    // handled safely without needing itemsVisible in scope.
    //
    // Stagger strategy:
    //   • Initial design load (many new items at once) — stagger at 60 ms/item
    //     so the reveal animation is visible.
    //   • User adds a single item from the catalog — 0 ms delay so it appears
    //     immediately.
    //
    // Cleanup: cancel any pending timers from a previous run before scheduling
    // new ones. Without this, rapid canvasItems changes pile up overlapping
    // timeout chains that flood setItemsVisible, causing Konva to skip
    // re-drawing static elements (walls) while processing the opacity updates.
    let staggerDelay = 0;

    canvasItems.forEach((item, i) => {
      timers.push(
        setTimeout(
          () =>
            setItemsVisible((prev) => {
              if (prev.has(item.id)) return prev;
              return new Set([...prev, item.id]);
            }),
          staggerDelay,
        ),
      );
      // Apply stagger only for items beyond the third — a single new item
      // from the catalog is always at the end and gets delay 0 because
      // the loop's first items are already visible (functional updater no-ops).
      staggerDelay = i < 2 ? 0 : staggerDelay + 60;
    });

    return () => timers.forEach(clearTimeout);
  }, [canvasItems]);

  useEffect(() => {
    if (!selectedItemId) {
      setAlternatives([]);
      return;
    }
    const item = canvasItems.find((i) => i.id === selectedItemId);
    if (!item) return;
    const style = preferences.styles[0] || "Scandinavian";
    fetch(
      `/api/swap-suggestions?itemId=${item.catalogId}&category=${encodeURIComponent(item.category)}&style=${encodeURIComponent(style)}&budgetMax=${preferences.budgetMax}`,
    )
      .then((r) => r.json())
      .then((d) => setAlternatives(d.alternatives || []))
      .catch(() => {});
  }, [selectedItemId, canvasItems, preferences]);

  const handleDragEnd = useCallback(
    (id: string, nodeX: number, nodeY: number, node: any) => {
      if (!room) return;

      // Convert from pure pixels back to world meters
      const metersX = nodeX / (SCALE * zoom);
      const metersY = nodeY / (SCALE * zoom);

      // Grid snapping (0.25m)
      let clampedX = Math.round(metersX / GRID) * GRID;
      let clampedY = Math.round(metersY / GRID) * GRID;

      const item = canvasItems.find((i) => i.id === id);
      if (!item) return;

      const getAABB = (
        ix: number,
        iy: number,
        w: number,
        d: number,
        rot: number,
      ) => {
        let r = Math.round(rot) % 360;
        if (r < 0) r += 360;
        if (r === 90) return { x: ix - d, y: iy, w: d, h: w };
        if (r === 180) return { x: ix - w, y: iy - d, w: w, h: d };
        if (r === 270) return { x: ix, y: iy - w, w: d, h: w };
        return { x: ix, y: iy, w: w, h: d };
      };

      let aabb = getAABB(
        clampedX,
        clampedY,
        item.width,
        item.depth,
        item.rotation,
      );

      if (aabb.x < 0) clampedX += 0 - aabb.x;
      else if (aabb.x + aabb.w > room.width)
        clampedX -= aabb.x + aabb.w - room.width;

      aabb = getAABB(clampedX, clampedY, item.width, item.depth, item.rotation);
      if (aabb.y < 0) clampedY += 0 - aabb.y;
      else if (aabb.y + aabb.h > room.length)
        clampedY -= aabb.y + aabb.h - room.length;

      aabb = getAABB(clampedX, clampedY, item.width, item.depth, item.rotation);

      const isRug = item.category.toLowerCase().includes("rug");
      let hasOverlap = false;

      // Check collision against all other items
      for (const other of canvasItems) {
        if (other.id === id) continue;
        const otherIsRug = other.category.toLowerCase().includes("rug");
        if (isRug || otherIsRug) continue; // Rugs don't collide with anything

        const oAabb = getAABB(
          other.x,
          other.y,
          other.width,
          other.depth,
          other.rotation,
        );
        const buffer = 0.05; // 5cm buffer

        // AABB Collision check
        if (
          aabb.x + buffer < oAabb.x + oAabb.w &&
          aabb.x + aabb.w - buffer > oAabb.x &&
          aabb.y + buffer < oAabb.y + oAabb.h &&
          aabb.y + aabb.h - buffer > oAabb.y
        ) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) {
        // Animate jump back beautifully instead of instant snap
        node.to({
          x: item.x * SCALE * zoom,
          y: item.y * SCALE * zoom,
          duration: 0.25,
        });
        return;
      }

      updateCanvasItem(id, { x: clampedX, y: clampedY });
      pushHistory();

      // Lock node layout exactly to snap grid smoothly
      node.x(clampedX * SCALE * zoom);
      node.y(clampedY * SCALE * zoom);
    },
    [room, canvasItems, updateCanvasItem, pushHistory, zoom],
  );

  const handleSwap = (alt: (typeof alternatives)[0]) => {
    if (!selectedItemId) return;
    updateCanvasItem(selectedItemId, {
      catalogId: alt.id,
      name: alt.name,
      price: alt.price,
      width: alt.width,
      depth: alt.depth,
      color: alt.color,
    });
    pushHistory();
  };

  useEffect(() => {
    if (viewMode === "3d") {
      setIsRendering3D(true);
      const timer = setTimeout(() => setIsRendering3D(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [viewMode, generatedDesign]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      setItemsVisible(new Set());
      setGeneratedDesign(data);
      setSelectedItemId(null);
    } catch (err) {
      console.error(err);
    }
    setIsRegenerating(false);
  };

  const handleAddFromCatalog = (item: (typeof fullCatalog)[0]) => {
    if (!room) return;
    // Enforce budget maximum: block items that would push the total over budgetMax
    if (totalCost + item.price > preferences.budgetMax) return;
    const newItem: FurnitureItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      catalogId: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      width: item.width,
      depth: item.depth,
      x: room.width / 2 - item.width / 2,
      y: room.length / 2 - item.depth / 2,
      rotation: 0,
      color: item.color,
    };
    addCanvasItem(newItem);
    pushHistory();
  };

  const handleSave = () => {
    saveDesign();
    router.push("/design/match");
  };

  const handleDownload = () => {
    const data = { preferences, items: canvasItems, totalCost, room };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kairos-design.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = canvasItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, FurnitureItem[]>,
  );

  const filteredCatalog = fullCatalog.filter(
    (i) =>
      i.styles.some((s) =>
        preferences.styles
          .map((ps) => ps.toLowerCase())
          .includes(s.toLowerCase()),
      ) &&
      (catalogSearch === "" ||
        i.name.toLowerCase().includes(catalogSearch.toLowerCase())),
  );
  const catalogCategories = [
    ...new Set(filteredCatalog.map((i) => i.category)),
  ];

  if (!room || !generatedDesign) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Sparkles size={48} style={{ color: "var(--color-accent)" }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>
          No design generated yet
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Start the wizard to generate your room layout
        </p>
        <button
          onClick={() => router.push("/design/wizard")}
          className="btn-primary"
          style={{ marginTop: 16 }}
        >
          Go to Wizard
        </button>
      </div>
    );
  }

  const canvasWidth = room.width * SCALE * zoom;
  const canvasHeight = room.length * SCALE * zoom;

  return (
    <div className="configurator-shell">
      <AnimatePresence>
        {isRegenerating && (
          <motion.div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(250,255,250,0.9)",
              backdropFilter: "blur(8px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Sparkles
                style={{
                  color: "var(--color-accent)",
                  animation: "spin 2s linear infinite",
                }}
                size={24}
              />{" "}
              <span style={{ fontSize: 16 }}>Regenerating layout...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <div className="config-panel left-panel">
        <div
          style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--color-accent)",
              marginBottom: 10,
            }}
          >
            YOUR PREFERENCES
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {preferences.styles.map((s) => (
              <span
                key={s}
                className="chip chip-accent"
                style={{ fontSize: 12 }}
              >
                {s}
              </span>
            ))}
            <span
              className="chip"
              style={{ fontSize: 12, textTransform: "capitalize" }}
            >
              {preferences.colorTone}
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "10px 16px",
              fontSize: 13,
            }}
          >
            <Sparkles size={14} /> Regenerate
          </button>
        </div>

        {selectedItemId && (
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--color-accent)",
                marginBottom: 10,
              }}
            >
              SWAP ALTERNATIVES
            </div>
            {(() => {
              const sel = canvasItems.find((i) => i.id === selectedItemId);
              return sel ? (
                <div
                  className="card"
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    borderColor: "var(--color-accent)",
                    background: "var(--color-accent-bg)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: sel.color,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {sel.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--color-accent)" }}
                      >
                        SGD ${sel.price}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            {alternatives.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                No alternatives found
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="card"
                    style={{
                      padding: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: alt.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {alt.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        SGD ${alt.price}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSwap(alt)}
                      className="btn-primary"
                      style={{
                        padding: "4px 12px",
                        fontSize: 11,
                        borderRadius: 8,
                      }}
                    >
                      SWAP
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: 16, flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--color-accent)",
              marginBottom: 10,
            }}
          >
            ADD MORE ITEMS
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
              }}
            />
            <input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search catalog..."
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 8,
                fontSize: 13,
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                outline: "none",
                color: "var(--color-text)",
              }}
            />
          </div>
          {catalogCategories.map((cat) => (
            <div key={cat}>
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === cat ? null : cat)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                {cat} (
                {filteredCatalog.filter((i) => i.category === cat).length})
                {expandedCategory === cat ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>
              {expandedCategory === cat &&
                filteredCatalog
                  .filter((i) => i.category === cat)
                  .map((item) => {
                    const wouldExceedBudget = totalCost + item.price > preferences.budgetMax;
                    return (
                    <button
                      key={item.id}
                      onClick={() => handleAddFromCatalog(item)}
                      disabled={wouldExceedBudget}
                      title={wouldExceedBudget ? "Adding this item would exceed your maximum budget" : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: 8,
                        borderRadius: 8,
                        width: "100%",
                        cursor: wouldExceedBudget ? "not-allowed" : "pointer",
                        background: "none",
                        border: "none",
                        transition: "background 0.15s",
                        textAlign: "left",
                        opacity: wouldExceedBudget ? 0.4 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--color-text)",
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          ${item.price}
                        </div>
                      </div>
                    </button>
                    );
                  })}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER CANVAS */}
      <div className="config-panel center-panel" ref={stageRef}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--color-bg)",
              borderRadius: 10,
              padding: 4,
            }}
          >
            <button
              onClick={() => setViewMode("2d")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: viewMode === "2d" ? "var(--color-surface)" : "transparent",
                color:
                  viewMode === "2d"
                    ? "var(--color-text)"
                    : "var(--color-text-secondary)",
                boxShadow: viewMode === "2d" ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s",
              }}
            >
              <Grid size={16} /> 2D Blueprint
            </button>
            <button
              onClick={() => setViewMode("3d")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: viewMode === "3d" ? "var(--color-surface)" : "transparent",
                color:
                  viewMode === "3d"
                    ? "var(--color-text)"
                    : "var(--color-text-secondary)",
                boxShadow: viewMode === "3d" ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s",
              }}
            >
              <ImageIcon size={16} /> 3D Render
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleRegenerate}
              title="Regenerate"
              style={{
                padding: 8,
                borderRadius: 8,
                background: "var(--color-accent)",
                color: "var(--color-bg)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Sparkles size={14} /> Regenerate
            </button>
            <div
              style={{
                width: 1,
                height: 20,
                background: "var(--color-border)",
                margin: "0 4px",
              }}
            />
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: "pointer",
                opacity: historyIndex <= 0 ? 0.3 : 1,
              }}
            >
              <Undo2
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: "pointer",
                opacity: historyIndex >= history.length - 1 ? 0.3 : 1,
              }}
            >
              <Redo2
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
            <div
              style={{
                width: 1,
                height: 20,
                background: "var(--color-border)",
                margin: "0 4px",
              }}
            />
            <button
              onClick={() => setZoom(zoom + 0.1)}
              title="Zoom In"
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              <ZoomIn
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
            <button
              onClick={() => setZoom(zoom - 0.1)}
              title="Zoom Out"
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              <ZoomOut
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
            </button>
            {selectedItemId && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--color-border)",
                    margin: "0 4px",
                  }}
                />
                <button
                  onClick={() => {
                    removeCanvasItem(selectedItemId);
                    setSelectedItemId(null);
                    pushHistory();
                  }}
                  title="Delete"
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={18} style={{ color: "var(--color-danger)" }} />
                </button>
                <button
                  onClick={() => {
                    const item = canvasItems.find(
                      (i) => i.id === selectedItemId,
                    );
                    if (item) {
                      updateCanvasItem(selectedItemId, {
                        rotation: (item.rotation + 90) % 360,
                      });
                      pushHistory();
                    }
                  }}
                  title="Rotate"
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw
                    size={18}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            background: "var(--color-bg)",
          }}
        >
          {viewMode === "3d" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                maxWidth: 900,
                maxHeight: 600,
                background: "var(--color-surface)",
                borderRadius: 20,
                boxShadow: "var(--shadow-lg)",
                overflow: "hidden",
                position: "relative",
                border: "1px solid var(--color-border)",
              }}
            >
              {isRendering3D ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--color-bg)",
                    zIndex: 10,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ marginBottom: 16 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "4px solid var(--color-border)",
                        borderTopColor: "var(--color-accent)",
                      }}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    Generating Photorealistic Render...
                  </motion.div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      marginTop: 8,
                    }}
                  >
                    Applying {preferences.styles[0] || "Scandinavian"} style
                    patterns
                  </p>
                </div>
              ) : (
                <div style={{ width: "100%", height: "100%" }}>
                  <DesignViewer3D design={generatedDesign ?? null} />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "var(--color-surface)",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid var(--color-border)",
                padding: 4,
              }}
            >
              <Stage
                width={canvasWidth}
                height={canvasHeight}
                onClick={(e) => {
                  if (e.target === e.target.getStage()) setSelectedItemId(null);
                }}
              >
                <Layer>
                  {/* ── Floor background ─────────────────────────────── */}
                  <Rect
                    x={0}
                    y={0}
                    width={canvasWidth}
                    height={canvasHeight}
                    fill={FP.FLOOR_BG}
                    cornerRadius={8}
                    shadowColor="rgba(0,0,0,0.06)"
                    shadowBlur={24}
                    shadowOffsetY={12}
                    stroke="rgba(0,0,0,0.04)"
                    strokeWidth={2}
                    listening={false}
                  />
                  {/* ── Zone fills + floor texture ────────────────── */}
                  {room.spaces?.map((zone) => {
                    const zx = zone.x * SCALE * zoom;
                    const zy = zone.y * SCALE * zoom;
                    const zw = zone.width * SCALE * zoom;
                    const zh = zone.length * SCALE * zoom;
                    const isTile = zone.floor === "tile";
                    return (
                      <Group key={zone.id} listening={false}>
                        <Rect
                          x={zx}
                          y={zy}
                          width={zw}
                          height={zh}
                          fill={
                            isTile
                              ? "rgba(148,163,184,0.14)"
                              : "rgba(180,140,100,0.12)"
                          }
                        />
                        {/* Wood grain lines every 0.2 m */}
                        {!isTile &&
                          Array.from(
                            { length: Math.ceil(zone.length / 0.2) + 1 },
                            (_, i) => {
                              const ly = zy + i * 0.2 * SCALE * zoom;
                              if (ly > zy + zh) return null;
                              return (
                                <Line
                                  key={`wg${i}`}
                                  points={[zx, ly, zx + zw, ly]}
                                  stroke="rgba(150,110,70,0.1)"
                                  strokeWidth={0.5}
                                />
                              );
                            },
                          )}
                        {/* Tile grid every 0.3 m */}
                        {isTile &&
                          Array.from(
                            { length: Math.ceil(zone.length / 0.3) + 1 },
                            (_, i) => {
                              const ly = zy + i * 0.3 * SCALE * zoom;
                              if (ly > zy + zh) return null;
                              return (
                                <Line
                                  key={`th${i}`}
                                  points={[zx, ly, zx + zw, ly]}
                                  stroke="rgba(100,120,140,0.1)"
                                  strokeWidth={0.5}
                                />
                              );
                            },
                          )}
                        {isTile &&
                          Array.from(
                            { length: Math.ceil(zone.width / 0.3) + 1 },
                            (_, i) => {
                              const lx = zx + i * 0.3 * SCALE * zoom;
                              if (lx > zx + zw) return null;
                              return (
                                <Line
                                  key={`tv${i}`}
                                  points={[lx, zy, lx, zy + zh]}
                                  stroke="rgba(100,120,140,0.1)"
                                  strokeWidth={0.5}
                                />
                              );
                            },
                          )}
                        {showLabels && (
                          <Text
                            x={zx + zw / 2 - 40}
                            y={zy + zh / 2 - Math.max(4, 5 * zoom)}
                            text={zone.label.toUpperCase()}
                            width={80}
                            fontSize={Math.max(7, 9 * zoom)}
                            fill="rgba(42,42,53,0.3)"
                            fontStyle="bold"
                            align="center"
                            listening={false}
                          />
                        )}
                      </Group>
                    );
                  })}

                  {/* ── Architectural walls — thick outer, thinner partitions ─ */}
                  {room.walls.map(
                    (
                      w: { x1: number; y1: number; x2: number; y2: number; type?: string },
                      i: number,
                    ) => (
                      <Line
                        key={`wall${i}`}
                        points={[
                          w.x1 * SCALE * zoom,
                          w.y1 * SCALE * zoom,
                          w.x2 * SCALE * zoom,
                          w.y2 * SCALE * zoom,
                        ]}
                        stroke={FP.WALL}
                        strokeWidth={
                          w.type === "internal"
                            ? FP.WALL_T_PARTITION * SCALE * zoom
                            : FP.WALL_T_M * SCALE * zoom
                        }
                        lineCap="square"
                        lineJoin="miter"
                        listening={false}
                      />
                    ),
                  )}

                  {/* ── Doors — gap eraser + leaf + swing arc ─────── */}
                  {/* Internal doors are rendered as wall gaps only (wall segments
                      are broken at the opening); ArchDoor is only used for
                      exterior doors whose arc logic assumes outer-wall positions. */}
                  {room.doors
                    .filter(
                      (d: { x: number; y: number; width: number; side?: string; type?: string }) =>
                        d.type !== "internal",
                    )
                    .map(
                      (
                        d: {
                          x: number;
                          y: number;
                          width: number;
                          side?: string;
                          orientation?: "horizontal" | "vertical";
                        },
                        i: number,
                      ) => (
                        <ArchDoor
                          key={`door${i}`}
                          door={d}
                          canvasWidth={canvasWidth}
                          canvasHeight={canvasHeight}
                          zoom={zoom}
                        />
                      ),
                    )}

                  {/* ── Windows — glass fill + centre glazing line ── */}
                  {room.windows.map(
                    (
                      w: {
                        x: number;
                        y: number;
                        width: number;
                        side: string;
                      },
                      i: number,
                    ) => (
                      <ArchWindow
                        key={`win${i}`}
                        window={w}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        zoom={zoom}
                      />
                    ),
                  )}

                  {/* ── Dimension labels ─────────────────────────── */}
                  {showDimensions && (
                    <>
                      <Text
                        x={canvasWidth / 2 - 20}
                        y={canvasHeight + 8}
                        text={`${room.width}m`}
                        fontSize={11 * zoom}
                        fill="var(--color-accent)"
                      />
                      <Text
                        x={canvasWidth + 8}
                        y={canvasHeight / 2 - 6}
                        text={`${room.length}m`}
                        fontSize={11 * zoom}
                        fill="var(--color-accent)"
                        rotation={90}
                      />
                    </>
                  )}
                  {/* ── Rugs drawn first, below all other furniture ─ */}
                  {canvasItems
                    .filter((i) => isRug(i))
                    .map((item) => {
                      const isSelected = selectedItemId === item.id;
                      return (
                        <Group
                          key={item.id}
                          x={item.x * SCALE * zoom}
                          y={item.y * SCALE * zoom}
                          rotation={item.rotation}
                          draggable
                          opacity={itemsVisible.has(item.id) ? 1 : 0}
                          onDragEnd={(e) =>
                            handleDragEnd(
                              item.id,
                              e.target.x(),
                              e.target.y(),
                              e.target,
                            )
                          }
                          onClick={() => setSelectedItemId(item.id)}
                          onTap={() => setSelectedItemId(item.id)}
                        >
                          <FurnitureSymbol
                            name={item.name}
                            category={item.category}
                            color={item.color}
                            pxW={item.width * SCALE * zoom}
                            pxD={item.depth * SCALE * zoom}
                            isSelected={isSelected}
                            showLabel={showLabels}
                            zoom={zoom}
                          />
                        </Group>
                      );
                    })}

                  {/* ── All other furniture ──────────────────────── */}
                  {canvasItems
                    .filter((i) => !isRug(i))
                    .map((item) => {
                      const isSelected = selectedItemId === item.id;
                      return (
                        <Group
                          key={item.id}
                          x={item.x * SCALE * zoom}
                          y={item.y * SCALE * zoom}
                          rotation={item.rotation}
                          draggable
                          opacity={itemsVisible.has(item.id) ? 1 : 0}
                          onDragEnd={(e) =>
                            handleDragEnd(
                              item.id,
                              e.target.x(),
                              e.target.y(),
                              e.target,
                            )
                          }
                          onClick={() => setSelectedItemId(item.id)}
                          onTap={() => setSelectedItemId(item.id)}
                        >
                          <FurnitureSymbol
                            name={item.name}
                            category={item.category}
                            color={item.color}
                            pxW={item.width * SCALE * zoom}
                            pxD={item.depth * SCALE * zoom}
                            isSelected={isSelected}
                            showLabel={showLabels}
                            zoom={zoom}
                          />
                        </Group>
                      );
                    })}
                </Layer>
              </Stage>
            </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontSize: 12,
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="chip" style={{ fontSize: 11 }}>
            Area: {(room.width * room.length).toFixed(1)} m²
          </span>
          <span className="chip" style={{ fontSize: 11 }}>
            Scale: 1:50
          </span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="config-panel right-panel">
        <div
          style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--color-accent)",
              marginBottom: 12,
            }}
          >
            COST ESTIMATE
          </div>
          {canvasItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                marginBottom: 8,
                cursor: "pointer",
              }}
              onClick={() => setSelectedItemId(item.id)}
            >
              <span
                style={{
                  color:
                    selectedItemId === item.id
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                }}
              >
                {item.name}
              </span>
              <span style={{ fontWeight: 600 }}>
                ${item.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{ padding: 16, borderTop: "1px solid var(--color-border)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--color-text-secondary)",
              }}
            >
              TOTAL PROJECT COST
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color:
                  totalCost < preferences.budgetMin
                    ? "var(--color-warning, #f59e0b)"
                    : totalCost <= preferences.budgetMax
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {totalCost < preferences.budgetMin
                ? "⚠ UNDER BUDGET"
                : totalCost <= preferences.budgetMax
                ? "✓ WITHIN BUDGET"
                : "⚠ OVER BUDGET"}
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 8,
            }}
          >
            SGD ${totalCost.toLocaleString()}
          </div>
          <div
            className="progress-bar"
            style={{ marginBottom: 4, height: 6, position: "relative" }}
          >
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (totalCost / preferences.budgetMax) * 100)}%`,
                background:
                  totalCost < preferences.budgetMin
                    ? "var(--color-warning, #f59e0b)"
                    : totalCost <= preferences.budgetMax
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            />
            {/* Min-budget marker tick */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${(preferences.budgetMin / preferences.budgetMax) * 100}%`,
                width: 2,
                height: "100%",
                background: "var(--color-text-secondary)",
                opacity: 0.5,
              }}
            />
          </div>
          {/* Budget range labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--color-text-secondary)",
              marginBottom: 16,
            }}
          >
            <span>Min ${preferences.budgetMin.toLocaleString()}</span>
            <span>Max ${preferences.budgetMax.toLocaleString()}</span>
          </div>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
          >
            Find My Designer <ArrowRight size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Save size={14} /> Save Design
          </button>
        </div>
      </div>
    </div>
  );
}
