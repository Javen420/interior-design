import { NextResponse } from 'next/server';
import styleProfiles from '../../../../data/style-profiles.json';

// PRODUCTION: Call vision model API (e.g. Google Vision, Claude) to detect style from uploaded image

export async function POST() {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Randomly select a style profile
  const randomProfile = styleProfiles[Math.floor(Math.random() * styleProfiles.length)];

  return NextResponse.json({
    style: randomProfile.name,
    confidence: Math.round(75 + Math.random() * 20),
    colorPalette: randomProfile.colorPalette,
    materials: randomProfile.materials,
    furnitureSuggestions: [
      `${randomProfile.name}-style sofa`,
      `${randomProfile.materials[0]} coffee table`,
      `${randomProfile.materials[1]} accent chair`,
    ],
  });
}
