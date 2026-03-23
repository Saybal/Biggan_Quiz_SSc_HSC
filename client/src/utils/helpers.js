export const esc = (t) =>
  String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

export const fmtTime = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
