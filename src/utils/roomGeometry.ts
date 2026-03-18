import * as THREE from "three";
import { FurnitureItem, RoomData } from "@/store/designStore";

export type RoomType = "3-room" | "4-room" | "5-room";

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

const roomDimensions: Record<RoomType, RoomDimensions> = {
  "3-room": { width: 4, length: 5.5, height: 2.8 },
  "4-room": { width: 5, length: 6.5, height: 2.8 },
  "5-room": { width: 6, length: 8, height: 2.8 },
};

export function getRoomDimensions(roomType: RoomType): RoomDimensions {
  return roomDimensions[roomType];
}

// Convert 2D floor plan coordinates to 3D space
// 2D: (x, y) on floor plan → 3D: (x, z) on floor, y is height
export function convert2DTo3D(
  x2d: number,
  y2d: number,
  roomWidth: number,
  roomLength: number,
  itemHeight: number = 0.5,
): THREE.Vector3 {
  // Normalize to room centered at origin
  const x3d = (x2d / 100 - roomWidth / 2) * 2.5; // Scale down 2D coordinates
  const z3d = (y2d / 100 - roomLength / 2) * 2.5;
  return new THREE.Vector3(x3d, itemHeight / 2, z3d);
}

// Create furniture box from FurnitureItem
export function createFurnitureBox(
  item: FurnitureItem,
  roomData: RoomData,
): THREE.Mesh {
  const scale = 0.025; // Scale down furniture dimensions from cm to meters
  const geometry = new THREE.BoxGeometry(
    item.width * scale,
    0.8, // Standard furniture height
    item.depth * scale,
  );

  // Determine color from item.color (name) or use default
  const colorMap: Record<string, number> = {
    beige: 0xf5e6d3,
    brown: 0x8b7355,
    white: 0xffffff,
    black: 0x333333,
    gray: 0x808080,
    blue: 0x4a8fd4,
    green: 0x2d5f4e,
    orange: 0xd4763c,
    default: 0xc4a265,
  };

  const colorHex =
    colorMap[item.color?.toLowerCase() || "default"] || colorMap.default;

  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.7,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Position from 2D coordinates
  const position = convert2DTo3D(
    item.x,
    item.y,
    roomData.width,
    roomData.length,
    0.8,
  );
  mesh.position.copy(position);

  // Apply rotation
  mesh.rotation.y = (item.rotation * Math.PI) / 180;

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

export function createRoomGeometry(roomType: RoomType): THREE.Group {
  const dims = roomDimensions[roomType];
  const group = new THREE.Group();

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(dims.width, dims.length);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.3,
    metalness: 0,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(dims.width, dims.length);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.5,
    metalness: 0,
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.y = dims.height;
  ceiling.rotation.x = Math.PI / 2;
  group.add(ceiling);

  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f6f2,
    roughness: 0.4,
    metalness: 0,
  });

  // Front wall
  const frontWallGeometry = new THREE.PlaneGeometry(dims.width, dims.height);
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.z = -dims.length / 2;
  frontWall.position.y = dims.height / 2;
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  // Back wall
  const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  backWall.position.z = dims.length / 2;
  backWall.rotation.y = Math.PI;
  backWall.position.y = dims.height / 2;
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left wall
  const sideWallGeometry = new THREE.PlaneGeometry(dims.length, dims.height);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.x = -dims.width / 2;
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.y = dims.height / 2;
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.x = dims.width / 2;
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.y = dims.height / 2;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Add grid lines for visual reference
  const gridHelper = new THREE.GridHelper(
    Math.max(dims.width, dims.length),
    8,
    0xcccccc,
    0xeeeeee,
  );
  gridHelper.position.y = 0.01;
  group.add(gridHelper);

  // Center pivot
  group.position.set(0, 0, 0);

  return group;
}

export function createFurniture(style: string): THREE.Group {
  const group = new THREE.Group();

  // Sample furniture - sofa
  const sofaGeometry = new THREE.BoxGeometry(2, 0.8, 0.9);
  const sofaMaterial = new THREE.MeshStandardMaterial({
    color: getColorForStyle(style, "furniture"),
    roughness: 0.7,
    metalness: 0,
  });
  const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
  sofa.position.set(0, 0.4, 1.5);
  sofa.castShadow = true;
  sofa.receiveShadow = true;
  group.add(sofa);

  // Coffee table
  const tableGeometry = new THREE.BoxGeometry(1, 0.4, 0.6);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: getColorForStyle(style, "accent"),
    roughness: 0.5,
    metalness: 0.2,
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, 0.2, 0.5);
  table.castShadow = true;
  table.receiveShadow = true;
  group.add(table);

  // Lamp
  const lampStandGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: getColorForStyle(style, "lamp"),
    roughness: 0.3,
    metalness: 0.8,
  });
  const lampStand = new THREE.Mesh(lampStandGeometry, lampMaterial);
  lampStand.position.set(1.2, 0.6, 0.8);
  lampStand.castShadow = true;
  group.add(lampStand);

  // Lamp shade
  const shadeGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: getColorForStyle(style, "shade"),
    roughness: 0.6,
    metalness: 0,
  });
  const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
  shade.position.set(1.2, 1.5, 0.8);
  group.add(shade);

  return group;
}

export function getColorForStyle(style: string, element: string): number {
  const styles: Record<string, Record<string, number>> = {
    scandinavian: {
      furniture: 0xf5e6d3,
      accent: 0xd4b896,
      lamp: 0x8b7355,
      shade: 0xf5e6d3,
    },
    minimalist: {
      furniture: 0xffffff,
      accent: 0x333333,
      lamp: 0x666666,
      shade: 0xf0f0f0,
    },
    industrial: {
      furniture: 0x4a4a4a,
      accent: 0x8b7355,
      lamp: 0x2a2a2a,
      shade: 0x666666,
    },
    japandi: {
      furniture: 0xf7f3ed,
      accent: 0xc8b89a,
      lamp: 0x8b7f6f,
      shade: 0xf7f3ed,
    },
    "mid-century-modern": {
      furniture: 0xd4763c,
      accent: 0x2d5f4e,
      lamp: 0xd4763c,
      shade: 0xf5e6d3,
    },
    contemporary: {
      furniture: 0x1a1a2e,
      accent: 0xd4a574,
      lamp: 0x333333,
      shade: 0xd4a574,
    },
  };

  return (
    styles[style.toLowerCase()]?.[element] || styles["scandinavian"][element]
  );
}

export function updateRoomMaterialsByStyle(
  room: THREE.Group,
  style: string,
): void {
  room.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // Floor
      if (
        child.geometry instanceof THREE.PlaneGeometry &&
        child.position.y === 0
      ) {
        child.material.color.setHex(0xf5f5f5);
      }
    }
  });
}
