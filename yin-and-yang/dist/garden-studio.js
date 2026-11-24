import {gardenCameras,gardenPieceOptions,defaultGardenDesign,gardenStarterLayouts,gardenFrame,loadGardenDesign,loadGardenLayouts,
  gardenLandmarkKey,movableGardenLandmark,clampGardenPlacement,placementBounds,gardenActivities,defaultPavilionPosition,pavilionBounds,
  gardenPropLayer,gardenPropPositionBounds,gardenPropTypes,gardenPropCategories,gardenPropLimit,gardenSizeBounds,gardenObjectSize,
  gardenPropBands,gardenPropBand,gardenPropStack,gardenPropsInOrder,moveGardenPropLayer,dropGardenPropLayer,
  gardenPropMembers,gardenPropMoveBounds,duplicateGardenProps,gardenPropAngle,
  gardenScenery,gardenSceneryObject,gardenSceneryTransform,gardenPropBounds,snapGardenPoint,
  loadGardenArrangements,placeGardenArrangement} from './garden-layout.js';
import {loadAppearance,seasonOptions,lightingOptions,gardenPalettes,weatherBySeason} from './garden-appearance.js';
import {gardenLandmarkPositions,mountGardenPreview} from './scenery.js';
import {gardenCourses,landmarkTypes} from './garden-growth.js';
import {foundationArt,gardenLantern,pavilionFoundation,pavilionTransform,styledBoat} from './garden-ornaments.js';
import {gardenPropTransform,gardenPropArtwork} from './garden-props.js';
import {gardenPieces} from './garden-pieces.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const buildingTarget='building',propPrefix='prop:',scenicPrefix='scenery:';
const layerActions={forward:'Bring forward',backward:'Send backward',front:'Bring to front',back:'Send to back'};
const layerStacks={sky:'Sky',front:gardenPropBands.front,middle:gardenPropBands.middle,back:gardenPropBands.back};
const layerIcons={
  grip:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  show:'M2 12q10-13 20 0-10 13-20 0zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  hide:'m3 3 18 18M9 6q7-3 13 6l-4 4M6 7l-4 5q6 8 13 6',
  lock:'M6 10h12v10H6zM8 10V7a4 4 0 0 1 8 0v3',
  unlock:'M6 10h12v10H6zM8 10V7a4 4 0 0 1 7-3'
};
const pieceLabels={mountains:'Mountains',shoreline:'Shoreline',path:'Path',pavilion:'Building',
  foundation:'Building base',boat:'Boat',lantern:'Lantern'};
