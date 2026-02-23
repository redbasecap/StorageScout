import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL for a given box ID.
 * The QR code encodes a URL that links to the box page.
 */
export async function generateBoxQrDataUrl(
  boxId: string,
  options?: { width?: number; margin?: number; baseUrl?: string }
): Promise<string> {
  const { width = 256, margin = 2, baseUrl } = options ?? {};
  const url = baseUrl
    ? `${baseUrl}/box?id=${encodeURIComponent(boxId)}`
    : boxId;

  return QRCode.toDataURL(url, {
    width,
    margin,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generate multiple QR codes for printing as a sheet.
 * Returns an array of { boxId, label, dataUrl }.
 */
export async function generateQrSheet(
  boxes: Array<{ id: string; label?: string }>,
  options?: { width?: number; baseUrl?: string }
): Promise<Array<{ boxId: string; label: string; dataUrl: string }>> {
  const results = await Promise.all(
    boxes.map(async (box) => ({
      boxId: box.id,
      label: box.label || box.id.substring(0, 8),
      dataUrl: await generateBoxQrDataUrl(box.id, options),
    }))
  );
  return results;
}
