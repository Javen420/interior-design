import { NextRequest, NextResponse } from 'next/server';
import designers from '../../../../data/designers.json';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { style, budgetTotal, flatType } = body;

  const scored = designers.map((designer) => {
    let score = 0;
    const reasons: string[] = [];

    // Style match – 50%
    const styleMatch = designer.specializations.some(
      (s) => s.toLowerCase() === (style || '').toLowerCase()
    );
    if (styleMatch) {
      score += 50;
      reasons.push(`Specializes in ${style} design`);
    } else {
      score += 10;
      reasons.push('Versatile designer across multiple styles');
    }

    // Budget fit – 30%
    if (
      budgetTotal >= designer.budgetRange.min &&
      budgetTotal <= designer.budgetRange.max
    ) {
      score += 30;
      reasons.push('Budget aligns perfectly with their typical projects');
    } else if (budgetTotal < designer.budgetRange.min) {
      score += 10;
      reasons.push('May offer value-engineered solutions');
    } else {
      score += 15;
      reasons.push('Experienced with premium budgets');
    }

    // Flat type experience – 20%
    const flatTypeLabel =
      flatType?.includes('bto') ? 'BTO' : flatType?.includes('resale') ? 'Resale' : 'Condo';
    if (designer.projectTypes.includes(flatTypeLabel)) {
      score += 20;
      reasons.push(`Extensive ${flatTypeLabel} project experience (${designer.projectsCompleted} completed)`);
    } else {
      score += 5;
      reasons.push('Expanding into your flat type category');
    }

    return {
      ...designer,
      matchScore: Math.min(score, 100),
      reasons,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ designers: scored.slice(0, 3) });
}
