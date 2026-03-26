'use client';

import { useCallback, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/ui/Button';

interface QRCodeDisplayProps {
  code: string;
  size?: number;
}

export default function QRCodeDisplay({ code, size = 200 }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${code}`
      : `/join/${code}`;

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `askly-${code}.png`;
      link.href = pngUrl;
      link.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [code]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [joinUrl]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div ref={qrRef} className="bg-white p-4 rounded-lg">
        <QRCodeSVG value={joinUrl} size={size} />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">세션 코드</p>
        <p className="text-2xl font-mono font-bold tracking-wider text-gray-900">
          {code}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? '복사됨!' : '링크 복사'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          PNG 다운로드
        </Button>
      </div>
    </div>
  );
}
