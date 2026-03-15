import { NextRequest, NextResponse } from 'next/server';
import furnitureCatalog from '../../../../data/furniture-catalog.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const category = searchParams.get('category');
  const style = searchParams.get('style');
  const budgetMax = parseFloat(searchParams.get('budgetMax') || '99999');

  const currentItem = furnitureCatalog.find((i) => i.id === itemId);
  if (!currentItem && !category) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const targetCategory = category || currentItem?.category;
  const targetStyle = style || currentItem?.styles[0] || '';

  const alternatives = furnitureCatalog
    .filter(
      (i) =>
        i.id !== itemId &&
        i.category === targetCategory &&
        i.price <= budgetMax &&
        i.styles.some((s) => s.toLowerCase() === targetStyle.toLowerCase())
    )
    .sort((a, b) => {
      const refPrice = currentItem?.price || 1000;
      return Math.abs(a.price - refPrice) - Math.abs(b.price - refPrice);
    })
    .slice(0, 4);

  return NextResponse.json({ alternatives });
}
