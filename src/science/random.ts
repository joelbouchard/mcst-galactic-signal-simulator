export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function poisson(mean: number, rng: () => number): number {
  // Exact sum of independent Poisson variates, with bounded work for the display catalog.
  if (mean > 100000) return -1;
  let count = 0;
  for (let remaining = mean; remaining > 0; remaining -= 20) {
    const limit = Math.exp(-Math.min(20, remaining));
    let product = 1,
      k = 0;
    do {
      k++;
      product *= rng();
    } while (product > limit);
    count += k - 1;
  }
  return count;
}
