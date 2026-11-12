export const CAPTURE_PREFIX = 'yin-and-yang.capture.';

export function cleanCaptureContext(value){
  if(typeof value?.taskId!=='string'||!value.taskId||typeof value.title!=='string'||!value.title.trim())return undefined;
  const block=value.block;
  const result={taskId:value.taskId,title:value.title.trim().slice(0,200)};
  if(/^\d{4}-\d{2}-\d{2}$/.test(block?.occurrence)&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(block.time)){
    result.block={occurrence:block.occurrence,time:block.time,blockId:typeof block.blockId==='string'?block.blockId:null};
  }
  return result;
}

export function saveCapture(storage, text, context) {
  const note = {text: text.trim(), createdAt: Date.now(),context};
  if (!note.text) return false;
  storeCapture(storage,note);
  return true;
}

export function storeCapture(storage,{text,createdAt,context}) {
  const key=CAPTURE_PREFIX+crypto.randomUUID();
  storage.setItem(key,JSON.stringify({text,createdAt,context:cleanCaptureContext(context)}));
  return key;
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
