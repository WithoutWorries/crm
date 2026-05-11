// ─── SoloCRM Task Widget for Scriptable ─────────────────────────────────────
// 1. Install Scriptable from the App Store (free)
// 2. Paste this entire file as a new script
// 3. Set CALENDAR_TOKEN below (copy from Tasks page in the CRM)
// 4. Long-press your home screen → Add Widget → Scriptable → choose this script
// ─────────────────────────────────────────────────────────────────────────────

const CALENDAR_TOKEN = 'PASTE_YOUR_TOKEN_HERE'
const CRM_BASE_URL   = 'https://crm.frasermackie.com'

// ─── Colour palette ───────────────────────────────────────────────────────────
const COLORS = {
  bg:        new Color('#0f172a'),   // dark navy
  card:      new Color('#1e293b'),
  border:    new Color('#334155'),
  accent:    new Color('#6366f1'),   // indigo
  overdue:   new Color('#ef4444'),
  high:      new Color('#f59e0b'),
  medium:    new Color('#6366f1'),
  low:       new Color('#10b981'),
  text:      new Color('#f1f5f9'),
  muted:     new Color('#94a3b8'),
  today:     new Color('#fbbf24'),
}

// ─── Fetch tasks ──────────────────────────────────────────────────────────────
async function fetchTasks() {
  const url = `${CRM_BASE_URL}/api/calendar/tasks.json?token=${CALENDAR_TOKEN}`
  const req = new Request(url)
  req.timeoutInterval = 10
  try {
    return await req.loadJSON()
  } catch (e) {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function priorityColor(task) {
  if (task.overdue)          return COLORS.overdue
  if (task.priority === 'HIGH')   return COLORS.high
  if (task.priority === 'MEDIUM') return COLORS.medium
  return COLORS.low
}

function dueDateLabel(task) {
  if (!task.dueDate) return 'No date'
  const d = new Date(task.dueDate + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d - today) / 86400000)
  if (task.overdue) return `${Math.abs(diff)}d overdue`
  if (diff === 0)   return 'Today'
  if (diff === 1)   return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Build widget ─────────────────────────────────────────────────────────────
async function buildWidget(tasks, size) {
  const w = new ListWidget()
  w.backgroundColor = COLORS.bg
  w.url = `${CRM_BASE_URL}/tasks`
  w.setPadding(14, 14, 14, 14)

  if (!tasks) {
    const err = w.addText('Could not load tasks')
    err.textColor = COLORS.muted
    err.font = Font.systemFont(13)
    return w
  }

  // Header
  const header = w.addStack()
  header.layoutHorizontally()
  header.centerAlignContent()

  const title = header.addText('CRM Tasks')
  title.textColor = COLORS.text
  title.font = Font.boldSystemFont(14)

  header.addSpacer()

  const count = tasks.length
  const overdue = tasks.filter(t => t.overdue).length
  const badge = header.addText(overdue > 0 ? `${overdue} overdue` : `${count} open`)
  badge.textColor = overdue > 0 ? COLORS.overdue : COLORS.muted
  badge.font = Font.systemFont(11)

  w.addSpacer(10)

  if (count === 0) {
    const none = w.addText('All clear — no outstanding tasks')
    none.textColor = COLORS.low
    none.font = Font.systemFont(13)
    return w
  }

  // Show tasks (limit by widget size)
  const maxItems = size === 'large' ? 8 : size === 'medium' ? 4 : 2
  const shown = tasks.slice(0, maxItems)

  for (const task of shown) {
    const row = w.addStack()
    row.layoutHorizontally()
    row.centerAlignContent()
    row.spacing = 8

    // Priority dot
    const dot = row.addText('●')
    dot.textColor = priorityColor(task)
    dot.font = Font.systemFont(9)

    // Task title
    const label = row.addText(task.title)
    label.textColor = task.overdue ? COLORS.overdue : COLORS.text
    label.font = task.overdue ? Font.boldSystemFont(12) : Font.systemFont(12)
    label.lineLimit = 1

    row.addSpacer()

    // Due date
    const due = row.addText(dueDateLabel(task))
    due.textColor = task.overdue ? COLORS.overdue : COLORS.muted
    due.font = Font.systemFont(10)

    w.addSpacer(6)
  }

  if (tasks.length > maxItems) {
    w.addSpacer(2)
    const more = w.addText(`+${tasks.length - maxItems} more`)
    more.textColor = COLORS.muted
    more.font = Font.systemFont(10)
  }

  w.addSpacer()

  // Footer timestamp
  const updated = w.addText(`Updated ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`)
  updated.textColor = COLORS.muted
  updated.font = Font.systemFont(9)

  return w
}

// ─── Run ──────────────────────────────────────────────────────────────────────
const tasks = await fetchTasks()

let widgetSize = 'medium'
if (config.widgetFamily === 'small')  widgetSize = 'small'
if (config.widgetFamily === 'large')  widgetSize = 'large'

const widget = await buildWidget(tasks, widgetSize)

if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  widget.presentMedium()
}

Script.complete()
