'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import { useDesignStore, FurnitureItem } from '@/store/designStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Ruler, Tag,
  RotateCcw, Search, ChevronDown, ChevronUp, ArrowRight, Save, Download, X,
  Image as ImageIcon, Grid
} from 'lucide-react';

const SCALE = 80;
const GRID = 0.25;

export default function ConfiguratorContent() {
  const router = useRouter();
  const {
    generatedDesign, preferences, canvasItems, setCanvasItems,
    updateCanvasItem, removeCanvasItem, addCanvasItem,
    pushHistory, undo, redo, history, historyIndex,
    zoom, setZoom, showDimensions, toggleDimensions, showLabels, toggleLabels,
    selectedItemId, setSelectedItemId, saveDesign, setGeneratedDesign
  } = useDesignStore();

  const [alternatives, setAlternatives] = useState<Array<{id:string;name:string;price:number;width:number;depth:number;color:string;category:string}>>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [fullCatalog, setFullCatalog] = useState<Array<{id:string;name:string;category:string;price:number;width:number;depth:number;color:string;styles:string[]}>>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [itemsVisible, setItemsVisible] = useState<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isRendering3D, setIsRendering3D] = useState(false);

  const room = generatedDesign?.room;
  const totalCost = canvasItems.reduce((s, i) => s + i.price, 0);

  useEffect(() => {
    fetch('/data/furniture-catalog.json').then(r => r.ok ? r.json() : []).then(setFullCatalog).catch(() => {});
  }, []);

  useEffect(() => {
    if (canvasItems.length > 0 && itemsVisible.size === 0) {
      canvasItems.forEach((item, i) => {
        setTimeout(() => setItemsVisible(prev => new Set([...prev, item.id])), i * 100);
      });
    }
  }, [canvasItems, itemsVisible.size]);

  useEffect(() => {
    if (!selectedItemId) { setAlternatives([]); return; }
    const item = canvasItems.find(i => i.id === selectedItemId);
    if (!item) return;
    const style = preferences.styles[0] || 'Scandinavian';
    fetch(`/api/swap-suggestions?itemId=${item.catalogId}&category=${encodeURIComponent(item.category)}&style=${encodeURIComponent(style)}&budgetMax=${preferences.budgetMax}`)
      .then(r => r.json()).then(d => setAlternatives(d.alternatives || [])).catch(() => {});
  }, [selectedItemId, canvasItems, preferences]);

  const handleDragEnd = useCallback((id: string, nodeX: number, nodeY: number, node: any) => {
    if (!room) return;
    
    // Convert from pure pixels back to world meters
    const metersX = nodeX / (SCALE * zoom);
    const metersY = nodeY / (SCALE * zoom);

    // Grid snapping (0.25m)
    let clampedX = Math.round(metersX / GRID) * GRID;
    let clampedY = Math.round(metersY / GRID) * GRID;

    const item = canvasItems.find(i => i.id === id);
    if (!item) return;

    const getAABB = (ix: number, iy: number, w: number, d: number, rot: number) => {
      let r = Math.round(rot) % 360;
      if (r < 0) r += 360;
      if (r === 90) return { x: ix - d, y: iy, w: d, h: w };
      if (r === 180) return { x: ix - w, y: iy - d, w: w, h: d };
      if (r === 270) return { x: ix, y: iy - w, w: d, h: w };
      return { x: ix, y: iy, w: w, h: d };
    };

    let aabb = getAABB(clampedX, clampedY, item.width, item.depth, item.rotation);

    if (aabb.x < 0) clampedX += (0 - aabb.x);
    else if (aabb.x + aabb.w > room.width) clampedX -= (aabb.x + aabb.w - room.width);
    
    aabb = getAABB(clampedX, clampedY, item.width, item.depth, item.rotation);
    if (aabb.y < 0) clampedY += (0 - aabb.y);
    else if (aabb.y + aabb.h > room.length) clampedY -= (aabb.y + aabb.h - room.length);

    aabb = getAABB(clampedX, clampedY, item.width, item.depth, item.rotation);

    const isRug = item.category.toLowerCase().includes('rug');
    let hasOverlap = false;

    // Check collision against all other items
    for (const other of canvasItems) {
      if (other.id === id) continue;
      const otherIsRug = other.category.toLowerCase().includes('rug');
      if (isRug || otherIsRug) continue; // Rugs don't collide with anything

      const oAabb = getAABB(other.x, other.y, other.width, other.depth, other.rotation);
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
        duration: 0.25
      });
      return;
    }

    updateCanvasItem(id, { x: clampedX, y: clampedY });
    pushHistory();
    
    // Lock node layout exactly to snap grid smoothly
    node.x(clampedX * SCALE * zoom);
    node.y(clampedY * SCALE * zoom);
  }, [room, canvasItems, updateCanvasItem, pushHistory, zoom]);

  const handleSwap = (alt: typeof alternatives[0]) => {
    if (!selectedItemId) return;
    updateCanvasItem(selectedItemId, { catalogId: alt.id, name: alt.name, price: alt.price, width: alt.width, depth: alt.depth, color: alt.color });
    pushHistory();
  };

  useEffect(() => {
    if (viewMode === '3d') {
      setIsRendering3D(true);
      const timer = setTimeout(() => setIsRendering3D(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [viewMode, generatedDesign]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences) });
      const data = await res.json();
      setItemsVisible(new Set());
      setGeneratedDesign(data);
      setSelectedItemId(null);
    } catch (err) { console.error(err); }
    setIsRegenerating(false);
  };

  const handleAddFromCatalog = (item: typeof fullCatalog[0]) => {
    if (!room) return;
    const newItem: FurnitureItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      catalogId: item.id, name: item.name, category: item.category,
      price: item.price, width: item.width, depth: item.depth,
      x: room.width / 2 - item.width / 2, y: room.length / 2 - item.depth / 2,
      rotation: 0, color: item.color,
    };
    addCanvasItem(newItem);
    pushHistory();
  };

  const handleSave = () => { saveDesign(); router.push('/design/match'); };

  const handleDownload = () => {
    const data = { preferences, items: canvasItems, totalCost, room };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kairos-design.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = canvasItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FurnitureItem[]>);

  const filteredCatalog = fullCatalog.filter(i =>
    i.styles.some(s => preferences.styles.map(ps => ps.toLowerCase()).includes(s.toLowerCase())) &&
    (catalogSearch === '' || i.name.toLowerCase().includes(catalogSearch.toLowerCase()))
  );
  const catalogCategories = [...new Set(filteredCatalog.map(i => i.category))];

  if (!room || !generatedDesign) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Sparkles size={48} style={{ color: 'var(--color-accent)' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>No design generated yet</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Start the wizard to generate your room layout</p>
        <button onClick={() => router.push('/design/wizard')} className="btn-primary" style={{ marginTop: 16 }}>Go to Wizard</button>
      </div>
    );
  }

  const canvasWidth = room.width * SCALE * zoom;
  const canvasHeight = room.length * SCALE * zoom;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--color-bg)' }}>
      <AnimatePresence>
        {isRegenerating && (
          <motion.div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Sparkles style={{ color: 'var(--color-accent)', animation: 'spin 2s linear infinite' }} size={24} /> <span style={{ fontSize: 16 }}>Regenerating layout...</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <div style={{ width: 280, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#fff', flexShrink: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: 10 }}>YOUR PREFERENCES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {preferences.styles.map(s => <span key={s} className="chip chip-accent" style={{ fontSize: 12 }}>{s}</span>)}
            <span className="chip" style={{ fontSize: 12, textTransform: 'capitalize' }}>{preferences.colorTone}</span>
          </div>
          <button onClick={handleRegenerate} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}>
            <Sparkles size={14} /> Regenerate
          </button>
        </div>

        {selectedItemId && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: 10 }}>SWAP ALTERNATIVES</div>
            {(() => {
              const sel = canvasItems.find(i => i.id === selectedItemId);
              return sel ? (
                <div className="card" style={{ padding: 12, marginBottom: 10, borderColor: 'var(--color-accent)', background: 'var(--color-accent-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: sel.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sel.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-accent)' }}>SGD ${sel.price}</div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            {alternatives.length === 0 ? <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No alternatives found</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alternatives.map(alt => (
                  <div key={alt.id} className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: alt.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>SGD ${alt.price}</div>
                    </div>
                    <button onClick={() => handleSwap(alt)} className="btn-primary" style={{ padding: '4px 12px', fontSize: 11, borderRadius: 8 }}>SWAP</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: 10 }}>ADD MORE ITEMS</div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Search catalog..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 13, background: 'var(--color-bg)', border: '1px solid var(--color-border)', outline: 'none', color: 'var(--color-text)' }} />
          </div>
          {catalogCategories.map(cat => (
            <div key={cat}>
              <button onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                {cat} ({filteredCatalog.filter(i => i.category === cat).length})
                {expandedCategory === cat ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expandedCategory === cat && filteredCatalog.filter(i => i.category === cat).map(item => (
                <button key={item.id} onClick={() => handleAddFromCatalog(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, width: '100%', cursor: 'pointer', background: 'none', border: 'none', transition: 'background 0.15s', textAlign: 'left' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: item.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>${item.price}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER CANVAS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }} ref={stageRef}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--color-border)', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg)', borderRadius: 10, padding: 4 }}>
            <button onClick={() => setViewMode('2d')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: viewMode === '2d' ? '#fff' : 'transparent', color: viewMode === '2d' ? 'var(--color-text)' : 'var(--color-text-secondary)', boxShadow: viewMode === '2d' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}>
              <Grid size={16} /> 2D Blueprint
            </button>
            <button onClick={() => setViewMode('3d')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: viewMode === '3d' ? '#fff' : 'transparent', color: viewMode === '3d' ? 'var(--color-text)' : 'var(--color-text-secondary)', boxShadow: viewMode === '3d' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}>
              <ImageIcon size={16} /> 3D Render
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleRegenerate} title="Regenerate" style={{ padding: 8, borderRadius: 8, background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
              <Sparkles size={14} /> Regenerate
            </button>
          <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', opacity: historyIndex <= 0 ? 0.3 : 1 }}><Undo2 size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', opacity: historyIndex >= history.length - 1 ? 0.3 : 1 }}><Redo2 size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
          <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
          <button onClick={() => setZoom(zoom + 0.1)} title="Zoom In" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}><ZoomIn size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
          <button onClick={() => setZoom(zoom - 0.1)} title="Zoom Out" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}><ZoomOut size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
          {selectedItemId && (
            <>
              <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
              <button onClick={() => { removeCanvasItem(selectedItemId); setSelectedItemId(null); pushHistory(); }} title="Delete" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={18} style={{ color: 'var(--color-danger)' }} /></button>
              <button onClick={() => { const item = canvasItems.find(i => i.id === selectedItemId); if (item) { updateCanvasItem(selectedItemId, { rotation: (item.rotation + 90) % 360 }); pushHistory(); } }} title="Rotate" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}><RotateCcw size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
            </>
          )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--color-bg)' }}>
          {viewMode === '3d' ? (
            <div style={{ width: '100%', height: '100%', maxWidth: 900, maxHeight: 600, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', position: 'relative', border: '1px solid var(--color-border)' }}>
              {isRendering3D ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', zIndex: 10 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }} style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                    Generating Photorealistic Render...
                  </motion.div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Applying {preferences.styles[0] || 'Scandinavian'} style patterns</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img
                    src={`/images/styles/${(preferences.styles[0] || 'Scandinavian').toLowerCase().replace(/\s+/g, '-')}.png`}
                    alt="Realistic 3D Render"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-sm)' }}>
                    <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.05em' }}>AI GENERATED RENDER</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 2 }}>APPLIED STYLE</div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{preferences.styles[0] || 'Scandinavian'}</span>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--color-border)', padding: 4 }}>
            <Stage width={canvasWidth} height={canvasHeight} onClick={(e) => { if (e.target === e.target.getStage()) setSelectedItemId(null); }}>
              <Layer>
                <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#ffffff" cornerRadius={8} shadowColor="rgba(0,0,0,0.06)" shadowBlur={24} shadowOffsetY={12} stroke="rgba(0,0,0,0.04)" strokeWidth={2} />
                {Array.from({ length: Math.ceil(room.width / GRID) + 1 }).map((_, i) => (
                  <Line key={`gv${i}`} points={[i * GRID * SCALE * zoom, 0, i * GRID * SCALE * zoom, canvasHeight]} stroke="rgba(0,0,0,0.03)" strokeWidth={1} />
                ))}
                {Array.from({ length: Math.ceil(room.length / GRID) + 1 }).map((_, i) => (
                  <Line key={`gh${i}`} points={[0, i * GRID * SCALE * zoom, canvasWidth, i * GRID * SCALE * zoom]} stroke="rgba(0,0,0,0.03)" strokeWidth={1} />
                ))}
                {room.walls.map((w: {x1:number;y1:number;x2:number;y2:number}, i: number) => (
                  <Line key={`wall${i}`} points={[w.x1*SCALE*zoom, w.y1*SCALE*zoom, w.x2*SCALE*zoom, w.y2*SCALE*zoom]} stroke="#2a2a35" strokeWidth={Math.max(4, 6*zoom)} lineCap="round" />
                ))}
                {room.doors.map((d: {x:number;y:number;width:number;side:string}, i: number) => (
                  <Group key={`door${i}`}>
                    <Rect x={d.x*SCALE*zoom-d.width*SCALE*zoom/2} y={d.y*SCALE*zoom-4} width={d.width*SCALE*zoom} height={8} fill="#4ade80" cornerRadius={2} opacity={0.7} />
                    {showLabels && <Text x={d.x*SCALE*zoom-10} y={d.y*SCALE*zoom+(d.side==='bottom'?10:-18)} text="Door" fontSize={9*zoom} fill="#4ade80" />}
                  </Group>
                ))}
                {room.windows.map((w: {x:number;y:number;width:number;side:string}, i: number) => (
                  <Group key={`win${i}`}>
                    <Line points={ w.side==='right' ? [w.x*SCALE*zoom,w.y*SCALE*zoom,w.x*SCALE*zoom,(w.y+w.width)*SCALE*zoom] : [w.x*SCALE*zoom,w.y*SCALE*zoom,(w.x+w.width)*SCALE*zoom,w.y*SCALE*zoom] } stroke="#4a8fd4" strokeWidth={4} opacity={0.6} />
                    {showLabels && <Text x={w.x*SCALE*zoom} y={w.y*SCALE*zoom+(w.side==='top'?-14:6)} text="WINDOW" fontSize={9*zoom} fill="#4a8fd4" fontStyle="bold" />}
                  </Group>
                ))}
                {showDimensions && (
                  <>
                    <Text x={canvasWidth/2-20} y={canvasHeight+8} text={`${room.width}m`} fontSize={11*zoom} fill="var(--color-accent)" />
                    <Text x={canvasWidth+8} y={canvasHeight/2-6} text={`${room.length}m`} fontSize={11*zoom} fill="var(--color-accent)" rotation={90} />
                  </>
                )}
                {/* First draw rugs */}
                {canvasItems.filter(i => i.category.toLowerCase().includes('rug')).map((item) => {
                  const isSelected = selectedItemId===item.id;
                  return (
                    <Group key={item.id} x={item.x*SCALE*zoom} y={item.y*SCALE*zoom} rotation={item.rotation} draggable
                      opacity={itemsVisible.has(item.id)?1:0}
                      onDragEnd={(e) => handleDragEnd(item.id, e.target.x(), e.target.y(), e.target)}
                      onClick={() => setSelectedItemId(item.id)} onTap={() => setSelectedItemId(item.id)}>
                      <Rect width={item.width*SCALE*zoom} height={item.depth*SCALE*zoom}
                        fill={item.color} cornerRadius={6*zoom}
                        stroke={isSelected?'#c4a265':'rgba(0,0,0,0.1)'}
                        strokeWidth={isSelected?2:1}
                        shadowColor={isSelected?'rgba(196,162,101,0.5)':'rgba(0,0,0,0.2)'}
                        shadowBlur={isSelected?16:8} shadowOffsetY={isSelected?0:4} />
                      <Rect x={4*zoom} y={4*zoom} width={item.width*SCALE*zoom-8*zoom} height={item.depth*SCALE*zoom-8*zoom}
                        fill="rgba(255,255,255,0.15)" cornerRadius={4*zoom} />
                      
                      <Rect x={4*zoom} y={item.depth*SCALE*zoom/2 - (showLabels ? 12*zoom : 8*zoom)} width={item.width*SCALE*zoom-8*zoom} height={showLabels ? 24*zoom : 16*zoom} fill="rgba(255,255,255,0.9)" cornerRadius={12*zoom} shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2} />
                      <Text text={item.name.toUpperCase()} x={8*zoom} y={item.depth*SCALE*zoom/2 - (showLabels ? 8*zoom : 4*zoom)}
                        width={item.width*SCALE*zoom-16*zoom}
                        fontSize={Math.max(5, 7*zoom)} fill="#1a1a2e" fontStyle="bold" align="center"
                        ellipsis wrap="none" />
                      {showLabels && (
                        <Text text={`$${item.price}`} x={8*zoom} y={item.depth*SCALE*zoom/2 + 2*zoom}
                          width={item.width*SCALE*zoom-16*zoom}
                          fontSize={Math.max(4, 6*zoom)} fill="var(--color-text-secondary)" align="center" />
                      )}
                    </Group>
                  );
                })}
                
                {/* Then draw everything else */}
                {canvasItems.filter(i => !i.category.toLowerCase().includes('rug')).map((item) => {
                  const isSelected = selectedItemId===item.id;
                  return (
                    <Group key={item.id} x={item.x*SCALE*zoom} y={item.y*SCALE*zoom} rotation={item.rotation} draggable
                      opacity={itemsVisible.has(item.id)?1:0}
                      onDragEnd={(e) => handleDragEnd(item.id, e.target.x(), e.target.y(), e.target)}
                      onClick={() => setSelectedItemId(item.id)} onTap={() => setSelectedItemId(item.id)}>
                      <Rect width={item.width*SCALE*zoom} height={item.depth*SCALE*zoom}
                        fill={item.color} cornerRadius={6*zoom}
                        stroke={isSelected?'#c4a265':'rgba(0,0,0,0.1)'}
                        strokeWidth={isSelected?2:1}
                        shadowColor={isSelected?'rgba(196,162,101,0.5)':'rgba(0,0,0,0.2)'}
                        shadowBlur={isSelected?16:8} shadowOffsetY={isSelected?0:4} />
                      <Rect x={4*zoom} y={4*zoom} width={item.width*SCALE*zoom-8*zoom} height={item.depth*SCALE*zoom-8*zoom}
                        fill="rgba(255,255,255,0.15)" cornerRadius={4*zoom} />
                      
                      <Rect x={4*zoom} y={item.depth*SCALE*zoom/2 - (showLabels ? 12*zoom : 8*zoom)} width={item.width*SCALE*zoom-8*zoom} height={showLabels ? 24*zoom : 16*zoom} fill="rgba(255,255,255,0.9)" cornerRadius={12*zoom} shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffsetY={2} />
                      <Text text={item.name.toUpperCase()} x={8*zoom} y={item.depth*SCALE*zoom/2 - (showLabels ? 8*zoom : 4*zoom)}
                        width={item.width*SCALE*zoom-16*zoom}
                        fontSize={Math.max(5, 7*zoom)} fill="#1a1a2e" fontStyle="bold" align="center"
                        ellipsis wrap="none" />
                      {showLabels && (
                        <Text text={`$${item.price}`} x={8*zoom} y={item.depth*SCALE*zoom/2 + 2*zoom}
                          width={item.width*SCALE*zoom-16*zoom}
                          fontSize={Math.max(4, 6*zoom)} fill="var(--color-text-secondary)" align="center" />
                      )}
                    </Group>
                  );
                })}
              </Layer>
            </Stage>
          </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--color-border)', background: '#fff', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <span className="chip" style={{ fontSize: 11 }}>Area: {(room.width * room.length).toFixed(1)} m²</span>
          <span className="chip" style={{ fontSize: 11 }}>Scale: 1:50</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 280, borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#fff', flexShrink: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: 12 }}>COST ESTIMATE</div>
          {canvasItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => setSelectedItemId(item.id)}>
              <span style={{ color: selectedItemId===item.id ? 'var(--color-accent)' : 'var(--color-text)' }}>{item.name}</span>
              <span style={{ fontWeight: 600 }}>${item.price.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>TOTAL PROJECT COST</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: totalCost <= preferences.budgetMax ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {totalCost <= preferences.budgetMax ? '✓ WITHIN BUDGET' : '⚠ OVER BUDGET'}
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>SGD ${totalCost.toLocaleString()}</div>
          <div className="progress-bar" style={{ marginBottom: 20, height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, (totalCost / preferences.budgetMax) * 100)}%`, background: totalCost <= preferences.budgetMax ? 'var(--color-success)' : 'var(--color-danger)' }} />
          </div>
          <button onClick={handleSave} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
            Find My Designer <ArrowRight size={14} />
          </button>
          <button onClick={handleDownload} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <Save size={14} /> Save Design
          </button>
        </div>
      </div>
    </div>
  );
}
