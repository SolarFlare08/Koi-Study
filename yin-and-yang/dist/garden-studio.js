import {gardenCameras,gardenPieceOptions,defaultGardenDesign,gardenStarterLayouts,gardenFrame,loadGardenDesign,loadGardenLayouts,
  gardenLandmarkKey,movableGardenLandmark,clampGardenPlacement,placementBounds,gardenActivities,defaultPavilionPosition,pavilionBounds,gardenPropLayer,gardenPropPositionBounds,gardenPropTypes,gardenPropCategories,gardenPropLimit,gardenSizeBounds,gardenObjectSize} from './garden-layout.js';
import {loadAppearance,seasonOptions,lightingOptions,gardenPalettes,weatherBySeason} from './garden-appearance.js';
import {gardenLandmarkPositions,mountGardenPreview} from './scenery.js';
import {gardenCourses,landmarkTypes} from './garden-growth.js';
import {foundationArt,gardenLantern,pavilionFoundation,pavilionTransform,styledBoat} from './garden-ornaments.js';
import {gardenPropTransform,gardenPropArtwork} from './garden-props.js';
import {gardenPieces} from './garden-pieces.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const buildingTarget='building',propPrefix='prop:';
const pieceLabels={mountains:'Mountains',shoreline:'Shoreline',path:'Path',pavilion:'Building',
  foundation:'Building base',boat:'Boat',lantern:'Lantern'};
