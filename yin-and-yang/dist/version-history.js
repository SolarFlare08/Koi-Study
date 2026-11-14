export const releases = [
  {version:'2.2.0',date:'2026-11-13',title:'Scheduling trade-offs, project health, and mistake review',changes:[
    'Compare ways to fit an unscheduled task today, including which booking would move. Apply and undo the whole change together.',
    'See next actions, stalled prerequisites, and shared deadline capacity across projects.',
    'Log corrected reasoning against a task or exam topic and retry mistakes from a shared notebook.',
    'Planner backups include the mistake notebook. Existing saves and backups still open.'
  ]},
  {version:'2.1.0',date:'2026-11-13',title:'Focus replay, exam prep, and session handoffs',changes:[
    'Switch Calendar to Actual to see focus intervals and replay starts, pauses, resumptions, task switches, and early finishes. Older sessions display estimated times.',
    'Create exam plans inside projects, rate topic confidence, and log practice scores. Saving the result adds a Garden star with your score and reflection.',
    'Save a stopping point, next step, and resource link beside the timer. End focus from the handoff while keeping the task open.',
    'Existing saves and backups remain compatible.'
  ]},
  {version:'2.0.0',date:'2026-11-12',title:'Garden landmarks and a more connected workspace',changes:[
    'Move or resize a weekly draft block, recover a skipped block, and see the hours awaiting approval.',
    'See estimated work remaining and tasks without estimates beside the next project milestone.',
    'Open tasks, calendar blocks, events, and captured thoughts directly from the daily recap.',
    'Navigate the note inbox and file, link, or archive thoughts using the keyboard.',
    'Compare changed fields side by side before restoring a backup or local restore point.',
    'Explore Garden history with landmark filters and select a record to highlight it in the landscape.',
    'Open a book’s lantern to see its logged reading dates, final rating, and Reading shelf entry.',
    'Record tests as stars and personal milestones as stone cairns, with optional results and notes.',
    'Existing saved data and version 1 backup files can still be opened.'
  ]},
  {version:'1.2.0',date:'2026-11-12',title:'Reading progress and smarter study plans',changes:[
    'Organize books in ordered series, course lists, and themed collections.',
    'Schedule chapter reviews and space them out based on recall.',
    'Log separate finish dates, ratings, and reviews for rereads.',
    'Filter Garden task suggestions by available time and energy level.',
    'Protect travel, setup, and recovery time around calendar events when drafting work.'
  ]},
  {version:'1.1.0',date:'2026-11-12',title:'Decisions, daily routines, and recovery',changes:[
    'Log dated project decisions with their reasons and links to affected tasks and milestones.',
    'Set recurring shutdown steps and check them off from the end-of-day recap.',
    'Attach the selected focus task and its calendar block to browser quick captures.',
    'Calculate yarn shortages by colorway in Stitchbook.',
    'Save and preview up to five local restore points.',
    'Browse version history from Help or the command palette.'
  ]},
  {version:'1.0.0',title:'The original workspace',changes:[],history:[
    {date:'2026-11-12',changes:['Journal draft autosave, Reading sorts and duplicate merges, pace ranges, Planner cooldowns, scheduling explanations, and editable weekly drafts.','Finished-book details and final reviews, the note inbox, end-of-day recap, and selective restore previews.','Permanent Garden landmarks, weekly planning with deadline risks, and project overviews and resume.']},
    {date:'2026-11-11',changes:['Task snooze, pinned Planner views, calendar export, reading pace forecasts, and Stitchbook pattern changes.','Journal templates, recurring availability, and sticky notes linked to projects, books, and journal entries.','Project goals and milestones, chapter review queue, crochet counters and checkpoints, reusable task templates, and estimate suggestions.','Focus outcomes, multi-phase timer routines, task suggestions by time, and searchable Help.']},
    {date:'2026-11-10',changes:['Reading goals and chapter history, Plan tomorrow, the command palette, Stitchbook time logging, and downloadable backups.','Replan today, calendar focus status, a pinned focus queue, sticky notes linked to tasks, and next steps for focus.','Daily Crochet, Annotate, and Journal items, plus book lookup and a more compact journal editor.']},
    {date:'2026-11-09',changes:['Weekly Review, calendar import, quick capture, and the Journal workspace.','Timer warnings, typing durations from the right, separate sound controls, and task completion animations.']},
    {date:'2026-11-08',changes:['Planner and Calendar workspaces, a five-hour schedule, task editing, projects, filters, and a centered timer.','Seasonal scenery and weather, improved shoreline and clouds, Orion, the penguin, and dusk lighting.']},
    {date:'2026-11-07',changes:['Introduced the illustrated Garden and focus timer.']}
  ]}
];

export const appVersion=releases[0].version;

export function installVersionHistory(dialog){
  const items=changes=>`<ul>${changes.map(change=>`<li>${change}</li>`).join('')}</ul>`;
  dialog.innerHTML=`<header><h2 id="version-title">Version history</h2><button type="button" aria-label="Close version history">×</button></header>
    ${releases.map((release,index)=>`<details class="version-release" ${index===0?'open':''}><summary>v${release.version} · ${release.title}</summary>
      ${release.date?`<time datetime="${release.date}">${release.date}</time>`:''}${release.changes.length?items(release.changes):''}
      ${(release.history||[]).map(day=>`<section><time datetime="${day.date}">${day.date}</time>${items(day.changes)}</section>`).join('')}</details>`).join('')}`;
  dialog.querySelector('button').onclick=()=>dialog.close();
  return ()=>{if(!dialog.open)dialog.showModal();};
}
