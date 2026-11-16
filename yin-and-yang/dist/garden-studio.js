import {gardenCameras,gardenPieceOptions,gardenStarterLayouts,gardenFrame,loadGardenDesign,loadGardenLayouts,
  gardenLandmarkKey,movableGardenLandmark,clampGardenPlacement,placementBounds,gardenActivities,defaultPavilionPosition,pavilionBounds} from './garden-layout.js';
import {loadAppearance,seasonOptions,lightingOptions,gardenPalettes,weatherBySeason} from './garden-appearance.js';
import {gardenLandmarkPositions,mountGardenPreview} from './scenery.js';
import {gardenCourses,landmarkTypes} from './garden-growth.js';
import {pavilionFoundation,pavilionTransform} from './garden-ornaments.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const buildingTarget='building';
const pieceLabels={mountains:'Mountains',shoreline:'Shoreline',pavilion:'Building',foundation:'Building base',
  boat:'Boat',lantern:'Lantern',path:'Path'};
const waterfrontPieces=['pavilion','foundation','boat','lantern'];
const options=values=>Object.entries(values).map(([key,label])=>`<option value="${escape(key)}">${escape(label)}</option>`).join('');
const select=(name,label,values)=>`<label>${label}<select name="${name}">${options(values)}</select></label>`;

