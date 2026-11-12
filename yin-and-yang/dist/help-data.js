// Keep feature instructions separate from the guide UI so they can be updated together with the app.
export const helpTopics = [
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
    steps:['Use the bottom tabs to switch between Garden, Planner, Calendar, Crochet, Journal, Notes, and Reading.',
      'Garden is your study space. Its top tools open Settings, Tasks, Music, quick Notes, Today’s progress, and Appearance.',
      'Use Planner for task lists, projects, reviews, and reports. Calendar is the full schedule shared with Planner and the Garden’s 5-hour calendar.',
      'Press `Ctrl+K` to search across tasks, sticky notes, books, and journal entries, or run a command.'],
    tip:'Open this guide from the floating Help button, press F1, or search for Help in Ctrl+K.',
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
    action:'focus', actionLabel:'Open timer', related:['routines','notifications','block-focus'],
    keywords:'pomodoro countdown colon seconds minutes inactive background tab time'
  },
  {
    id:'routines', group:'Focus & rest', title:'Save timer routines and an intention',
    summary:'Keep favorite focus and break lengths ready to use.',
    steps:['In Garden, open `Settings` from the top tools.',
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
      'Choose `Find a task by time` and enter your available minutes. Garden suggests ready tasks that fit, with higher priorities first.'],
    tip:'Your pinned order is for today. A session started from a calendar block keeps that block’s task selected.',
    action:'focus', actionLabel:'Open Garden', related:['resume','tomorrow','block-focus']
  },
  {
    id:'focus-outcome', group:'Focus & rest', title:'Set and review a focus outcome',
    summary:'Write what you want to finish, then record how far you got.',
    steps:['Choose `Set outcome` beneath the timer and write a concrete goal, such as “Solve problems 1–4.”',
      'Choose `Save and begin` to start a ready timer with the outcome.',
      'After the session, choose `Review outcome`, mark it Reached or Partial, and leave a next step. The next step appears on the task if the session was linked to one.'],
    tip:'Choose Later if you want to review it another time. Garden keeps completed outcomes available to review.',
    action:'focus', actionLabel:'Open Garden', related:['timer','resume']
  },
  {
    id:'resume', group:'Focus & rest', title:'Pick up where you left off',
    summary:'Leave a concrete next step for the next time you work on a task.',
    steps:['Choose the task in Garden, then click `Leave a next step` below the current task.',
      'Write the first thing you want to do next time. For example: “Continue the proof from equation 4.”',
      'Choose `Save next step` or press `Ctrl+Enter`.',
      'When you return to that task, its saved next step appears beneath the timer. You can also edit it in the task editor.'],
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
    steps:['Open Garden → `Settings` → `Timer warnings`.',
      'Choose `Enable browser notifications` and allow notifications when your browser asks.',
      'Focus sessions warn at `5:00` remaining; breaks warn at `2:30`. A phase shorter than its warning threshold does not produce that warning.',
      'Choose `Adjust chimes and ambience` to control the separate focus and break sound volumes.'],
    tip:'In-app warnings remain available. If notification permission was denied, change it in the browser’s settings for this site. The app must remain open to deliver its timer warnings.',
    action:'settings', actionLabel:'Open timer settings', related:['music','timer']
  },
  {
    id:'progress', group:'Focus & rest', title:'See today’s progress and blossoms',
    summary:'Check today’s completed sessions, focus minutes, and skipped sessions.',
    steps:['In Garden, choose `Today` in the top tools.',
      'Read your completed-session count and total focus minutes. The list shows each session’s finish time, intention, and outcome.',
      'Each completed focus session adds a blossom. Skipped sessions are recorded separately and do not add to completed totals.',
      'For earlier dates or project-level statistics, use Planner → `Reporting`.'],
    action:'progress', actionLabel:'Open today’s progress', related:['reporting','timer','weekly-review']
  },
  {
    id:'tasks', group:'Tasks & projects', title:'Create and edit tasks',
    summary:'Add descriptions, subtasks, comments, estimates, dates, and reminders.',
    steps:['Choose `Add task` in Garden or Planner. You can also use the `Add task` action in `Ctrl+K`.',
      'Enter the name. Add a description, next step, subtasks (one per line), and a comment if useful.',
      'Set its project, section, date, time, estimate, deadline, priority, labels, or reminder in the properties area.',
      'Set `Snooze until` to keep the task out of the focus queue until that date. Its schedule and deadline stay visible in Planner. Clear the date to bring it back early.',
      'Expand `Task templates` and choose `Save as template` to reuse a task’s subtasks, labels, and estimate. In a new task, select a saved template and choose `Use template`. Review the draft and save it as a task.',
      'Save the task. Click its title to edit it again. Right-click a task for actions such as editing, prioritizing, focusing, and deleting.'],
    tip:'Task reminders are shown while the app is open. A task’s estimate is also useful for scheduling and estimate-accuracy reports.',
    action:'planner', actionLabel:'Open Planner', related:['repeat','quick-add','completion']
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
    action:'planner', actionLabel:'Open Planner', related:['project-resume','filters','csv-import','calendar']
  },
  {
    id:'project-resume', group:'Tasks & projects', title:'Resume work on a project',
    summary:'See project context in Planner and bring your next task to Garden.',
    steps:['Select a project in Planner. Its overview shows the next milestone, upcoming blocks, linked sticky notes, and recent focus sessions.',
      'Choose `Resume project` to select the project’s first ready task in the Garden focus queue. Finish or reset any current focus session first.',
      'Read the task’s description and saved next step. Use linked notes for context or choose `Back to timer` when you are ready. The project name by the timer reopens this panel.'],
    action:'planner', actionLabel:'Open Planner', related:['projects','linked-notes','focus-queue']
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
      'Use the date picker, Today, and previous/next controls to move through dates. Week views also scroll horizontally.',
      'Open `Task shelf` to find a task. Drag it onto a time slot, or choose it to set its schedule. A task without an estimate defaults to a one-hour block.',
      'Garden’s separate 5-hour calendar shows the same schedule. Its arrows let you inspect earlier and later hours; `Open calendar` opens the full view.'],
    tip:'Overlapping blocks are supported. Planner and Calendar share your tasks and bookings.',
    action:'calendar', actionLabel:'Open Calendar', related:['multiple-blocks','events','block-focus']
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
      'Review the suggested blocks and how much time couldn’t fit. Suggestions credit booked time and completed focus for the task.',
      'Choose the blocks you want, then select `Add selected blocks`. Calendar opens to the first booking.'],
    tip:'Suggestions work backward from the deadline using 9 AM, your Replan cutoff, and the daily study capacity in Workload. For a repeating task, the plan targets the latest unfinished occurrence by the deadline.',
    action:'deadline', actionLabel:'Open Plan to deadline', related:['build-week','workload','schedule-preview','task-dependencies']
  },
  {
    id:'build-week', group:'Calendar & planning', title:'Build a week around deadlines',
    summary:'Draft seven days of focus blocks and see which deadlines need attention.',
    steps:['Set deadlines and estimates on your tasks. In Planner, choose `Build my week` or find it with `Ctrl+K`.',
      'Choose the first day, available hours, and daily study minutes. The draft works around your calendar commitments and recurring unavailable time.',
      'Choose `Draft week`. Review the deadlines at risk and the blocks for each date. Choose `Approve day` to add that day’s blocks to Calendar.'],
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
    id:'events', group:'Calendar & planning', title:'Add events and all-day commitments',
    summary:'Put meetings and appointments on the calendar without making them tasks.',
    steps:['Open Calendar and choose `Add event`.',
      'Enter a title, optional description, and start/end dates and times. Turn on All day for a date-only event.',
      'Save the event. Click a manually created event to edit or delete it.',
      'Events appear beside task blocks and are considered when finding open time. Imported events can be viewed in their own details panel.'],
    action:'calendar', actionLabel:'Open Calendar', related:['calendar-import','tomorrow','workload']
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
      'Open Calendar → `Import .ics` and choose the downloaded file.',
      'Import it to add its supported events and recurring occurrences to the shared schedule.',
      'To refresh imported data, download a new file and import it again. The import panel also lists imported sources with Remove controls.'],
    tip:'This is a file import, not a live Canvas account connection or automatic background sync.',
    action:'calendar-import', actionLabel:'Open calendar import', related:['events','calendar','calendar-export'], keywords:'ics ical feed classes assignments canvas sync'
  },
  {
    id:'calendar-export', group:'Calendar & planning', title:'Export a calendar as .ics',
    summary:'Take a day, week, or project schedule to another calendar.',
    steps:['Open Calendar or a project in Planner and choose `Export .ics`.',
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
    steps:['Press `Ctrl+Alt+N` while using the app, or open Garden’s top `Notes` tool and choose `Quick capture`.',
      'Write the thought and press `Ctrl+Enter` or choose `Save note`. Escape closes capture without submitting it.',
      'Return to Garden’s Notes tool to review captured thoughts.',
      'Give a thought a destination: make a task, attach it to a project, or move it to Quick Notes. Attached thoughts are available from that project’s Thoughts button.'],
    tip:'The Quick Notes text area saves as you type. The quick-capture form has an explicit Save note action.',
    action:'capture', actionLabel:'Open quick capture', related:['capture-window','sticky-notes','projects']
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
      'Select the linked task in Garden and use its linked-notes control to open the notes beside the timer.'],
    action:'notes', actionLabel:'Open sticky notes', related:['sticky-notes','focus-queue','resume']
  },
  {
    id:'daily-rituals', group:'Reading & journal', title:'Daily Crochet, Annotate, and Journal items',
    summary:'Keep your three daily rituals at the top of each calendar day.',
    steps:['Open Calendar or a supported Planner date view. Each day begins with Crochet, Annotate, and Journal.',
      'Click a ritual’s name to edit its details. Crochet can link to a Stitchbook project; Annotate holds your book and reading goal; Journal opens an entry for that date.',
      'Use the small check control to mark a ritual complete or incomplete for that day.',
      'Saving a journal entry automatically completes that date’s Journal item. A newer saved entry can complete it again if you previously reopened it.'],
    action:'calendar', actionLabel:'Open Calendar', related:['reading-goal','journal','crochet-projects']
  },
  {
    id:'reading-goal', group:'Reading & journal', title:'Set a reading goal and stopping point',
    summary:'Show your next chapter or page target alongside where you left off.',
    steps:['In Calendar, click `Annotate` on the day you plan to read.',
      'Enter the book and author. Optionally choose `Search Open Library` to look up a title; you can always enter it yourself.',
      'Choose Chapter or Page as the goal type and enter your next-session target, such as `12` or `45–60`.',
      'Log chapters annotated, one per line or as a range. Use `Where you stopped` for a bookmark such as “Page 52,” then choose `Save annotation log`.'],
    tip:'The daily Annotate item shows your goal and last stopping point. An unfinished goal can carry into the next day; check the ritual off when you finish it.',
    action:'calendar', actionLabel:'Open Calendar', related:['reading-shelf','daily-rituals'], keywords:'book annotation bookmark chapters pages target'
  },
  {
    id:'reading-shelf', group:'Reading & journal', title:'Browse your reading shelf',
    summary:'See annotation history, finished chapters, and your latest bookmark by book.',
    steps:['Open the Reading tab.',
      'Search for a book or select one from the book list.',
      'Read `Where you left off`, chapters annotated, and the dated history of your logs. Enter total pages and page numbers in your Annotate logs to see a pace forecast after at least two logs show an advance.',
      'Use `Add chapter note` on a book to save a question, quote, or insight. Mark notes for the `Review queue`. Choose `Mark reviewed` after revisiting a note.',
      'Use `Open Calendar` and the daily Annotate item to add your next log or goal. Ctrl+K can also find a book and open its history directly.'],
    tip:'Books are grouped by title and author. Keeping those consistent keeps your history together.',
    action:'reading', actionLabel:'Open Reading', related:['reading-goal','search']
  },
  {
    id:'journal', group:'Reading & journal', title:'Write and revisit journal entries',
    summary:'Use a spacious editor with visible date, mood, and project fields.',
    steps:['Open Journal → `New entry`, or click a date’s Journal ritual in Calendar.',
      'Start blank or choose a template and select `Insert template`. Use `Save as template` to reuse the current draft text in another entry.',
      'Add a title and write your entry. Choose the date, optional mood, and an optional crochet project above the writing area.',
      'Choose `Save entry` to save it and complete that date’s Journal ritual. The word count updates while you write.',
      'Search the journal library or Ctrl+K to find an entry. Click its title to edit it. Deleting asks for confirmation and offers Undo after deletion.'],
    tip:'Use Save entry before leaving the editor. Journal entries are saved locally; export a backup to keep a separate copy.',
    action:'journal', actionLabel:'Open Journal', related:['daily-rituals','backup']
  },
  {
    id:'crochet-projects', group:'Stitchbook', title:'Track crochet projects, rows, and time',
    summary:'Keep patterns, row goals, project status, and hours worked together.',
    steps:['Open Crochet → Projects → `New project`.',
      'Set a name, status, hook size, rows, optional row goal, pattern link, and notes. Link yarn already in your stash, then Save.',
      'Use the plus/minus row buttons as you work. Row goals show progress, and the status filter helps you find active or finished projects.',
      'Choose `Add counter` for separate counts such as a sleeve or a stitch repeat. Save a checkpoint with a resume note to record the current row and counter values.',
      'Choose `Log time` on a project, enter the date and minutes worked, and save. The project shows its total hours and minutes and the time dialog shows recent sessions.',
      'Choose `Log pattern change` to record a date, row, and change. Open the same dialog to see earlier changes.'],
    tip:'Link a project from Calendar’s daily Crochet item for quick access. Time logs, row counts, and yarn use are separate, so you can update just what changed.',
    action:'crochet', actionLabel:'Open Stitchbook', related:['yarn','journal','daily-rituals'], keywords:'stitchbook crochet hours duration log time pattern hook rows'
  },
  {
    id:'yarn', group:'Stitchbook', title:'Manage yarn stash and usage',
    summary:'Track colorways, fiber, dye lots, grams remaining, and project use.',
    steps:['Open Crochet → `Yarn stash` → `Add yarn`.',
      'Enter the name, colorway, swatch, weight, grams on hand, fiber, and dye lot, then save.',
      'Edit a project to link yarn from your stash.',
      'In Yarn stash, choose `Log use`, enter grams used, and optionally choose a linked project. Logging use reduces stock and adds to the project’s grams used.'],
    tip:'You cannot log more grams than are available. Removing a yarn also unlinks it from projects.',
    action:'crochet', actionLabel:'Open Stitchbook', related:['crochet-projects','backup']
  },
  {
    id:'appearance', group:'Make it yours', title:'Lighting, seasons, weather, and saved looks',
    summary:'Customize the landscape and switch looks by time of day.',
    steps:['In Garden, open `Appearance` from the top tools.',
      'Choose lighting. `Follow timer` ties sunrise and sunset to focus progress; fixed day or night looks keep a steady atmosphere.',
      'Choose Spring, Summer, Autumn, or Winter. Set weather manually or choose `Rotate every 8 minutes` for seasonal changes.',
      'For timed looks, choose the appearance you want, set a start time under `Daily Garden presets`, and choose `Save preset`. Enable `Switch looks by time of day`.'],
    tip:'Changing the look manually pauses the schedule until you save or enable it again. Resetting a timer returns its sun directly to the beginning of the cycle. Click the penguin for another thought.',
    action:'appearance', actionLabel:'Open Appearance', related:['focus-mode','music'], keywords:'theme garden snow rain fog sun sunset sunrise night day seasons presets'
  },
  {
    id:'music', group:'Make it yours', title:'Spotify, optional ambience, and silence',
    summary:'Play your playlists and choose whether the app makes any sound.',
    steps:['In Garden, open `Music`. Paste a Spotify playlist, album, or track link and choose `Load`.',
      'Use the embedded player or `Open Spotify` to play music externally.',
      'Optional rain, water, and wind have independent volume sliders. Focus and break chimes have separate sliders too. Zero disables a channel; `Silence` clears the ambience mix.',
      'Use `Mute all app sounds` for silence. If music is playing outside the embedded player, turn on `Music playing elsewhere` to pause app sounds.'],
    tip:'The embedded Spotify player pauses app sounds automatically. Outside music needs the switch because this browser app cannot inspect or control all music playing on your computer.',
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
      'Open Garden → Settings → `Backup and restore`, then choose `Download backup` to export one file with tasks, calendar, journal, notes, reading history, crochet projects/time, and settings.',
      'On another device or after a reset, open Backup and restore and choose the `.json` file.',
      'Read the restore summary, then choose `Replace data on this device` only when you want the backup to replace what is currently saved there.'],
    tip:'There is no account sync. Clearing site data, using a different browser/profile/address or port, or ending a private session can make saved work unavailable. Keep a downloaded backup of work you want to preserve.',
    action:'backup', actionLabel:'Open Backup and restore', related:['journal','csv-import','calendar-import'], keywords:'save persist export import restore computer delete tab offline storage localstorage data lost'
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
