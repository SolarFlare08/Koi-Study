import {saveCapture} from './capture.js';

const form = document.querySelector('form');
const text = document.querySelector('#thought');
const status = document.querySelector('#capture-status');
const contextChoice=document.querySelector('#mini-context');
let context;
if (window.opener) {
  try{context=window.opener.yinYangCaptureContext?.();}catch{ /* Opened outside the Garden. */ }
  if(context){
    const label=document.querySelector('#mini-context-label');
    label.hidden=false;label.querySelector('span').textContent=`Remember ${context.title}${context.block?' and its calendar block':''}`;
  }
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
    if (!saveCapture(localStorage, text.value, contextChoice.checked?context:undefined)) { text.focus(); return; }
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