export function createGardenStudio({getState,getAppearance,getDesign,commit,download,today,notify}){
  let draft,form,selected='',scene=null,drag=null;
  function open(){
    draft={id:'',name:'',through:'',design:loadGardenDesign(getDesign()),appearance:getAppearance()};
    selected='';drag=null;
  }
  function markup(){
    return `<form id="garden-studio-form">
      <div class="studio-library">
        <label>Layout library<select name="library"></select></label>
        <button type="button" class="text-button" data-studio="copy">Save a copy</button>
        <button type="button" class="text-button" data-studio="delete">Delete saved layout</button>
      </div>
      <fieldset class="studio-activities">
        <legend>Layout by activity</legend>
        <div class="studio-control-grid">${Object.entries(gardenActivities).map(([activity,label])=>
          `<label>${label}<select data-studio-activity="${activity}"></select></label>`).join('')}</div>
        <p class="studio-stage-help" data-studio-activity-status role="status"></p>
      </fieldset>
      <div class="studio-workspace">
        <div class="studio-canvas-column">
          <div class="studio-stage">
            <div class="garden-scene-preview studio-scene" aria-hidden="true"></div>
            <span class="studio-pin" aria-hidden="true" hidden></span>
          </div>
          <p class="studio-stage-help" data-studio-placement-tip></p>
          <div class="studio-landmarks">
            <label>Move scenery<select name="landmark"></select></label>
            <div class="studio-placement" hidden>
              <label>Left to right<input type="range" name="x" min="${placementBounds.x[0]}" max="${placementBounds.x[1]}"></label>
              <label>Back to front<input type="range" name="y" min="${placementBounds.y[0]}" max="${placementBounds.y[1]}"></label>
              <button type="button" class="text-button" data-studio="automatic">Reset position</button>
              <small class="studio-foundation-note" data-studio-foundation hidden></small>
            </div>
          </div>
        </div>
        <div class="studio-settings">
          <fieldset><legend>Scenery</legend><div class="studio-control-grid">
          ${Object.entries(gardenPieceOptions).filter(([key])=>!waterfrontPieces.includes(key)).map(([key,values])=>select(key,pieceLabels[key],values)).join('')}
          ${select('camera','View',Object.fromEntries(Object.entries(gardenCameras).map(([key,item])=>[key,item.name])))}
          </div></fieldset>
          <fieldset><legend>Buildings, boats and lanterns</legend><div class="studio-control-grid">
            ${waterfrontPieces.map(key=>select(key,pieceLabels[key],gardenPieceOptions[key])).join('')}
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
        <p class="studio-stage-help" data-studio-default-hint hidden>Save and apply updates the default Garden. Assigned activities still use their chosen layouts.</p>
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
  function updateActivityChoices(){
    const {gardenLayouts,gardenActivityLayouts}=getState();
    const activityOptions='<option value="">Default Garden</option>'+gardenLayouts.map(item=>
      `<option value="${escape(item.id)}">${escape(item.name)}</option>`).join('');
    for(const select of form.querySelectorAll('[data-studio-activity]')){
      select.innerHTML=activityOptions;
      select.value=gardenActivityLayouts[select.dataset.studioActivity]||'';
      select.disabled=!gardenLayouts.length;
    }
    form.querySelector('[data-studio-default-hint]').hidden=!Object.keys(gardenActivityLayouts).length;
    form.querySelector('[data-studio-activity-status]').textContent=gardenLayouts.length?
      'Layouts switch automatically as you change timer modes or open Evening lights.':'Save a layout to assign it to Focus, Rest, or Shutdown.';
  }
  function weatherOptions(){
    field('weather').innerHTML=options({auto:'Rotate by season',...weatherBySeason[draft.appearance.season]});
    field('weather').value=draft.appearance.weather;
  }
  function populate(){
    updateLibrary();updateActivityChoices();weatherOptions();
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
    if(selected===buildingTarget)return draft.design.pavilionPosition||defaultPavilionPosition;
    const state=getState(),courses=gardenCourses(state.gardenGrowth,state.projects);
    const landmark=gardenLandmarkPositions(state.gardenGrowth,courses,draft.design.placements)
      .find(({item})=>gardenLandmarkKey(item)===selected);
    const [x,y]=landmark?.position||placementBounds.x;
    return landmark?clampGardenPlacement(x,y):null;
  }
  function selectedBounds(){return selected===buildingTarget?pavilionBounds:placementBounds;}
  function savePosition(point){
    if(selected===buildingTarget)draft.design.pavilionPosition=point;
    else draft.design.placements[selected]=point;
  }
  function previewPosition(point){
    if(selected===buildingTarget){
      for(const id of ['pavilion','pavilionLights']){
        scene.querySelector('[data-garden-piece="'+id+'"] > g').setAttribute('transform',pavilionTransform(point));
      }
    }
    updatePin(point,true);
  }
  function updatePin(point=pointForSelected(),previewing=false){
    const stage=form.querySelector('.studio-stage'),pin=form.querySelector('.studio-pin');
    const [left,top,width,height]=gardenFrame(draft.design.camera);
    const visible=point&&point.x>=left&&point.x<=left+width&&point.y>=top&&point.y<=top+height;
    stage.toggleAttribute('data-placing',Boolean(point));pin.hidden=!visible;
    if(visible){
      pin.style.left=`${(point.x-left)/width*100}%`;
      pin.style.top=`${(point.y-top)/height*100}%`;
    }
    form.querySelector('.studio-placement').hidden=!point;
    const building=selected===buildingTarget;
    const support=form.querySelector('[data-studio-foundation]');
    support.hidden=!building;
    if(building){
      const base=pavilionFoundation({...draft.design,pavilionPosition:previewing?point:draft.design.pavilionPosition});
      support.textContent={land:'Low plinth · on land',stone:'Stone outcrop',timber:'Timber landing'}[base];
    }
    if(point){
      for(const axis of ['x','y']){
        const input=field(axis),[min,max]=selectedBounds()[axis];
        input.min=min;input.max=max;input.value=point[axis];
      }
      form.querySelector('[data-studio="automatic"]').disabled=!(building?draft.design.pavilionPosition:Object.hasOwn(draft.design.placements,selected));
    }
    form.querySelector('[data-studio-placement-tip]').textContent=!point?'Choose the building or an earned landmark to move it.':
      visible?'Click the scene or drag the pin. You can also use the position sliders.':'The pin is outside this view. Choose Full landscape or use the position sliders.';
  }
  function render(){
    const state=getState(),history=state.gardenGrowth,courses=gardenCourses(history,state.projects);
    const savedLandmarks=landmarks();
    if(selected&&selected!==buildingTarget&&!savedLandmarks.some(item=>gardenLandmarkKey(item)===selected))selected='';
    field('landmark').innerHTML='<option value="">Choose what to move</option>'+
      options({[buildingTarget]:'Building · '+gardenPieceOptions.pavilion[draft.design.pavilion]})+
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
    draft=structuredClone(item);field('layoutName').value=draft.name;updateLibrary();updateActivityChoices();
    const message=apply?'Layout saved and applied as the default Garden.':'Garden layout saved.';
    status(message);notify(message);
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
      return clampGardenPlacement(left+(event.clientX-pane.left)/pane.width*width,top+(event.clientY-pane.top)/pane.height*height,selectedBounds());
    };
    stage.addEventListener('pointerdown',event=>{
      if(!selected||event.button!==0)return;
      drag={pointer:event.pointerId};
      stage.setPointerCapture(event.pointerId);
      previewPosition(eventPoint(event));
    });
    stage.addEventListener('pointermove',event=>{if(drag?.pointer===event.pointerId)previewPosition(eventPoint(event));});
    stage.addEventListener('pointerup',event=>{
      if(drag?.pointer!==event.pointerId)return;
      savePosition(eventPoint(event));drag=null;render();
    });
    stage.addEventListener('pointercancel',()=>{if(drag){drag=null;render();}});
    form.addEventListener('input',event=>{if(event.target===field('layoutName'))field('layoutName').setCustomValidity('');});
    form.addEventListener('change',event=>{
      const {name,value}=event.target;
      const activity=event.target.dataset.studioActivity;
      if(activity){
        const state=getState();
        const saved=commit(state.gardenLayouts,null,{...state.gardenActivityLayouts,[activity]:value});
        updateActivityChoices();
        const layout=state.gardenLayouts.find(item=>item.id===value);
        form.querySelector('[data-studio-activity-status]').textContent=saved?
          `${gardenActivities[activity]} uses ${layout?.name||'the default Garden'}.`:'Could not save the activity layout.';
        return;
      }
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
        savePosition(clampGardenPlacement(Number(field('x').value),Number(field('y').value),selectedBounds()));
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
          if(selected===buildingTarget)draft.design.pavilionPosition=null;
          else if(selected)delete draft.design.placements[selected];
          render();field('landmark').focus();
          break;
        case 'export':exportDraft(button);break;
        case 'delete':
          if(!button.dataset.confirm){button.dataset.confirm='true';button.textContent='Confirm delete';return;}
          if(commit(getState().gardenLayouts.filter(item=>item.id!==draft.id),null)){
            draft.id='';updateLibrary();updateActivityChoices();field('library').focus();status('Saved layout deleted. The draft is still open.');
          }
          break;
      }
    });
    form.addEventListener('submit',event=>{event.preventDefault();writeCandidate({apply:event.submitter?.value==='apply'});});
  }
  return {open,markup,mount};
}
