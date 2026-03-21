"use client";
import React, { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureItem, RoomData } from "@/store/designStore";
import { getModelPath } from "@/lib/modelRegistry";

// ── Furniture classification ────────────────────────────────────────────────

type FurnitureClass =
  | "sofa" | "armchair" | "bed" | "wardrobe" | "side-table"
  | "coffee-table" | "dining-table" | "dining-chair"
  | "rug" | "tv-console" | "cabinet" | "desk"
  | "lamp" | "plant" | "decor" | "generic";

function classifyFurniture(item: FurnitureItem): FurnitureClass {
  const n = item.name.toLowerCase();
  const c = item.category;
  if (n.includes("sofa") || n.includes("loveseat") || n.includes("sectional")) return "sofa";
  if (n.includes("armchair") || n.includes("accent chair")) return "armchair";
  if (c === "Bedroom" && (n.includes("bed") || n.includes("mattress"))) return "bed";
  if (n.includes("wardrobe") || n.includes("closet")) return "wardrobe";
  if (n.includes("nightstand") || n.includes("side table") || n.includes("end table")) return "side-table";
  if (n.includes("coffee") || n.includes("wabi") || n.includes("boomerang") || n.includes("low table")) return "coffee-table";
  if (c === "Dining" && n.includes("table")) return "dining-table";
  if (c === "Dining" && n.includes("chair")) return "dining-chair";
  if (n.includes("rug") || n.includes(" mat")) return "rug";
  if (n.includes("tv") || n.includes("console") || n.includes("media")) return "tv-console";
  if (c === "Storage") return "cabinet";
  if (c === "Workspace") return "desk";
  if (c === "Lighting") return "lamp";
  if (n.includes("plant") || n.includes("fern") || n.includes("monstera")) return "plant";
  if (c === "Decor") return "decor";
  return "generic";
}

// ── Material helpers ────────────────────────────────────────────────────────

function woodMat(color = "#C4A878"): React.ReactElement {
  return <meshStandardMaterial color={color} roughness={0.85} metalness={0} />;
}
function fabricMat(color = "#C8B4A0"): React.ReactElement {
  return <meshStandardMaterial color={color} roughness={0.9} metalness={0} />;
}
function metalMat(color = "#8C8C8C"): React.ReactElement {
  return <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />;
}

// ── Category-aware fallback geometry ───────────────────────────────────────
// All dimensions are derived from item.width / item.depth (real metres).
// The group is positioned with its base at y=0 (floor level) by the parent.

function SofaFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const seatH = 0.44;
  const backH = 0.38;
  const armW = Math.min(0.12, W * 0.07);
  const seatD = D * 0.58;
  return (
    <group>
      {/* seat cushion */}
      <mesh position={[0, seatH / 2, D * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[W, seatH, seatD]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, seatH + backH / 2, -(D / 2 - 0.07)]} castShadow receiveShadow>
        <boxGeometry args={[W, backH, 0.13]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* left arm */}
      <mesh position={[-(W / 2 - armW / 2), seatH * 0.65, D * 0.05]} castShadow receiveShadow>
        <boxGeometry args={[armW, seatH * 0.6, seatD * 0.9]} />
        {fabricMat(color)}
      </mesh>
      {/* right arm */}
      <mesh position={[W / 2 - armW / 2, seatH * 0.65, D * 0.05]} castShadow receiveShadow>
        <boxGeometry args={[armW, seatH * 0.6, seatD * 0.9]} />
        {fabricMat(color)}
      </mesh>
      {/* legs */}
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * (W / 2 - 0.06), 0.04, sz * (seatD / 2 - 0.06) + D * 0.08]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.025, 0.08, 6]} />
            {woodMat("#5C4A35")}
          </mesh>
        )),
      )}
    </group>
  );
}

function ArmchairFallback({ W, D, color }: { W: number; D: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, D * 0.06]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.44, D * 0.6]} />
        {fabricMat(color)}
      </mesh>
      <mesh position={[0, 0.58, -(D / 2 - 0.08)]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.35, 0.12]} />
        {fabricMat(color)}
      </mesh>
    </group>
  );
}

function BedFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const frameH = 0.22;
  const mattressH = 0.18;
  const headH = 0.65;
  const headZ = -(D / 2 - 0.05);
  return (
    <group>
      {/* frame */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, frameH, D]} />
        {woodMat("#7A5C3A")}
      </mesh>
      {/* mattress */}
      <mesh position={[0, frameH + mattressH / 2, D * 0.02]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.92, mattressH, D * 0.88]} />
        <meshStandardMaterial color="#F0EBE3" roughness={0.95} metalness={0} />
      </mesh>
      {/* headboard */}
      <mesh position={[0, frameH + headH / 2, headZ]} castShadow receiveShadow>
        <boxGeometry args={[W, headH, 0.1]} />
        {woodMat("#7A5C3A")}
      </mesh>
      {/* pillows */}
      {[-0.28, 0.28].map((px) => (
        <mesh key={px} position={[px * W, frameH + mattressH + 0.06, headZ + 0.28]} castShadow>
          <boxGeometry args={[W * 0.38, 0.09, 0.5]} />
          <meshStandardMaterial color="#FAFAFA" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTableFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const tableH = 0.42;
  const topH = 0.05;
  const legH = tableH - topH;
  const legR = 0.025;
  return (
    <group>
      <mesh position={[0, tableH - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, topH, D]} />
        {woodMat(color)}
      </mesh>
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.06), legH / 2, sz * (D / 2 - 0.06)]} castShadow>
            <cylinderGeometry args={[legR, legR * 1.1, legH, 8]} />
            {metalMat(color)}
          </mesh>
        )),
      )}
    </group>
  );
}

function DiningTableFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const tableH = 0.75;
  const topH = 0.06;
  return (
    <group>
      <mesh position={[0, tableH - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, topH, D]} />
        {woodMat(color)}
      </mesh>
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.07), (tableH - topH) / 2, sz * (D / 2 - 0.07)]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, tableH - topH, 8]} />
            {woodMat("#5C4030")}
          </mesh>
        )),
      )}
    </group>
  );
}

function DiningChairFallback({ W, D, color }: { W: number; D: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, D * 0.05]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.04, D * 0.85]} />
        {woodMat(color)}
      </mesh>
      <mesh position={[0, 0.47, -(D / 2 - 0.05)]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.36, 0.04]} />
        {woodMat(color)}
      </mesh>
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.04), 0.2 / 2, sz * (D / 2 * 0.8)]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
            {woodMat("#5C4030")}
          </mesh>
        )),
      )}
    </group>
  );
}

function WardrobeFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const H = 2.1;
  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {woodMat(color)}
      </mesh>
      {/* centre divider */}
      <mesh position={[0, H / 2, D / 2 + 0.005]} receiveShadow>
        <boxGeometry args={[0.012, H * 0.95, 0.01]} />
        {woodMat("#4A3828")}
      </mesh>
      {/* handles */}
      {[-0.12, 0.12].map((hx) => (
        <mesh key={hx} position={[hx, H * 0.48, D / 2 + 0.015]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          {metalMat()}
        </mesh>
      ))}
    </group>
  );
}

function TVConsoleFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const H = 0.48;
  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {woodMat(color)}
      </mesh>
      {/* door panels */}
      {[-0.25, 0, 0.25].map((dx, i) => (
        <mesh key={i} position={[dx * W, H * 0.48, D / 2 + 0.005]}>
          <boxGeometry args={[W * 0.28, H * 0.75, 0.01]} />
          {woodMat("#9C7E56")}
        </mesh>
      ))}
      {/* legs */}
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.08), 0.04, sz * (D / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
            {metalMat()}
          </mesh>
        )),
      )}
    </group>
  );
}

function CabinetFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const H = 1.1;
  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {woodMat(color)}
      </mesh>
      <mesh position={[0, H * 0.5, D / 2 + 0.003]}>
        <boxGeometry args={[W * 0.88, H * 0.88, 0.008]} />
        {woodMat("#B89A6A")}
      </mesh>
    </group>
  );
}

function DeskFallback({ W, D, color }: { W: number; D: number; color: string }) {
  const desktopH = 0.75;
  const topThick = 0.04;
  return (
    <group>
      <mesh position={[0, desktopH - topThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, topThick, D]} />
        {woodMat(color)}
      </mesh>
      {/* two side panels */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (W / 2 - 0.025), desktopH / 2 - topThick, 0]} castShadow>
          <boxGeometry args={[0.04, desktopH - topThick, D * 0.9]} />
          {woodMat(color)}
        </mesh>
      ))}
    </group>
  );
}

function SideTableFallback({ W, D, color }: { W: number; D: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.57, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.04, D]} />
        {woodMat(color)}
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.9, 0.04, D * 0.9]} />
        {woodMat(color)}
      </mesh>
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.04), 0.27, sz * (D / 2 - 0.04)]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.54, 8]} />
            {metalMat()}
          </mesh>
        )),
      )}
    </group>
  );
}

function LampFallback({ W }: { W: number }) {
  const R = Math.min(W, 0.15) / 2;
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.5, 8]} />
        {metalMat("#B0A090")}
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[R * 0.8, R, 0.3, 12]} />
        <meshStandardMaterial color="#F5EFE6" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
        {metalMat()}
      </mesh>
    </group>
  );
}

