import {helpTopics,searchHelp} from './help-data.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const prose=value=>escape(value).replace(/`([^`]+)`/g,'<code>$1</code>');
const groups=[...new Set(helpTopics.map(topic=>topic.group))];
const orderedTopics=groups.flatMap(group=>helpTopics.filter(topic=>topic.group===group));
const find=id=>helpTopics.find(topic=>topic.id===id);

export function installHelp({dialog,onAction,canNavigate=()=>true}){
  dialog.innerHTML=`<header class="help-header"><div><span class="help-eyebrow">YIN AND YANG · FIELD GUIDE</span><h2 id="help-title">Help guide</h2></div><button type="button" class="help-close" aria-label="Close Help">×</button></header>
    <div class="help-toolbar"><label class="help-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg><span class="sr-only">Search the help guide</span><input id="help-search" type="search" placeholder="Search topics, e.g. “reading goal”…" autocomplete="off" aria-describedby="help-search-hint" autofocus></label><span class="sr-only" id="help-search-hint">Press Enter to open the first matching topic.</span><button type="button" data-help-topic="shortcuts" class="help-shortcuts">Shortcuts</button></div>
    <div class="help-layout"><nav id="help-topics" aria-label="Help topics"></nav><div class="help-reading"><div class="help-mobile-nav"><label for="help-topic-select">Browse topics</label><select id="help-topic-select"></select></div><div class="help-crumbs"><button type="button" id="help-back" aria-label="Previous help page">← Back</button><button type="button" data-help-home>All topics</button><span id="help-current-group"></span></div><article id="help-article" aria-labelledby="help-page-title"></article></div></div>
    <footer class="help-footer"><span id="help-count" role="status"></span><span><kbd>F1</kbd> Help <span aria-hidden="true">·</span> <kbd>Esc</kbd> Close</span></footer>`;
  const search=dialog.querySelector('#help-search'),nav=dialog.querySelector('#help-topics'),article=dialog.querySelector('#help-article');
  const select=dialog.querySelector('#help-topic-select'),back=dialog.querySelector('#help-back'),groupLabel=dialog.querySelector('#help-current-group');
  const count=dialog.querySelector('#help-count'),scroller=dialog.querySelector('.help-reading');
  let page='',history=[],opener=null,restoreFocus=true;

  const topicButton=(topic,extra='')=>`<button type="button" data-help-topic="${topic.id}" ${extra}>${escape(topic.title)}</button>`;
  function renderNav(){
    const matches=searchHelp(search.value),ids=new Set(matches.map(topic=>topic.id));
    nav.innerHTML=`<button type="button" class="help-home-link" data-help-home ${!page&&!search.value.trim()?'aria-current="page"':''}>Start here</button>`+groups.map(group=>{
      const topics=helpTopics.filter(topic=>topic.group===group&&ids.has(topic.id));
      return topics.length?`<section><h3>${escape(group)}</h3>${topics.map(topic=>topicButton(topic,topic.id===page&&!search.value.trim()?'aria-current="page"':'')).join('')}</section>`:'';
    }).join('');
    select.innerHTML='<option value="">All topics</option>'+groups.map(group=>`<optgroup label="${escape(group)}">${helpTopics.filter(topic=>topic.group===group&&ids.has(topic.id)).map(topic=>`<option value="${topic.id}">${escape(topic.title)}</option>`).join('')}</optgroup>`).join('');
    select.value=!search.value.trim()&&ids.has(page)?page:'';
    count.textContent=search.value.trim()?`${matches.length} matching ${matches.length===1?'topic':'topics'}`:`${helpTopics.length} how-to guides`;
    return matches;
  }
  function topicList(topics){
    return `<ul class="help-topic-links">${topics.map(topic=>`<li><button type="button" data-help-topic="${topic.id}"><span><strong>${escape(topic.title)}</strong><small>${escape(topic.summary)}</small></span><span aria-hidden="true">↗</span></button></li>`).join('')}</ul>`;
  }
  function renderPage(){
    const matches=renderNav(),query=search.value.trim(),topic=find(page);
    back.disabled=!history.length;
    groupLabel.textContent=query?'Search':topic?.group||'Welcome';
    if(query){
      article.innerHTML=`<span class="help-eyebrow">SEARCH THE GUIDE</span><h3 id="help-page-title" tabindex="-1">${escape(query)}</h3><p class="help-lead">${matches.length?`${matches.length} ${matches.length===1?'topic':'topics'} to explore.`:'No matching topics. Try a shorter phrase, like “notes” or “calendar”.'}</p>${matches.length?topicList(matches):'<button type="button" data-help-home class="help-action">Browse all topics</button>'}`;
    }else if(topic){
      const related=(topic.related||[]).map(find).filter(Boolean),index=orderedTopics.indexOf(topic);
      article.innerHTML=`<span class="help-eyebrow">${escape(topic.group)}</span><h3 id="help-page-title" tabindex="-1">${escape(topic.title)}</h3><p class="help-lead">${escape(topic.summary)}</p>
        ${topic.steps?`<ol class="help-steps">${topic.steps.map(step=>`<li>${prose(step)}</li>`).join('')}</ol>`:''}
        ${topic.shortcuts?`<dl class="help-key-list">${topic.shortcuts.map(([keys,meaning])=>`<div><dt><kbd>${escape(keys)}</kbd></dt><dd>${prose(meaning)}</dd></div>`).join('')}</dl>`:''}
        ${topic.tip?`<aside class="help-tip"><span>Good to know</span><p>${prose(topic.tip)}</p></aside>`:''}
        ${topic.action?`<button type="button" class="help-action" data-help-action="${topic.action}" ${canNavigate()?'':'disabled'}>${escape(topic.actionLabel)} <span aria-hidden="true">↗</span></button>${canNavigate()?'':'<p class="help-action-hint">Close the panel behind Help before opening another screen.</p>'}`:''}
        ${related.length?`<section class="help-related"><h4>Related topics</h4>${topicList(related)}</section>`:''}
        <nav class="help-page-nav" aria-label="Previous and next topic">${index?topicButton(orderedTopics[index-1],'class="help-previous" aria-label="Previous topic"'):''}${index<orderedTopics.length-1?topicButton(orderedTopics[index+1],'class="help-next" aria-label="Next topic"'):''}</nav>`;
    }else{
      article.innerHTML=`<span class="help-eyebrow">MAKE YOURSELF AT HOME</span><h3 id="help-page-title" tabindex="-1">Find your next small step.</h3><p class="help-lead">Browse topics or search for what you want to do. Each guide walks you through a feature and shows you where to find it.</p><section class="help-get-started"><h4>A good place to begin</h4>${topicList(['first-session','workspaces','shortcuts'].map(find))}</section><section class="help-directory"><h4>Explore the app</h4>${groups.filter(group=>group!=='Start here').map(group=>`<section><h5>${escape(group)}</h5><div>${helpTopics.filter(topic=>topic.group===group).map(topic=>topicButton(topic)).join('')}</div></section>`).join('')}</section>`;
    }
  }
  function show(id,{remember=true,focus=true}={}){
    if(id&&!find(id))return;
    if(remember&&(page!==id||search.value))history.push({page,query:search.value,scroll:scroller.scrollTop});
    search.value='';page=id;renderPage();scroller.scrollTop=0;
    if(focus)article.querySelector('#help-page-title').focus({preventScroll:true});
  }
  search.addEventListener('input',()=>{
    renderPage();scroller.scrollTop=0;
  });
  search.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.isComposing||!search.value.trim())return;
    const [first]=searchHelp(search.value);
    if(first){event.preventDefault();show(first.id);}
  });
  select.addEventListener('change',()=>show(select.value,{focus:false}));
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.classList.contains('help-close')){dialog.close();return;}
    if(button.hasAttribute('data-help-topic')){show(button.dataset.helpTopic);return;}
    if(button.hasAttribute('data-help-home')){show('');return;}
    if(button===back){
      const previous=history.pop();
      if(!previous)return;
      page=previous.page;search.value=previous.query;renderPage();scroller.scrollTop=previous.scroll;
      article.querySelector('#help-page-title').focus({preventScroll:true});return;
    }
    if(button.dataset.helpAction&&canNavigate()){
      const action=button.dataset.helpAction;
      restoreFocus=false;dialog.close();onAction(action);
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
      if(id&&find(id)){page=id;history=[];search.value='';}
      renderPage();dialog.showModal();search.focus();
    }
  };
}
