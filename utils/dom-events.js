// One listener slot per element + group. Re-binding the same slot aborts the
// previous listener so a second init cannot stack handlers on a shared button.

const slots = new WeakMap();

function slotMap(el) {
  let map = slots.get(el);
  if (!map) {
    map = new Map();
    slots.set(el, map);
  }
  return map;
}

/**
 * @param {EventTarget} el
 * @param {string} group stable slot id for this element
 * @param {string} type
 * @param {EventListener} handler
 * @returns {AbortController | null}
 */
export function bindExclusive(el, group, type, handler) {
  if (!el) return null;
  const map = slotMap(el);
  map.get(group)?.abort();
  const ac = new AbortController();
  map.set(group, ac);
  el.addEventListener(type, handler, { signal: ac.signal });
  return ac;
}

/** Abort only if `ac` is still the listener installed for this slot. */
export function releaseExclusive(el, group, ac) {
  if (!el) return;
  const map = slots.get(el);
  if (!map) return;
  if (ac && map.get(group) !== ac) return;
  map.get(group)?.abort();
  map.delete(group);
}
