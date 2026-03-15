import { NextRequest, NextResponse } from 'next/server';
import projects from '../../../../../data/projects.json';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === parseInt(id));
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}
