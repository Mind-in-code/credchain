// Issuer display labels, kept in localStorage keyed by wallet address.
//
// The contract holds a flat whitelist and stores only the address, so the name,
// role and department are frontend data. Keeping them here means they survive a
// refresh on this machine. They are still not on chain and not shared with
// anyone else.

const KEY = 'credchain.issuerLabels.v1'

// localStorage throws in private mode and when site data is blocked, so every
// read and write is guarded and simply falls back to no labels.
function readAll() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (err) {
    return {}
  }
}

function writeAll(map) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map))
    return true
  } catch (err) {
    return false
  }
}

export function loadIssuerLabels() {
  return readAll()
}

export function getIssuerLabel(address) {
  if (!address) return null
  return readAll()[address.toLowerCase()] || null
}

/// Saves one issuer's labels and returns the whole updated map, so callers can
/// drop it straight into state.
export function saveIssuerLabel(address, { name, role, department }) {
  if (!address) return readAll()
  const all = readAll()
  all[address.toLowerCase()] = {
    name: name || '',
    role: role || 'Issuer',
    department: department || '',
  }
  writeAll(all)
  return all
}

export function removeIssuerLabel(address) {
  if (!address) return readAll()
  const all = readAll()
  delete all[address.toLowerCase()]
  writeAll(all)
  return all
}
