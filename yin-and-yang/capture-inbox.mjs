import {fileURLToPath} from 'node:url';

export function captureDirectory(port) {
  return fileURLToPath(new URL(`./.local/capture/${port}/`, import.meta.url));
}
