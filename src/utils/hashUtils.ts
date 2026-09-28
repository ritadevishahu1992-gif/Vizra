/**
 * Fast deterministic string hash utility for content deduplication and versioning
 */
export function computeStringHash(text: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    hash1 ^= ch;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = (hash2 << 5) - hash2 + ch;
    hash2 |= 0;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `hash_${part1}${part2}`;
}
