import { describe, it, expect } from 'vitest';

// Test the lightbox image list construction logic (extracted from component)
function buildLightboxImages(items: { id: string; imageUrl: string; name: string }[]) {
  return items
    .filter((item) => item.imageUrl)
    .map((item) => ({ url: item.imageUrl, alt: item.name, id: item.id }));
}

describe('Lightbox image list', () => {
  it('filters items without images', () => {
    const items = [
      { id: '1', imageUrl: 'http://img/1.jpg', name: 'Item 1' },
      { id: '2', imageUrl: '', name: 'Item 2' },
      { id: '3', imageUrl: 'http://img/3.jpg', name: 'Item 3' },
    ];
    const result = buildLightboxImages(items);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ url: 'http://img/1.jpg', alt: 'Item 1', id: '1' });
    expect(result[1]).toEqual({ url: 'http://img/3.jpg', alt: 'Item 3', id: '3' });
  });

  it('returns empty for no images', () => {
    const items = [
      { id: '1', imageUrl: '', name: 'A' },
      { id: '2', imageUrl: '', name: 'B' },
    ];
    expect(buildLightboxImages(items)).toHaveLength(0);
  });

  it('preserves order', () => {
    const items = [
      { id: 'c', imageUrl: 'http://c.jpg', name: 'C' },
      { id: 'a', imageUrl: 'http://a.jpg', name: 'A' },
      { id: 'b', imageUrl: 'http://b.jpg', name: 'B' },
    ];
    const ids = buildLightboxImages(items).map(i => i.id);
    expect(ids).toEqual(['c', 'a', 'b']);
  });

  it('finds correct index for navigation', () => {
    const items = [
      { id: '1', imageUrl: 'http://1.jpg', name: '1' },
      { id: '2', imageUrl: 'http://2.jpg', name: '2' },
      { id: '3', imageUrl: 'http://3.jpg', name: '3' },
    ];
    const images = buildLightboxImages(items);
    const idx = images.findIndex(img => img.id === '2');
    expect(idx).toBe(1);
  });
});
