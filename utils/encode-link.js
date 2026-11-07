// Encode unsafe URL characters while preserving valid existing percent escapes.
export function encodeLink(value) {
 const url = String(value || '')
 try { return encodeURI(url).replace(/%25([0-9a-f]{2})/gi, '%$1') }
 catch { return url }
}
