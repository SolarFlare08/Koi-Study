import {saveCapture} from './capture.js';

const form = document.querySelector('form');
const text = document.querySelector('#thought');
const status = document.querySelector('#capture-status');
if (window.opener) {
  const close = document.querySelector('#capture-close');
  close.hidden = false;
  document.querySelector('#capture-esc').hidden = false;
  close.onclick = () => window.close();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.close();
  });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (!saveCapture(localStorage, text.value)) { text.focus(); return; }
    text.value = '';
    status.textContent = 'Saved. Your note is waiting in Yin and Yang.';
    if (window.opener) window.close();
  } catch { status.textContent = 'Could not save this note. Your text is still here.'; }
});
text.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    form.requestSubmit();
  }
});
