// src/components/MobileBackButton.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function MobileBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // The desktop home owns all eight entrances, including at narrow widths.
  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.back()}
      // 放在右下角稍微靠上的位置，防止挡住底部的导航转轴
      className="fixed bottom-24 right-4 z-[90] w-11 h-11 flex items-center justify-center bg-[var(--core-elevated)] border border-[var(--core-border)] shadow-xl rounded-full text-[var(--core-accent)] hover:bg-[var(--core-soft-hover)] active:bg-[var(--core-selected)] active:scale-90 transition-all"
      title="返回上一页"
    >
      <ChevronLeft size={24} />
    </button>
  );
}