const tools={
  select:['Move','M5 3l13 10-7 1-3 6L5 3z'],
  props:['Props','M12 3v18M3 12h18M5 5h14v14H5z'],
  scene:['Terrain','M2 19l7-11 4 6 3-4 6 9H2zM7 11l2 2 2-2'],
  light:['Light','M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7m-10 10-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
  library:['Layouts','M3 6h7l2 2h9v11H3zM3 6V4h7l2 2h7v2']
};
const emptyWater='<path d="M-58-2q16 3 32 0m15 10q35 5 64 0m-72 10h38" fill="none" stroke="#d7e2d0" stroke-linecap="round" opacity=".58"/>';
const emptyOption='<path d="M-6 0H6" fill="none" stroke="#d7e2d0" stroke-width="1.7" stroke-linecap="round"/>';
const swatchArt={
  mountains:style=>['0 70 1600 500',gardenPieces.mountains.render(style)],
  shoreline:style=>['-4 623 340 279',gardenPieces.westBank.render(style)],
  path:style=>['1030 583 188 69',style==='none'?'<path d="M1040 630q42-18 81-14t88-17" fill="none" stroke="#a0b3a2" opacity=".8"/>':gardenPieces.path.render(style,defaultGardenDesign)],
  pavilion:style=>['1015 492 162 142',gardenPieces.pavilion.render(style,{...defaultGardenDesign,pavilion:style})],
  foundation:style=>['-75 -17 150 56',style==='auto'?
    `<g transform="translate(-35 1) scale(.63)">${foundationArt('land')}</g>
      <g transform="translate(31 1) scale(.63)">${foundationArt('stone')}</g>`:foundationArt(style)],
  boat:style=>style==='seasonal'?['-100 -58 200 87',
    `<g transform="translate(-49 -2) scale(.66)">${styledBoat('lotus')}</g><g transform="translate(43 5) scale(.66)">${styledBoat('sampan')}</g>`]:
    ['-81 -59 162 88',style==='none'?emptyWater:styledBoat(style)],
  lantern:style=>['-13 -14 26 29',style==='none'?emptyOption:gardenLantern(style,0,0)]
};
const toolIcon=d=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

const options=values=>Object.entries(values).map(([key,label])=>`<option value="${escape(key)}">${escape(label)}</option>`).join('');
const select=(name,label,values)=>`<label>${label}<select name="${name}">${options(values)}</select></label>`;
const sizeSlider=(name,label)=>`<label>${label} <output name="${name}Value">100%</output><input type="range" name="${name}" min="${gardenSizeBounds.min}" max="${gardenSizeBounds.max}" step="${gardenSizeBounds.step}" value="100"></label>`;

export function createGardenStudio({getState,getAppearance,getDesign,commit,download,today}){
  let draft,form,selected='',scene=null,drag=null,tool='select',stamp='',stampPoint=null,zoom=1,terrainCategory='mountains';
  let undo=[],redo=[],savedDraft='';
  function open(){
    draft={id:'',name:'',through:'',design:loadGardenDesign(getDesign()),appearance:getAppearance()};
    selected='';drag=null;stamp='';stampPoint=null;undo=[];redo=[];zoom=1;tool='scene';terrainCategory='mountains';
    savedDraft=fingerprint(draft);
  }
  function markup(){
    return `<form id="garden-studio-form" novalidate>
      <header class="studio-top">
        <div class="studio-title"><h2 id="panel-title">Garden Studio</h2><span data-studio-draft-state></span></div>
        <label class="studio-name"><span>Layout name <small>Optional</small></span><input name="layoutName" maxlength="70" placeholder="Automatic name"></label>
        <div class="studio-top-actions">
          <div class="studio-history">
            <button type="button" data-studio="undo" title="Undo (Ctrl+Z)" aria-label="Undo">${toolIcon('M9 6l-5 5 5 5M4 11h10a4 4 0 0 1 0 8')}</button>
            <button type="button" data-studio="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">${toolIcon('M15 6l5 5-5 5m5-5H10a4 4 0 0 0 0 8')}</button>
          </div>
          <button type="submit" class="studio-save-button">Save layout</button>
          <button type="submit" class="panel-primary" value="apply">Save &amp; apply</button>
          <button type="button" class="icon-button close-panel" aria-label="Close Garden Studio">${toolIcon('m6 6 12 12M18 6 6 18')}</button>
        </div>
      </header>
      <nav class="studio-tools" aria-label="Studio tools">${Object.entries(tools).map(([key,[label,path]])=>
        `<button type="button" data-studio-tool="${key}" aria-controls="studio-tool-${key}" aria-pressed="false">${toolIcon(path)}<span>${label}</span></button>`).join('')}</nav>
      <div class="studio-workspace">
        <div class="studio-board">
          <div class="studio-stage" tabindex="0" aria-label="Landscape canvas" aria-describedby="studio-canvas-tip">
            <div class="garden-scene-preview studio-scene" aria-hidden="true"></div>
          </div>
        </div>
        <aside class="studio-settings" id="studio-settings" aria-label="Tool controls">
          <section id="studio-tool-select" data-tool-panel="select">
            <h3>Move an object</h3>
            <label>Object<select name="landmark"></select></label>
            <p class="studio-selection-empty" data-studio-no-selection>Select an object on the canvas or from the list.</p>
            <div class="studio-placement" hidden>
              <label>Horizontal position<input type="range" name="x" min="${placementBounds.x[0]}" max="${placementBounds.x[1]}"></label>
              <label>Vertical position<input type="range" name="y" min="${placementBounds.y[0]}" max="${placementBounds.y[1]}"></label>
              <small class="studio-foundation-note" data-studio-foundation hidden></small>
              ${sizeSlider('objectSize','Object size')}
              <div class="studio-object-actions"><button type="button" data-studio="automatic">Reset position</button>
                <button type="button" data-studio="remove-prop" hidden>Remove prop</button></div>
            </div>
          </section>
          <section id="studio-tool-props" data-tool-panel="props" hidden>
            <div class="studio-inspector-heading">
              <h3>Prop library</h3><p data-studio-prop-count></p>
            </div>
            <p>Choose a prop, then click or tap the canvas to place it.</p>
            <div class="studio-stamp-controls">
              ${sizeSlider('stampSize','Placement size')}
              <button type="button" data-studio="place-center" disabled>Place in view</button>
            </div>
            <div class="studio-prop-library">${Object.entries(gardenPropCategories).map(([key,label])=>{
              const items=Object.entries(gardenPropTypes).filter(([,item])=>item.category===key)
                .sort(([,a],[,b])=>a.name.localeCompare(b.name,'en'));
              return `<details class="studio-prop-group">
                <summary><span class="studio-prop-group-label">${label}<span>${items.length} props</span></span></summary>
                <div class="studio-prop-palette" role="group" aria-label="${label}">
                  ${items.map(([kind,item])=>
                    `<button type="button" data-studio-stamp="${kind}" data-prop-layer="${gardenPropLayer(kind)}" aria-pressed="false">${propSwatch(kind)}<span>${item.name}</span></button>`).join('')}
                </div>
              </details>`;
            }).join('')}</div>
          </section>
          <section id="studio-tool-scene" data-tool-panel="scene" hidden>
            <h3>Terrain</h3>
            <div class="studio-terrain-categories" role="group" aria-label="Terrain categories">${Object.entries(pieceLabels).map(([key,label])=>
              `<button type="button" data-studio-category="${key}" aria-controls="studio-style-${key}" aria-pressed="false">${label}</button>`).join('')}</div>
            <p class="studio-current-style" data-studio-current-style></p>
            ${Object.entries(pieceLabels).map(([key,label])=>`<div id="studio-style-${key}" class="studio-style-palette" data-studio-style-group="${key}" role="group" aria-label="${label} styles" hidden>
              ${Object.entries(gardenPieceOptions[key]).map(([style,name])=>styleTile(key,style,name)).join('')}
            </div>`).join('')}
          </section>
          <section id="studio-tool-light" data-tool-panel="light" hidden>
            <h3>Light and weather</h3>
            <div class="studio-control-grid">
              ${select('season','Season',Object.fromEntries(Object.entries(seasonOptions).map(([key,item])=>[key,item.name])))}
              ${select('lighting','Lighting',lightingOptions)}
              ${select('palette','Palette',gardenPalettes)}
              <label>Weather<select name="weather"></select></label>
            </div>
          </section>
          <section id="studio-tool-library" data-tool-panel="library" hidden>
            <h3>Layouts</h3>
            <label>Layout library<select name="library"></select></label>
            <div class="studio-object-actions">
              <button type="button" data-studio="copy">Save a copy</button>
              <button type="button" data-studio="delete">Delete saved layout</button>
            </div>
            <fieldset class="studio-activities">
              <legend>Layout by activity</legend>
              <div class="studio-control-grid">${Object.entries(gardenActivities).map(([activity,label])=>
                `<label>${label}<select data-studio-activity="${activity}"></select></label>`).join('')}</div>
              <p class="studio-stage-help" data-studio-activity-status role="status"></p>
            </fieldset>
            <fieldset><legend>Archive and export</legend>
              <label>Archive landmarks through<input name="through" type="date" max="${today()}"></label>
              <label>Postcard caption<input name="caption" maxlength="90" placeholder="Optional caption"></label>
              <div class="studio-object-actions"><button type="button" data-studio="export">Download postcard</button><button type="button" data-postcard-viewpoints>Postcard viewpoints</button></div>
            </fieldset>
            <button type="button" class="text-button" data-studio="reset">Reset scenery</button>
            <p class="studio-stage-help" data-studio-default-hint hidden>Save &amp; apply updates the default Garden. Assigned activities use their chosen layouts.</p>
          </section>
        </aside>
      </div>
      <footer class="studio-status">
        <p id="studio-canvas-tip" data-studio-placement-tip></p>
        <p role="status" data-studio-status></p>
        <div class="studio-view">
          <button type="button" class="studio-inspector-toggle" aria-controls="studio-settings" aria-expanded="true" data-studio="toggle-settings">Hide panel</button>
          ${select('camera','View',Object.fromEntries(Object.entries(gardenCameras).map(([key,item])=>[key,item.name])))}
          <div class="studio-zoom" role="group" aria-label="Canvas zoom">
            <button type="button" data-studio="zoom-out" aria-label="Zoom out">−</button>
            <button type="button" data-studio="zoom-fit" title="Fit canvas" aria-label="Fit canvas">Fit</button>
            <button type="button" data-studio="zoom-in" aria-label="Zoom in">+</button>
          </div>
        </div>
      </footer>
    </form>`;
  }
  function styleTile(key,style,label){
    const [viewBox,art]=swatchArt[key](style);
    return `<button type="button" data-studio-style="${style}" data-studio-piece="${key}" aria-pressed="false">
      <svg viewBox="${viewBox}" aria-hidden="true">${art}</svg><span>${label}</span></button>`;
  }
  function propSwatch(kind){
    const {group,viewBox}=gardenPropTypes[kind];
    const frame=viewBox||(group==='pavilion'?'-83 -112 166 138':group==='path'?'-75 -38 150 62':'-75 -87 150 111');
    return `<svg viewBox="${frame}" aria-hidden="true">${gardenPropArtwork(kind)}</svg>`;
  }
  const field=name=>form.elements.namedItem(name);
  const status=message=>{form.querySelector('[data-studio-status]').textContent=message;};
  function fingerprint({name,design,appearance,through}){
    const {season,lighting,palette,weather,motion}=appearance;
    return JSON.stringify({name,design,season,lighting,palette,weather,motion,through});
  }
  function hasUnsavedChanges(){
    return Boolean(form?.isConnected&&fingerprint({...draft,name:field('layoutName').value.trim()})!==savedDraft);
  }
  function canLeave(){
    return !hasUnsavedChanges()||window.confirm('Discard unsaved changes to this Garden layout?');
  }
  function updateHistoryControls(){
    const dirty=hasUnsavedChanges();
    const draftStatus=form.querySelector('[data-studio-draft-state]');
    draftStatus.textContent=dirty?'Unsaved changes':draft.id?'Saved layout':'Live Garden';
    draftStatus.classList.toggle('studio-unsaved',dirty);
    form.querySelector('[data-studio="undo"]').disabled=!undo.length;
    form.querySelector('[data-studio="redo"]').disabled=!redo.length;
  }
  function record(before){
    if(fingerprint(before)===fingerprint(draft))return;
    undo.push(before);
    if(undo.length>40)undo.shift();
    redo=[];
  }
  function useHistory(backwards){
    const source=backwards?undo:redo,destination=backwards?redo:undo;
    const previous=source.pop();
    if(!previous)return;
    destination.push(structuredClone(draft));
    Object.assign(draft,{design:previous.design,appearance:previous.appearance,through:previous.through});
    syncFields();render();
  }
  function setTool(key){
    tool=key;
    setSettingsVisible(true);
    for(const button of form.querySelectorAll('[data-studio-tool]'))button.setAttribute('aria-pressed',String(button.dataset.studioTool===key));
    for(const pane of form.querySelectorAll('[data-tool-panel]'))pane.hidden=pane.dataset.toolPanel!==key;
    stampPoint=null;
    syncStamp();updatePin();
  }
  function setSettingsVisible(visible){
    const settings=form.querySelector('#studio-settings'),button=form.querySelector('[data-studio="toggle-settings"]');
    settings.hidden=!visible;
    form.classList.toggle('studio-canvas-only',!visible);
    button.textContent=visible?'Hide panel':'Show panel';
    button.setAttribute('aria-expanded',String(visible));
  }
  function updateCurrentStyle(){
    form.querySelector('[data-studio-current-style]').textContent=`${pieceLabels[terrainCategory]} · ${gardenPieceOptions[terrainCategory][draft.design[terrainCategory]]}`;
  }
  function showTerrainCategory(key){
    terrainCategory=key;
    for(const button of form.querySelectorAll('[data-studio-category]')){
      button.setAttribute('aria-pressed',String(button.dataset.studioCategory===key));
    }
    for(const group of form.querySelectorAll('[data-studio-style-group]'))group.hidden=group.dataset.studioStyleGroup!==key;
    updateCurrentStyle();
  }
  function syncStamp(){
    const active=tool==='props'&&stamp&&draft.design.props.length<gardenPropLimit;
    form.querySelector('.studio-stage').toggleAttribute('data-stamping',Boolean(active));
    for(const button of form.querySelectorAll('[data-studio-stamp]')){
      button.setAttribute('aria-pressed',String(button.dataset.studioStamp===stamp));
      button.disabled=draft.design.props.length>=gardenPropLimit;
    }
    form.querySelector('[data-studio="place-center"]').disabled=!active;
    field('stampSize').disabled=!active;
    const ghost=scene.querySelector('.studio-ghost');
    if(active){
      const parent=gardenPropLayer(stamp)==='ground'?scene:scene.querySelector('[data-garden-piece="skyProps"]');
      if(ghost.parentNode!==parent)parent.append(ghost);
    }
    ghost.innerHTML=active?gardenPropArtwork(stamp):'';
    paintStamp();
  }
  function stampCandidate(position){
    return {kind:stamp,...clampGardenPlacement(position.x,position.y,gardenPropPositionBounds(stamp)),size:gardenObjectSize(field('stampSize').valueAsNumber)};
  }
  function paintStamp(){
    const ghost=scene.querySelector('.studio-ghost');
    const show=stampPoint&&tool==='props'&&stamp&&draft.design.props.length<gardenPropLimit;
    ghost.setAttribute('visibility',show?'visible':'hidden');
    if(show)ghost.setAttribute('transform',gardenPropTransform(stampCandidate(stampPoint)));
  }
  function setZoom(level){
    zoom=Math.max(1,Math.min(2.5,level));
    form.querySelector('.studio-board').style.setProperty('--studio-zoom',zoom);
    form.querySelector('[data-studio="zoom-fit"]').textContent=zoom===1?'Fit':`${Math.round(zoom*100)}%`;
    form.querySelector('[data-studio="zoom-out"]').disabled=zoom===1;
    form.querySelector('[data-studio="zoom-in"]').disabled=zoom===2.5;
  }
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
  function syncFields(){
    weatherOptions();
    field('through').value=draft.through;
    field('camera').value=draft.design.camera;
    for(const key of ['season','lighting','palette'])field(key).value=draft.appearance[key];
  }
  function populate(){
    updateLibrary();updateActivityChoices();syncFields();
    field('layoutName').value=draft.name;
    field('stampSize').value=100;field('stampSizeValue').value='100%';
    render();showTerrainCategory(terrainCategory);setTool(tool);setZoom(zoom);
  }
  function landmarks(){
    return getState().gardenGrowth.filter(item=>movableGardenLandmark(item)&&(!draft.through||item.day<=draft.through));
  }
  function selectedProp(){return draft.design.props.find(item=>propPrefix+item.id===selected);}
  function pointForSelected(){
    if(!selected)return null;
    if(selected===buildingTarget)return draft.design.pavilionPosition||defaultPavilionPosition;
    if(selected.startsWith(propPrefix))return selectedProp()||null;
    const state=getState(),courses=gardenCourses(state.gardenGrowth,state.projects);
    const landmark=gardenLandmarkPositions(state.gardenGrowth,courses,draft.design.placements,draft.design.landmarkSizes)
      .find(({item})=>gardenLandmarkKey(item)===selected);
    const [x,y]=landmark?.position||placementBounds.x;
    return landmark?clampGardenPlacement(x,y):null;
  }
  function selectedBounds(){return selected===buildingTarget?pavilionBounds:selected.startsWith(propPrefix)?gardenPropPositionBounds(selectedProp()?.kind):placementBounds;}
  function selectedSize(){
    return selected===buildingTarget?draft.design.pavilionSize:selectedProp()?.size??draft.design.landmarkSizes[selected]??100;
  }
  function savePosition(point){
    if(selected===buildingTarget)draft.design.pavilionPosition=point;
    else if(selected.startsWith(propPrefix))Object.assign(selectedProp(),point);
    else draft.design.placements[selected]=point;
  }
  function previewPosition(point){
    if(selected===buildingTarget){
      for(const id of ['pavilion','pavilionLights']){
        scene.querySelector('[data-garden-piece="'+id+'"] > g').setAttribute('transform',pavilionTransform(point,draft.design.pavilionSize));
      }
    }
    const prop=selectedProp();
    if(prop){
      for(const node of scene.querySelectorAll('[data-garden-prop="'+prop.id+'"]')){
        node.setAttribute('transform',gardenPropTransform({...prop,...point}));
      }
    }
    updatePin(point,true);
  }
  function updatePin(point=pointForSelected(),previewing=false){
    const stage=form.querySelector('.studio-stage'),pin=scene.querySelector('.studio-pin');
    const [left,top,width,height]=gardenFrame(draft.design.camera);
    const visible=tool==='select'&&point&&point.x>=left&&point.x<=left+width&&point.y>=top&&point.y<=top+height;
    stage.toggleAttribute('data-placing',tool==='select'&&Boolean(point));pin.setAttribute('visibility',visible?'visible':'hidden');
    if(visible){
      pin.setAttribute('cx',point.x);pin.setAttribute('cy',point.y);
    }
    form.querySelector('.studio-placement').hidden=!point;
    form.querySelector('[data-studio-no-selection]').hidden=Boolean(point);
    const building=selected===buildingTarget;
    const support=form.querySelector('[data-studio-foundation]');
    support.hidden=!building;
    const prop=selectedProp();
    form.querySelector('[data-studio="remove-prop"]').hidden=!prop;
    field('objectSize').value=selectedSize();field('objectSizeValue').value=selectedSize()+'%';
    if(building){
      const base=pavilionFoundation({...draft.design,pavilionPosition:previewing?point:draft.design.pavilionPosition});
      support.textContent={land:'Low plinth · on land',stone:'Stone outcrop',timber:'Timber landing',terrace:'Stone terrace'}[base];
    }
    if(point){
      for(const axis of ['x','y']){
        const input=field(axis),[min,max]=selectedBounds()[axis];
        input.min=min;input.max=max;input.value=point[axis];
      }
      form.querySelector('[data-studio="automatic"]').disabled=!(prop||(building?draft.design.pavilionPosition:Object.hasOwn(draft.design.placements,selected)));
    }
    form.querySelector('[data-studio-placement-tip]').textContent=tool==='props'
      ?stamp?`Click the canvas to place ${gardenPropTypes[stamp].name.toLowerCase()}.${propLightingTip(gardenPropLayer(stamp))}`:'Choose a prop from the palette.'
      :tool!=='select'?'Changes are previewed on the canvas.'
      :!point?'Click an object or select it from the list.'
      :visible?'Drag to move. Arrow keys nudge the selected object.':'This object is outside the current view.';
  }
  function propLightingTip(layer){
    if(layer==='day')return ' Visible in Day lighting.';
    if(layer==='night')return ' Visible when stars are out.';
    return '';
  }
  function render(){
    const state=getState(),history=state.gardenGrowth,courses=gardenCourses(history,state.projects);
    const savedLandmarks=landmarks(),props=draft.design.props;
    if(selected&&selected!==buildingTarget&&!selectedProp()&&!savedLandmarks.some(item=>gardenLandmarkKey(item)===selected))selected='';
    const counts=new Map();
    const propOptions=Object.fromEntries(props.map(prop=>{
      const count=(counts.get(prop.kind)||0)+1;
      counts.set(prop.kind,count);
      return [propPrefix+prop.id,gardenPropTypes[prop.kind].name+(count>1?' '+count:'')];
    }));
    form.querySelector('[data-studio-prop-count]').textContent=props.length?`${props.length} / ${gardenPropLimit} props`:'No props placed yet.';
    field('landmark').innerHTML='<option value="">Choose what to move</option>'+
      options({[buildingTarget]:'Building · '+gardenPieceOptions.pavilion[draft.design.pavilion]})+
      (props.length?`<optgroup label="Props">${options(propOptions)}</optgroup>`:'')+
      options(Object.fromEntries(savedLandmarks.map(item=>[gardenLandmarkKey(item),landmarkTypes[item.kind].name+' · '+item.title])));
    field('landmark').value=selected;
    scene=mountGardenPreview(form.querySelector('.studio-scene'),loadAppearance(draft.appearance),
      {history,courses,through:draft.through,design:draft.design});
    scene.insertAdjacentHTML('beforeend','<g class="studio-ghost" data-live-scenery visibility="hidden"></g><circle class="studio-pin" data-live-scenery visibility="hidden" r="5"/>');
    for(const button of form.querySelectorAll('[data-studio-style]')){
      button.setAttribute('aria-pressed',String(draft.design[button.dataset.studioPiece]===button.dataset.studioStyle));
    }
    updateCurrentStyle();
    syncStamp();updateHistoryControls();updatePin();
  }
  function placeProp(position){
    if(!stamp||draft.design.props.length>=gardenPropLimit)return;
    const before=structuredClone(draft),id=crypto.randomUUID();
    draft.design.props.push({id,...stampCandidate(position)});
    stampPoint=null;
    selected=propPrefix+id;
    record(before);render();status(gardenPropTypes[stamp].name+' placed.');
  }
  function removeSelectedProp(){
    const prop=selectedProp();
    if(!prop)return;
    const before=structuredClone(draft);
    draft.design.props=draft.design.props.filter(item=>item!==prop);selected='';
    record(before);render();status(gardenPropTypes[prop.kind].name+' removed.');
  }
  function writeCandidate({apply=false,copy=false}={}){
    const name=field('layoutName');
    if(!field('through').validity.valid){setTool('library');field('through').reportValidity();return;}
    const layouts=getState().gardenLayouts;
    const old=layouts.find(item=>item.id===draft.id);
    if(draft.id&&!old){status('This saved layout was removed in another tab. Save a copy to keep your edits.');if(!copy)return;}
    let label=name.value.trim()||old?.name;
    if(!label){
      const used=new Set(layouts.map(layout=>layout.name.toLowerCase()));
      let number=1;
      while(used.has(`garden layout ${number}`))number++;
      label=`Garden layout ${number}`;
    }
    const itemId=copy||!draft.id?crypto.randomUUID():draft.id;
    const [item]=loadGardenLayouts([{...draft,id:itemId,through:field('through').value,
      name:copy&&old?.name===label?label.slice(0,65)+' copy':label,savedOn:today()}]);
    if(!item)return;
    const next=old&&!copy?layouts.map(layout=>layout.id===itemId?item:layout):[...layouts,item];
    if(!commit(next,apply?item:null)){status('Could not save the layout.');return;}
    draft=structuredClone(item);savedDraft=fingerprint(draft);field('layoutName').value=draft.name;
    updateLibrary();updateActivityChoices();updateHistoryControls();
    const message=apply?'Layout saved and applied as the default Garden.':'Garden layout saved.';
    status(message);
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
    function handleKey(event){
      if(event.key==='Escape'&&tool==='props'&&stamp){
        event.preventDefault();event.stopPropagation();stamp='';setTool('props');return;
      }
      if(event.target.matches('input,select,textarea'))return;
      const command=(event.ctrlKey||event.metaKey)&&!event.altKey;
      if(command&&['z','y'].includes(event.key.toLowerCase())){
        event.preventDefault();event.stopPropagation();
        useHistory(event.key.toLowerCase()==='z'&&!event.shiftKey);return;
      }
      if(event.target!==stage||tool!=='select')return;
      if(event.key==='Delete'&&selectedProp()){event.preventDefault();removeSelectedProp();return;}
      const offset={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      const point=pointForSelected();
      if(!offset||!point)return;
      event.preventDefault();
      const before=structuredClone(draft),distance=event.shiftKey?16:3;
      savePosition(clampGardenPlacement(point.x+offset[0]*distance,point.y+offset[1]*distance,selectedBounds()));
      record(before);render();
    }
    const scenePoint=event=>new DOMPoint(event.clientX,event.clientY).matrixTransform(scene.getScreenCTM().inverse());
    const eventPoint=event=>{
      const point=scenePoint(event);
      return clampGardenPlacement(point.x-(drag?.dx||0),point.y-(drag?.dy||0),selectedBounds());
    };
    stage.addEventListener('pointerdown',event=>{
      if(event.button!==0||drag)return;
      if(tool==='props'&&stamp){event.stopPropagation();placeProp(scenePoint(event));return;}
      if(tool!=='select')return;
      const propId=event.target.closest('[data-garden-prop]')?.dataset.gardenProp;
      const building=event.target.closest('[data-garden-piece="pavilion"]');
      const hit=propId?propPrefix+propId:building?buildingTarget:'';
      if(hit){selected=hit;field('landmark').value=hit;}
      const anchor=pointForSelected(),point=scenePoint(event);
      if(!anchor)return;
      drag={pointer:event.pointerId,dx:hit?point.x-anchor.x:0,dy:hit?point.y-anchor.y:0,before:structuredClone(draft)};
      stage.focus({preventScroll:true});
      stage.setPointerCapture(event.pointerId);
      previewPosition(eventPoint(event));
    });
    stage.addEventListener('pointermove',event=>{
      if(drag?.pointer===event.pointerId)previewPosition(eventPoint(event));
      else if(tool==='props'&&stamp&&event.pointerType==='mouse'&&draft.design.props.length<gardenPropLimit){
        stampPoint=scenePoint(event);paintStamp();
      }
    });
    stage.addEventListener('pointerleave',()=>{stampPoint=null;paintStamp();});
    stage.addEventListener('pointerup',event=>{
      if(drag?.pointer!==event.pointerId)return;
      const next=eventPoint(event),previous=pointForSelected();
      if(previous.x!==next.x||previous.y!==next.y){savePosition(next);record(drag.before);}
      drag=null;render();
    });
    stage.addEventListener('pointercancel',()=>{if(drag){drag=null;render();}});
    form.addEventListener('input',event=>{
      if(event.target===field('layoutName'))updateHistoryControls();
      if(event.target===field('stampSize')){field('stampSizeValue').value=event.target.value+'%';paintStamp();}
      if(event.target===field('objectSize'))field('objectSizeValue').value=event.target.value+'%';
    });
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
        if(!canLeave()){updateLibrary();return;}
        const saved=value.startsWith('saved:')&&getState().gardenLayouts.find(item=>item.id===value.slice(6));
        const key=value.startsWith('starter:')?value.slice(8):'';
        const template=Object.hasOwn(gardenStarterLayouts,key)&&gardenStarterLayouts[key];
        open();tool='library';
        if(saved)draft=structuredClone(saved);
        if(template)draft={...draft,starter:key,name:template.name,design:loadGardenDesign(template.design),
          appearance:loadAppearance({...draft.appearance,...template.appearance,palette:'seasonal'})};
        savedDraft=fingerprint(draft);populate();
        status(saved?'Saved layout loaded for editing.':template?'Starter layout loaded for editing.':'Live Garden copied into a new draft.');
        return;
      }
      if(name==='landmark'){selected=value;updatePin();return;}
      const before=structuredClone(draft);
      if(name==='through'){
        if(!event.target.validity.valid)return;
        draft.through=value;
      }else if(name==='x'||name==='y'){
        if(!selected)return;
        savePosition(clampGardenPlacement(Number(field('x').value),Number(field('y').value),selectedBounds()));
      }else if(name==='objectSize'){
        if(!selected)return;
        const size=gardenObjectSize(Number(value)),prop=selectedProp();
        if(selected===buildingTarget)draft.design.pavilionSize=size;
        else if(prop)prop.size=size;
        else if(size===100)delete draft.design.landmarkSizes[selected];
        else draft.design.landmarkSizes[selected]=size;
      }else if(name==='camera')draft.design.camera=value;
      else if(['season','lighting','palette','weather'].includes(name)){
        draft.appearance=loadAppearance({...draft.appearance,[name]:value});
        if(name==='season')weatherOptions();
      }else return;
      record(before);render();
    });
    form.addEventListener('keydown',handleKey);
    form.addEventListener('click',event=>{
      const toolButton=event.target.closest('[data-studio-tool]');
      if(toolButton){setTool(toolButton.dataset.studioTool);return;}
      const stampButton=event.target.closest('[data-studio-stamp]');
      if(stampButton){stamp=stampButton.dataset.studioStamp;syncStamp();updatePin();return;}
      const category=event.target.closest('[data-studio-category]');
      if(category){showTerrainCategory(category.dataset.studioCategory);return;}
      const style=event.target.closest('[data-studio-style]');
      if(style){
        const before=structuredClone(draft);
        draft.design[style.dataset.studioPiece]=style.dataset.studioStyle;
        record(before);render();return;
      }
      const button=event.target.closest('[data-studio]');
      if(!button)return;
      switch(button.dataset.studio){
        case 'toggle-settings':setSettingsVisible(form.querySelector('#studio-settings').hidden);break;
        case 'undo':useHistory(true);break;
        case 'redo':useHistory(false);break;
        case 'zoom-in':setZoom(zoom+.25);break;
        case 'zoom-out':setZoom(zoom-.25);break;
        case 'zoom-fit':setZoom(1);break;
        case 'place-center':{
          const [x,y,w,h]=gardenFrame(draft.design.camera);
          placeProp({x:x+w/2,y:y+h*(gardenPropLayer(stamp)==='ground'?.78:.18)});break;
        }
        case 'remove-prop':removeSelectedProp();field('landmark').focus();break;
        case 'copy':writeCandidate({copy:true});break;
        case 'reset':{
          const before=structuredClone(draft);
          draft.design=loadGardenDesign();
          record(before);syncFields();render();status('Scenery reset in this draft.');break;
        }
        case 'automatic':{
          const before=structuredClone(draft);
          if(selected===buildingTarget)draft.design.pavilionPosition=null;
          else if(selected.startsWith(propPrefix)){
            const prop=selectedProp(),{x,y}=gardenPropTypes[prop.kind];savePosition({x,y});
          }else if(selected)delete draft.design.placements[selected];
          record(before);render();field('landmark').focus();break;
        }
        case 'export':exportDraft(button);break;
        case 'delete':
          if(!button.dataset.confirm){button.dataset.confirm='true';button.textContent='Confirm delete';return;}
          if(commit(getState().gardenLayouts.filter(item=>item.id!==draft.id),null)){
            draft.id='';savedDraft='';updateLibrary();updateActivityChoices();updateHistoryControls();field('library').focus();status('Saved layout deleted. The draft is still open.');
          }
          break;
      }
    });
    form.addEventListener('submit',event=>{event.preventDefault();writeCandidate({apply:event.submitter?.value==='apply'});});
  }
  return {open,markup,mount,canLeave,hasUnsavedChanges,postcardScene:()=>({design:draft.design,appearance:draft.appearance,through:draft.through})};
}
