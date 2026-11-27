import {helpTopics,searchHelpResults} from './help-data.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const prose=value=>escape(value).replace(/`([^`]+)`/g,'<code>$1</code>');
const categories=[
  {id:'start',title:'Getting started',description:'First steps, shortcuts, and updates',groups:['Start here','Search & shortcuts']},
  {id:'focus',title:'Garden & focus',description:'Timer, sessions, music, and landscape',groups:['Focus & rest','Garden','Make it yours']},
  {id:'planning',title:'Tasks & planning',description:'Planner, projects, and Calendar',groups:['Tasks & projects','Planner','Calendar & planning','Calendar']},
  {id:'notes',title:'Notes',description:'Quick capture, inbox, and sticky notes',groups:['Thoughts & notes']},
  {id:'reading',title:'Reading & journal',description:'Books, annotations, and writing',groups:['Reading','Journal','Reading & journal']},
  {id:'stitch',title:'Stitchbook',description:'Crochet projects, counters, and yarn',groups:['Stitchbook']},
  {id:'data',title:'Backups & data',description:'Save, export, and restore your work',groups:['Your data']}
];
const find=id=>helpTopics.find(topic=>topic.id===id);
const categoryFor=topic=>categories.find(item=>item.groups.includes(topic.group));
const topicsFor=category=>category.groups.flatMap(group=>helpTopics.filter(topic=>topic.group===group));

