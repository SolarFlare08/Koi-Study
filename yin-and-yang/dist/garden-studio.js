import {gardenCameras,gardenPieceOptions,gardenStarterLayouts,gardenFrame,loadGardenDesign,loadGardenLayouts,
  gardenLandmarkKey,movableGardenLandmark,clampGardenPlacement,placementBounds} from './garden-layout.js';
import {loadAppearance,seasonOptions,lightingOptions,gardenPalettes,weatherBySeason} from './garden-appearance.js';
import {gardenLandmarkPositions,mountGardenPreview} from './scenery.js';
import {gardenCourses,landmarkTypes} from './garden-growth.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const pieceLabels={mountains:'Mountains',shoreline:'Shoreline',pavilion:'Building',path:'Path'};
const options=values=>Object.entries(values).map(([key,label])=>`<option value="${escape(key)}">${escape(label)}</option>`).join('');
const select=(name,label,values)=>`<label>${label}<select name="${name}">${options(values)}</select></label>`;

export function createGardenStudio({getState,getAppearance,commit,download,today,notify}){
  let draft,form,selected='',scene=null,drag=null;
  function open(){
    draft={id:'',name:'',through:'',design:loadGardenDesign(getState().gardenDesign),appearance:getAppearance()};
    selected='';drag=null;
  }
  function markup(){
    return `<form id="garden-studio-form">
      <div class="studio-library">
        <label>Layout library<select name="library"></select></label>
        <button type="button" class="text-button" data-studio="copy">Save a copy</button>
        <button type="button" class="text-button" data-studio="delete">Delete saved layout</button>
      </div>
      <div class="studio-workspace">
        <div class="studio-canvas-column">
          <div class="studio-stage">
            <div class="garden-scene-preview studio-scene" aria-hidden="true"></div>
            <span class="studio-pin" aria-hidden="true" hidden></span>
          </div>
          <p class="studio-stage-help" data-studio-placement-tip></p>
          <div class="studio-landmarks">
            <label>Move a landmark<select name="landmark"></select></label>
            <div class="studio-placement" hidden>
              <label>Left to right<input type="range" name="x" min="${placementBounds.x[0]}" max="${placementBounds.x[1]}"></label>
              <label>Back to front<input type="range" name="y" min="${placementBounds.y[0]}" max="${placementBounds.y[1]}"></label>
              <button type="button" class="text-button" data-studio="automatic">Reset this landmark</button>
            </div>
          </div>
        </div>
        <div class="studio-settings">
          <fieldset><legend>Scenery</legend><div class="studio-control-grid">
          ${Object.entries(gardenPieceOptions).map(([key,values])=>select(key,pieceLabels[key],values)).join('')}
          ${select('camera','View',Object.fromEntries(Object.entries(gardenCameras).map(([key,item])=>[key,item.name])))}
          </div></fieldset>
          <fieldset><legend>Season and light</legend><div class="studio-control-grid">
            ${select('season','Season',Object.fromEntries(Object.entries(seasonOptions).map(([key,item])=>[key,item.name])))}
            ${select('lighting','Lighting',lightingOptions)}
            ${select('palette','Palette',gardenPalettes)}
            <label>Weather<select name="weather"></select></label>
          </div></fieldset>
        </div>
      </div>
      <div class="studio-save">
        <label>Layout name<input name="layoutName" maxlength="70" required placeholder="Fall semester"></label>
        <label><span>Archive landmarks through <small>(optional)</small></span><input name="through" type="date" max="${today()}"></label>
        <div class="studio-actions">
          <button type="button" class="text-button" data-studio="reset">Reset scenery</button>
          <button type="submit" class="text-button">Save layout</button>
          <button type="submit" class="panel-primary" value="apply">Save and apply</button>
        </div>
      </div>
      <div class="studio-export">
        <label><span>Postcard caption <small>(optional)</small></span><input name="caption" maxlength="90" placeholder="A semester by the lake"></label>
        <button type="button" class="text-button" data-studio="export">Download postcard</button>
      </div>
      <p role="status" aria-live="polite" data-studio-status></p>
    </form>`;
  }
  const field=name=>form.elements.namedItem(name);
  const status=message=>{form.querySelector('[data-studio-status]').textContent=message;};
  function updateLibrary(){
    const starters=Object.fromEntries(Object.entries(gardenStarterLayouts).map(([id,item])=>['starter:'+id,item.name]));
    const saved=Object.fromEntries(getState().gardenLayouts.map(item=>['saved:'+item.id,item.name]));
    field('library').innerHTML='<option value="">New layout from the live Garden</option>'+
      '<optgroup label="Starter layouts">'+options(starters)+'</optgroup>'+
      (getState().gardenLayouts.length?'<optgroup label="Saved layouts">'+options(saved)+'</optgroup>':'');
    field('library').value=draft.id?'saved:'+draft.id:draft.starter?'starter:'+draft.starter:'';
    for(const action of ['delete','copy']){
      const button=form.querySelector('[data-studio="'+action+'"]');
      button.disabled=!draft.id;
      if(action==='delete'){button.textContent='Delete saved layout';delete button.dataset.confirm;}
    }
  }
  function weatherOptions(){
    field('weather').innerHTML=options({auto:'Rotate by season',...weatherBySeason[draft.appearance.season]});
    field('weather').value=draft.appearance.weather;
  }
  function populate(){
    updateLibrary();weatherOptions();
    field('layoutName').value=draft.name;
    field('through').value=draft.through;
    for(const key of [...Object.keys(gardenPieceOptions),'camera'])field(key).value=draft.design[key];
    for(const key of ['season','lighting','palette'])field(key).value=draft.appearance[key];
    render();
  }
  function landmarks(){
    return getState().gardenGrowth.filter(item=>movableGardenLandmark(item)&&(!draft.through||item.day<=draft.through));
  }
  function pointForSelected(){
    if(!selected)return null;
    const state=getState(),courses=gardenCourses(state.gardenGrowth,state.projects);
    const landmark=gardenLandmarkPositions(state.gardenGrowth,courses,draft.design.placements)
      .find(({item})=>gardenLandmarkKey(item)===selected);
    const [x,y]=landmark?.position||placementBounds.x;
    return landmark?clampGardenPlacement(x,y):null;
  }
  function updatePin(point=pointForSelected()){
    const stage=form.querySelector('.studio-stage'),pin=form.querySelector('.studio-pin');
    const [left,top,width,height]=gardenFrame(draft.design.camera);
    const visible=point&&point.x>=left&&point.x<=left+width&&point.y>=top&&point.y<=top+height;
    stage.toggleAttribute('data-placing',Boolean(point));pin.hidden=!visible;
    if(visible){
      pin.style.left=`${(point.x-left)/width*100}%`;
      pin.style.top=`${(point.y-top)/height*100}%`;
    }
    form.querySelector('.studio-placement').hidden=!point;
    if(point){
      field('x').value=point.x;field('y').value=point.y;
      form.querySelector('[data-studio="automatic"]').disabled=!Object.hasOwn(draft.design.placements,selected);
    }
    form.querySelector('[data-studio-placement-tip]').textContent=!point?(field('landmark').options.length>1?'Select a landmark to place it on the preview.':'Earn a tree, lantern, or cairn to place it here.'):
      visible?'Click the scene or drag the pin. You can also use the position sliders.':'The pin is outside this view. Choose Full landscape or use the position sliders.';
  }
  function render(){
    const state=getState(),history=state.gardenGrowth,courses=gardenCourses(history,state.projects);
    const savedLandmarks=landmarks();
    if(selected&&!savedLandmarks.some(item=>gardenLandmarkKey(item)===selected))selected='';
    field('landmark').innerHTML='<option value="">Choose a tree, lantern, or cairn</option>'+
      options(Object.fromEntries(savedLandmarks.map(item=>[gardenLandmarkKey(item),landmarkTypes[item.kind].name+' · '+item.title])));
    field('landmark').value=selected;
    scene=mountGardenPreview(form.querySelector('.studio-scene'),loadAppearance(draft.appearance),
      {history,courses,through:draft.through,design:draft.design});
    updatePin();
  }
  function writeCandidate({apply=false,copy=false}={}){
    const name=field('layoutName');
    name.setCustomValidity(name.value.trim()?'':'Enter a name for this layout.');
    if(!name.reportValidity()||!field('through').reportValidity())return;
    const layouts=getState().gardenLayouts;
    const old=layouts.find(item=>item.id===draft.id);
    if(draft.id&&!old){status('This saved layout was removed in another tab. Save a copy to keep your edits.');if(!copy)return;}
    const label=name.value.trim();
    const itemId=copy||!draft.id?crypto.randomUUID():draft.id;
    const [item]=loadGardenLayouts([{...draft,id:itemId,through:field('through').value,
      name:copy&&old?.name===label?label.slice(0,65)+' copy':label,savedOn:today()}]);
    if(!item)return;
    const next=old&&!copy?layouts.map(layout=>layout.id===itemId?item:layout):[...layouts,item];
    if(!commit(next,apply?item:null)){status('Could not save the layout.');return;}
    draft=structuredClone(item);field('layoutName').value=draft.name;updateLibrary();
    status(apply?'Layout saved and applied to the Garden.':'Layout saved.');
    notify(apply?'Garden layout applied.':'Garden layout saved.');
  }
  async function exportDraft(button){
    if(!field('through').reportValidity())return;
    render();
    button.disabled=true;
    status('Preparing postcard…');
    const currentForm=form;
    try{
      await download(scene,field('caption').value);
      if(currentForm===form&&form.isConnected)status('Postcard downloaded.');
    }catch{
      if(currentForm===form&&form.isConnected)status('Could not export the postcard. Try again.');
    }finally{button.disabled=false;}
  }
  function mount(element){
    form=element;
    if(!form)return;
    populate();
    const stage=form.querySelector('.studio-stage');
    const eventPoint=event=>{
      const pane=form.querySelector('.studio-scene svg').getBoundingClientRect(),[left,top,width,height]=gardenFrame(draft.design.camera);
      return clampGardenPlacement(left+(event.clientX-pane.left)/pane.width*width,top+(event.clientY-pane.top)/pane.height*height);
    };
    stage.addEventListener('pointerdown',event=>{
      if(!selected||event.button!==0)return;
      drag={pointer:event.pointerId};
      stage.setPointerCapture(event.pointerId);
      updatePin(eventPoint(event));
    });
    stage.addEventListener('pointermove',event=>{if(drag?.pointer===event.pointerId)updatePin(eventPoint(event));});
    stage.addEventListener('pointerup',event=>{
      if(drag?.pointer!==event.pointerId)return;
      draft.design.placements[selected]=eventPoint(event);drag=null;render();
    });
    stage.addEventListener('pointercancel',()=>{drag=null;updatePin();});
    form.addEventListener('input',event=>{if(event.target===field('layoutName'))field('layoutName').setCustomValidity('');});
    form.addEventListener('change',event=>{
      const {name,value}=event.target;
      if(name==='library'){
        const saved=value.startsWith('saved:')&&getState().gardenLayouts.find(item=>item.id===value.slice(6));
        const key=value.startsWith('starter:')?value.slice(8):'';
        const template=Object.hasOwn(gardenStarterLayouts,key)&&gardenStarterLayouts[key];
        open();
        if(saved)draft=structuredClone(saved);
        if(template)draft={...draft,starter:key,name:template.name,design:loadGardenDesign(template.design),
          appearance:loadAppearance({...draft.appearance,...template.appearance,palette:'seasonal'})};
        populate();
        status(saved?'Saved layout loaded for editing.':template?'Starter layout loaded for editing.':'Live Garden copied into a new draft.');
        return;
      }
      if(name==='landmark'){selected=value;updatePin();return;}
      if(name==='through'){if(!event.target.validity.valid)return;draft.through=value;render();return;}
      if(name==='x'||name==='y'){
        if(!selected)return;
        draft.design.placements[selected]=clampGardenPlacement(Number(field('x').value),Number(field('y').value));
      }else if(Object.hasOwn(gardenPieceOptions,name)||name==='camera')draft.design[name]=value;
      else if(['season','lighting','palette','weather'].includes(name)){
        draft.appearance=loadAppearance({...draft.appearance,[name]:value});
        if(name==='season')weatherOptions();
      }else return;
      render();
    });
    form.addEventListener('click',event=>{
      const button=event.target.closest('[data-studio]');
      if(!button)return;
      switch(button.dataset.studio){
        case 'copy':writeCandidate({copy:true});break;
        case 'reset':
          draft.design=loadGardenDesign();
          for(const key of [...Object.keys(gardenPieceOptions),'camera'])field(key).value=draft.design[key];
          render();status('Scenery reset in this draft.');break;
        case 'automatic':
          if(selected){delete draft.design.placements[selected];render();field('landmark').focus();}
          break;
        case 'export':exportDraft(button);break;
        case 'delete':
          if(!button.dataset.confirm){button.dataset.confirm='true';button.textContent='Confirm delete';return;}
          if(commit(getState().gardenLayouts.filter(item=>item.id!==draft.id),null)){
            draft.id='';updateLibrary();field('library').focus();status('Saved layout deleted. The draft is still open.');
          }
          break;
      }
    });
    form.addEventListener('submit',event=>{event.preventDefault();writeCandidate({apply:event.submitter?.value==='apply'});});
  }
  return {open,markup,mount};
}
