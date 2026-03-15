'use client';
import dynamic from 'next/dynamic';

const ConfiguratorContent = dynamic(() => import('@/components/ConfiguratorContent'), { ssr: false });

export default function ConfiguratorPage() {
  return <ConfiguratorContent />;
}