export function installHelp({dialog,onAction,canNavigate=()=>true}){
  dialog.innerHTML=`<header class="help-header"><h2 id="help-title">Help guide</h2><button type="button" class="help-close" aria-label="Close Help">×</button></header>
    <div class="help-toolbar">
      <label class="help-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg>
        <span class="sr-only">Search Help by topic or button name</span>
        <input id="help-search" type="search" placeholder="Search topics or button names" autocomplete="off" aria-describedby="help-search-hint">
      </label>
      <span class="sr-only" id="help-search-hint">Press Enter to open the best match.</span>
      <button type="button" class="help-clear" aria-label="Clear Help search" hidden>Clear</button>
      <button type="button" data-help-topic="shortcuts" class="help-shortcuts">Shortcuts</button>
      <button type="button" data-help-action="versions" class="help-shortcuts">Version history</button>
    </div>
    <div class="help-layout"><nav id="help-topics" aria-label="Help categories">
      <button type="button" data-help-home>Help home</button>
      ${categories.map(({id,title})=>`<button type="button" data-help-category="${id}">${escape(title)}</button>`).join('')}
    </nav><div class="help-reading">
      <div class="help-mobile-nav"><label for="help-topic-select">Category</label><select id="help-topic-select">
        <option value="">All categories</option>${categories.map(({id,title})=>`<option value="${id}">${escape(title)}</option>`).join('')}</select></div>
      <div class="help-crumbs"><button type="button" id="help-back" aria-label="Previous help page">← Back</button><button type="button" data-help-home>Help home</button><button type="button" id="help-current-group" hidden></button></div>
      <article id="help-article" aria-labelledby="help-page-title"></article>
    </div></div>
    <footer class="help-footer"><span id="help-count" role="status"></span><button type="button" data-help-action="admin-sandbox">Admin sandbox</button><span><kbd>F1</kbd> Help <span aria-hidden="true">·</span> <kbd>Esc</kbd> Close</span></footer>`;
  const search=dialog.querySelector('#help-search'),nav=dialog.querySelector('#help-topics'),article=dialog.querySelector('#help-article');
  const select=dialog.querySelector('#help-topic-select'),back=dialog.querySelector('#help-back'),crumb=dialog.querySelector('#help-current-group');
  const count=dialog.querySelector('#help-count'),scroller=dialog.querySelector('.help-reading'),clear=dialog.querySelector('.help-clear');
  const crumbs=dialog.querySelector('.help-crumbs'),homeCrumb=crumbs.querySelector('[data-help-home]');
  const history=[];
  let page='',categoryId='',activeStep=-1,matches=[],opener=null,restoreFocus=true;

  const title=text=>`<h3 id="help-page-title" tabindex="-1">${escape(text)}</h3>`;
  const topicButton=(topic,extra='')=>`<button type="button" data-help-topic="${topic.id}" ${extra}>${escape(topic.title)}</button>`;
  function topicList(results,showCategory=false){
    return `<ul class="help-topic-links">${results.map(({topic,step=-1})=>`<li>
      <button type="button" data-help-topic="${topic.id}" data-help-step="${step}">
        <span>${showCategory?`<span class="help-result-category">${escape(categoryFor(topic)?.title||topic.group)}</span>`:''}
        <strong>${escape(topic.title)}</strong><small>${step<0?escape(topic.summary):prose(topic.steps[step])}</small></span><span aria-hidden="true">›</span>
      </button></li>`).join('')}</ul>`;
  }

  function renderPage(){
    const query=search.value.trim(),topic=find(page);
    const category=categories.find(item=>item.id===categoryId);
    matches=query?searchHelpResults(query):[];
    clear.hidden=!query;
    back.hidden=!history.length;
    homeCrumb.hidden=!query&&!category;
    crumbs.hidden=back.hidden&&homeCrumb.hidden;
    dialog.querySelector('.help-footer button').disabled=!canNavigate();
    dialog.querySelector('.help-toolbar [data-help-action]').disabled=!canNavigate();
    for(const button of nav.querySelectorAll('button')){
      const selected=!query&&(button.hasAttribute('data-help-home')?!category:button.dataset.helpCategory===categoryId);
      if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    }
    select.value=query?'':categoryId;
    crumb.hidden=!topic||!category||Boolean(query);
    crumb.textContent=category?.title||'';
    count.textContent=query?`${matches.length} ${matches.length===1?'match':'matches'}`:
      category?`${topicsFor(category).length} guides in ${category.title}`:`${helpTopics.length} how-to guides`;

    if(query){
      article.innerHTML=title(`Results for “${query}”`)+(matches.length?topicList(matches,true):
        '<p class="help-lead">No matching guides. Try a shorter phrase or a button name.</p><button type="button" class="help-action" data-help-home>Browse categories</button>');
    }else if(topic){
      const related=(topic.related||[]).map(find).filter(Boolean),neighbors=category?topicsFor(category):[],index=neighbors.indexOf(topic);
      article.innerHTML=`${title(topic.title)}<p class="help-lead">${escape(topic.summary)}</p>
        ${topic.steps?`<ol class="help-steps">${topic.steps.map((step,index)=>`<li ${index===activeStep?'class="help-matched-step" tabindex="-1"':''}>${prose(step)}</li>`).join('')}</ol>`:''}
        ${topic.shortcuts?`<dl class="help-key-list">${topic.shortcuts.map(([keys,meaning])=>`<div><dt><kbd>${escape(keys)}</kbd></dt><dd>${prose(meaning)}</dd></div>`).join('')}</dl>`:''}
        ${topic.tip?`<aside class="help-tip"><span>Good to know</span><p>${prose(topic.tip)}</p></aside>`:''}
        ${topic.action?`<button type="button" class="help-action" data-help-action="${topic.action}" ${canNavigate()?'':'disabled'}>${escape(topic.actionLabel)} <span aria-hidden="true">↗</span></button>`:''}
        ${related.length?`<section class="help-related"><h4>Related guides</h4>${topicList(related.map(topic=>({topic})))}</section>`:''}
        <nav class="help-page-nav" aria-label="Previous and next guide">
          ${index>0?topicButton(neighbors[index-1],'class="help-previous"'):''}
          ${index>=0&&index<neighbors.length-1?topicButton(neighbors[index+1],'class="help-next"'):''}
        </nav>`;
    }else if(category){
      article.innerHTML=`${title(category.title)}<p class="help-lead">${escape(category.description)}</p>
        ${category.groups.map(group=>`<section class="help-category-section">
          ${category.groups.length>1?`<h4>${escape(group)}</h4>`:''}
          ${topicList(helpTopics.filter(topic=>topic.group===group).map(topic=>({topic})))}</section>`).join('')}`;
    }else{
      article.innerHTML=`${title('Browse Help')}
        <div class="help-category-grid">${categories.map(({id,title,description})=>`<button type="button" data-help-category="${id}">
          <span><strong>${escape(title)}</strong><small>${escape(description)}</small></span><span aria-hidden="true">›</span></button>`).join('')}</div>
        <section class="help-get-started"><h4>Quick links</h4>
          ${topicList(['first-session','command-prompt','shortcuts'].map(id=>({topic:find(id)})))}</section>`;
    }
  }

  function show(id,{category='',step=-1,remember=true}={}){
    const topic=find(id);
    if(id&&!topic)return;
    const nextCategory=topic?categoryFor(topic)?.id||'':category;
    if(remember&&(page!==id||categoryId!==nextCategory||search.value)){
      history.push({page,categoryId,activeStep,query:search.value,scroll:scroller.scrollTop});
    }
    search.value='';page=id;categoryId=nextCategory;activeStep=step;renderPage();scroller.scrollTop=0;
    const matchedStep=article.querySelector('.help-matched-step');
    matchedStep?.scrollIntoView({block:'nearest'});
    (matchedStep||article.querySelector('#help-page-title')).focus({preventScroll:true});
  }

  search.addEventListener('input',()=>{renderPage();scroller.scrollTop=0;});
  search.addEventListener('keydown',event=>{
    if(event.isComposing||!matches.length)return;
    if(event.key==='Enter'){
      event.preventDefault();
      const [{topic,step}]=matches;show(topic.id,{step});
    }else if(event.key==='ArrowDown'){
      event.preventDefault();article.querySelector('[data-help-topic]')?.focus();
    }
  });
  article.addEventListener('keydown',event=>{
    if(!search.value.trim()||!['ArrowUp','ArrowDown'].includes(event.key))return;
    const results=[...article.querySelectorAll('[data-help-topic]')],index=results.indexOf(document.activeElement);
    if(index<0)return;
    event.preventDefault();
    (event.key==='ArrowUp'?(results[index-1]||search):(results[index+1]||results[index])).focus();
  });
  select.addEventListener('change',()=>show('',{category:select.value}));
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.classList.contains('help-close')){dialog.close();return;}
    if(button===clear){search.value='';renderPage();scroller.scrollTop=0;search.focus();return;}
    if(button.hasAttribute('data-help-topic')){show(button.dataset.helpTopic,{step:Number(button.dataset.helpStep??-1)});return;}
    if(button.hasAttribute('data-help-home')){show('');return;}
    if(button.dataset.helpCategory){show('',{category:button.dataset.helpCategory});return;}
    if(button===crumb){show('',{category:categoryId});return;}
    if(button===back){
      const previous=history.pop();
      if(!previous)return;
      ({page,categoryId,activeStep}=previous);search.value=previous.query;renderPage();scroller.scrollTop=previous.scroll;
      (previous.query?search:article.querySelector('#help-page-title')).focus({preventScroll:true});return;
    }
    if(button.dataset.helpAction&&canNavigate()){
      restoreFocus=false;dialog.close();onAction(button.dataset.helpAction);
    }
  });
  dialog.addEventListener('close',()=>{
    if(restoreFocus&&opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
  });
  return {
    open(id){
      if(dialog.open){if(id)show(id);else search.focus();return;}
      opener=document.activeElement;
      restoreFocus=true;
      dialog.showModal();
      if(id&&find(id)){
        history.length=0;
        show(id,{remember:false});
      }else{
        renderPage();search.focus();
      }
    }
  };
}
