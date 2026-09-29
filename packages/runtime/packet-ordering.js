/** Deterministic topological ordering with a hard domain-run limit.
 * A bounded search fails explicitly rather than relaxing an invariant.
 * Seed controls tie-breaking only; counts keep a domain from being stranded.
 */
export function orderSelectedItems({ items, seed, maxSameDomainConsecutive = 2, maxSearchNodes = 100000 }) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  if (!Number.isInteger(maxSameDomainConsecutive) || maxSameDomainConsecutive < 1) {
    throw new RangeError('maxSameDomainConsecutive must be a positive integer');
  }
  if (!Number.isInteger(maxSearchNodes) || maxSearchNodes < 1) throw new RangeError('Invalid search limit');
  const byId = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || typeof item.domainId !== 'string') throw new TypeError('Invalid item');
    if (byId.has(item.id)) throw new Error('Duplicate selected item: ' + item.id);
    byId.set(item.id, item);
  }
  const dependencies = new Map(items.map(item => [item.id, new Set(
    item.eligibility?.mode === 'conditional' ? item.eligibility.all.map(c => c.itemId) : []
  )]));
  for (const [id, deps] of dependencies) for (const dep of deps) {
    if (!byId.has(dep)) throw new Error('Missing selected prerequisite: ' + id + ' -> ' + dep);
  }
  const seen = new Set(), visiting = new Set();
  const visit = id => {
    if (visiting.has(id)) throw new Error('Dependency cycle at ' + id);
    if (seen.has(id)) return;
    visiting.add(id);
    for (const dep of dependencies.get(id)) visit(dep);
    visiting.delete(id); seen.add(id);
  };
  for (const id of byId.keys()) visit(id);
  const hash = text => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const priority = new Map(items.map(i => [i.id, hash(String(seed) + ':order:' + i.id)]));
  const remaining = new Set(byId.keys());
  const counts = new Map();
  for (const i of items) counts.set(i.domainId, (counts.get(i.domainId) ?? 0) + 1);
  const capacityAllows = (lastDomain, run) => {
    for (const [domain, count] of counts) {
      const separators = remaining.size - count;
      const capacity = maxSameDomainConsecutive * (separators + 1) - (domain === lastDomain ? run : 0);
      if (count > capacity) return false;
    }
    return true;
  };
  const ordered = [], failed = new Set();
  let visitedNodes = 0;
  const search = (lastDomain = null, run = 0) => {
    if (++visitedNodes > maxSearchNodes) throw new Error('Packet-ordering search budget exceeded; constraints were not relaxed');
    if (!remaining.size) return true;
    if (!capacityAllows(lastDomain, run)) return false;
    const key = JSON.stringify([lastDomain, run, [...remaining].sort()]);
    if (failed.has(key)) return false;
    const candidates = [...remaining].filter(id => {
      const domain = byId.get(id).domainId;
      return !(domain === lastDomain && run >= maxSameDomainConsecutive) &&
        [...dependencies.get(id)].every(dep => !remaining.has(dep));
    }).sort((a,b) => {
      const domainDifference = counts.get(byId.get(b).domainId) - counts.get(byId.get(a).domainId);
      return domainDifference || priority.get(a) - priority.get(b) || (a < b ? -1 : a > b ? 1 : 0);
    });
    for (const id of candidates) {
      const domain = byId.get(id).domainId;
      remaining.delete(id); counts.set(domain, counts.get(domain) - 1); ordered.push(id);
      if (search(domain, domain === lastDomain ? run + 1 : 1)) return true;
      ordered.pop(); remaining.add(id); counts.set(domain, counts.get(domain) + 1);
    }
    failed.add(key);
    return false;
  };
  if (!search()) throw new Error('No packet order satisfies the dependency and domain-run constraints');
  return ordered;
}
