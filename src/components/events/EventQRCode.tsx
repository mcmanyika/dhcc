"use client";

import QRCode from "react-qr-code";
import { Download } from "lucide-react";
import { getEventScanUrl } from "@/lib/event-qr";
import { Button } from "@/components/ui/Button";

interface EventQRCodeProps {
  eventId: string;
  title?: string;
  size?: number;
  showDownload?: boolean;
}

export function EventQRCode({
  eventId,
  title = "Event QR Code",
  size = 160,
  showDownload = true,
}: EventQRCodeProps) {
  const url = getEventScanUrl(eventId);

  const downloadQr = () => {
    const svg = document.getElementById(`qr-${eventId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `event-${eventId}-qr.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = blobUrl;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <QRCode
          id={`qr-${eventId}`}
          value={url}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#0f766e"
        />
      </div>
      <p className="max-w-xs break-all text-center text-xs text-gray-500">{url}</p>
      <p className="max-w-xs text-center text-xs text-gray-400">
        Scan to register before the event or check in on event day.
      </p>
      {showDownload && (
        <Button variant="outline" size="sm" onClick={downloadQr}>
          <Download className="h-4 w-4" />
          Download QR
        </Button>
      )}
    </div>
  );
}
