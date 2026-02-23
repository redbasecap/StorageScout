import { describe, it, expect } from 'vitest';
import { generateBoxQrDataUrl, generateQrSheet } from '@/lib/qr-generate';

describe('generateBoxQrDataUrl', () => {
  it('returns a data URL for a valid box ID', async () => {
    const result = await generateBoxQrDataUrl('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('encodes the box ID into a URL when baseUrl is provided', async () => {
    const result = await generateBoxQrDataUrl('test-box', { baseUrl: 'https://app.example.com' });
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('generates different QR codes for different box IDs', async () => {
    const qr1 = await generateBoxQrDataUrl('box-1');
    const qr2 = await generateBoxQrDataUrl('box-2');
    expect(qr1).not.toBe(qr2);
  });

  it('respects custom width', async () => {
    const result = await generateBoxQrDataUrl('test', { width: 128 });
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe('generateQrSheet', () => {
  it('generates QR codes for multiple boxes', async () => {
    const boxes = [
      { id: 'box-1', label: 'Kitchen' },
      { id: 'box-2', label: 'Garage' },
      { id: 'box-3' },
    ];
    const results = await generateQrSheet(boxes);
    expect(results).toHaveLength(3);
    expect(results[0].label).toBe('Kitchen');
    expect(results[0].boxId).toBe('box-1');
    expect(results[0].dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(results[2].label).toBe('box-3'.substring(0, 8));
  });

  it('handles empty array', async () => {
    const results = await generateQrSheet([]);
    expect(results).toHaveLength(0);
  });
});
