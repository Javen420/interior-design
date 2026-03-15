import { NextResponse } from 'next/server';
import contractors from '../../../../../data/contractors.json';

export async function GET() {
  const totalProjects = contractors.reduce((s, c) => s + c.projectsCompleted, 0);
  const totalRevenue = contractors.reduce((s, c) => s + c.totalRevenue, 0);
  const avgSatisfaction =
    contractors.reduce((s, c) => s + c.satisfactionRating, 0) / contractors.length;
  const avgOnTime =
    contractors.reduce((s, c) => s + c.onTimeRate, 0) / contractors.length;
  const activeContractors = contractors.filter((c) => c.status === 'active').length;
  const flaggedContractors = contractors.filter((c) => c.status === 'flagged').length;

  return NextResponse.json({
    totalProjects,
    totalRevenue,
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    avgOnTime: Math.round(avgOnTime * 100),
    activeContractors,
    flaggedContractors,
    totalContractors: contractors.length,
  });
}
