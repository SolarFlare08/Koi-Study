const prefix='yin-and-yang.sandbox:';

export function isAdminSandbox(url=location.href){
  return new URL(url).searchParams.get('admin')==='1';
}

export function adminSandboxUrl(enabled,url=location.href){
  const next=new URL(url);
  if(enabled)next.searchParams.set('admin','1');
  else next.searchParams.delete('admin');
  return next.href;
}

export function adminSandboxStorage(storage){
  function keys(){
    const names=[];
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);
      if(key?.startsWith(prefix))names.push(key.slice(prefix.length));
    }
    return names;
  }
  return {
    get length(){return keys().length;},
    key:index=>keys()[index]??null,
    getItem:key=>storage.getItem(prefix+key),
    setItem:(key,value)=>storage.setItem(prefix+key,value),
    removeItem:key=>storage.removeItem(prefix+key)
  };
}

export function workspaceStorageEvent(key,admin){
  if(key===null)return null;
  if(key.startsWith(prefix))return admin?key.slice(prefix.length):undefined;
  return admin?undefined:key;
}
