"use client";

/**
 * ARWalkthrough — WebXR immersive-ar interior walkthrough.
 *
 * Flow:
 *  1. User taps "Enter AR Walkthrough" → phone camera feed starts.
 *  2. A placement reticle tracks detected floor surfaces via hit-test.
 *  3. User taps the screen → furniture is anchored at that real-world spot.
 *  4. User physically walks around to explore the room at 1:1 scale.
 *
 * Requires: Chrome on Android (ARCore) or Safari on iOS 12+ (ARKit), over HTTPS.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  createXRStore,
  XR,
  useXR,
  useXRHitTest,
  useXRInputSourceEvent,
} from "@react-three/xr";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { GeneratedDesign, RoomData } from "@/store/designStore";
import { FurnitureModel } from "@/components/FurnitureModel";

// ── Module-level XR store — created once, safe because file is client-only ──
const xrStore = createXRStore();

// ── Room floor boundary outline ─────────────────────────────────────────────

function RoomFloorOutline({ room }: { room: RoomData }) {
  const hw = room.width / 2;
  const hl = room.length / 2;
  // Close the loop by repeating the first point
  const points: [number, number, number][] = [
    [-hw, 0.005, -hl],
    [hw, 0.005, -hl],
    [hw, 0.005, hl],
    [-hw, 0.005, hl],
    [-hw, 0.005, -hl],
  ];
  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={2.5}
      opacity={0.6}
      transparent
    />
  );
}

// ── Placement reticle ────────────────────────────────────────────────────────
// Tracks floor surfaces via WebXR hit-test; tap fires onPlace with the position.

function Reticle({ onPlace }: { onPlace: (pos: THREE.Vector3) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const isVisible = useRef(false);
  const placementPos = useRef(new THREE.Vector3());

  // Update reticle position every frame from hit-test results
  useXRHitTest((results, getWorldMatrix) => {
    if (!groupRef.current) return;
    if (results.length === 0) {
      groupRef.current.visible = false;
      isVisible.current = false;
      return;
    }
    const mat = new THREE.Matrix4();
    getWorldMatrix(mat, results[0]);
    mat.decompose(
      placementPos.current,
      new THREE.Quaternion(),
      new THREE.Vector3(),
    );
    groupRef.current.position.copy(placementPos.current);
    groupRef.current.visible = true;
    isVisible.current = true;
  }, "viewer");

  // Tap (select) places the room
  useXRInputSourceEvent(
    "all",
    "select",
    () => {
      if (isVisible.current) {
        onPlace(placementPos.current.clone());
      }
    },
    [onPlace],
  );

  return (
    // Rotate -90° around X so the ring/circle lie flat on the floor
    <group ref={groupRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
      {/* outer ring */}
      <mesh>
        <ringGeometry args={[0.1, 0.13, 40]} />
        <meshBasicMaterial
          color="#ffffff"
          opacity={0.9}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* inner dot */}
      <mesh>
        <circleGeometry args={[0.025, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          opacity={0.6}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Placed room ──────────────────────────────────────────────────────────────
// Renders the furniture layout anchored to the tapped real-world position.

function PlacedRoom({
  design,
  origin,
}: {
  design: GeneratedDesign;
  origin: THREE.Vector3;
}) {
  return (
    <group position={origin}>
      <RoomFloorOutline room={design.room} />
      <Suspense fallback={null}>
        {design.items.map((item) => (
          <FurnitureModel key={item.id} item={item} room={design.room} />
        ))}
      </Suspense>
    </group>
  );
}

// ── XR session mode tracker ──────────────────────────────────────────────────
// Must live inside <XR> to access the XR context.

function XRModeTracker({
  onChange,
}: {
  onChange: (inAR: boolean) => void;
}) {
  const mode = useXR((s) => s.mode);
  useEffect(() => {
    onChange(mode === "immersive-ar");
  }, [mode, onChange]);
  return null;
}

// ── AR scene (must be a child of <XR>) ──────────────────────────────────────

function ARScene({
  design,
  onModeChange,
}: {
  design: GeneratedDesign;
  onModeChange: (inAR: boolean) => void;
}) {
  const [placed, setPlaced] = useState(false);
  const [origin, setOrigin] = useState<THREE.Vector3 | null>(null);

  const handlePlace = useCallback(
    (pos: THREE.Vector3) => {
      setOrigin(pos);
      setPlaced(true);
    },
    [],
  );

  return (
    <>
      {/* Lighting — ambient keeps AR objects visible in real environments */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 8, 4]} intensity={0.9} castShadow />

      <XRModeTracker onChange={onModeChange} />

      {/* Before placement: show reticle so the user can see where to tap */}
      {!placed && <Reticle onPlace={handlePlace} />}

      {/* After placement: show full furniture layout */}
      {placed && origin && <PlacedRoom design={design} origin={origin} />}
    </>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

interface ARWalkthroughProps {
  design: GeneratedDesign;
}

export function ARWalkthrough({ design }: ARWalkthroughProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [inAR, setInAR] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.xr) {
      setSupported(false);
      return;
    }
    navigator.xr
      .isSessionSupported("immersive-ar")
      .then(setSupported)
      .catch(() => setSupported(false));
  }, []);

  const handleModeChange = useCallback(
    (active: boolean) => setInAR(active),
    [],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 500,
        background: "#0e1117",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Three.js canvas — XR mounts the AR passthrough session on top */}
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 70, near: 0.01, far: 100 }}
        style={{ width: "100%", height: "100%" }}
      >
        <XR store={xrStore}>
          <ARScene design={design} onModeChange={handleModeChange} />
        </XR>
      </Canvas>

      {/* ── Pre-AR overlay ─────────────────────────────────────────────── */}
      {!inAR && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.72)",
            gap: 16,
            padding: 32,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto", maxWidth: 440 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🚶</div>
            <h3 style={{ color: "white", margin: "0 0 10px", fontSize: 22 }}>
              AR Interior Walkthrough
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                margin: "0 auto 24px",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              Your{" "}
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>
                {design.styleApplied}
              </strong>{" "}
              room is placed at real-world scale. Point your phone at the floor,
              tap to place the room, then physically walk around to explore.
            </p>

            {supported === null && (
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Checking AR support…
              </p>
            )}

            {supported === false && (
              <div
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: "12px 20px",
                  color: "#fca5a5",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                AR walkthrough requires{" "}
                <strong>Chrome on Android</strong> (ARCore) or{" "}
                <strong>Safari on iOS 12+</strong> (ARKit).
                <br />
                Not supported on desktop browsers.
              </div>
            )}

            {supported === true && (
              <button
                onClick={() => xrStore.enterAR()}
                style={{
                  background: "var(--color-accent, #c4a265)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 36px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  boxShadow: "0 4px 20px rgba(196,162,101,0.35)",
                }}
              >
                Enter AR Walkthrough
              </button>
            )}

            <p
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 11,
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              Requires HTTPS · Android (ARCore) or iOS 12+ (ARKit)
            </p>
          </div>
        </div>
      )}

      {/* ── In-AR hint bar ─────────────────────────────────────────────── */}
      {inAR && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            borderRadius: 24,
            padding: "10px 20px",
            fontSize: 13,
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          Point at the floor · Tap to place · Walk around to explore
        </div>
      )}
    </div>
  );
}
