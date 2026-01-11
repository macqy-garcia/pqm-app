'use client';

import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeModal({ open, onOpenChange }: QRCodeModalProps) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?action=join`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Queue via QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to join the queue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg">
            <QRCodeCanvas
              value={url}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* URL Display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Or visit:</p>
            <code className="text-xs bg-muted px-3 py-2 rounded-md break-all">
              {url}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
