export const CAPTURE_PREFIX = 'yin-and-yang.capture.';

export function saveCapture(storage, text) {
  const note = {text: text.trim(), createdAt: Date.now()};
  if (!note.text) return false;
  storage.setItem(CAPTURE_PREFIX + crypto.randomUUID(), JSON.stringify(note));
  return true;
}

export function readCaptures(storage) {
  const notes = [];
  for (let index = 0; index < (storage.length || 0); index++) {
    const key = storage.key(index);
    if (!key?.startsWith(CAPTURE_PREFIX)) continue;
    try {
      const note = JSON.parse(storage.getItem(key));
      if (note && typeof note.text === 'string' && Number.isFinite(note.createdAt)) notes.push({...note, key});
    } catch { /* Ignore a damaged note without losing the rest. */ }
  }
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}
