// Keep feature instructions separate from the guide UI so they can be updated together with the app.
export const helpTopics = [
  {id:'reading-sitting',group:'Reading',title:'Bookmark a reading sitting',summary:'Save your page and time spent reading.',steps:['Open a book, enter your starting page under Reading bookmark, and click Start sitting. You can close the book while the sitting is active.','When you stop, enter the ending page and click End sitting. Next time the book opens, it shows your resume page and how long the last sitting took.'],related:['reading-shelf']},
  {id:'reread-comparison',group:'Reading',title:'Compare first read and reread',summary:'See how your rating and reactions changed.',steps:['On a finished book, save your final review and log a reread. Add passage reactions as Chapter 4 | Your reaction, one per line, in either review editor.','Open Compare first read and reread and pick a reread. The comparison shows both reviews and their rating change. While the spoiler cutoff is active, both columns show only passage reactions through the selected chapter. General review text is hidden because it has no chapter tag.'],related:['spoiler-cutoff','reading-shelf']},
  {id:'postcard-viewpoints',group:'Garden',title:'Save a fixed postcard viewpoint',summary:'Return to the same crop, season, and light as your Garden grows.',steps:['Open Garden Studio or Export postcard and choose Postcard viewpoints. Frame the scene with the zoom and position sliders, then choose a season and fixed lighting.','Name and save your viewpoint. Select it later to restore the frame, landscape design and appearance. Use Garden through to choose how much dated landmark history is visible, then download a PNG.'],related:['garden-postcard','garden-studio']},
  {id:'future-questions',group:'Journal',title:'Write a question to your future self',summary:'Return to a passage on a date you choose.',steps:['Open a completed entry, highlight a line, and choose Margin notes → Ask your future self. Write the question and select a revisit date.','Journal’s Future questions view shows upcoming and due questions. On or after the revisit date, choose Answer as margin note. The response appears beside the original passage in Margin notes.'],related:['margin-notes']},
  {id:'calendar-brush',group:'Calendar',title:'Paint copies across the timeline',summary:'Place irregular study sessions or events in one pass.',steps:['In Calendar’s planned day or week timeline, select Paint blocks. Choose a task or timed event and set the copy length.','Click slots individually or drag across the days and hours. Enter a slot also works with a keyboard. Undo last removes one placement. Choose Place copies to save, or Cancel to discard. Tasks receive more blocks. Events become individual copies.','After placing the copies, choose Undo in the confirmation to remove the whole batch. Choose Redo to restore it. The control stays available until you dismiss it, place another batch, or make another change that offers Undo.'],related:['move-blocks']},
  {id:'garden-stuck',group:'Focus & rest',title:'Capture a question when stuck',summary:'Keep a blocker with its task and page reference.',steps:['In Garden → Session tools, choose I’m stuck. Enter the exact question and an optional page, file, or problem number. Choose the course or General.','Try another approach saves the question and keeps your timer going. Switch task saves it and opens your task picker. Save for office hours opens your sheet. You can also browse General questions here.'],related:['office-sheet']},
  {id:'office-sheet',group:'Planner',title:'Prepare an office-hours question sheet',summary:'Bring questions and unresolved mistakes to a course meeting.',steps:['Open the course project in Planner, expand Project overview, and choose Office-hours sheet. The sheet includes saved questions and mistakes from that project’s tasks and exams that still need a retry.','Add page references as you capture questions. Print sheet prints the visible questions. During the meeting, write an answer and check it off. Show answered lets you revisit or reopen it.'],related:['garden-stuck']},
  {id:'spoiler-cutoff',group:'Reading',title:'Hide notes beyond your chapter',summary:'Keep your review queue and discussion sheet spoiler-safe.',steps:['Open a book → Spoiler cutoff. Enter the highest chapter you want to see and save. A note covering chapters 4–6 appears starting at chapter 6.','Notes with unrecognized chapter labels stay hidden while a cutoff is active. Clear the number and save to see all notes again.'],related:['borrowed-shelf']},
  {id:'margin-notes',group:'Journal',title:'Respond to an older journal entry',summary:'Save a dated reply alongside a passage.',steps:['Open a completed entry. Select a sentence in the writing area and choose Margin notes. Type today’s response and save it.','Open Margin notes again to read the saved quotations and replies. They stay with the completed entry even if you close the editor without saving edits.'],related:[]},
  {id:'semester-replay',group:'Garden',title:'Play a semester time-lapse',summary:'Watch earned landmarks appear in order.',steps:['Open Garden → Progress → Garden Field Guide. Choose From and Through dates, then Play time-lapse. Empty dates include your entire history.','Pause or step through the dates with Previous and Next. Landmarks earned before the range form the opening scene. Reduced motion starts the replay paused.'],related:['garden-growth']},
  {id:'mini-focus',group:'Focus & rest',title:'Keep a mini timer over your work',summary:'Use Garden while reading or watching a lecture.',steps:['In Garden, open Session tools → Mini timer. Drag or resize the window. Windows and browsers with document picture-in-picture keep it on top. Other browsers open a regular popup.','Start, pause, extend an eligible session by five minutes, or save a quick thought to the note inbox. Keep the main Garden open.'],related:['timer']},
  {id:'move-blocks',group:'Calendar',title:'Move several calendar blocks together',summary:'Preview a group move before saving.',steps:['In the planned calendar timeline choose Move blocks. Pick the source day and check the timed tasks and editable events to move.','Choose the destination day and a shift in minutes. Use a negative number for earlier or zero to keep the times on another day. Review overlaps before saving. Recurring items move for that occurrence only. Imported events remain commitments in the preview.'],related:[]},
  {id:'split-task',group:'Planner',title:'Split a task that overruns its estimate',summary:'Use logged focus to plan smaller steps.',steps:['Open an estimated task and look under Subtasks. A suggestion appears after repeated overruns on completed occurrences, or once three completed focus sessions on the current task exceed its estimate.','Choose Draft subtasks, replace the part names with concrete steps, and save the task.'],related:[]},
  {id:'borrowed-shelf',group:'Reading',title:'Track and return borrowed books',summary:'Keep a shelf for outstanding loans.',steps:['Choose Add a book or Edit library entry. Enter the lender and an optional return date.','Choose Borrowed to see outstanding loans. Open a book for the due date or Mark returned. Finishing a book and returning it are separate actions.'],related:[]},
  {id:'weekly-postcards',group:'Garden',title:'Export a weekly Garden postcard',summary:'Save a landscape with seven days of focus.',steps:['Open Export postcard and enable Include the last seven days of focus. A historical view uses the week ending on its selected date.','Choose a milestone or a line from a completed journal entry under Weekly highlight, or type a caption. Download PNG includes your selected text, date range, completed session count, and focus minutes.'],related:[]},
  {id:'focus-compass',group:'Focus & rest',title:'Progress ring, chimes, and daily goal',
    summary:'See where your session is headed without opening a panel.',
    steps:['The small ring below the countdown fills as the session progresses. While running, its label shows the expected finish time. Pausing freezes progress; resetting clears it.',
      'Click the bell beside the ring to toggle timer chimes. Chimes start off on new profiles; music mode can still silence them. Use Timer settings to adjust volumes individually.',
      'Click the minutes-today label beneath the timer to see your last seven days of focus. Choose a bar to see that day’s completed and skipped sessions. The dashed line shows your current daily goal, which you can change below the chart.',
      'Only completed focus sessions count toward the goal, including recorded overtime. Skipped sessions are shown separately.',
      'Open Session tools for outcomes, subtasks, overtime, task suggestions, and review actions. Click it again to fold the tools away.'],
    related:['timer','backup','windows-app']},
  {id:'quick-timer-lengths',group:'Focus & rest',title:'Quick times and timer extensions',
    summary:'Pick a ready-made duration or give the current session a few more minutes.',
    steps:['Choose Focus or Rest, then open Quick times beside the bell. Pick a length; press Space to start. Click the countdown to type a different length.',
      'While running or paused, choose + Time to add 1, 5, or 10 minutes. The same session and task continue, and a paused timer stays paused. Reset returns to the original length.',
      'For task-timed phases, Quick times changes only that phase, leaving the rest of the plan in place. Calendar block sessions, saved routines, and mistake retries keep their own timing.'],
    related:['timer','focus-compass']},
  {id:'automatic-backups',group:'Start here',title:'Automatic backups and recovery',
    summary:'Protect your Garden automatically and see whether the backup succeeded.',
    steps:['Open Tools → Timer settings → Backup and restore. In a browser tab, Automatic protection shows local backup status. In the Windows app, it also shows disk backup status. Choose Back up now to create a snapshot immediately.',
      'While the app is open, changed data is captured every five minutes, with an initial backup after ten seconds. The last three automatic snapshots are separate from five manual restore points. Preview any snapshot and choose the sections to restore.',
      'The Windows app also saves JSON files in %LOCALAPPDATA%\\Yin and Yang\\Backups. It keeps 30 recent snapshots plus the first snapshot from each of the last 14 backed-up days. A normal window close makes another disk backup.',
      'Choose Open backup folder in the Windows app, then restore a JSON file through the normal backup preview. Tasks, calendars, saved journal drafts, notes, books, Stitchbook photos, and settings use the existing portable backup format.',
      'Automatic backups stay on this computer. Copy a downloaded backup to another device or drive for protection against drive failure. Browser storage limits can prevent local snapshots; the status tells you when a backup fails.'],
    action:'backup',actionLabel:'Open backups',related:['backup','windows-app']},
  {
    id:'windows-app', group:'Start here', title:'Use the Windows desktop app',
    summary:'Open Yin and Yang in its own window and move your saved data from the browser.',
    steps:['Extract the complete Windows x64 package and open Yin and Yang.exe. Windows uses the Microsoft Edge WebView2 Runtime to display the app.',
      'To bring over tasks, books, notes, and settings, open Backup and restore in your original browser tab and download a backup. Open Backup and restore in the Windows app and select the file.',
      'The Windows app starts the Quick Capture helper when it opens. Ctrl+Alt+N opens a note near the pointer. If that shortcut is already owned by the browser helper, quit the browser helper from its tray icon and reopen the desktop app.',
      'Drag the slim top strip to move the window or double-click to maximize. The buttons on the right minimize, maximize, or close it. Fullscreen hides the strip. The Garden icon appears on the taskbar.',
      'Windows 5.0 enables per-monitor DPI support to avoid bitmap scaling on high-resolution displays. Existing app data stays in the same profile.',
      'Updates are manual, not automatic. Changes to the website or source files do not change an already-built desktop package. Close the app, extract the newer full Windows package to a new folder, and open its executable. It reads the same saved data from your Windows profile.'],
    related:['backup','versions','shortcuts']
  },
  {
    id:'versions', group:'Start here', title:'See version history',
    summary:'Browse the current release and past updates.',
    steps:['Open Help → `Version history`, or search for Version history with `Ctrl+K`.',
      'Expand a release to read its changes. Version 1.0.0 groups earlier updates by date.'],
    tip:'Patch versions cover fixes and documentation, minor versions add compatible features, and major versions mark intentionally incompatible changes.',
    action:'versions', actionLabel:'Open version history', related:['workspaces','backup']
  },
  {
    id:'first-session', group:'Start here', title:'Your first focus session',
    summary:'Add a task, choose a duration, and start studying.',
    steps:['In Garden, choose `+ Add task` in the Tasks panel. Enter a task name and choose `Save task`.',
      'Click `Current task` beneath the timer and select what you want to work on.',
      'Click the large countdown and type your duration. For 25 minutes, type `2500`. Press `Enter` to set it.',
      'Press `Space` or choose `Begin focus`. Use Pause when you need to stop temporarily.'],
    tip:'You can close Help and come back at any time. The timer keeps running while you browse the guide.',
    action:'focus', actionLabel:'Open Garden', related:['timer','focus-queue','shortcuts']
  },
  {
    id:'workspaces', group:'Start here', title:'Find your way around',
    summary:'What each workspace is for, and how to find features quickly.',
    steps:['Use the bottom bar to switch between `Garden`, `Planner`, and `Calendar`. Notes, Reading, Journal, and Crochet are beside them on wide screens or under `More` on small screens.',
      'In Garden, use `Tasks` to show or hide the sidebar. Use the chevron beside Tasks to collapse just the list and keep the calendar visible. Use `Progress` to see today’s sessions. Choose `Edit landscape` to open Studio with your live design ready to edit.',
      'Open `Tools` for timer settings, appearance, quick notes, music and video, the Field Guide, and Help.',
      'Use Planner for task lists, projects, reviews, and reports. Calendar is the full schedule shared with Planner and the Garden’s 5-hour calendar.',
      'Choose `Search` or press `Ctrl+K` to search across tasks, sticky notes, books, and journal entries, or run a command.'],
    tip:'The filled tab marks your current workspace. On small screens, More stays highlighted while a workspace in its menu is active. Open Help with F1 or find it in Ctrl+K.',
    related:['search','calendar','backup']
  },
  {
    id:'timer', group:'Focus & rest', title:'Set, start, pause, and reset the timer',
    summary:'Type time without a colon and reset to your last saved duration.',
    steps:['Click the countdown to edit it. Digits fill from right to left: `1` means 1 second, `10` means 10 seconds, `100` means 1 minute, and `5000` means 50 minutes.',
      'Press `Enter` or `Set` to commit the duration. You can immediately press `Space` to start. `Escape` cancels editing.',
      'Use the Focus and Rest buttons to choose a phase. Each keeps its own saved duration.',
      'Use the main button to start, pause, or continue. Reset returns to the saved duration; Skip moves to the other phase.'],
    tip:'A reset or skip marks an unfinished session as skipped. Completed focus sessions and skipped sessions stay distinct in your progress. The running countdown survives refreshes and inactive tabs.',
    action:'focus', actionLabel:'Open timer', related:['focus-compass','routines','notifications','block-focus'],
    keywords:'pomodoro countdown colon seconds minutes inactive background tab time'
  },
  {
    id:'focus-task-timing',group:'Focus & rest',title:'Match the timer to your task',
    summary:'Use a task’s duration and prepare a proportional break.',
    steps:['Select a task in Garden from Current task, Tasks, or Find a task by time. Garden uses a scheduled block or the task estimate. Without a duration, it uses the manual timer.',
      'A task over 60 minutes splits into two halves with a break equal to 20% of the first half. Start each phase when ready or use Skip to advance.',
      'The final break is 20% of the full task duration. `Finish` → `Take a break` uses the same calculation when you finish early.',
      'Use the countdown editor to set another length manually. Starting from a calendar block uses its remaining time, and saved routines use their own phases.'],
    action:'focus',actionLabel:'Open Garden',related:['timer','focus-queue','routines']
  },
  {
    id:'focus-subtasks',group:'Focus & rest',title:'Check off subtasks during focus',
    summary:'Use the current task’s checklist beside the timer.',
    steps:['Add subtasks in the task editor and select the task in Garden.',
      'Open `Session tools` → `Subtasks` below the timer and check items off as you go. Planner shows the same checkmarks.',
      'The first unchecked item appears in Pick up here and Warm up with your other handoff details.'],
    action:'focus',actionLabel:'Open Garden',related:['resume','session-warmup','tasks']
  },
  {
    id:'focus-overtime',group:'Focus & rest',title:'Keep counting in focus overtime',
    summary:'Continue after zero and record the extra time separately.',
    steps:['Turn on `Overtime` in Garden before an ordinary or task-timed focus countdown ends. The setting stays on until you turn it off.',
      'At zero, the timer counts up. Choose `Finish overtime` to record the extra time and prepare the next break.',
      'Open Calendar → `Actual` to see a separate overtime segment. Calendar-started blocks, routines, and mistake retries end on schedule.'],
    action:'focus',actionLabel:'Open Garden',related:['timer','focus-replay','focus-task-timing']
  },
  {
    id:'routines', group:'Focus & rest', title:'Save timer routines and an intention',
    summary:'Keep favorite focus and break lengths ready to use.',
    steps:['In Garden, open `Tools` → `Timer settings`.',
      'Set Focus and Rest lengths and add a session intention under `What are you making space for?`. Choose `Save rhythm`.',
      'Use the routines section to apply Classic (25/5), Deep work (50/10), or a routine you saved.',
      'To save your own routine, give it a name and set its focus and rest lengths, then save it.',
      'Choose `Create a multi-phase routine` to name, reorder, and save a sequence of focus and break phases. Select the saved routine to load it. Each phase is ready to start when the previous one ends.'],
    tip:'When a session has already started, saved settings apply to the next session. Your current countdown is not silently replaced.',
    action:'settings', actionLabel:'Open timer settings', related:['timer','focus-mode']
  },
  {
    id:'focus-queue', group:'Focus & rest', title:'Choose and order today’s focus queue',
    summary:'Select the current task or pin the order you want to work in.',
    steps:['In Garden, click `Current task` below the timer.',
      'Select a task to focus on. Drag rows or use their up/down arrows to pin a custom order for today.',
      'Choose `Use calendar order` to restore automatic ordering. Calendar blocks come first, followed by unscheduled tasks in priority order.',
      'Use the finish-current-task control beside the task to end early. Choose `Take a break` or `Keep going` to continue with the next task.',
      'Set a task’s estimate and optional `Energy` in the task editor. In Garden, choose `Find a task by time`, enter your available minutes, and pick Light, Moderate, Demanding, or Any energy level. Garden shows ready tasks that fit, with higher priorities first.'],
    tip:'Your pinned order is for today. A session started from a calendar block keeps that block’s task selected.',
    action:'focus', actionLabel:'Open Garden', related:['resume','tomorrow','block-focus','task-bundles']
  },
  {
    id:'task-bundles', group:'Tasks & projects', title:'Work through a task bundle in order',
    summary:'Group existing tasks and pick up where you left off across focus sessions.',
    steps:['Open Planner → `Task bundles` → `New bundle`. Name it and add saved tasks in the order you want. Use the arrows to change the order.',
      'Choose `Start in Garden`, then `Begin focus`. Complete the current task to advance. Ending a focus session by itself keeps your place.',
      'Select the bundle name near the timer and choose `Checkpoint & pause` to save the current step. If focus is running, this records your elapsed time and leaves the task open. Resume either bundle from Planner.',
      'If the next task is blocked or scheduled for later, the bundle waits there. Remove a deleted or archived task from the bundle with `Edit order`.'],
    tip:'Bundles share the original tasks. Finished non-repeating tasks stay complete. A completed bundle can start again when its repeating tasks are ready for a new occurrence.',
    action:'bundles', actionLabel:'Open Task bundles', related:['focus-queue','resume','projects']
  },
  {
    id:'focus-outcome', group:'Focus & rest', title:'Set and review a focus outcome',
    summary:'Write what you want to finish, then record how far you got.',
    steps:['Open `Session tools` → `Warm up` beneath a ready timer and write a concrete goal, such as “Solve problems 1–4.” During a session, use `Set outcome` to add or edit it.',
      'Choose `Save and begin` to start a ready timer with the outcome.',
      'After the session, choose `Review outcome`, mark it Reached or Partial, and leave a next step. The next step appears on the task if the session was linked to one.'],
    tip:'Choose Later if you want to review it another time. Garden keeps completed outcomes available to review.',
    action:'focus', actionLabel:'Open Garden', related:['timer','resume','session-warmup']
  },
  {
    id:'session-warmup', group:'Focus & rest', title:'Warm up before a focus session',
    summary:'See your last handoff, a linked note, and the outcome you want from this session.',
    steps:['Select your task in Garden. With a fresh focus timer, choose `Warm up` beneath the countdown.',
      'Read the task’s last handoff and a sticky note linked to the task or its project. Enter or edit the intended outcome.',
      'Choose `Save and begin` to start or `Save outcome` to do so later. You can still press `Space` from Garden to start directly.'],
    action:'focus', actionLabel:'Open Garden', related:['focus-outcome','resume','linked-notes']
  },
  {
    id:'break-ideas', group:'Focus & rest', title:'Save break ideas that fit the timer',
    summary:'Keep a personal list of 2-, 5-, and 10-minute ways to take a break.',
    steps:['In Garden, open `Tools` → `Timer settings` → `Manage break ideas`. Name the activity, choose 2, 5, or 10 minutes, and select `Add idea`.',
      'During Rest, open `Session tools` → `Break idea` beneath the timer. Garden suggests an activity at the longest saved length that fits the time left.',
      'Choose `Another idea` when more than one activity fits at that length. Use `Remove` to take an idea off your list.'],
    action:'focus', actionLabel:'Open Garden', related:['timer','backup']
  },
  {
    id:'resume', group:'Focus & rest', title:'Pick up where you left off',
    summary:'Save the exact problem, page, or file where you stopped and pick up there next time.',
    steps:['Choose the task in Garden, then open `Session tools` and click `Leave a handoff` or `Edit handoff`.',
      'Enter where you stopped, the next step, and an optional web link to your resource. A local filename or path can go in Where you stopped.',
      'Choose `Save handoff` or press `Ctrl+Enter`. During focus, `Save and end focus` records the elapsed work, leaves the task open, and prepares a break.',
      'When the task is selected again in focus, its handoff appears in the Pick up here panel beside the timer. You can also edit it in the task editor.'],
    action:'focus', actionLabel:'Open Garden', related:['focus-queue','linked-notes']
  },
  {
    id:'focus-mode', group:'Focus & rest', title:'Focus mode and fullscreen',
    summary:'Keep the timer and landscape in view with fewer distractions.',
    steps:['In Garden, choose `Focus mode` near the upper-right corner.',
      'The task sidebar, workspace tabs, and garden tools tuck away. During a running session, secondary controls fade after four seconds without activity.',
      'Move the pointer or use the keyboard to reveal controls. Press `Escape` or choose `Exit focus` to return.',
      'Use the fullscreen icon next to Focus mode to fill the browser screen. If browser fullscreen is unavailable, use its own fullscreen control.'],
    tip:'Environmental animations respect your device’s reduced-motion preference.',
    action:'focus', actionLabel:'Open Garden', related:['appearance','timer']
  },
  {
    id:'notifications', group:'Focus & rest', title:'Timer warnings and optional chimes',
    summary:'Get a five-minute focus warning and a 2:30 break warning.',
    steps:['Open Garden → `Tools` → `Timer settings` → `Timer warnings`.',
      'Choose `Enable browser notifications` and allow notifications when your browser asks.',
      'Focus sessions warn at `5:00` remaining; breaks warn at `2:30`. A phase shorter than its warning threshold does not produce that warning.',
      'Choose `Adjust chimes and ambience` to control the separate focus and break sound volumes.'],
    tip:'In-app warnings remain available. If notification permission was denied, change it in the browser’s settings for this site. The app must remain open to deliver its timer warnings.',
    action:'settings', actionLabel:'Open timer settings', related:['music','timer']
  },
  {
    id:'progress', group:'Focus & rest', title:'See today’s progress and blossoms',
    summary:'Check today’s completed sessions, focus minutes, and skipped sessions.',
    steps:['In Garden, choose `Progress` in the top tools.',
      'Read your completed-session count and total focus minutes. The list shows each session’s finish time, intention, and outcome.',
      'Each completed focus session adds a blossom. Skipped sessions are recorded separately and do not add to completed totals.',
      'For earlier dates or project-level statistics, use Planner → `Reporting`.'],
    action:'progress', actionLabel:'Open today’s progress', related:['day-recap','garden-growth','reporting','timer','weekly-review']
  },
  {
    id:'day-recap', group:'Calendar & planning', title:'Review today in two minutes',
    summary:'See what you finished or moved and what is lined up for tomorrow.',
    steps:['Open Garden → Today → `End-of-day recap`, use the button on Planner’s Today view, or find it with `Ctrl+K`.',
      'Review completed tasks and rituals, focus time, and the schedule changes recorded today.',
      'Select a task, a moved or upcoming block, an event, or a captured thought to open it. Unsorted and archived thoughts captured today appear under Captured today.',
      'Check tomorrow’s events, focus blocks, and due tasks. Choose `Plan tomorrow` to reserve your first focus block.',
      'Use `Shutdown checklist` to check off your steps. Choose `Edit recurring steps` to add, remove, or reorder them, one per line. Checkmarks reset each day.'],
    action:'day-recap', actionLabel:'Open end-of-day recap', related:['progress','tomorrow','weekly-review']
  },
  {
    id:'garden-growth', group:'Focus & rest', title:'Explore the Garden Field Guide',
    summary:'Explore trees for projects, lanterns for books, stars for tests, and cairns for milestones.',
    steps:['Open a project in Planner. In Project overview, choose `Mark project finished` to plant its tree.',
      'Open a book in Reading and choose `Mark book finished` to add its lantern to the lake. Lanterns glow after dark.',
      'In Garden, open `Progress` → `Open Garden Field Guide`, or find it with `Ctrl+K`. Filter the illustrated entries by landmark type and date range. Choose an entry to highlight it in the landscape.',
      'Set an end date and choose `View Garden at end date` to see all landmarks earned through that day. Use `Return to today` to exit the historical view.',
      'Open a tree, lantern, or cairn and expand `Place landmark`. Choose West shore, Lake island, or Pagoda shore. Enter a group name and leave the area on Automatic to reuse that group’s area. A new group without an area starts at Lake island.',
      'Click or tab to a landmark in Garden to open its details. A book lantern shows the finish date, first logged reading date if available, and final rating. Scroll inside the landmark panel to reach the inscription and placement controls on smaller screens. Choose `Open in Reading` for the full entry.',
      'Save a Planner exam result to add a star to the project’s course constellation. Open a constellation from the sky or the Field Guide to see its exams in date order.',
      'In Garden history, choose `Record a test or milestone`. Add a title and date, plus a result or note if you want one. Tests add stars and personal milestones add cairns.'],
    tip:'Each project or book earns one landmark. Garden history is included in backups.',
    action:'garden-history', actionLabel:'Open Garden Field Guide', related:['garden-studio','garden-inscriptions','garden-comparison','progress','projects','exam-plans','reading-shelf','backup']
  },
  {
    id:'garden-inscriptions',group:'Focus & rest',title:'Add a Garden landmark inscription',
    summary:'Give a tree, lantern, or cairn a short dedication.',
    steps:['Select the landmark in the Garden or from the Field Guide. Expand `Add inscription`, write a dedication, and save it.',
      'The text appears whenever you open the landmark. To change it or clear it, choose `Edit inscription`.',
      'Choose `Use as postcard caption` to open postcard export with the dedication already filled in.'],
    action:'garden-history',actionLabel:'Open Garden Field Guide',related:['garden-growth','garden-postcard','backup']
  },
  {
    id:'garden-comparison',group:'Focus & rest',title:'Compare two dates in the Garden',
    summary:'See how the landscape grew and export the two views together.',
    steps:['Open the Garden Field Guide and choose `Compare two dates`.',
      'Set a Before date and a later After date, then choose `Compare dates`. Each view includes landmarks earned through that date. Both use the current season and the same dusk light.',
      'Add a caption if you like and choose `Download comparison PNG` for a 3200 × 1040 postcard.'],
    action:'garden-history',actionLabel:'Open Garden Field Guide',related:['garden-growth','garden-postcard']
  },
  {
    id:'evening-lights', group:'Focus & rest', title:'Wind down with Evening lights',
    summary:'See the lit pagoda, your shutdown steps, and tomorrow’s first task.',
    steps:['Open Garden → Today → `Evening lights`, use the button in the end-of-day recap, or find it with `Ctrl+K`.',
      'Check off your shutdown steps. The same checklist appears in the recap. Choose `Plan tomorrow` to reserve a first task.',
      'Close the panel or press Escape to return to your regular Garden view.'],
    action:'evening-lights', actionLabel:'Open Evening lights', related:['day-recap','tomorrow','garden-growth']
  },
  {
    id:'tasks', group:'Tasks & projects', title:'Create and edit tasks',
    summary:'Add descriptions, subtasks, comments, estimates, dates, and reminders.',
    steps:['Choose `Add task` in Garden or Planner. You can also use the `Add task` action in `Ctrl+K`.',
      'Enter the name. Add a description, next step, subtasks (one per line), and a comment if useful.',
      'Set its project, section, date, time, estimate, deadline, priority, labels, or reminder in the properties area.',
      'Set `Snooze until` to keep the task out of the focus queue until that date. Its schedule and deadline stay visible in Planner. Clear the date to bring it back early.',
      'Expand `Task templates` and choose `Save as template` to reuse a task’s subtasks, labels, and estimate. In a new task, select a saved template and choose `Use template`. Review the draft and save it as a task.',
      'Save the task. Click its title to edit it again. Right-click a task to choose Finish task, edit it, prioritize it, focus on it, or delete it. You can reopen completed tasks from the same menu.'],
    tip:'Task reminders are shown while the app is open. A task’s estimate is also useful for scheduling and estimate-accuracy reports.',
    action:'planner', actionLabel:'Open Planner', related:['repeat','quick-add','completion','waiting-for']
  },
  {
    id:'waiting-for', group:'Tasks & projects', title:'Track waiting-for tasks and follow-ups',
    summary:'Keep tasks on hold while you wait for a person, reply, or material.',
    steps:['Open a task and fill in `Waiting for`. Add an optional `Follow up on` date and save.',
      'Open Planner → `Waiting for` to see due follow-ups. The open app also shows a prompt when a follow-up date arrives.',
      'Choose `Mark ready` when you can act. A follow-up date alone does not return a waiting task to Garden. Its calendar booking and deadline remain in Planner.'],
    action:'waiting',actionLabel:'Open Waiting for',related:['tasks','focus-queue','project-health']
  },
  {
    id:'day-templates',group:'Calendar & planning',title:'Reuse a calendar day',
    summary:'Save a named schedule and copy selected blocks to another date.',
    steps:['In Calendar, switch to Planned and choose More → Day templates. Choose a source date, name the template, and save it.',
      'Choose your template and a destination date. The preview flags timed overlaps with existing commitments and with other blocks in the template.',
      'Uncheck anything you want to leave out, then click Copy selected. Leave overlapping blocks checked if you want to keep them.'],
    tip:'Copied tasks start open and copied events are editable. Multiple selected blocks for the same task stay together. The source day stays intact.',
    action:'calendar',actionLabel:'Open Calendar',related:['calendar','multiple-blocks','backup']
  },
  {
    id:'calendar-task-colors',group:'Calendar & planning',title:'Mark important calendar tasks and choose colors',
    summary:'Flag priority tasks and identify them by color across calendar views.',
    steps:['In Calendar, choose `Create → Task`. Turn on `Important` to set the task’s priority to P1 and show a star on the calendar.',
      'Click a scheduled task block and choose a swatch under Task color. You can also open a task’s actions menu and choose Change color, or use Task color near its name in the task editor.',
      'Choose Custom to use the color picker or enter a hex code like #4C8B79. In the block’s quick picker, choose Apply custom color. The color follows the task across all its blocks.'],
    action:'calendar',actionLabel:'Open Calendar',related:['tasks','calendar']
  },
  {
    id:'task-dependencies', group:'Tasks & projects', title:'Set task prerequisites',
    summary:'Keep a task out of the focus queue until the tasks it needs are finished.',
    steps:['Open the task that needs to wait, such as “Write the report.”',
      'Expand `Waiting on` in the task editor. Search for and check each prerequisite, such as “Finish the analysis.”',
      'Choose `Save task`. Planner shows which tasks it’s waiting for. You can reserve time for it in Calendar.',
      'Complete the prerequisites to make the task available in Garden. To remove a prerequisite, open the editor, uncheck it, and save.'],
    tip:'A recurring prerequisite counts as finished after one completed occurrence. Planner prevents loops where tasks would wait on each other.',
    action:'planner', actionLabel:'Open Planner', related:['tasks','focus-queue','deadline-plan'], keywords:'blocked dependency dependencies order unlock'
  },
  {
    id:'repeat', group:'Tasks & projects', title:'Make a task repeat',
    summary:'Schedule daily habits, weekdays, weekly work, or a custom interval.',
    steps:['Click the task title to open its editor.',
      'In Schedule, choose the first date and change `Repeat` from `Does not repeat`.',
      'Choose every day, weekdays, every week, every month, every year, or `Every N days`. For an interval, set the number of days.',
      'Save the task. Checking it off completes that occurrence; future occurrences remain available.'],
    tip:'The first date anchors the repeat pattern. If you leave the first date blank, the pattern starts today.',
    action:'planner', actionLabel:'Open Planner', related:['tasks','daily-rituals']
  },
  {
    id:'quick-add', group:'Tasks & projects', title:'Quick Add with dates and labels',
    summary:'Write a task and its schedule in one line.',
    steps:['Use Planner’s quick Add task field.',
      'Try `Read chapter tomorrow at 9am for 30m` to set a date, time, and duration.',
      'Use `p1` through `p4` for priority, `#ProjectName` for an existing project, and `%reading` or `@reading` for a label. Quote names with spaces, such as `#"Study project"`.',
      'For recurring work, try `Stretch every day at 8am for 10m`. Use `{tomorrow}` to set a deadline separately from the scheduled date.'],
    tip:'You can always open the task editor afterward to check or adjust the parsed properties.',
    action:'planner', actionLabel:'Open Planner', related:['tasks','filters'], keywords:'natural language syntax'
  },
  {
    id:'projects', group:'Tasks & projects', title:'Organize projects, sections, and views',
    summary:'Group related work and choose the task layout that suits you.',
    steps:['In Planner, use the plus beside `Projects` to add a project with a name and color.',
      'Assign tasks to the project in their editors. Within a project, use `+ Section` to group tasks further.',
      'In a project, choose `Milestones` → `Add milestone`. Set a target date and link the tasks that need to be done. The project shows its next incomplete milestone and how many linked tasks are finished.',
      'Use Inbox for ungrouped tasks, Today for due work and overdue tasks, and Upcoming to browse dates.',
      'Use Display to switch supported views between list, board, week calendar, three-day calendar, and month. Project settings let you edit, favorite, or archive a project.'],
    tip:'Archived projects are kept, but their tasks are left out of the Garden’s active focus queue.',
    action:'planner', actionLabel:'Open Planner', related:['project-decisions','project-resume','filters','csv-import','calendar']
  },
  {
    id:'project-decisions', group:'Tasks & projects', title:'Keep a project decision log',
    summary:'Record what you decided, why, and what work it affects.',
    steps:['Open a project in Planner and choose `Decision log` → `Add decision`.',
      'Enter the decision, date, and reason. Choose an optional milestone and check the affected project tasks.',
      'Save the decision. Reopen the log to edit a decision or open its linked work.'],
    action:'planner', actionLabel:'Open Planner', related:['projects','project-resume']
  },
  {
    id:'project-resources',group:'Tasks & projects',title:'Keep a project resource shelf',
    summary:'Save reference material and pin the resource you need for your next session.',
    steps:['In Planner, select a project and open Resource shelf in Project Overview.',
      'Save a web link, reference note, or file path. Use Edit or Remove to maintain the shelf.',
      'Choose Pin for focus on one resource, then click Resume project in Project Overview to see it beside the Garden timer.'],
    tip:'Web links open in a new tab. File paths are shown as selectable text for use in your file manager.',
    action:'planner',actionLabel:'Open Planner',related:['project-resume','resume','backup']
  },
  {
    id:'project-resume', group:'Tasks & projects', title:'Resume work on a project',
    summary:'See project context in Planner and bring your next task to Garden.',
    steps:['Select a project in Planner. Its overview shows the next milestone, upcoming blocks, linked sticky notes, and recent focus sessions.',
      'Check estimated work left beside the milestone. Garden subtracts completed focus time from estimates for unfinished linked tasks and lists how many of those tasks still need an estimate.',
      'Choose `Resume project` to select the project’s first ready task in the Garden focus queue. Finish or reset any current focus session first.',
      'Read the task’s description and saved next step. Use linked notes for context or choose `Back to timer` when you are ready. The project name by the timer reopens this panel.'],
    action:'planner', actionLabel:'Open Planner', related:['projects','linked-notes','focus-queue','project-session-timeline']
  },
  {
    id:'project-session-timeline', group:'Tasks & projects', title:'Review a project’s session timeline',
    summary:'See actual time, outcomes, and handoffs grouped by task.',
    steps:['Open a project in Planner and expand `Project overview`. Scroll to `Session timeline`.',
      'Read the newest sessions first under each task. Actual time excludes pauses and follows task switches recorded by the timer.',
      'Each entry shows whether the session was completed or skipped. Saved outcomes, handoffs, next steps, and mistake retry results appear when available.'],
    action:'planner', actionLabel:'Open Planner', related:['project-resume','focus-replay','resume','mistake-notebook']
  },
  {
    id:'exam-plans', group:'Tasks & projects', title:'Prepare for exams and log results',
    summary:'Keep prep topics, confidence ratings, practice scores, and your final reflection in a project.',
    steps:['Open a project in Planner and choose Exam prep in Project overview. Add an exam with a name and an optional date.',
      'Add topics one per line and save the prep plan. Set confidence on each topic as you practice. Use Remove to drop a topic when you save.',
      'Under Practice scores, give each attempt a name, date, score, and maximum. Log each attempt separately.',
      'Choose `Review mistakes` to log mistakes against the exam’s topics and retry the ones you have yet to solve.',
      'Choose `Plan study blocks`, enter your available minutes, and preview open times up to two weeks ahead and before the exam date. Suggestions prioritize unsolved mistakes and topics with low confidence. Approve only the blocks you want on Calendar.',
      'After the test, save the date taken, result, and reflection. Select its star in Garden or Garden history to see the result or reopen the plan. Editing the result updates the same star.'],
    action:'planner', actionLabel:'Open Planner', related:['projects','garden-growth','mistake-notebook']
  },
  {
    id:'mistake-notebook', group:'Tasks & projects', title:'Log mistakes and practice them again',
    summary:'Save corrected reasoning and revisit mistakes until you solve them.',
    steps:['Open an existing task and choose `Mistake notebook`, or open a project exam and choose `Review mistakes`.',
      'Expand `Log a mistake`. Describe what went wrong and how to reason through it correctly. In an exam, select the topic.',
      'Choose `Retry with focus` to open Garden and start the focus timer. Garden shows the mistake prompt and keeps the corrected reasoning tucked away during the session.',
      'When the timer expires, choose `Review retry`, or select `Finish retry` to finish early. Reveal the reasoning if needed, then choose `Solved it` or `Still stuck`. A reset or skip does not log a retry result.',
      'To practice without a timer, try the problem before choosing `Reveal reasoning`. Choose `Solved it` to clear it from To retry or `Still stuck` to keep it queued.',
      'Choose `All` to revisit successful retries. Open the notebook from Planner to review mistakes across tasks and exams.'],
    action:'mistakes', actionLabel:'Open Mistake notebook', related:['tasks','exam-plans','backup']
  },
  {
    id:'project-health', group:'Tasks & projects', title:'Check project health and deadline risks',
    summary:'Find projects with no next action, tasks waiting on prerequisites, and estimated work that exceeds available time.',
    steps:['Open Planner → `Project health`. Select a project or task name to open it.',
      'Expand the prerequisite list to see which tasks are waiting and what needs to be finished first.',
      'Expand Deadline risk to see the remaining minutes that do not fit before a task deadline or a linked milestone. Projects share the same time, allocated from the earliest deadlines first.',
      'Add estimates where they are missing. The forecast checks up to one year and uses your availability, daily study limit, cutoff, cooldowns, and calendar commitments.'],
    action:'health', actionLabel:'Open Project health', related:['projects','workload','deadline-plan','availability']
  },
  {
    id:'filters', group:'Tasks & projects', title:'Use filters, labels, and priorities',
    summary:'Create saved views of the work you want to see.',
    steps:['Open Planner → `Filters & Labels`. Use the plus beside Filters or Labels to add one.',
      'Add labels and priorities to tasks in the task editor. P1 is highest; P4 is normal.',
      'For a filter, try `today & p1` for today’s highest-priority work, or `%reading | #Study` for a label or project.',
      'Queries also support `overdue`, `undated`, `recurring`, `completed`, words, and `!` to exclude a match. Select a saved filter or label to open its tasks.',
      'Use `Pin 30 minutes or less` or `Pin Due this week` for a ready-made view. For your own filter, turn on `Pin in Planner` to show it in the sidebar.'],
    action:'filters', actionLabel:'Open Filters & Labels', related:['projects','search']
  },
  {
    id:'completion', group:'Tasks & projects', title:'Complete tasks, clear Done, and undo',
    summary:'Keep completed work recorded without filling your Garden task list.',
    steps:['Check a task’s completion circle to finish it. A small animation marks the completion.',
      'Use `Clear done` above the Garden’s Done column to hide finished items from that column.',
      'To see completed tasks in Planner, open Display options and enable `Show completed`. Reporting also keeps completion history.',
      'After a supported delete, move, or completion, choose `Undo` in the confirmation message to reverse it before the message expires.'],
    tip:'Clear done hides items in Garden; it does not delete the tasks. Resetting or skipping a timer does not mark its task complete.',
    action:'planner', actionLabel:'Open Planner', related:['reporting','focus-queue']
  },
  {
    id:'calendar', group:'Calendar & planning', title:'Schedule tasks and navigate dates',
    summary:'Use the full calendar, the task shelf, or Garden’s 5-hour view.',
    steps:['Open the Calendar tab. Use Day, 3 days, Week, or Month to choose the view.',
      'Use the date picker, Today, and previous/next controls to move through dates. Timed views open near the current time. Week views also scroll horizontally.',
      'Open `Task shelf` to find a task. Drag it onto a time slot, or choose it to set its schedule. A task without an estimate defaults to a one-hour block.',
      'Garden’s 5-hour calendar sits below your tasks. Collapse the Tasks list to make more room. Use the arrows to browse, Now to return, or Open calendar for the full view. Select a short block or colored marker to see its full details.'],
    tip:'Overlapping blocks are supported. Planner and Calendar share your tasks and bookings.',
    action:'calendar', actionLabel:'Open Calendar', related:['multiple-blocks','events','block-focus','focus-replay']
  },
  {
    id:'focus-replay', group:'Calendar & planning', title:'Replay actual focus sessions',
    summary:'Compare your planned schedule with the timer activity you recorded.',
    steps:['Open Calendar and choose `Actual`. Use Day, 3 days, or Week, then navigate to the dates you want.',
      'Select a focus block to see its start, pauses, resumptions, task switches, and how the session ended. Gaps between blocks show paused time.',
      'Choose `Planned` to return to scheduling. Older sessions with only a duration and finish time are marked Estimated.'],
    action:'focus-replay', actionLabel:'Open Actual calendar', related:['calendar','block-focus','resume','reporting']
  },
  {
    id:'schedule-preview', group:'Calendar & planning', title:'Check free time and scheduling overlaps',
    summary:'See what a timed task would overlap and how much open time would remain.',
    steps:['Enter a time and estimate in the task editor or choose a task from Calendar’s `Task shelf` to set a block duration.',
      'When the editor finds completed focus history for similar tasks, it shows their typical duration. Choose `Use … min` to apply the suggested estimate or enter your own.',
      'Read the preview for free time until your scheduling cutoff and the commitments the proposed time overlaps.',
      'Change the start or duration to avoid a conflict, or save to keep the overlap. Calendar also asks you to review drops scheduled for today or drops that would overlap another commitment.'],
    tip:'Today’s free time starts now. Future dates use a 9 AM start. The cutoff comes from Replan today.',
    action:'calendar', actionLabel:'Open Calendar', related:['calendar','deadline-plan','replan'], keywords:'conflict collision remaining capacity double book'
  },
  {
    id:'deadline-plan', group:'Calendar & planning', title:'Plan backward from a deadline',
    summary:'Fit your remaining study time into calendar blocks before a task is due.',
    steps:['Give a task an estimate and deadline. Choose `Save and plan to deadline` in the task editor or `Plan to deadline` in Planner.',
      'Review the suggested blocks and how much time couldn’t fit. Expand `Why this time?` to see the deadline, free time, and commitments. Suggestions credit booked time and completed focus for the task.',
      'Choose the blocks you want, then select `Add selected blocks`. Calendar opens to the first booking.'],
    tip:'Suggestions work backward from the deadline using 9 AM, your Replan cutoff, and the daily study capacity in Workload. For a repeating task, the plan targets the latest unfinished occurrence by the deadline.',
    action:'deadline', actionLabel:'Open Plan to deadline', related:['build-week','workload','schedule-preview','task-dependencies']
  },
  {
    id:'build-week', group:'Calendar & planning', title:'Build a week around deadlines',
    summary:'Draft seven days of focus blocks and see which deadlines need attention.',
    steps:['Set deadlines and estimates on your tasks. In Planner, choose `Build my week` or find it with `Ctrl+K`.',
      'Choose the first day, available hours, daily study minutes, and cooldown between blocks. The cooldown defaults to five minutes and also applies to Plan to deadline, Plan tomorrow, and Replan today suggestions.',
      'Choose `Draft week` and review deadlines at risk. Expand `Why this time?` to see the deadline, free time, calendar commitments, and event buffers behind a suggestion.',
      'Choose `Compare drafts` to preview Lighter week at two thirds of your daily limit and Earlier finish at the full limit. Compare deadlines covered, the last new block, and spare study capacity. Select one to load it into the editable draft.',
      'Use `Edit block` to change its day, start, or duration. Use `Skip block` to set it aside, or `Restore block` under Skipped blocks to bring it back. The draft shows pending blocks and planned time.',
      'Choose `Approve day` to add that date’s blocks to Calendar. Review or edit any remaining days separately.'],
    action:'build-week', actionLabel:'Open Build my week', related:['deadline-plan','availability','workload']
  },
  {
    id:'multiple-blocks', group:'Calendar & planning', title:'Give one task multiple calendar blocks',
    summary:'Reserve several work periods without creating duplicate tasks.',
    steps:['Open Calendar and find the task in `Task shelf`.',
      'Drag it into each time slot where you want to work on it. Each added block stays linked to the original task.',
      'Click a block and choose its edit action to adjust that block’s date, start, or duration.',
      'Drag an existing block to move it. Blocks can overlap when you need to plan simultaneous activities.'],
    action:'calendar', actionLabel:'Open Calendar', related:['calendar','block-focus','replan']
  },
  {
    id:'block-focus', group:'Calendar & planning', title:'Start focus from a calendar block',
    summary:'Use the block’s remaining time and track what actually happened.',
    steps:['Click a task block in Calendar or Garden’s 5-hour calendar.',
      'Choose the start-focus action in its panel. The linked task is selected automatically.',
      'The countdown uses the time still available before the block ends. If you start before the block, its full planned duration is available.',
      'Blocks longer than an hour use focus periods of up to 50 minutes with 10-minute breaks. Click a block later to inspect its recorded focus time and status.'],
    tip:'Blocks can show focused, partly done, or missed. A completed focus session and a completed task are separate records; check off the task when the work itself is finished.',
    action:'calendar', actionLabel:'Open Calendar', related:['timer','reporting','replan']
  },
  {
    id:'calendar-lists',group:'Calendar & planning',title:'Organize events into calendars',
    summary:'Keep separate color-coded calendars for school, work, and personal plans.',
    steps:['Open Calendar. Under My calendars, click the plus button and give the calendar a name and color. On smaller screens, tap Calendars to open the sidebar.',
      'Use the Calendar theme selector in the toolbar to choose Day, Dusk, or Night. Day uses warm off-white, and Calendar remembers its theme independently of Garden.',
      'When creating or editing an event, pick its calendar from the Calendar field. Use the checkboxes in the sidebar to show or hide calendars or the Tasks & rituals row.',
      'Use the mini month to jump to a date. Each imported .ics file appears as a separate calendar in the sidebar.',
      'Use the edit button next to a calendar name to change its name or default color. Choose a swatch or Custom, then use the color picker or type a hex code. Check the preview before saving. Removing a custom calendar moves its events to Personal.'],
    tip:'Hidden events stay saved and still count as commitments in Planner. Calendar settings are saved on this device and included in backups.',
    action:'calendar',actionLabel:'Open Calendar',related:['calendar','events','calendar-import','backup']
  },
  {
    id:'events', group:'Calendar & planning', title:'Create repeating tasks and events',
    summary:'Schedule calendar entries, choose Task or Event, and set their repeat pattern.',
    steps:['Choose Create or click an empty time in Calendar. Use the Task or Event switch above Title. The plus in an all-day row or month cell starts an all-day entry.',
      'Choose a color swatch or Custom. The picker and hex field update the preview. Events can inherit their calendar’s default color.',
      'Enter dates and times or turn on All day. Choose Repeat for daily, weekday, weekly, monthly, yearly, or custom day intervals.',
      'Click a manual event to edit it or switch it to a task. For a task, open Edit task → Change entry type. A task with linked work or task history stays a task. Changes to repeating events apply to the full series.',
      'For a timed event, set `Minutes before` and `Minutes after` under `Planning buffers` to reserve travel, setup, or recovery time. On an imported event, open its details and choose `Save buffers`.',
      'Week drafts and deadline plans protect the longer of the event buffer and the regular cooldown on each side. The event retains its original calendar times.'],
    action:'calendar', actionLabel:'Open Calendar', related:['calendar-import','tomorrow','workload']
  },
  {
    id:'task-tradeoffs', group:'Calendar & planning', title:'Make room for a task today',
    summary:'Compare open time, a split session, and moves that make room for your task.',
    steps:['In Calendar → `Planned` or Planner → Today, choose `Fit a task today`. Save the task first so it can appear in the picker.',
      'Select an unscheduled task and choose `Compare options`. Each move shows the existing task’s original time and its proposed new time today or tomorrow.',
      'To constrain a move, edit the task block or a timed event you created and open `Scheduling flexibility`. Use `Keep fixed` or set the earliest start, latest finish, and whether it can move to tomorrow. Timed events are only offered as moves when you explicitly make them flexible.',
      'Choose `Apply option` to update the calendar. The confirmation’s Undo button reverses the whole change.'],
    tip:'Options use your study cutoff, daily capacity, recurring availability, and event buffers. A task without an estimate uses one hour.',
    action:'tradeoffs', actionLabel:'Open Fit a task today', related:['calendar','replan','availability','project-health']
  },
  {
    id:'replan', group:'Calendar & planning', title:'Replan missed work before a cutoff',
    summary:'Review suggested moves for missed blocks before applying them.',
    steps:['In Calendar, choose `Replan today`. You can also find the action with `Ctrl+K`.',
      'Set `Stop scheduling at` to your cutoff, such as 9 PM, and update the suggestions.',
      'Review the proposed slots. The planner can suggest two shorter slots or tomorrow when a block will not fit today. Uncheck moves you do not want.',
      'Apply the selected moves. Use Undo in the confirmation message if you want to reverse them.'],
    tip:'Suggestions avoid timed commitments, active work, and blocks that already have recorded focus. Nothing moves until you approve it.',
    action:'replan', actionLabel:'Open Replan today', related:['tomorrow','workload'], keywords:'missed overdue reschedule split cutoff'
  },
  {
    id:'availability', group:'Calendar & planning', title:'Protect time every week',
    summary:'Keep recurring work hours, evenings, and days off free when planning.',
    steps:['Open Planner or Calendar and choose `Availability`.',
      'Name the block, select the days it repeats, and set a start and end time or choose All day. An end time earlier than the start continues into the next day.',
      'Choose `Add unavailable time`. Build my week, Plan tomorrow, and Replan today avoid these blocks. Open Availability again to edit or remove a block.'],
    action:'calendar', actionLabel:'Open Calendar', related:['build-week','tomorrow','replan']
  },
  {
    id:'tomorrow', group:'Calendar & planning', title:'Plan tomorrow in two minutes',
    summary:'Choose tomorrow’s first task and reserve a focus block.',
    steps:['Open Planner → `Plan tomorrow`, or run that action from `Ctrl+K`.',
      'Review the unfinished-today list and choose `Tomorrow’s first task`.',
      'Check the suggested start time and focus minutes. Use `Find open time` to search for another available slot, or enter a time yourself.',
      'Choose `Reserve focus block`. Calendar opens to the booking, and the chosen task leads tomorrow’s automatic focus queue.'],
    tip:'You can reopen this flow to change the plan. It updates the block it created rather than accumulating duplicate reservations. A manually pinned focus queue can take precedence.',
    action:'tomorrow', actionLabel:'Open Plan tomorrow', related:['focus-queue','replan']
  },
  {
    id:'weekly-review', group:'Calendar & planning', title:'Review the week',
    summary:'See completed work, open work, and what is coming next.',
    steps:['Open Planner → `Weekly review` in the left sidebar.',
      'Use the week arrows or `This week` to choose the period.',
      'Under Weekly project goals, choose `Set goals` on a project. Set focus minutes, chapters, or both. Select that project when you save a chapter log in Annotate.',
      'Review completed-task and focus totals, plus lists of still-open work from earlier weeks, open work this week, and next week’s tasks.',
      'Use `Move to today` on eligible carried-over tasks to bring them back into today’s plan.'],
    action:'review', actionLabel:'Open Weekly review', related:['workload','reporting','tomorrow']
  },
  {
    id:'workload', group:'Calendar & planning', title:'Preview workload and daily capacity',
    summary:'Find overfull days before they happen.',
    steps:['Open Planner → `Workload`.',
      'Choose the week you want to review and set your available daily study capacity.',
      'Compare each day’s planned task time with that capacity. Days above the limit show how much they are over.',
      'Review calendar commitments as well as study blocks, then adjust bookings in Calendar or use Replan today for missed work.'],
    tip:'Overlapping study blocks still count as planned work. Overlapping calendar commitments are counted once when measuring occupied time.',
    action:'workload', actionLabel:'Open Workload', related:['calendar','replan','weekly-review']
  },
  {
    id:'calendar-import', group:'Calendar & planning', title:'Import a calendar or Canvas schedule',
    summary:'Bring events in from an iCalendar (.ics) file.',
    steps:['Download an `.ics` calendar file from the source you use. In Canvas, look for Calendar → Calendar Feed.',
      'Open Calendar → More → `Import .ics` and choose the downloaded file.',
      'Import it to add its supported events and recurring occurrences to the shared schedule.',
      'To refresh imported data, download a new file and import it again. The import panel also lists imported sources with Remove controls.'],
    tip:'This is a file import, not a live Canvas account connection or automatic background sync.',
    action:'calendar-import', actionLabel:'Open calendar import', related:['events','calendar','calendar-export'], keywords:'ics ical feed classes assignments canvas sync'
  },
  {
    id:'calendar-export', group:'Calendar & planning', title:'Export a calendar as .ics',
    summary:'Take a day, week, or project schedule to another calendar.',
    steps:['Open Calendar → More → `Export .ics`, or choose Export .ics from a project in Planner.',
      'Choose Day, Week (Monday through Sunday), or Project. For a project, also select an end date.',
      'Choose `Download .ics`, then import the file into your other calendar. Day and week exports can include standalone events; project exports include its timed task blocks.'],
    action:'calendar', actionLabel:'Open Calendar', related:['calendar','calendar-import'], keywords:'ics ical download export'
  },
  {
    id:'reporting', group:'Tasks & projects', title:'Reports and estimate accuracy',
    summary:'Inspect completed tasks, focus time, skipped sessions, and estimates.',
    steps:['Open Planner → `Reporting`.',
      'Choose Activity log, Metrics, or Estimate accuracy. Filter by project and date range as needed.',
      'Metrics shows focus minutes, completed tasks and sessions, skipped sessions, active days, averages, and completion rate. Choose a daily metric to compare days.',
      'For Estimate accuracy, set a task estimate, complete focus sessions with that task selected, and mark the task done. Use `Export CSV` to download the current report.'],
    tip:'Estimate accuracy compares the saved estimate with completed focus time for each completed occurrence. Repeated overruns are flagged when enough completed examples exist.',
    action:'reporting', actionLabel:'Open Reporting', related:['block-focus','tasks','weekly-review']
  },
  {
    id:'csv-import', group:'Tasks & projects', title:'Import tasks from Todoist',
    summary:'Bring a Todoist project CSV into a new local project.',
    steps:['Export your project from Todoist as a CSV file.',
      'In Planner’s left sidebar, choose `Import Todoist CSV`.',
      'Select the file and optionally name the project, then choose Import.',
      'Review imported tasks. Unrecognized schedule text is preserved in task descriptions so you can set it manually.'],
    action:'csv-import', actionLabel:'Open task import', related:['projects','backup']
  },
  {
    id:'capture', group:'Thoughts & notes', title:'Capture a distracting thought',
    summary:'Get a thought out of your head without losing your place.',
    steps:['Press `Ctrl+Alt+N` while using the app, or open Garden → `Tools` → `Quick notes` and choose `Quick capture`.',
      'Write the thought and press `Ctrl+Enter` or choose `Save note`. Escape closes capture without submitting it.',
      'When a task is selected in Garden, check `Remember` in the browser capture or its mini window to attach the task and any active calendar block.',
      'Open the `Note inbox` in Notes to sort your captured thoughts.',
      'Give a thought a destination: make a task, attach it to a project, or move it to Quick Notes. Attached thoughts are available from that project’s Thoughts button.'],
    tip:'The Quick Notes text area saves as you type. The quick-capture form has an explicit Save note action.',
    action:'capture', actionLabel:'Open quick capture', related:['capture-inbox','capture-window','sticky-notes','projects']
  },
  {
    id:'capture-inbox', group:'Thoughts & notes', title:'Sort ideas in the note inbox',
    summary:'Review unsorted captured thoughts and decide where they belong.',
    steps:['Open Notes → `Note inbox`, or find it with `Ctrl+K`.',
      'File a thought as a sticky note, make a task, attach it to a project, or link it to an existing task. Linking creates a sticky note you can open from that task.',
      'Press `N` for the next thought or `P` for the previous one. With a thought focused in Unsorted, press `F` to file it as a sticky note, `L` to link it to a task, or `A` to archive it.',
      'Choose `Archive` to set a thought aside. Open the Archive view and choose `Return to inbox` whenever you want to sort it again.'],
    action:'capture-inbox', actionLabel:'Open note inbox', related:['capture','sticky-notes','linked-notes']
  },
  {
    id:'capture-window', group:'Thoughts & notes', title:'Use the mini note window and system hotkey',
    summary:'Capture notes in a small window, including from other Windows apps.',
    steps:['In Garden’s Notes tool or quick capture, choose `Open mini window`. Allow popups for this site if your browser blocks it.',
      'For a system-wide Windows shortcut, keep the app server running and open a second terminal in the `yin-and-yang` folder.',
      'Run `npm run capture-hotkey -- PORT`, replacing `PORT` with the port in your app’s address. For example: `npm run capture-hotkey -- 5180`.',
      'While the helper is running, `Ctrl+Alt+N` opens a note near the pointer even from another application. `Ctrl+Enter` saves; Escape hides it. Saved thoughts appear back in the app.'],
    tip:'The browser alone cannot register a system-wide hotkey. The optional helper is Windows-only; its port must match the app server.',
    action:'capture', actionLabel:'Open quick capture', related:['capture','shortcuts'], keywords:'global windows shortcut popup sticky minitab'
  },
  {
    id:'sticky-notes', group:'Thoughts & notes', title:'Arrange sticky notes',
    summary:'Create movable, resizable notes with editable stacking order.',
    steps:['Open the Notes tab and choose `New note`.',
      'Type a title and note text. Edits save immediately.',
      'Drag the move handle to arrange the note. Drag its resize handle to change its size. Use Bring to front or Send to back to change the layer.',
      'For keyboard control, focus the move or resize handle and use the arrow keys. Use the delete control to remove a note and Undo when available to restore it.'],
    action:'notes', actionLabel:'Open sticky notes', related:['linked-notes','search']
  },
  {
    id:'linked-notes', group:'Thoughts & notes', title:'Link notes to tasks or turn a line into a task',
    summary:'Keep the original context beside your focus timer.',
    steps:['In the Notes tab, use a note’s link control to choose tasks, books, projects, or journal entries and save the links. Open the original sticky note from a linked book, project, or journal entry.',
      'To create a task from a note, select text or place the cursor on a line, then choose `Create task from note text`.',
      'Review the new task in its editor and save it. The original note is linked automatically.',
      'Select the linked task in Garden and open `Session tools` → `Task notes` to open the notes beside the timer.'],
    action:'notes', actionLabel:'Open sticky notes', related:['sticky-notes','focus-queue','resume']
  },
  {
    id:'daily-rituals', group:'Reading & journal', title:'Daily Crochet, Annotate, and Journal items',
    summary:'Choose which days and times Crochet, Annotate, and Journal appear in Calendar.',
    steps:['Open Calendar → Rituals. For each activity, pick Off calendar, All day, or At a time. Select the weekdays and, for timed rituals, set a start time and duration. Choose Save schedules.',
      'Open the ritual from its block or use the Open button in Rituals when it’s off the calendar. Crochet links a Stitchbook project, Annotate holds your book and reading goal, and Journal opens that date’s entry.',
      'Use the small check control to mark a ritual complete or incomplete for that day.',
      'Saving a journal entry automatically completes that date’s Journal item. A newer saved entry can complete it again if you previously reopened it.'],
    action:'calendar', actionLabel:'Open Calendar', related:['reading-goal','journal','crochet-projects']
  },
  {
    id:'reading-goal', group:'Reading & journal', title:'Set a reading goal and stopping point',
    summary:'Show your next chapter or page target alongside where you left off.',
    steps:['Open `Annotate` from your Calendar, or from Calendar → Rituals for the displayed date.',
      'Enter the book and author. Optionally choose `Search Open Library` to look up a title; you can always enter it yourself.',
      'Choose Chapter or Page as the goal type and enter your next-session target, such as `12` or `45–60`.',
      'Log chapters annotated, one per line or as a range. Use `Where you stopped` for a bookmark such as “Page 52,” then choose `Save annotation log`.'],
    tip:'The daily Annotate item shows your goal and last stopping point. An unfinished goal can carry into the next day; check the ritual off when you finish it.',
    action:'calendar', actionLabel:'Open Calendar', related:['reading-shelf','daily-rituals'], keywords:'book annotation bookmark chapters pages target'
  },
  {
    id:'reading-shelf', group:'Reading & journal', title:'Build your Reading library',
    summary:'Add books directly to your bookshelf and open their reviews and annotation history.',
    steps:['Open Reading and click Add book. Enter a title, optional author and page count, and choose Want to read or Reading.',
      'Hover over a spine or focus it with Tab to preview its cover. Select the spine to open its details. Every rated spine has a badge. A ringed planet marks 6/5, a crystal marks 5–5.9/5, and gold, silver, bronze, and poop mark the lower ratings.',
      'Choose Shelf order to use multiple shelves. Books in adjacent slots sit flush. Spine thickness follows the page count and uses 350 pages for sizing when the count is missing. Leave an empty slot when you want a gap. Drag a spine into any slot, or open Place on shelf in book details to choose a shelf and slot on touch screens. Dragging onto another book swaps their positions. Add shelf makes another row.',
      'In Shelf order, choose Add bookend and select a design and an empty slot. Click a placed bookend to move, mirror, or remove it.',
      'Open a book and choose Archive book to move it to Archived. Restore to shelf brings it back. Delete book asks you to confirm before removing the book, its reading records, and its Garden lantern.',
      'Choose Find pages on Open Library in the book editor. Search by title and author for a typical page count or use ISBN for a specific edition. Select a result and save. You can enter pages manually.',
      'In an unfinished book, use Edit library entry to change its information or shelf, or Mark book finished to move it to Finished.',
      'If a typo split a book, open the duplicate and choose `Merge duplicate book`. Pick the book you want to keep. Logs, chapter notes, and sticky links move there. If both are finished, their review text is combined and the kept book’s completion and lantern take priority.',
      'Read `Where you left off`, chapters annotated, and the dated history of your logs. Enter total pages and page numbers in your Annotate logs to get a pace forecast. When recent progress varies, Reading shows a range of sittings.',
      'Use `Add chapter note` on a book to save a question, quote, or insight. Choose `Schedule review` on a note to see it again in three days.',
      'Use Calendar and the daily Annotate item to add your next log or goal. Ctrl+K can also find a book and open its history directly.'],
    tip:'Your library saves to this browser profile and site address. If books are missing after switching ports or browsers, reopen the original address and export a backup from there.',
    action:'reading', actionLabel:'Open Reading', related:['reading-collections','chapter-reviews','reading-discussion','finished-books','reading-goal','search']
  },
  {
    id:'reading-collections', group:'Reading & journal', title:'Arrange books in collections',
    summary:'Group and order books by series, course, or theme.',
    steps:['Open Reading → `Collections`. Enter a name and type, then choose `Create collection`.',
      'Choose a book from your shelf and select `Add book`. Use the up and down buttons to change the reading order.',
      'Choose a book in the collection to open it. A book can belong to several collections.'],
    action:'reading', actionLabel:'Open Reading', related:['reading-shelf','finished-books']
  },
  {
    id:'chapter-reviews', group:'Reading & journal', title:'Schedule chapter reviews',
    summary:'Review due notes and space them out as you remember them.',
    steps:['Choose `Schedule review` on a chapter note. The first review is due in three days. Previously queued notes appear as due right away.',
      'Open Reading → `Review queue` to see what is due now and what is coming up.',
      'Choose `Remembered` for a longer interval, or `Again tomorrow` to revisit it the next day. Use `Remove from queue` to stop scheduling a note.'],
    action:'reading', actionLabel:'Open Reading', related:['reading-shelf','reading-collections']
  },
  {
    id:'reading-discussion', group:'Reading & journal', title:'Build a printable reading discussion sheet',
    summary:'Gather selected quotes, questions, and insights with their chapter references.',
    steps:['Open Reading and pick a book. Add any missing quotes, questions, or insights under Chapter notes.',
      'Choose `Discussion sheet` in Chapter notes. Check the items you want to share and review the preview.',
      'Choose `Print / Save PDF` and select a printer or a PDF destination in the browser dialog.'],
    action:'reading', actionLabel:'Open Reading', related:['reading-shelf','chapter-reviews']
  },
  {
    id:'book-ratings',group:'Reading & journal',title:'Rate books and rereads',
    summary:'Give books fractional stars or reserve 6/5 for a favorite.',
    steps:['Open a finished book from Reading and choose Write final review or Edit final review.',
      'Enter a rating from 1 to 6. Type a decimal like 4.7, or use a quick rating button. The extra sparkle gives you 6/5. Save finished book to update the cover.',
      'Cover borders change by rating. 1–1.9 has a poop badge, 2–2.9 is bronze, 3–3.9 is silver, 4–4.9 is gold, 5–5.9 is teal Crystal, and exactly 6/5 earns the violet-and-gold Aurora tier. The final rating sets the cover; rereads keep their own ratings.'],
    tip:'Crystal and Aurora covers shimmer when you open a book. Opening a rated book’s Garden lantern uses its tier across the full popup. Crystal and Aurora lanterns also shimmer, with motion disabled by Garden Still or reduced-motion settings. Reading respects the system’s reduced-motion setting.',
    action:'reading',actionLabel:'Open Reading',related:['reading-shelf','finished-books']
  },
  {
    id:'finished-books', group:'Reading & journal', title:'Edit finished books and write reviews',
    summary:'Correct book details and keep a final review, rating, and takeaway.',
    steps:['In Reading, choose `Finished` to filter the shelf, then open a book. To finish a book, open it on the full shelf and choose `Mark book finished`.',
      'Choose `Edit book details` to correct the title, author, finish date, or page count. Annotation history and links follow a title or author change.',
      'Choose `Write final review` or `Edit final review` to add your thoughts, an optional rating, including a bonus 6/5, and a main takeaway. Choose `Save finished book`.',
      'Choose `Log a reread` to save a separate finish date, rating, and review. Use `Edit reread` to revise that entry.'],
    tip:'Reading backups include your finished books and reviews.',
    action:'reading', actionLabel:'Open Reading', related:['reading-shelf','book-ratings','garden-growth','backup']
  },
  {
    id:'journal', group:'Reading & journal', title:'Write and revisit journal entries',
    summary:'Use a spacious editor with visible date, mood, and project fields.',
    steps:['Open Journal → `New entry`, or click a date’s Journal ritual in Calendar.',
      'Start blank or choose a template and select `Insert template`. Use `Save as template` to reuse the current draft text in another entry.',
      'Add a title and write your entry. Choose the date, optional mood, and an optional crochet project above the writing area. Add comma-separated tags and themes to make entries easier to find.',
      'Your draft saves as you type. Reopen it from the library after closing or refreshing. Choose `Mark complete` when you want it to count toward that date’s Journal ritual.',
      'Search the journal library or Ctrl+K to find an entry. Click its title to edit it. Deleting asks for confirmation and offers Undo after deletion.'],
    tip:'Drafts and completed entries are saved locally and included in backups.',
    action:'journal', actionLabel:'Open Journal', related:['daily-rituals','journal-patterns','journal-anniversaries','backup']
  },
  {
    id:'journal-patterns', group:'Reading & journal', title:'Find journal patterns and write weekly reflections',
    summary:'Browse entries by mood, tag, or a theme you label yourself.',
    steps:['In Journal → `Entries`, use the Mood, Tag, and Theme filters. Search and filters can be combined.',
      'Open `Patterns & reflections`. Move between Monday-to-Sunday weeks and select a label to browse matching entries.',
      'Choose `Write reflection`, write your notes, and check the completed entries you want to reference. Choose `Save reflection`.',
      'Reopen a week with `Saved reflections`. Select a referenced entry to jump back into its editor. Weekly reflections are saved separately from daily Journal completions.'],
    action:'journal-patterns', actionLabel:'Open Patterns & reflections', related:['journal','weekly-review','backup']
  },
  {
    id:'journal-anniversaries', group:'Reading & journal', title:'Revisit this week in past years',
    summary:'Find completed entries from the same time of year and open the corresponding weekly reflections.',
    steps:['Open Journal → `Past years`. Each year shows the Monday-to-Sunday week containing the anniversary of today’s date.',
      'Select an entry title to read or edit it. Select `Open weekly reflection` when that week has a saved reflection.',
      'Choose `Past years` again to return to the comparison.'],
    action:'journal-anniversaries', actionLabel:'Open Past years', related:['journal','journal-patterns']
  },
  {
    id:'crochet-projects', group:'Stitchbook', title:'Track crochet projects, rows, and time',
    summary:'Keep patterns, row goals, project status, and hours worked together.',
    steps:['Open Crochet → Projects → `New project`.',
      'Set a name, status, hook size, rows, optional row goal, pattern link, and notes. Link yarn already in your stash, then Save.',
      'Use the plus/minus row buttons as you work. Row goals show progress, and the status filter helps you find active or finished projects.',
      'Choose `Add counter` for separate counts such as a sleeve or a stitch repeat. Save a checkpoint with a resume note to record the current row and counter values.',
      'Use `Edit` on a counter, or edit the project for its main Rows counter. Under Next row instruction, enter what to do and optionally set the row number. A blank row number uses the count plus one. The card shows the instruction and marks it Done once you count that row.',
      'Choose `Log time` on a project, enter the date and minutes worked, and save. The project shows its total hours and minutes and the time dialog shows recent sessions.',
      'Choose `Log pattern change` to record a date, row, and change. Open the same dialog to see earlier changes.'],
    tip:'Link a project from Calendar’s daily Crochet item for quick access. Time logs, row counts, and yarn use are separate, so you can update just what changed.',
    action:'crochet', actionLabel:'Open Stitchbook', related:['yarn','shopping-list','journal','daily-rituals'], keywords:'stitchbook crochet hours duration log time pattern hook rows'
  },
  {
    id:'checkpoint-photos',group:'Stitchbook',title:'Attach progress photos to checkpoints',
    summary:'Keep a reference picture of a sleeve, seam, or stitch repeat with your resume note.',
    steps:['In Crochet, open a project’s Checkpoints. Add a resume note and choose up to three JPEG, PNG, or WebP photos before saving.',
      'For a saved checkpoint, choose Add photos or View / edit photos. Use Remove photo and Save photos to remove or replace an image.',
      'On the project card, expand Latest checkpoint photos under Resume here to see the most recent checkpoint’s images.'],
    tip:'Photos are resized and stored on this device. Stitchbook backups include the resized copies.',
    action:'crochet',actionLabel:'Open Stitchbook',related:['crochet-projects','backup']
  },
  {
    id:'shopping-list', group:'Stitchbook', title:'Work out what yarn to buy',
    summary:'See yarn shortages by colorway across planned and in-progress projects.',
    steps:['In Stitchbook, add yarn to the stash. Enter zero grams on hand for a colorway you still need to buy.',
      'Edit a planned or in-progress project. Link its yarn and enter the total grams needed for each yarn.',
      'Open `Shopping list` to see what to buy. The list credits yarn already logged as used and combines on-hand grams for matching yarn names, colorways, and weights.'],
    action:'crochet', actionLabel:'Open Stitchbook', related:['crochet-projects','yarn','yarn-substitution']
  },
  {
    id:'yarn-substitution', group:'Stitchbook', title:'Calculate skeins for a yarn substitution',
    summary:'Use pattern yardage, replacement skein yardage, and the stash you can use.',
    steps:['In Stitchbook → `Shopping list`, open `Yarn substitution calculator`.',
      'Enter the pattern’s total yardage and the replacement yarn’s yards per skein. Stitchbook rounds up to whole skeins.',
      'Select any usable yarn in the checklist. Add the yarn label’s yards and grams per skein in `Yarn stash` so Stitchbook can convert its remaining grams to estimated yards.',
      'If you know the yardage of additional stash, enter only that amount under `Other usable stash (yards)`. Read the updated number of skeins to buy and yards left to cover.'],
    tip:'Select only yarn you intend to use. The calculation leaves your inventory as it is.',
    action:'crochet', actionLabel:'Open Stitchbook', related:['shopping-list','yarn']
  },
  {
    id:'yarn', group:'Stitchbook', title:'Manage yarn stash and usage',
    summary:'Track colorways, fiber, dye lots, grams remaining, and project use.',
    steps:['Open Crochet → `Yarn stash` → `Add yarn`.',
      'Enter the name, colorway, swatch, weight, grams on hand, fiber, and dye lot, then save.',
      'Optional. Add the label’s yards per skein and grams per skein to include this yarn in the `Yarn substitution calculator`.',
      'Edit a project to link yarn from your stash.',
      'In Yarn stash, choose `Log use`, enter grams used, and optionally choose a linked project. Logging use reduces stock and adds to the project’s grams used.'],
    tip:'You cannot log more grams than are available. Removing a yarn also unlinks it from projects.',
    action:'crochet', actionLabel:'Open Stitchbook', related:['crochet-projects','backup']
  },
  {
    id:'appearance', group:'Make it yours', title:'Lighting, seasons, weather, and saved looks',
    summary:'Customize the landscape and switch looks by time of day.',
    steps:['In Garden, open `Tools` → `Appearance`.',
      'Choose lighting. `Follow timer` ties sunrise and sunset to focus progress; fixed day or night looks keep a steady atmosphere.',
      'Use the `Season wheel` to preview Spring, Summer, Autumn, or Winter on the same view of the lake. Choose `Apply season` to switch the live Garden, or save a named look directly from the preview.',
      'Set weather manually or choose `Rotate every 8 minutes` for seasonal changes. Summer heat brings a soft warm haze over the lake.',
      'Watch showers crossfade into lake mist and the cloud cover pull apart as skies clear. Spring petals, autumn leaves, rain, and snow scatter across the scene and move at different speeds. Summer evenings bring fireflies.',
      'Under `Scenery motion`, choose Still for a static scene, Gentle for slow movement, or Lively for faster movement. Still also holds the timer-driven sun in place. This setting applies across all saved looks.',
      'Choose a palette and lighting, then use `Saved Garden looks` to name and save the combination. Looks are silent by default. To include rain, water, and wind, set their levels in Music first and check the ambient sound option when saving.',
      'Select a saved look to apply its colors, weather, motion, and ambience. Applying a named look pauses the daily schedule. Saving with the same name updates that look.',
      'For timed looks, choose the appearance you want, set a start time under `Daily Garden presets`, and choose `Save preset`. Enable `Switch looks by time of day`.'],
    tip:'Changing the look manually pauses the schedule until you save or enable it again. Resetting a timer returns its sun directly to the beginning of the cycle. Click the penguin for another thought.',
    action:'appearance', actionLabel:'Open Appearance', related:['garden-studio','focus-mode','music','garden-postcard'], keywords:'theme garden snow rain fog sun sunset sunrise night day seasons presets'
  },
  {
    id:'garden-studio',group:'Make it yours',title:'Build a landscape in Garden Studio',
    summary:'Edit on a full-screen canvas with a tool rail, zoom, and undo.',
    steps:['In Garden, click Edit landscape. In Terrain, choose a category such as Shoreline, Path, Building, Building base, Boat, or Lantern. Click an illustrated tile to try that style on the canvas. Use Light for season, palette, weather, and lighting.',
      'Use Select to click or drag the building and props on the canvas. Choose earned landmarks from the Object list. The position sliders and arrow keys let you fine-tune placement.',
      'Use the bottom View and zoom controls to frame the canvas. Undo and Redo at the top step through scenery edits in the current draft.',
      'Name the layout and use Save layout or Save & apply at the top. In Layouts, load saved and starter layouts, save a copy, assign layouts by activity, set an archive date, or download a postcard.'],
    tip:'Save & apply updates the default Garden and pauses daily appearance presets. Activity assignments keep using their chosen layouts.',
    action:'garden-studio',actionLabel:'Open Garden Studio',related:['appearance','garden-growth','garden-postcard','backup']
  },
  {
    id:'garden-props',group:'Make it yours',title:'Place props in the Garden',
    summary:'Arrange bridges, plants, water details, and stone lanterns in a Studio layout.',
    steps:['Open Garden → Edit landscape. Choose Props in the tool rail, pick a thumbnail such as Vermilion footbridge, Copper maple, or Floating lantern, then click or tap the canvas to place it. Keep clicking to place more copies, or use Place in view from the keyboard.',
      'Switch to Select, then click the prop on the canvas or choose it from the Object list. Drag or use the position sliders to move it. Use Size or Remove prop to edit it.',
      'Save your layout. Props appear in the live Garden when you apply the layout and are included in postcards and backups.'],
    action:'garden-studio',actionLabel:'Open Garden Studio',related:['garden-studio','activity-layouts','garden-postcard']
  },
  {
    id:'activity-layouts',group:'Make it yours',title:'Switch Garden layouts by activity',
    summary:'Give Focus, Rest, and Shutdown their own saved Studio scenes.',
    steps:['In Garden, choose Edit landscape. Save each scene you want to use in Studio.',
      'Open Layouts. Under Layout by activity, select a saved layout for Focus, Rest, or Shutdown. The assignment saves immediately.',
      'Focus and Rest follow the timer mode. Shutdown appears when you open Evening lights and returns to the timer mode’s scene when you close it.',
      'Choose Default Garden to clear an assignment. Save and apply updates the default Garden.'],
    tip:'Activity layouts use their saved scenery and appearance with current landmarks. Backups include the assignments in Garden & focus.',
    action:'garden-studio',actionLabel:'Open Garden Studio',related:['garden-studio','evening-lights','backup']
  },
  {
    id:'garden-postcard',group:'Make it yours',title:'Export a Garden postcard',
    summary:'Download a 1600 × 900 PNG of the landscape with an optional caption.',
    steps:['In Garden, open `Tools` → `Appearance` or `Garden Field Guide`, then choose `Export postcard`.',
      'Type a caption such as a semester title or milestone, choose `Use month`, or leave it blank.',
      'Choose `Download PNG`. To export an earlier Garden, first open a historical view from the Field Guide.'],
    action:'garden-postcard',actionLabel:'Open postcard export',related:['garden-growth','garden-inscriptions','garden-comparison','appearance']
  },
  {
    id:'music', group:'Make it yours', title:'Spotify, YouTube, and app sounds',
    summary:'Play your playlists and choose whether the app makes any sound.',
    steps:['In Garden, open `Tools` → `Music & video`. Choose Spotify or YouTube, paste a link, and choose `Load`. Each service keeps its own most recent link.',
      'To keep several links, paste a link, expand `Save a soundtrack`, and enter a name. Use `Saved soundtracks` to switch links or `Remove saved` to remove one.',
      'On YouTube, choose `Pop out video` for a mini player inside Yin and Yang. Use `Expand` to return to the full player or hide the video to continue listening.',
      'Use `Open in Spotify` or `Open on YouTube` to play the saved link on the service’s own site.',
      'Optional rain, water, and wind have independent volume sliders. Focus and break chimes have separate sliders too. Zero disables a channel; `Silence` clears the ambience mix.',
      'Use `Mute all app sounds` for silence. If music is playing outside the embedded player, turn on `Music playing elsewhere` to pause app sounds.'],
    tip:'The embedded players pause app sounds while they are playing. Outside music needs the switch because this browser app cannot inspect or control all music playing on your computer.',
    action:'music', actionLabel:'Open Music', related:['notifications','focus-mode'], keywords:'audio mute volume ambient soundtrack'
  },
  {
    id:'search', group:'Search & shortcuts', title:'Search everything with the command palette',
    summary:'Find saved work or run an action without switching through tabs.',
    steps:['Press `Ctrl+K` (or `Command+K` on Mac). The magnifying-glass button in Garden, Planner, and Calendar opens it too.',
      'Type words from a task, note, book, or journal entry. Note and journal text are searchable, not just titles.',
      'Use up/down arrows and `Enter` to open a result, or click it. The app opens the matching workspace and item.',
      'Search for actions such as `Start timer`, `Replan today`, `Plan tomorrow`, `Add task`, or `Help`. Press Escape to close the palette.'],
    tip:'Planner’s own Search tasks view is focused on tasks. Use Ctrl+K for a search across workspaces. Close a modal editor before opening the palette.',
    action:'search', actionLabel:'Open command palette', related:['shortcuts','filters']
  },
  {
    id:'shortcuts', group:'Search & shortcuts', title:'Keyboard shortcuts',
    summary:'The useful keys, plus where each one works.',
    shortcuts:[['F1','Open Help while using the app; Escape closes Help.'],
      ['Ctrl+K / Command+K','Open the command palette outside modal editors.'],
      ['Space','Start/pause the Garden timer when you are not typing or using another control.'],
      ['Enter','Commit a typed countdown duration.'],
      ['Ctrl+Alt+N','Open quick capture in the app, or system-wide while the Windows helper runs.'],
      ['Ctrl+Enter','Save quick capture or a task’s next step.'],
      ['Q','Open Planner Quick Add when you are not typing or in a dialog.'],
      ['/','Open Planner task search when you are not typing or in a dialog.'],
      ['Shift+V','Cycle supported Planner layouts outside forms and dialogs.'],
      ['Arrow keys','Reposition/resize a sticky note when its handle is focused; navigate calendar dates when the schedule is focused.'],
      ['Escape','Close the current panel or dialog; exit Calendar or Focus mode when no panel is open.'],
      ['Tab / Shift+Tab','Move forward/backward between interactive controls.']],
    tip:'The system-wide note shortcut needs the optional Windows helper. Other shortcuts work while the app has keyboard focus.',
    related:['capture-window','timer','search']
  },
  {
    id:'backup', group:'Your data', title:'Saving locally, backups, and restoring',
    summary:'Keep your work when closing a tab and move it to another device.',
    steps:['Saved work stays in this browser on this device when you close the tab. Reopen the app at the same address, browser, and profile to access it.',
      'Open Garden → Tools → Timer settings → `Backup and restore`, then choose `Download backup` to export one file with tasks, calendar, journal, notes, reading history, crochet projects/time, and settings.',
      'On another device or after a reset, open Backup and restore and choose the `.json` file.',
      'Review the add and replace counts. Open `Show records`, then expand a `Replace` row to compare the current and incoming values for each changed field. Check the sections you want and choose `Restore selected sections`. Reading logs match by date.',
      'Choose `Save restore point` to keep a dated snapshot in this browser. The five newest points stay available. Choose the dated snapshot and restore the sections you want through the same preview.'],
    tip:'There is no account sync. Clearing site data, using a different browser/profile/address or port, or ending a private session can make saved work unavailable. Keep a downloaded backup of work you want to preserve.',
    action:'backup', actionLabel:'Open Backup and restore', related:['automatic-backups','windows-app','journal','calendar-import'], keywords:'save persist export import restore computer delete tab offline storage localstorage data lost'
  }
];

const normalize=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export function searchHelp(query){
  const phrase=normalize(query).trim(),words=phrase.split(/\s+/).filter(Boolean);
  return helpTopics.flatMap(topic=>{
    const content=normalize([topic.title,topic.group,topic.summary,...(topic.steps||[]),topic.tip,topic.keywords,...(topic.shortcuts||[]).flat()].join(' '));
    if(!words.every(word=>content.includes(word)))return [];
    const title=normalize(topic.title),brief=normalize([topic.title,topic.summary,topic.keywords].join(' '));
    const score=!words.length?0:title===phrase?4:title.includes(phrase)?3:words.every(word=>title.includes(word))?2:words.every(word=>brief.includes(word))?1:0;
    return [{topic,score}];
  }).sort((a,b)=>b.score-a.score).map(({topic})=>topic);
}
