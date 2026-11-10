import { describe, expect, it } from 'vitest';
import { validateGlb } from './glb';

function glb(metadata: unknown) {
  const text = new TextEncoder().encode(JSON.stringify(metadata));
  const length = Math.ceil(text.length / 4) * 4;
  const data = new ArrayBuffer(20 + length);
  const view = new DataView(data);
  [0x46546c67, 2, data.byteLength, length, 0x4e4f534a].forEach((value, i) =>
    view.setUint32(i * 4, value, true),
  );
  new Uint8Array(data, 20).fill(32);
  new Uint8Array(data, 20, text.length).set(text);
  return data;
}

describe('Blender GLB handoff', () => {
  it('accepts embedded buffers and images', () => {
    expect(() =>
      validateGlb(
        glb({ buffers: [{ byteLength: 12 }], images: [{ bufferView: 0 }] }),
      ),
    ).not.toThrow();
  });
  it('rejects external resources before the renderer requests them', () => {
    expect(() =>
      validateGlb(
        glb({ images: [{ uri: 'https://example.com/private.png' }] }),
      ),
    ).toThrow('Embed all textures');
    expect(() =>
      validateGlb(glb({ buffers: [{ uri: '../house.bin' }] })),
    ).toThrow('Embed all textures');
  });
  it('rejects HTML fallback, truncated files, and unsupported compression', () => {
    expect(() =>
      validateGlb(new TextEncoder().encode('<html>not a model</html>').buffer),
    ).toThrow('valid GLB');
    expect(() => validateGlb(glb({}).slice(0, 21))).toThrow('valid GLB');
    expect(() =>
      validateGlb(glb({ extensionsRequired: ['KHR_draco_mesh_compression'] })),
    ).toThrow('without Draco');
  });
});
