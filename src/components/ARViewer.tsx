"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useDesignStore, type GeneratedDesign, type RoomData } from "@/store/designStore";
import { FurnitureModel } from "@/components/FurnitureModel";
import { getAllRegisteredPaths } from "@/lib/modelRegistry";

// Pre-fetch any registered models in the background so they are ready
// before the user switches to the 3D tab. Has no effect when the list is empty.
getAllRegisteredPaths().forEach((path) => useGLTF.preload(path));

// ── Constants ───────────────────────────────────────────────────────────────

const WALL_HEIGHT = 2.8;
const WALL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#F0EBE3",
  roughness: 0.88,
  metalness: 0,
});
const PARTITION_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#F5F0EA",
  roughness: 0.88,
  metalness: 0,
});

// ── Room shell helpers ──────────────────────────────────────────────────────

/** Extrudes a single 2D wall segment into a 3D box, centred in world space. */
function WallSegment({
  wall,
  room,
}: {
  wall: { x1: number; y1: number; x2: number; y2: number; type?: string };
  room: RoomData;
}) {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const segLen = Math.sqrt(dx * dx + dy * dy);
  if (segLen < 0.01) return null;

  const isInternal = wall.type === "internal";
  const thickness = isInternal ? 0.09 : 0.15;
  const height = isInternal ? WALL_HEIGHT : WALL_HEIGHT;

  // Midpoint in world space (2D origin top-left → world origin at room centre)
  const mx = (wall.x1 + wall.x2) / 2 - room.width / 2;
  const mz = (wall.y1 + wall.y2) / 2 - room.length / 2;

  // Rotation: BoxGeometry length axis is world-X by default.
  // We rotate around Y so the box aligns with the wall direction.
  // 2D angle: atan2(dy, dx) in screen coords (x→right, y→down)
  // Three.js: positive Y rotation turns X toward -Z.
  const rotY = -Math.atan2(dy, dx);

  return (
    <mesh
      position={[mx, height / 2, mz]}
      rotation={[0, rotY, 0]}
      castShadow
      receiveShadow
      material={isInternal ? PARTITION_MATERIAL : WALL_MATERIAL}
    >
      <boxGeometry args={[segLen, height, thickness]} />
    </mesh>
  );
}

/** Floor plane — single material, or zone-aware if spaces are present. */
function Floor({ room }: { room: RoomData }) {
  // Full floor background
  return (
    <group>
      {/* base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[room.width, room.length]} />
        <meshStandardMaterial color="#E8E0D4" roughness={0.9} metalness={0} />
      </mesh>

      {/* per-zone material overlay */}
      {room.spaces?.map((zone) => {
        const zx = zone.x + zone.width / 2 - room.width / 2;
        const zz = zone.y + zone.length / 2 - room.length / 2;
        return (
          <mesh
            key={zone.id}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[zx, 0.001, zz]}
            receiveShadow
          >
            <planeGeometry args={[zone.width, zone.length]} />
            <meshStandardMaterial
              color={zone.floor === "tile" ? "#D8D0C8" : "#C8B898"}
              roughness={zone.floor === "tile" ? 0.4 : 0.95}
              metalness={zone.floor === "tile" ? 0.05 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Ceiling plane — slightly warm off-white. */
function Ceiling({ room }: { room: RoomData }) {
  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, WALL_HEIGHT, 0]}
      receiveShadow
    >
      <planeGeometry args={[room.width + 0.3, room.length + 0.3]} />
      <meshStandardMaterial color="#FAFAF8" roughness={0.9} metalness={0} side={THREE.BackSide} />
    </mesh>
  );
}

/** Architectural lighting rig. */
function Lighting() {
  return (
    <>
      {/* Soft ambient — prevents pitch-black shadows */}
      <ambientLight intensity={0.35} color="#FFF8F0" />

      {/* Key light — main daylight from upper-front-right */}
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.4}
        color="#FFF8F2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />

      {/* Fill light — from opposite side, warm bounce */}
      <directionalLight position={[-4, 5, -4]} intensity={0.4} color="#F0E8D8" />

      {/* Warm low fill — simulates floor bounce */}
      <pointLight position={[0, 0.5, 0]} intensity={0.15} color="#F5E8D0" />
    </>
  );
}

/** Camera setup — isometric corner view looking into the apartment. */
function CameraSetup({ room }: { room: RoomData }) {
  const { camera } = useThree();

  useEffect(() => {
    // Place the camera inside the room at human eye level (1.6 m), offset
    // toward the back wall so the user's first view looks across the interior.
    // room.length * 0.35 keeps the camera well inside every supported room size
    // (smallest room is 4 m deep → offset 1.4 m from centre, 0.6 m from wall).
    camera.position.set(0, 1.6, room.length * 0.35);
    camera.lookAt(0, 0.8, 0);
  }, [camera, room.width, room.length]);

  return (
    <OrbitControls
      target={[0, 0.8, 0]}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={1}
      maxDistance={Math.max(room.width, room.length) * 3}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

// ── Scene root ──────────────────────────────────────────────────────────────

function RoomScene({ design }: { design: GeneratedDesign }) {
  const { room } = design;

  return (
    <>
      <Lighting />
      <Environment preset="apartment" />
      <Floor room={room} />

      {/* Walls derived from 2D room.walls (outer + internal partitions) */}
      {room.walls.map((wall, i) => (
        <WallSegment key={`wall-${i}`} wall={wall} room={room} />
      ))}

      {/* Furniture — each item tries GLB then falls back to shaped geometry */}
      <Suspense fallback={null}>
        {design.items.map((item) => (
          <FurnitureModel key={item.id} item={item} room={room} />
        ))}
      </Suspense>

      <CameraSetup room={room} />
    </>
  );
}

function EmptyState() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.001, 0.001, 0.001]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ── DesignViewer3D ──────────────────────────────────────────────────────────

export function DesignViewer3D({ design }: { design: GeneratedDesign | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!design) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50 rounded-lg text-neutral-500 text-sm">
        Complete the design wizard to see your 3D room
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50 rounded-lg text-neutral-500 text-sm">
        Loading 3D view…
      </div>
    );
  }

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 48, near: 0.1, far: 200 }}
      className="w-full h-full"
      style={{ background: "#F0EBE3" }}
    >
      <RoomScene design={design} />
    </Canvas>
  );
}

// ── ARViewerContainer (existing public API — kept for sidebar / AR panel) ───

interface ARViewerContainerProps {
  design?: GeneratedDesign;
  onFullscreenRequest?: () => void;
}

export function ARViewerContainer({
  design,
  onFullscreenRequest,
}: ARViewerContainerProps) {
  const { generatedDesign } = useDesignStore();
  const selectedDesign = design ?? generatedDesign;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <DesignViewer3D design={selectedDesign ?? null} />

      {/* Overlay controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {onFullscreenRequest && (
          <button
            onClick={onFullscreenRequest}
            className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-md transition-all text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
            title="Fullscreen view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6v4m12-4h4v4M6 18h4v-4m12 4h-4v-4" />
            </svg>
          </button>
        )}
      </div>

      {/* Usage hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm pointer-events-none">
        Drag to orbit · Scroll to zoom · Right-click to pan
      </div>
    </div>
  );
}