const tools={
  select:['Move','M5 3l13 10-7 1-3 6L5 3z'],
  props:['Props','M12 3v18M3 12h18M5 5h14v14H5z'],
  layers:['Layers','m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5'],
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
  let undo=[],redo=[],savedDraft='',layerDrag='',beforeLayout;
  let snapEnabled=false,stampFree=false,unfilteredOriginalsOpen=null;
  const marked=new Set();
  function open(){
    draft={id:'',name:'',through:'',design:loadGardenDesign(getDesign()),appearance:getAppearance()};
    selected='';drag=null;layerDrag='';stamp='';stampPoint=null;undo=[];redo=[];zoom=1;tool='scene';terrainCategory='mountains';
    marked.clear();
    unfilteredOriginalsOpen=null;
    rememberLayout();
  }
  function rememberLayout(){
    savedDraft=fingerprint(draft);
    beforeLayout=structuredClone({design:draft.design,appearance:draft.appearance,through:draft.through});
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
          <button type="button" class="studio-save-button studio-compare" data-studio="compare" aria-pressed="false" title="Hold to preview the saved layout">Before</button>
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
            <div class="studio-before" aria-hidden="true" hidden>
              <div class="garden-scene-preview"></div><span>Before</span>
            </div>
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
              <fieldset class="studio-orientation" hidden>
                <legend>Orientation</legend>
                <label><span>Rotation <output name="propRotationValue" for="studio-prop-rotation">0°</output></span>
                  <input id="studio-prop-rotation" type="range" name="propRotation" min="-180" max="180" step="1" value="0">
                </label>
                <div class="studio-object-actions">
                  <button type="button" data-studio="flip-prop" aria-pressed="false">Flip horizontally</button>
                  <button type="button" data-studio="reset-orientation">Reset orientation</button>
                </div>
              </fieldset>
              <fieldset class="studio-layer-controls" hidden>
                <legend>Layer</legend>
                ${select('propBand','Scenery layer',gardenPropBands)}
                <p data-studio-layer-position></p>
                <div class="studio-layer-actions studio-object-actions">${Object.entries(layerActions).map(([direction,label])=>
                  `<button type="button" data-studio-layer="${direction}">${label}</button>`).join('')}</div>
              </fieldset>
              <div class="studio-object-actions"><button type="button" data-studio="automatic">Reset position</button>
                <button type="button" data-studio="hide-scenery" hidden>Hide original</button>
                <button type="button" data-studio="remove-prop" hidden>Remove prop</button></div>
            </div>
          </section>
          <section id="studio-tool-layers" data-tool-panel="layers" hidden>
            <h3>Layers</h3>
            <p>Props are listed front to back. Check two or more to group them, or click a row to select it.</p>
            <label>Filter by name<input type="search" name="layerFilter" placeholder="e.g. lantern" autocomplete="off"></label>
            <div class="studio-layer-actions studio-object-actions">
              <button type="button" data-studio="group-props">Group selected</button>
              <button type="button" data-studio="ungroup-props" hidden>Ungroup</button>
              <button type="button" data-studio="duplicate-props">Duplicate</button>
            </div>
            <div class="studio-layer-actions studio-object-actions">
              <button type="button" data-studio-layer="forward">Bring forward</button>
              <button type="button" data-studio-layer="backward">Send backward</button>
            </div>
            <details class="studio-prop-group studio-arrangements">
              <summary>Prop arrangements</summary>
              <div class="studio-arrangement-fields">
                <label>Arrangement name<input name="arrangementName" maxlength="70" placeholder="e.g. Lantern walk"></label>
                <button type="button" data-studio="save-arrangement">Save selection</button>
                <label>Saved arrangement<select name="arrangement"></select></label>
                <button type="button" data-studio="place-arrangement">Place in view</button>
                <p data-studio-arrangement-hint></p>
              </div>
            </details>
            <div class="studio-layer-list"></div>
            <details class="studio-prop-group studio-originals"><summary>Built-in scenery</summary>
              <ol class="studio-scenery-list"></ol>
            </details>
            <p data-layer-empty role="status" hidden>No layers match that name.</p>
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
          <button type="button" class="studio-inspector-toggle studio-snap" data-studio="snap" aria-pressed="false" title="Snap to nearby objects. Hold Alt for free placement.">Snap</button>
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
    syncSnap();
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
  function syncSnap(){
    const button=form.querySelector('[data-studio="snap"]');
    button.hidden=!['select','props'].includes(tool);
    button.setAttribute('aria-pressed',String(snapEnabled));
    paintSnapGuides();
  }
  function placementPoint(position,bounds,air=false,free=false,moving=false){
    if(!snapEnabled||free)return {point:clampGardenPlacement(position.x,position.y,bounds),guides:{}};
    const ids=new Set(moving?selectedMembers().map(item=>item.id):[]);
    const targets=draft.design.props.filter(item=>!item.hidden&&!ids.has(item.id)&&(gardenPropLayer(item.kind)!=='ground')===air);
    if(!air){
      targets.push(...Object.keys(gardenScenery).filter(id=>!moving||selected!==scenicPrefix+id)
        .map(id=>gardenSceneryObject(draft.design,id)).filter(item=>!item.hidden));
      if(!moving||selected!==buildingTarget)targets.push(draft.design.pavilionPosition||defaultPavilionPosition);
    }
    const {a,b}=scene.getScreenCTM();
    return snapGardenPoint(position,bounds,targets,Math.min(32,9/Math.hypot(a,b)));
  }
  function paintSnapGuides(point,guides={}){
    for(const axis of ['x','y']){
      const line=scene.querySelector('[data-snap-guide="'+axis+'"]'),target=guides[axis];
      line.setAttribute('visibility',target?'visible':'hidden');
      if(!target)continue;
      const cross=axis==='x'?'y':'x';
      line.setAttribute(axis+'1',point[axis]);line.setAttribute(axis+'2',point[axis]);
      line.setAttribute(cross+'1',Math.min(point[cross],target[cross])-24);
      line.setAttribute(cross+'2',Math.max(point[cross],target[cross])+24);
    }
  }
  function stampCandidate(position,free,preview=false){
    const {point,guides}=placementPoint(position,gardenPropPositionBounds(stamp),gardenPropLayer(stamp)!=='ground',free);
    if(preview)paintSnapGuides(point,guides);
    return {kind:stamp,...point,size:gardenObjectSize(field('stampSize').valueAsNumber)};
  }
  function paintStamp(){
    const ghost=scene.querySelector('.studio-ghost');
    const show=stampPoint&&tool==='props'&&stamp&&draft.design.props.length<gardenPropLimit;
    ghost.setAttribute('visibility',show?'visible':'hidden');
    if(show)ghost.setAttribute('transform',gardenPropTransform(stampCandidate(stampPoint,stampFree,true)));
    else paintSnapGuides();
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
  function selectedScenery(){
    const id=selected.slice(scenicPrefix.length);
    return selected.startsWith(scenicPrefix)&&Object.hasOwn(gardenScenery,id)?gardenSceneryObject(draft.design,id):null;
  }
  function editScenery(id,changes){
    const next={...draft.design.scenery[id],...changes},base=gardenScenery[id];
    for(const [field,initial] of Object.entries({x:base.x,y:base.y,size:100,hidden:false})){
      if(next[field]===initial)delete next[field];
    }
    if(Object.keys(next).length)draft.design.scenery[id]=next;
    else delete draft.design.scenery[id];
  }
  function selectedMembers(prop=selectedProp()){return prop?gardenPropMembers(draft.design.props,prop):[];}
  function groupMoveLocked(prop){return selectedMembers(prop).some(item=>item.locked);}
  function pointForSelected(){
    if(!selected)return null;
    if(selected===buildingTarget)return draft.design.pavilionPosition||defaultPavilionPosition;
    if(selected.startsWith(propPrefix))return selectedProp()||null;
    if(selected.startsWith(scenicPrefix))return selectedScenery();
    const state=getState(),courses=gardenCourses(state.gardenGrowth,state.projects);
    const landmark=gardenLandmarkPositions(state.gardenGrowth,courses,draft.design.placements,draft.design.landmarkSizes)
      .find(({item})=>gardenLandmarkKey(item)===selected);
    const [x,y]=landmark?.position||placementBounds.x;
    return landmark?clampGardenPlacement(x,y):null;
  }
  function selectedBounds(){
    const prop=selectedProp();
    return prop?gardenPropMoveBounds(selectedMembers(prop),prop):selected===buildingTarget?pavilionBounds:selectedScenery()?gardenPropBounds:placementBounds;
  }
  function selectedSize(){
    return selected===buildingTarget?draft.design.pavilionSize:selectedProp()?.size??selectedScenery()?.size??draft.design.landmarkSizes[selected]??100;
  }
  function savePosition(point){
    if(selected===buildingTarget)draft.design.pavilionPosition=point;
    else if(selected.startsWith(propPrefix)){
      const prop=selectedProp(),dx=point.x-prop.x,dy=point.y-prop.y;
      for(const item of selectedMembers(prop)){item.x+=dx;item.y+=dy;}
    }
    else if(selected.startsWith(scenicPrefix))editScenery(selectedScenery().id,point);
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
      const dx=point.x-prop.x,dy=point.y-prop.y;
      for(const item of selectedMembers(prop)){
        scene.querySelector('[data-garden-prop="'+item.id+'"]')?.setAttribute('transform',
          gardenPropTransform({...item,x:item.x+dx,y:item.y+dy}));
      }
    }
    const original=selectedScenery();
    if(original)scene.querySelector(`[data-garden-scenery="${original.id}"]`)?.setAttribute('transform',gardenSceneryTransform({...original,...point}));
    updatePin(point,true);
  }
  function updatePin(point=pointForSelected(),previewing=false){
    const stage=form.querySelector('.studio-stage'),pin=scene.querySelector('.studio-pin');
    const [left,top,width,height]=gardenFrame(draft.design.camera);
    const prop=selectedProp(),original=selectedScenery(),locked=Boolean(prop?.locked),hidden=Boolean(prop?.hidden||original?.hidden);
    const moveLocked=groupMoveLocked(prop);
    const visible=['select','layers'].includes(tool)&&!hidden&&point&&point.x>=left&&point.x<=left+width&&point.y>=top&&point.y<=top+height;
    stage.toggleAttribute('data-placing',tool==='select'&&Boolean(point)&&!moveLocked&&!hidden);pin.setAttribute('visibility',visible?'visible':'hidden');
    if(visible){
      pin.setAttribute('cx',point.x);pin.setAttribute('cy',point.y);
    }
    form.querySelector('.studio-placement').hidden=!point;
    form.querySelector('[data-studio-no-selection]').hidden=Boolean(point);
    const building=selected===buildingTarget;
    const support=form.querySelector('[data-studio-foundation]');
    support.hidden=!building;
    if(!previewing)updateLayerControls(prop);
    if(!previewing)updateOrientationControls(prop);
    if(!previewing){
      const hide=form.querySelector('[data-studio="hide-scenery"]');
      hide.hidden=!original;hide.textContent=original?.hidden?'Show original':'Hide original';
      for(const button of form.querySelectorAll('[data-scenery-action="select"]')){
        button.setAttribute('aria-pressed',String(button.closest('[data-scenery-id]').dataset.sceneryId===original?.id));
      }
    }
    form.querySelector('[data-studio="remove-prop"]').hidden=!prop;
    form.querySelector('[data-studio="remove-prop"]').disabled=locked;
    field('objectSize').disabled=locked;
    field('objectSize').value=selectedSize();field('objectSizeValue').value=selectedSize()+'%';
    if(building){
      const base=pavilionFoundation({...draft.design,pavilionPosition:previewing?point:draft.design.pavilionPosition});
      support.textContent={land:'Low plinth · on land',stone:'Stone outcrop',timber:'Timber landing',terrace:'Stone terrace'}[base];
    }
    if(point){
      for(const axis of ['x','y']){
        const input=field(axis),[min,max]=selectedBounds()[axis];
        input.min=min;input.max=max;input.value=point[axis];input.disabled=moveLocked||min===max;
      }
      const changed=original&&(original.x!==gardenScenery[original.id].x||original.y!==gardenScenery[original.id].y);
      form.querySelector('[data-studio="automatic"]').disabled=moveLocked||!(prop||changed||(building?draft.design.pavilionPosition:Object.hasOwn(draft.design.placements,selected)));
    }
    form.querySelector('[data-studio-placement-tip]').textContent=tool==='props'
      ?stamp?`Click the canvas to place ${gardenPropTypes[stamp].name.toLowerCase()}.${propLightingTip(gardenPropLayer(stamp))}`:'Choose a prop from the palette.'
      :tool!=='select'?'Changes are previewed on the canvas.'
      :!point?'Click an object or select it from the list.'
      :moveLocked?'Unlock all selected props in Layers to move them.'
      :hidden?'This object is hidden. Use Layers to show it.'
      :visible?'Drag to move. Arrow keys nudge the selected object.':'This object is outside the current view.';
  }
  function updateOrientationControls(prop){
    form.querySelector('.studio-orientation').hidden=!prop;
    if(!prop)return;
    field('propRotation').value=prop.rotation||0;
    field('propRotation').disabled=Boolean(prop.locked);
    field('propRotationValue').value=(prop.rotation||0)+'°';
    const flip=form.querySelector('[data-studio="flip-prop"]');
    flip.setAttribute('aria-pressed',String(Boolean(prop.flipped)));
    flip.disabled=Boolean(prop.locked);
    form.querySelector('[data-studio="reset-orientation"]').disabled=Boolean(prop.locked||!(prop.rotation||prop.flipped));
  }
  function setOrientation(prop,{rotation=prop.rotation,flipped=prop.flipped}){
    if(prop.locked)return;
    const before=structuredClone(draft);
    const angle=gardenPropAngle(rotation);
    if(angle)prop.rotation=angle;
    else delete prop.rotation;
    if(flipped)prop.flipped=true;
    else delete prop.flipped;
    record(before);render();
  }
  function updateLayerControls(prop){
    const controls=form.querySelector('.studio-layer-controls');
    controls.hidden=!prop;
    const stack=prop?gardenPropStack(prop):'';
    const order=gardenPropsInOrder(draft.design.props,stack),index=order.indexOf(prop);
    if(prop){
      const band=field('propBand');
      band.parentElement.hidden=stack==='sky';
      band.value=gardenPropBand(prop);
      band.disabled=Boolean(prop.locked);
      controls.querySelector('[data-studio-layer-position]').textContent=
        `${stack==='sky'?'Sky · ':''}${index+1} of ${order.length}, back to front`;
    }
    for(const button of form.querySelectorAll('[data-studio-layer]')){
      button.disabled=!prop||Boolean(prop.locked)||(['back','backward'].includes(button.dataset.studioLayer)?index===0:index===order.length-1);
    }
    updateGroupControls(prop);
  }
  function updateGroupControls(prop=selectedProp()){
    const members=selectedMembers(prop),ids=new Set(members.map(item=>item.id));
    for(const button of form.querySelectorAll('[data-layer-action="select"]')){
      button.setAttribute('aria-pressed',String(ids.has(button.closest('[data-layer-id]').dataset.layerId)));
    }
    const group=form.querySelector('[data-studio="group-props"]'),ungroup=form.querySelector('[data-studio="ungroup-props"]');
    group.hidden=members.length>1&&marked.size===0;
    group.disabled=marked.size<2;
    ungroup.hidden=!group.hidden;
    const duplicate=form.querySelector('[data-studio="duplicate-props"]');
    duplicate.textContent=members.length>1?'Duplicate group':'Duplicate';
    duplicate.disabled=!members.length||draft.design.props.length+members.length>gardenPropLimit;
    duplicate.title=members.length&&duplicate.disabled?`The layout limit is ${gardenPropLimit} props.`:'';
    updateArrangementControls();
  }
  function arrangementMembers(){
    return marked.size?draft.design.props.filter(prop=>marked.has(prop.id)):selectedMembers();
  }
  function chosenArrangement(){
    return getState().gardenArrangements.find(item=>item.id===field('arrangement').value);
  }
  function updateArrangementChoices(){
    const select=field('arrangement'),current=select.value,arrangements=getState().gardenArrangements;
    select.innerHTML='<option value="">Choose an arrangement</option>'+
      options(Object.fromEntries(arrangements.map(item=>[item.id,`${item.name} · ${item.props.length} props`])));
    select.value=arrangements.some(item=>item.id===current)?current:'';
    updateArrangementControls();
  }
  function updateArrangementControls(){
    const count=arrangementMembers().length,chosen=chosenArrangement();
    const fits=!chosen||draft.design.props.length+chosen.props.length<=gardenPropLimit;
    form.querySelector('[data-studio="save-arrangement"]').disabled=!count||!field('arrangementName').value.trim();
    form.querySelector('[data-studio="place-arrangement"]').disabled=!chosen||!fits;
    form.querySelector('[data-studio-arrangement-hint]').textContent=!fits?`This arrangement would exceed the ${gardenPropLimit}-prop limit.`:
      count?`${count} selected for saving`:'Select a group, or check the props to save.';
  }
  function saveArrangement(){
    const props=arrangementMembers(),name=field('arrangementName').value.trim();
    if(!props.length||!name)return;
    const state=getState(),id=crypto.randomUUID();
    const arrangements=loadGardenArrangements([...state.gardenArrangements,{id,name,props}]);
    if(!commit(state.gardenLayouts,null,undefined,arrangements)){status('Could not save the arrangement.');return;}
    field('arrangementName').value='';
    updateArrangementChoices();field('arrangement').value=id;updateArrangementControls();
    status('Prop arrangement saved.');
  }
  function placeArrangement(){
    const item=chosenArrangement();
    if(!item)return;
    const [x,y,w,h]=gardenFrame(draft.design.camera);
    const sky=item.props.every(prop=>gardenPropLayer(prop.kind)!=='ground');
    const result=placeGardenArrangement(draft.design.props,item,{x:x+w/2,y:y+h*(sky?.2:.72)});
    if(!result)return;
    const before=structuredClone(draft);
    draft.design.props=result.props;
    selected=propPrefix+result.id;marked.clear();
    record(before);render();setTool('select');
    form.querySelector('[data-studio-tool="select"]').focus();
    status('Arrangement placed. Drag it to reposition.');
  }
  function renderLayerList(propOptions){
    const groups=new Map();
    for(const {groupId} of draft.design.props)if(groupId&&!groups.has(groupId))groups.set(groupId,groups.size+1);
    for(const id of marked)if(!draft.design.props.some(prop=>prop.id===id&&!prop.groupId))marked.delete(id);
    form.querySelector('.studio-layer-list').innerHTML=draft.design.props.length?
      Object.entries(layerStacks).map(([stack,label])=>{
        const rows=gardenPropsInOrder(draft.design.props,stack).reverse().map(prop=>{
          const name=escape(propOptions[propPrefix+prop.id]);
          const toggle=(action,verb,icon)=>`<button type="button" data-layer-action="${action}" aria-label="${verb} ${name}" title="${verb} ${name}">${toolIcon(layerIcons[icon])}</button>`;
          return `<li class="studio-layer-row" data-layer-id="${prop.id}" data-layer-name="${name}"${prop.hidden?' data-layer-hidden':''}>
            ${prop.groupId?'<span class="studio-group-link" aria-hidden="true">↳</span>':
              `<input type="checkbox" data-layer-mark aria-label="Select ${name} for grouping"${marked.has(prop.id)?' checked':''}>`}
            <span class="studio-layer-grip"${prop.locked?'':' draggable="true"'} aria-hidden="true">${toolIcon(layerIcons.grip)}</span>
            <button type="button" data-layer-action="select" aria-pressed="false">${propSwatch(prop.kind)}
              <span>${name}${prop.groupId?`<small>Group ${groups.get(prop.groupId)}</small>`:''}</span></button>
            ${toggle('hidden',prop.hidden?'Show':'Hide',prop.hidden?'hide':'show')}
            ${toggle('locked',prop.locked?'Unlock':'Lock',prop.locked?'lock':'unlock')}
          </li>`;
        }).join('');
        return `<div class="studio-layer-stack" data-layer-stack="${stack}">
          <h4>${label}</h4>${rows?`<ol aria-label="${label}">${rows}</ol>`:'<p>No props here.</p>'}</div>`;
      }).join(''):'<p>Choose Props to place your first object.</p>';
  }
  function filterLayers(){
    const query=field('layerFilter').value.trim().toLowerCase(),pane=form.querySelector('#studio-tool-layers');
    const originals=pane.querySelector('.studio-originals'),placed=pane.querySelector('.studio-layer-list');
    const filterRows=container=>{
      let matches=0;
      for(const row of container.querySelectorAll('[data-layer-name]')){
        row.hidden=!row.dataset.layerName.toLowerCase().includes(query);
        if(!row.hidden)matches++;
      }
      return matches;
    };
    const propMatches=filterRows(placed),originalMatches=filterRows(originals);
    for(const stack of placed.querySelectorAll('[data-layer-stack]')){
      stack.hidden=Boolean(query&&!stack.querySelector('[data-layer-name]:not([hidden])'));
    }
    placed.hidden=Boolean(query&&!propMatches);
    originals.hidden=Boolean(query&&!originalMatches);
    if(query){
      unfilteredOriginalsOpen??=originals.open;
      if(originalMatches)originals.open=true;
    }else if(unfilteredOriginalsOpen!==null){
      originals.open=unfilteredOriginalsOpen;
      unfilteredOriginalsOpen=null;
    }
    pane.querySelector('[data-layer-empty]').hidden=!query||Boolean(propMatches+originalMatches);
  }
  function propLightingTip(layer){
    if(layer==='day')return ' Visible in Day lighting.';
    if(layer==='night')return ' Visible when stars are out.';
    return '';
  }
  function render(){
    const inspector=form.querySelector('#studio-settings'),layerScroll=tool==='layers'?inspector.scrollTop:null;
    showBefore(false);
    const state=getState(),history=state.gardenGrowth,courses=gardenCourses(history,state.projects);
    const savedLandmarks=landmarks(),props=draft.design.props;
    if(selected&&selected!==buildingTarget&&!selectedProp()&&!selectedScenery()&&!savedLandmarks.some(item=>gardenLandmarkKey(item)===selected))selected='';
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
      `<optgroup label="Built-in scenery">${options(Object.fromEntries(Object.entries(gardenScenery).map(([id,item])=>[scenicPrefix+id,item.name])))}</optgroup>`+
      options(Object.fromEntries(savedLandmarks.map(item=>[gardenLandmarkKey(item),landmarkTypes[item.kind].name+' · '+item.title])));
    field('landmark').value=selected;
    renderLayerList(propOptions);
    updateArrangementChoices();
    form.querySelector('.studio-scenery-list').innerHTML=Object.keys(gardenScenery).map(id=>{
      const {name,kind,hidden}=gardenSceneryObject(draft.design,id);
      return `<li class="studio-layer-row studio-scenery-row" data-scenery-id="${id}" data-layer-name="${escape(name)}"${hidden?' data-layer-hidden':''}>
        <button type="button" data-scenery-action="select" aria-pressed="false">${propSwatch(kind)}<span>${name}</span></button>
        <button type="button" data-scenery-action="toggle" aria-label="${hidden?'Show':'Hide'} ${name}">${toolIcon(layerIcons[hidden?'hide':'show'])}</button>
      </li>`;
    }).join('');
    filterLayers();
    scene=mountGardenPreview(form.querySelector('.studio-scene'),loadAppearance(draft.appearance),
      {history,courses,through:draft.through,design:draft.design});
    scene.insertAdjacentHTML('beforeend','<g class="studio-ghost" data-live-scenery visibility="hidden"></g><g class="studio-snap-guides" data-live-scenery><line data-snap-guide="x"/><line data-snap-guide="y"/></g><circle class="studio-pin" data-live-scenery visibility="hidden" r="5"/>');
    for(const button of form.querySelectorAll('[data-studio-style]')){
      button.setAttribute('aria-pressed',String(draft.design[button.dataset.studioPiece]===button.dataset.studioStyle));
    }
    updateCurrentStyle();
    syncStamp();updateHistoryControls();updatePin();
    if(layerScroll!==null)inspector.scrollTop=layerScroll;
  }
  function placeProp(position,free=false){
    if(!stamp||draft.design.props.length>=gardenPropLimit)return;
    const before=structuredClone(draft),id=crypto.randomUUID();
    draft.design.props.push({id,...stampCandidate(position,free)});
    stampPoint=null;
    selected=propPrefix+id;
    record(before);render();status(gardenPropTypes[stamp].name+' placed.');
  }
  function removeSelectedProp(){
    const prop=selectedProp();
    if(!prop||prop.locked)return;
    const before=structuredClone(draft);
    draft.design.props=draft.design.props.filter(item=>item!==prop);selected='';
    const remaining=selectedMembers(prop);
    if(prop.groupId&&remaining.length===1)delete remaining[0].groupId;
    record(before);render();status(gardenPropTypes[prop.kind].name+' removed.');
  }
  function changeGrouping(group){
    const members=group?draft.design.props.filter(prop=>marked.has(prop.id)&&!prop.groupId):selectedMembers();
    if(members.length<2)return;
    const before=structuredClone(draft),groupId=group?crypto.randomUUID():'';
    for(const prop of members){
      if(groupId)prop.groupId=groupId;
      else delete prop.groupId;
    }
    marked.clear();
    selected=propPrefix+members[0].id;
    record(before);render();
    form.querySelector(`[data-layer-id="${members[0].id}"] [data-layer-action="select"]`)?.focus({preventScroll:true});
    status(group?`Grouped ${members.length} props. Use Move to reposition the group.`:`Ungrouped ${members.length} props.`);
  }
  function duplicateSelection(){
    const prop=selectedProp();
    if(!prop)return;
    const result=duplicateGardenProps(draft.design.props,prop);
    if(!result)return;
    const before=structuredClone(draft);
    draft.design.props=result.props;
    selected=propPrefix+result.id;
    marked.clear();
    record(before);render();
    form.querySelector(`[data-layer-id="${result.id}"] [data-layer-action="select"]`)?.focus({preventScroll:true});
    status(prop.groupId?'Group duplicated.':'Prop duplicated.');
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
    draft=structuredClone(item);rememberLayout();field('layoutName').value=draft.name;
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
  function showBefore(show){
    const overlay=form.querySelector('.studio-before'),button=form.querySelector('[data-studio="compare"]');
    if(overlay.hidden===!show)return;
    overlay.hidden=!show;
    button.setAttribute('aria-pressed',String(show));
    if(!show)return;
    const {gardenGrowth:history,projects}=getState();
    mountGardenPreview(overlay.querySelector('.garden-scene-preview'),loadAppearance(beforeLayout.appearance),{
      history,courses:gardenCourses(history,projects),through:beforeLayout.through,
      design:{...beforeLayout.design,camera:draft.design.camera}
    });
  }
  function mount(element){
    form=element;
    if(!form)return;
    populate();
    const stage=form.querySelector('.studio-stage');
    const compare=form.querySelector('[data-studio="compare"]');
    compare.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();
      compare.focus({preventScroll:true});
      compare.setPointerCapture(event.pointerId);
      showBefore(true);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])compare.addEventListener(type,()=>showBefore(false));
    const comparisonKey=event=>[' ','Enter'].includes(event.key);
    compare.addEventListener('keydown',event=>{
      if(!comparisonKey(event))return;
      event.preventDefault();
      if(!event.repeat)showBefore(true);
    });
    compare.addEventListener('keyup',event=>{
      if(!comparisonKey(event))return;
      event.preventDefault();showBefore(false);
    });
    compare.addEventListener('click',event=>{
      if(event.detail===0)showBefore(form.querySelector('.studio-before').hidden);
    });
    function handleKey(event){
      if(event.target===field('layerFilter')){
        if(event.key==='Enter')event.preventDefault();
        if(event.key==='Escape'&&event.target.value){
          event.preventDefault();event.stopPropagation();
          event.target.value='';filterLayers();
        }
        return;
      }
      if(event.target===field('arrangementName')&&event.key==='Enter'){
        event.preventDefault();saveArrangement();return;
      }
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
      if(selectedProp()?.locked||selectedProp()?.hidden)return;
      if(event.key==='Delete'&&selectedProp()){event.preventDefault();removeSelectedProp();return;}
      if(groupMoveLocked())return;
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
      const prop=selectedProp(),air=prop&&gardenPropLayer(prop.kind)!=='ground';
      const result=placementPoint({x:point.x-drag.dx,y:point.y-drag.dy},selectedBounds(),air,event.altKey,true);
      paintSnapGuides(result.point,result.guides);
      return result.point;
    };
    stage.addEventListener('pointerdown',event=>{
      if(event.button!==0||drag)return;
      if(tool==='props'&&stamp){event.stopPropagation();placeProp(scenePoint(event),event.altKey);return;}
      if(tool!=='select')return;
      const propId=event.target.closest('[data-garden-prop]')?.dataset.gardenProp;
      const originalId=event.target.closest('[data-garden-scenery]')?.dataset.gardenScenery;
      const building=event.target.closest('[data-garden-piece="pavilion"]');
      const hit=propId?propPrefix+propId:originalId?scenicPrefix+originalId:building?buildingTarget:'';
      if(hit){selected=hit;field('landmark').value=hit;}
      if(groupMoveLocked()||selectedProp()?.hidden||selectedScenery()?.hidden){updatePin();return;}
      const anchor=pointForSelected(),point=scenePoint(event);
      if(!anchor)return;
      drag={pointer:event.pointerId,dx:hit?point.x-anchor.x:0,dy:hit?point.y-anchor.y:0,
        startX:event.clientX,startY:event.clientY,moved:!hit,before:structuredClone(draft)};
      stage.focus({preventScroll:true});
      stage.setPointerCapture(event.pointerId);
      if(drag.moved)previewPosition(eventPoint(event));
      else updatePin();
    });
    stage.addEventListener('pointermove',event=>{
      if(drag?.pointer===event.pointerId){
        drag.moved||=Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>=3;
        if(drag.moved)previewPosition(eventPoint(event));
      }
      else if(tool==='props'&&stamp&&event.pointerType==='mouse'&&draft.design.props.length<gardenPropLimit){
        stampPoint=scenePoint(event);stampFree=event.altKey;paintStamp();
      }
    });
    stage.addEventListener('pointerleave',()=>{stampPoint=null;paintStamp();});
    stage.addEventListener('pointerup',event=>{
      if(drag?.pointer!==event.pointerId)return;
      if(drag.moved){
        const next=eventPoint(event),previous=pointForSelected();
        if(previous.x!==next.x||previous.y!==next.y){savePosition(next);record(drag.before);}
      }
      drag=null;render();
    });
    stage.addEventListener('pointercancel',()=>{if(drag){drag=null;render();}});
    const layerList=form.querySelector('.studio-layer-list');
    function endLayerDrag(){
      layerDrag='';
      layerList.querySelector('[data-layer-drop]')?.removeAttribute('data-layer-drop');
    }
    function layerDropTarget(event){
      const section=event.target.closest('[data-layer-stack]');
      const prop=draft.design.props.find(item=>item.id===layerDrag);
      if(!section||!prop||prop.locked)return;
      const stack=section.dataset.layerStack;
      if((gardenPropStack(prop)==='sky')!==(stack==='sky'))return;
      const row=event.target.closest('[data-layer-id]');
      if(row?.dataset.layerId===layerDrag)return;
      const rect=row?.getBoundingClientRect();
      const above=Boolean(rect&&event.clientY<rect.top+rect.height/2);
      return {stack,row,section,above};
    }
    layerList.addEventListener('dragstart',event=>{
      const grip=event.target.closest('[draggable="true"]');
      if(!grip)return;
      layerDrag=grip.closest('[data-layer-id]').dataset.layerId;
      event.dataTransfer.effectAllowed='move';
      event.dataTransfer.setData('text/plain',layerDrag);
    });
    layerList.addEventListener('dragover',event=>{
      layerList.querySelector('[data-layer-drop]')?.removeAttribute('data-layer-drop');
      const target=layerDropTarget(event);
      if(!target)return;
      event.preventDefault();
      event.dataTransfer.dropEffect='move';
      (target.row||target.section).dataset.layerDrop=target.row?(target.above?'above':'below'):'section';
    });
    layerList.addEventListener('dragleave',event=>{
      if(!layerList.contains(event.relatedTarget))layerList.querySelector('[data-layer-drop]')?.removeAttribute('data-layer-drop');
    });
    layerList.addEventListener('dragend',endLayerDrag);
    layerList.addEventListener('drop',event=>{
      const target=layerDropTarget(event),id=layerDrag;
      endLayerDrag();
      if(!target)return;
      event.preventDefault();
      const next=dropGardenPropLayer(draft.design.props,id,target.stack,target.row?.dataset.layerId,target.above);
      if(next===draft.design.props)return;
      const before=structuredClone(draft);
      selected=propPrefix+id;
      draft.design.props=next;
      record(before);render();
    });
    form.addEventListener('input',event=>{
      if(event.target===field('layerFilter')){filterLayers();return;}
      if(event.target===field('layoutName'))updateHistoryControls();
      if(event.target===field('arrangementName'))updateArrangementControls();
      if(event.target===field('stampSize')){field('stampSizeValue').value=event.target.value+'%';paintStamp();}
      if(event.target===field('objectSize'))field('objectSizeValue').value=event.target.value+'%';
      if(event.target===field('propRotation')){
        const prop=selectedProp();
        if(!prop||prop.locked)return;
        const rotation=gardenPropAngle(event.target.valueAsNumber);
        field('propRotationValue').value=rotation+'°';
        scene.querySelector(`[data-garden-prop="${prop.id}"]`)?.setAttribute('transform',gardenPropTransform({...prop,rotation}));
      }
    });
    form.addEventListener('change',event=>{
      const {name,value}=event.target;
      if(event.target.hasAttribute('data-layer-mark')){
        const id=event.target.closest('[data-layer-id]').dataset.layerId;
        if(event.target.checked)marked.add(id);
        else marked.delete(id);
        updateGroupControls();
        return;
      }
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
        rememberLayout();populate();
        status(saved?'Saved layout loaded for editing.':template?'Starter layout loaded for editing.':'Live Garden copied into a new draft.');
        return;
      }
      if(name==='landmark'){selected=value;updatePin();return;}
      if(name==='arrangement'){updateArrangementControls();return;}
      if(name==='propRotation'){
        const prop=selectedProp();
        if(prop)setOrientation(prop,{rotation:event.target.valueAsNumber});
        return;
      }
      if(name==='propBand'){
        const prop=selectedProp();
        if(!prop||prop.locked||gardenPropStack(prop)==='sky'||!Object.hasOwn(gardenPropBands,value)||gardenPropBand(prop)===value)return;
        const before=structuredClone(draft);
        if(value==='middle')delete prop.band;
        else prop.band=value;
        delete prop.order;
        record(before);render();
        return;
      }
      const before=structuredClone(draft);
      if(name==='through'){
        if(!event.target.validity.valid)return;
        draft.through=value;
      }else if(name==='x'||name==='y'){
        if(!selected||groupMoveLocked())return;
        savePosition(clampGardenPlacement(Number(field('x').value),Number(field('y').value),selectedBounds()));
      }else if(name==='objectSize'){
        if(!selected||selectedProp()?.locked)return;
        const size=gardenObjectSize(Number(value)),prop=selectedProp(),original=selectedScenery();
        if(selected===buildingTarget)draft.design.pavilionSize=size;
        else if(prop)prop.size=size;
        else if(original)editScenery(original.id,{size});
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
      const sceneryAction=event.target.closest('[data-scenery-action]');
      if(sceneryAction){
        const id=sceneryAction.closest('[data-scenery-id]').dataset.sceneryId;
        if(sceneryAction.dataset.sceneryAction==='select'){
          selected=scenicPrefix+id;field('landmark').value=selected;updatePin();
        }else{
          const before=structuredClone(draft);
          editScenery(id,{hidden:!gardenSceneryObject(draft.design,id).hidden});
          record(before);render();
          form.querySelector(`[data-scenery-id="${id}"] [data-scenery-action="toggle"]`).focus({preventScroll:true});
        }
        return;
      }
      const layerAction=event.target.closest('[data-layer-action]');
      if(layerAction){
        const id=layerAction.closest('[data-layer-id]').dataset.layerId;
        const action=layerAction.dataset.layerAction;
        if(action==='select'){
          selected=propPrefix+id;field('landmark').value=selected;updatePin();
        }else{
          const prop=draft.design.props.find(item=>item.id===id);
          const before=structuredClone(draft);
          if(prop[action])delete prop[action];
          else prop[action]=true;
          record(before);render();
          layerList.querySelector(`[data-layer-id="${id}"] [data-layer-action="${action}"]`)?.focus({preventScroll:true});
        }
        return;
      }
      const layerButton=event.target.closest('[data-studio-layer]');
      if(layerButton){
        const next=moveGardenPropLayer(draft.design.props,selectedProp()?.id,layerButton.dataset.studioLayer);
        if(next!==draft.design.props){
          const before=structuredClone(draft);
          draft.design.props=next;
          record(before);render();
        }
        return;
      }
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
        case 'save-arrangement':saveArrangement();break;
        case 'place-arrangement':placeArrangement();break;
        case 'snap':
          snapEnabled=!snapEnabled;syncSnap();paintStamp();
          status(snapEnabled?'Snap on. Hold Alt for free placement.':'Snap off. Place objects freely.');break;
        case 'hide-scenery':{
          const original=selectedScenery();
          if(!original)break;
          const before=structuredClone(draft);
          editScenery(original.id,{hidden:!original.hidden});
          record(before);render();break;
        }
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
        case 'group-props':changeGrouping(true);break;
        case 'ungroup-props':changeGrouping(false);break;
        case 'duplicate-props':duplicateSelection();break;
        case 'flip-prop':{
          const prop=selectedProp();
          if(prop)setOrientation(prop,{flipped:!prop.flipped});
          break;
        }
        case 'reset-orientation':{
          const prop=selectedProp();
          if(prop)setOrientation(prop,{rotation:0,flipped:false});
          break;
        }
        case 'copy':writeCandidate({copy:true});break;
        case 'reset':{
          const before=structuredClone(draft);
          draft.design=loadGardenDesign();
          record(before);syncFields();render();status('Scenery reset in this draft.');break;
        }
        case 'automatic':{
          if(groupMoveLocked())break;
          const before=structuredClone(draft);
          if(selected===buildingTarget)draft.design.pavilionPosition=null;
          else if(selected.startsWith(propPrefix)){
            const prop=selectedProp(),{x,y}=gardenPropTypes[prop.kind];savePosition(clampGardenPlacement(x,y,selectedBounds()));
          }else if(selectedScenery()){
            const {id}=selectedScenery(),{x,y}=gardenScenery[id];
            savePosition({x,y});
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
