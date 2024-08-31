export function createBytes(size: number): Uint8Array {
  return new Uint8Array(size).fill(0);
}
