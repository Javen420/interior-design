import { NextResponse } from 'next/server';
import contractors from '../../../../../data/contractors.json';

export async function GET() {
  return NextResponse.json(contractors);
}