function PlantFallback({ W }: { W: number }) {
  const potR = Math.min(W, 0.28) / 2;
  return (
    <group>
      <mesh position={[0, potR * 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[potR * 0.7, potR * 0.55, potR * 1.6, 10]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      <mesh position={[0, potR * 1.9, 0]} castShadow>
        <sphereGeometry args={[potR * 1.2, 10, 8]} />
        <meshStandardMaterial color="#2D5A27" roughness={1} />
      </mesh>
    </group>
  );
}

function RugFallback({ W, D, color }: { W: number; D: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
      <planeGeometry args={[W, D]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DecorFallback({ W, color }: { W: number; color: string }) {
  return (
    <mesh position={[0, W / 2, 0]} castShadow>
      <octahedronGeometry args={[W / 2, 0]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  );
}

function GenericFallback({ W, D, color }: { W: number; D: number; color: string }) {
  return (
    <mesh position={[0, D * 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[W, D * 0.8, D]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
    </mesh>
  );
}

// ── Dispatch ────────────────────────────────────────────────────────────────

function FurnitureFallback({
  item,
}: {
  item: FurnitureItem;
}) {
  const cls = classifyFurniture(item);
  const W = Math.max(item.width, 0.2);
  const D = Math.max(item.depth, 0.2);

  // Map item.color name to a hex string
  const colorMap: Record<string, string> = {
    beige: "#D4B896", brown: "#8B7355", walnut: "#7A5C3A",
    white: "#F2EDE6", black: "#2A2A2A", gray: "#9A9080",
    charcoal: "#4A4440", blue: "#5A7DA0", green: "#4A6B4A",
    green_light: "#6B8B5A", teal: "#4A7B78", orange: "#C4724A",
    terracotta: "#B85A3A", pink: "#C49080", navy: "#2A3D60",
  };
  const color = colorMap[item.color?.toLowerCase() ?? ""] ?? "#C4A878";

  switch (cls) {
    case "sofa":        return <SofaFallback W={W} D={D} color={color} />;
    case "armchair":    return <ArmchairFallback W={W} D={D} color={color} />;
    case "bed":         return <BedFallback W={W} D={D} color={color} />;
    case "wardrobe":    return <WardrobeFallback W={W} D={D} color={color} />;
    case "side-table":  return <SideTableFallback W={W} D={D} color={color} />;
    case "coffee-table": return <CoffeeTableFallback W={W} D={D} color={color} />;
    case "dining-table": return <DiningTableFallback W={W} D={D} color={color} />;
    case "dining-chair": return <DiningChairFallback W={W} D={D} color={color} />;
    case "rug":         return <RugFallback W={W} D={D} color={color} />;
    case "tv-console":  return <TVConsoleFallback W={W} D={D} color={color} />;
    case "cabinet":     return <CabinetFallback W={W} D={D} color={color} />;
    case "desk":        return <DeskFallback W={W} D={D} color={color} />;
    case "lamp":        return <LampFallback W={W} />;
    case "plant":       return <PlantFallback W={W} />;
    case "decor":       return <DecorFallback W={W} color={color} />;
    default:            return <GenericFallback W={W} D={D} color={color} />;
  }
}

// ── GLB loader (inner — only mounted when a path is known) ──────────────────

function GLBMesh({
  path,
  item,
}: {
  path: string;
  item: FurnitureItem;
}) {
  const { scene } = useGLTF(path);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  // Scale the loaded model to match item footprint (preserve Y proportion)
  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.x < 0.001 || size.z < 0.001) return new THREE.Vector3(1, 1, 1);
    const sx = item.width / size.x;
    const sz = item.depth / size.z;
    const uniform = Math.min(sx, sz);
    return new THREE.Vector3(uniform, uniform, uniform);
  }, [cloned, item.width, item.depth]);

  // Lift model so its bottom sits exactly on y=0
  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    return -box.min.y * scale.y;
  }, [cloned, scale]);

  return <primitive object={cloned} scale={scale} position={[0, yOffset, 0]} />;
}

// ── Error boundary (catches 404s from useGLTF) ──────────────────────────────

interface EBState { error: boolean }
class ModelLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; modelPath: string },
  EBState
> {
  state: EBState = { error: false };
  static getDerivedStateFromError(): EBState { return { error: true }; }
  componentDidCatch(error: Error) {
    console.warn(
      `[FurnitureModel] Could not load model "${this.props.modelPath}". ` +
      `Using fallback geometry. (${error.message})`,
    );
  }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

interface FurnitureModelProps {
  item: FurnitureItem;
  room: RoomData;
}

/**
 * Renders one furniture item at the correct 3D position derived from the
 * 2D floor plan. Tries to load a .glb model first; falls back to
 * category-aware geometry if no model is registered or the file is missing.
 *
 * Coordinate mapping:
 *   2D x  (metres from left)   → 3D +X
 *   2D y  (metres from top)    → 3D +Z
 *   item sits with its base at 3D y = 0 (the floor)
 */
export function FurnitureModel({ item, room }: FurnitureModelProps) {
  // Centre the 2D room at the 3D world origin
  const x3d = (item.x + item.width / 2) - room.width / 2;
  const z3d = (item.y + item.depth / 2) - room.length / 2;
  // 2D rotation is clockwise degrees; Three.js Y rotation is counter-clockwise radians
  const rotY = -(item.rotation * Math.PI) / 180;

  const modelPath = getModelPath(item);
  const fallback = <FurnitureFallback item={item} />;

  return (
    <group position={[x3d, 0, z3d]} rotation={[0, rotY, 0]}>
      {modelPath ? (
        <ModelLoadBoundary fallback={fallback} modelPath={modelPath}>
          <Suspense fallback={fallback}>
            <GLBMesh path={modelPath} item={item} />
          </Suspense>
        </ModelLoadBoundary>
      ) : (
        fallback
      )}
    </group>
  );
}
