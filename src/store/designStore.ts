'use client';
import { create } from 'zustand';

export interface WizardPreferences {
  flatType: string;
  roomType: string;
  styles: string[];
  colorTone: string;
  priorities: string[];
  budgetMin: number;
  budgetMax: number;
  inspirationStyle: string | null;
}

export interface FurnitureItem {
  catalogId: string;
  name: string;
  category: string;
  price: number;
  width: number;
  depth: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  id: string; // unique placement id
  /** When set, item was placed in this zone of a multi-room layout */
  spaceId?: string;
}

export interface FloorSpace {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  length: number;
  floor: "wood" | "tile";
}

export interface RoomData {
  width: number;
  length: number;
  walls: { x1: number; y1: number; x2: number; y2: number }[];
  doors: {
    x: number;
    y: number;
    width: number;
    side?: string;
    orientation?: "horizontal" | "vertical";
  }[];
  windows: { x: number; y: number; width: number; side: string }[];
  /** Multi-room apartment metadata */
  layoutId?: string;
  spaces?: FloorSpace[];
}

export interface GeneratedDesign {
  room: RoomData;
  items: FurnitureItem[];
  totalCost: number;
  averageCost: number;
  styleApplied: string;
  colorPalette: string[];
}

interface DesignState {
  // Wizard
  wizardStep: number;
  preferences: WizardPreferences;
  setWizardStep: (step: number) => void;
  updatePreferences: (partial: Partial<WizardPreferences>) => void;
  resetWizard: () => void;

  // Generated design
  generatedDesign: GeneratedDesign | null;
  setGeneratedDesign: (design: GeneratedDesign) => void;

  // Canvas state
  canvasItems: FurnitureItem[];
  setCanvasItems: (items: FurnitureItem[]) => void;
  updateCanvasItem: (id: string, updates: Partial<FurnitureItem>) => void;
  removeCanvasItem: (id: string) => void;
  addCanvasItem: (item: FurnitureItem) => void;

  // Undo/Redo
  history: FurnitureItem[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Canvas view
  zoom: number;
  setZoom: (z: number) => void;
  showDimensions: boolean;
  toggleDimensions: () => void;
  showLabels: boolean;
  toggleLabels: () => void;

  // Selected item on canvas
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;

  // Saved design for match page
  savedDesign: { preferences: WizardPreferences; design: GeneratedDesign; canvasItems: FurnitureItem[] } | null;
  saveDesign: () => void;
}

const defaultPreferences: WizardPreferences = {
  flatType: '',
  roomType: '',
  styles: [],
  colorTone: '',
  priorities: [],
  budgetMin: 10000,
  budgetMax: 20000,
  inspirationStyle: null,
};

export const useDesignStore = create<DesignState>((set, get) => ({
  wizardStep: 0,
  preferences: { ...defaultPreferences },
  setWizardStep: (step) => set({ wizardStep: step }),
  updatePreferences: (partial) =>
    set((s) => ({ preferences: { ...s.preferences, ...partial } })),
  resetWizard: () => set({ wizardStep: 0, preferences: { ...defaultPreferences } }),

  generatedDesign: null,
  setGeneratedDesign: (design) =>
    set({
      generatedDesign: design,
      canvasItems: design.items.map((item, i) => ({ ...item, id: item.id || `item-${i}` })),
      history: [design.items.map((item, i) => ({ ...item, id: item.id || `item-${i}` }))],
      historyIndex: 0,
    }),

  canvasItems: [],
  setCanvasItems: (items) => set({ canvasItems: items }),
  updateCanvasItem: (id, updates) =>
    set((s) => ({
      canvasItems: s.canvasItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeCanvasItem: (id) =>
    set((s) => ({
      canvasItems: s.canvasItems.filter((item) => item.id !== id),
    })),
  addCanvasItem: (item) =>
    set((s) => ({ canvasItems: [...s.canvasItems, item] })),

  history: [],
  historyIndex: -1,
  pushHistory: () =>
    set((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push([...s.canvasItems]);
      if (newHistory.length > 30) newHistory.shift();
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    }),
  undo: () =>
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      return { historyIndex: newIndex, canvasItems: [...s.history[newIndex]] };
    }),
  redo: () =>
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      return { historyIndex: newIndex, canvasItems: [...s.history[newIndex]] };
    }),

  zoom: 1,
  setZoom: (z) => set({ zoom: Math.max(0.3, Math.min(2.5, z)) }),
  showDimensions: true,
  toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),
  showLabels: true,
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),

  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),

  savedDesign: null,
  saveDesign: () =>
    set((s) => ({
      savedDesign: s.generatedDesign
        ? { preferences: { ...s.preferences }, design: { ...s.generatedDesign }, canvasItems: [...s.canvasItems] }
        : null,
    })),
}));
