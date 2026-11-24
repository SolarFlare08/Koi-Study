export function taskReference(value){
  const text=typeof value?.text==='string'?value.text.trim().slice(0,3000):'';
  const image=typeof value?.image==='string'&&value.image.length<=820000&&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.image)?value.image:'';
  return text||image?{text,image}:null;
}

export function paintReference(container,reference){
  if(!reference){container.hidden=true;return;}
  container.hidden=false;
  const text=container.querySelector('[data-reference-text]'),image=container.querySelector('img');
  if(text.textContent!==reference.text)text.textContent=reference.text;
  text.hidden=!reference.text;
  if(image.getAttribute('src')!==reference.image){
    if(reference.image)image.src=reference.image;
    else image.removeAttribute('src');
  }
  image.hidden=!reference.image;
}

async function diagramClipboardBlob(source){
  const image=new Image();
  image.src=source;
  await image.decode();
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;
  canvas.height=image.naturalHeight;
  canvas.getContext('2d').drawImage(image,0,0);
  return new Promise((resolve,reject)=>canvas.toBlob(result=>{
    if(result)resolve(result);
    else reject(new Error('Could not encode diagram.'));
  },'image/png'));
}

export function installReferenceEditor({button,card,getTask,save,notify}){
  const dialog=document.createElement('dialog');
  dialog.className='workspace-dialog study-companion';
  dialog.setAttribute('aria-labelledby','reference-title');
  dialog.innerHTML=`<header><h2 id="reference-title">Pinned reference</h2><button type="button" data-close aria-label="Close">×</button></header>
    <form><label>Formula or example<textarea name="text" rows="6" maxlength="3000"></textarea></label>
    <label>Diagram<input name="file" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPEG, or WebP up to 600 KB.</small></label>
    <label data-remove-image hidden><input type="checkbox" name="removeImage"> Remove current diagram</label>
    <p role="status"></p><div class="companion-actions"><button class="workspace-primary">Save pin</button><button type="button" data-unpin>Unpin</button></div></form>`;
  document.body.append(dialog);
  const form=dialog.querySelector('form'),status=dialog.querySelector('[role=status]');
  let taskId='',existing=null;
  function open(){
    const task=getTask();if(!task)return;
    taskId=task.id;existing=task.reference;
    form.reset();form.elements.text.value=existing?.text||'';
    dialog.querySelector('[data-remove-image]').hidden=!existing?.image;
    dialog.querySelector('[data-unpin]').hidden=!existing;
    status.textContent='';dialog.showModal();
  }
  const copy=card.querySelector('[data-copy-reference]');
  button.onclick=card.querySelector('[data-edit-reference]').onclick=open;
  copy.onclick=async()=>{
    const reference=getTask()?.reference;
    if(!reference)return;
    try{
      if(reference.text)await navigator.clipboard.writeText(reference.text);
      else{
        if(!navigator.clipboard?.write||!globalThis.ClipboardItem)throw new Error('Image clipboard unavailable.');
        await navigator.clipboard.write([new ClipboardItem({'image/png':diagramClipboardBlob(reference.image)})]);
      }
      notify(reference.text?'Reference text copied.':'Diagram copied.');
    }catch{
      notify('Could not copy the pinned reference.');
    }
  };
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-unpin]').onclick=()=>{if(save(taskId,null))dialog.close();};
  form.onsubmit=async event=>{
    event.preventDefault();
    const submit=form.querySelector('[type=submit], .workspace-primary'),id=taskId;
    const text=form.elements.text.value;
    let image=form.elements.removeImage.checked?'':existing?.image||'';
    const file=form.elements.file.files[0];
    if(file){
      if(file.size>600000||!['image/png','image/jpeg','image/webp'].includes(file.type)){status.textContent='Choose a PNG, JPEG, or WebP under 600 KB.';return;}
      submit.disabled=true;
      try{image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}
      catch{status.textContent='Could not read this diagram.';return;}
      finally{submit.disabled=false;}
    }
    if(!dialog.open||id!==taskId)return;
    const reference=taskReference({text,image});
    if(!reference){status.textContent='Add text or a diagram to pin.';return;}
    if(save(id,reference))dialog.close();
  };
  return (task,visible)=>{
    const ref=visible&&task?.reference;
    button.hidden=!visible||!task;
    button.textContent=ref?'Edit reference':'Pin reference';
    paintReference(card,ref);
    if(ref)copy.title=ref.text?'Copy reference text':'Copy diagram';
  };
}
