"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useDesignStore, GeneratedDesign } from "@/store/designStore";
import { convert2DTo3D, createFurnitureBox } from "@/utils/roomGeometry";

interface TouchState {
  startX: number;
  startY: number;
  startRotation: { x: number; y: number };
}

function RoomScene({ design }: { design: GeneratedDesign | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!groupRef.current || !design) return;

    groupRef.current.clear();

    const roomData = design.room;
    const height = 2.8;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(
      roomData.width,
      roomData.length,
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.3,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    groupRef.current.add(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(
      roomData.width,
      roomData.length,
    );
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.5,
      metalness: 0,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = height;
    ceiling.rotation.x = Math.PI / 2;
    groupRef.current.add(ceiling);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f6f2,
      roughness: 0.4,
      metalness: 0,
    });

    // Front wall
    const frontWallGeometry = new THREE.PlaneGeometry(roomData.width, height);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.z = -roomData.length / 2;
    frontWall.position.y = height / 2;
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    groupRef.current.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.z = roomData.length / 2;
    backWall.rotation.y = Math.PI;
    backWall.position.y = height / 2;
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    groupRef.current.add(backWall);

    // Left wall
    const sideWallGeometry = new THREE.PlaneGeometry(roomData.length, height);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.x = -roomData.width / 2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.y = height / 2;
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    groupRef.current.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.x = roomData.width / 2;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.y = height / 2;
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    groupRef.current.add(rightWall);

    // Grid
    const gridHelper = new THREE.GridHelper(
      Math.max(roomData.width, roomData.length),
      8,
      0xcccccc,
      0xeeeeee,
    );
    gridHelper.position.y = 0.01;
    groupRef.current.add(gridHelper);

    // Furniture from design
    design.items.forEach((item) => {
      try {
        const furnitureBox = createFurnitureBox(item, roomData);
        groupRef.current!.add(furnitureBox);
      } catch (err) {
        console.error("Error creating furniture:", item, err);
      }
    });
  }, [design]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
    }
  });

  const handlePointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    setTouchState({
      startX: e.clientX,
      startY: e.clientY,
      startRotation: { ...rotation },
    });
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging || !touchState) return;

    const deltaX = e.clientX - touchState.startX;
    const deltaY = e.clientY - touchState.startY;

    setRotation({
      x: touchState.startRotation.x + deltaY * 0.01,
      y: touchState.startRotation.y + deltaX * 0.01,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setTouchState(null);
  };

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDragging, touchState, rotation]);

  return (
    <>
      <group ref={groupRef} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
      <Environment preset="apartment" />
    </>
  );
}

function SceneControls() {
  const { camera } = useThree();

  useEffect(() => {
    if (camera) {
      camera.position.set(5, 3.5, 5);
      camera.lookAt(0, 1, 0);
    }
  }, [camera]);

  return <OrbitControls />;
}

function DesignViewer3D({ design }: { design: GeneratedDesign | null }) {
  if (!design) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No design generated yet</p>
          <p className="text-sm">
            Complete the design wizard to visualize your room
          </p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: true,
      }}
      camera={{ position: [5, 3.5, 5], fov: 50, near: 0.1, far: 1000 }}
      className="w-full h-full"
    >
      <RoomScene design={design} />
      <SceneControls />
    </Canvas>
  );
}

interface ARViewerContainerProps {
  design?: GeneratedDesign;
  onFullscreenRequest?: () => void;
}

export function ARViewerContainer({
  design,
  onFullscreenRequest,
}: ARViewerContainerProps) {
  const { generatedDesign } = useDesignStore();
  const selectedDesign = design || generatedDesign;
  const [arSupported, setArSupported] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkWebXR = async () => {
      try {
        const supported =
          navigator.xr &&
          (await navigator.xr.isSessionSupported("immersive-ar"));
        setArSupported(!!supported);
      } catch (err) {
        console.log("WebXR not supported");
        setArSupported(false);
      }
      setLoading(false);
    };

    checkWebXR();
  }, []);

  const handleARClick = async () => {
    if (!navigator.xr || !selectedDesign) return;

    try {
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
      } as any);

      setArActive(true);
      session.end().then(() => setArActive(false));
    } catch (err) {
      console.error("AR session request failed:", err);
    }
  };

  return (
    <div className="relative w-full h-full bg-linear-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200">
      <DesignViewer3D design={selectedDesign} />

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={onFullscreenRequest}
          className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
          title="Fullscreen view"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6v4m12-4h4v4M6 18h4v-4m12 4h-4v-4"
            />
          </svg>
        </button>

        {arSupported && !loading && (
          <button
            onClick={handleARClick}
            disabled={!selectedDesign}
            className={`p-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium flex items-center gap-2 backdrop-blur-sm ${
              arActive
                ? "bg-red-600 text-white hover:bg-red-700"
                : selectedDesign
                  ? "bg-white/90 hover:bg-white text-gray-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title="Start AR view"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {arActive ? "Exit AR" : "AR View"}
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 bg-gray-900/80 text-white text-xs p-3 rounded-lg backdrop-blur-sm show-mobile">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Drag to rotate • Pinch to zoom</p>
        {arSupported && (
          <p className="mt-1">📱 Tap AR to view in augmented reality</p>
        )}
      </div>

      {!loading && !arSupported && (
        <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-xs show-mobile">
          📱 AR not available on this device
        </div>
      )}
    </div>
  );
}
