// Class mode: a teacher prepares a route with questions, runs it with the class, then gets a summary.
import { useState } from 'react'
import { STREAMS, cityOf } from '../data/mock'
import { useDemo } from '../store'
import { useExtra, type ClassSession, type Question } from '../extra'
import { Block, card, Empty, field, ghost, primary, Pill } from './kit'

const blank = (): Question => ({ q: '', options: ['', '', ''], answer: 0 })

function Summary({ c }: { c: ClassSession }) {
  if (!c.result) return null
  const avg = Math.round(c.result.perQ.reduce((a, b) => a + b, 0) / Math.max(1, c.result.perQ.length))
  const hard = c.result.perQ.indexOf(Math.min(...c.result.perQ))
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line p-3 text-sm" data-testid="class-summary">
      <p><b>{c.result.answered}</b> of {c.pupils} pupils took part · average <b>{avg}%</b> correct.</p>
      <ul className="flex flex-col gap-1">{c.questions.map((q, i) => <li key={i} className="flex items-center gap-2"><span className="w-6 text-fg-muted">Q{i + 1}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700"><span className="block h-full bg-sky" style={{ width: `${c.result!.perQ[i]}%` }} /></span><span className="w-10 text-right tabular-nums">{c.result!.perQ[i]}%</span></li>)}</ul>
      {c.questions.length > 0 && <p className="text-fg-muted">To revisit in class: “{c.questions[hard].q}”</p>}
    </div>
  )
}

export function ClassView({ onWatch }: { onWatch?: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const { classes, addClass, runClass, finishClass } = useExtra()
  const [title, setTitle] = useState('')
  const [streamId, setStreamId] = useState(STREAMS[0].id)
  const [qs, setQs] = useState<Question[]>([blank()])
  const [err, setErr] = useState('')
  const set = (i: number, p: Partial<Question>) => setQs((a) => a.map((q, k) => (k === i ? { ...q, ...p } : q)))
  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const good = qs.filter((q) => q.q.trim() && q.options.filter((o) => o.trim()).length >= 2)
    if (!title.trim()) return setErr('Name the lesson.')
    if (!good.length) return setErr('Add at least one question with two answers.')
    addClass({ teacher: user?.name ?? 'Teacher', title: title.trim(), streamId, questions: good.map((q) => ({ ...q, options: q.options.filter((o) => o.trim()), answer: Math.min(q.answer, q.options.filter((o) => o.trim()).length - 1) })) })
    setErr(''); setTitle(''); setQs([blank()])
  }
  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={create} className={`${card} flex flex-col gap-4`} aria-label="Prepare a class" data-testid="class-form">
        <div><h2 className="font-display text-xl font-bold">Prepare a lesson</h2><p className="text-sm text-fg-muted">Choose a live, add questions, run it with the class and read the summary.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">Lesson title<input aria-label="Lesson title" className={field} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="The French bakery, vocabulary" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Live to visit<select aria-label="Live" className={field} value={streamId} onChange={(e) => setStreamId(e.target.value)}>{STREAMS.map((s) => <option key={s.id} value={s.id}>{cityOf(s.cityId).name}: {s.title.slice(0, 44)}</option>)}</select></label>
        </div>
        {qs.map((q, i) => (
          <fieldset key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3">
            <legend className="px-1 text-sm font-semibold">Question {i + 1}</legend>
            <input aria-label={`Question ${i + 1}`} className={field} value={q.q} maxLength={120} onChange={(e) => set(i, { q: e.target.value })} placeholder="What is the French word for bread?" />
            {q.options.map((o, k) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name={`ans-${i}`} checked={q.answer === k} onChange={() => set(i, { answer: k })} aria-label={`Correct answer ${k + 1}`} /><input aria-label={`Answer ${k + 1} of question ${i + 1}`} className={field} value={o} maxLength={60} onChange={(e) => set(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} placeholder={`Answer ${k + 1}`} /></label>
            ))}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2"><button type="button" className={ghost} onClick={() => qs.length < 5 && setQs([...qs, blank()])}>Add a question</button><button type="submit" className={primary}>Save the lesson</button></div>
        {err && <p role="alert" className="text-sm text-fg-muted">{err}</p>}
      </form>

      <Block title="Your lessons">
        {classes.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {classes.map((c) => {
              const s = STREAMS.find((x) => x.id === c.streamId)
              return (
                <li key={c.id} className={`${card} flex flex-col gap-3`} data-testid="class-card">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg font-bold leading-snug">{c.title}</h3><Pill tone={c.status === 'live' ? 'sun' : 'sky'}>{c.status === 'draft' ? 'Ready' : c.status === 'live' ? 'Live now' : 'Done'}</Pill></div>
                  <p className="text-sm text-fg-muted">{s ? `${cityOf(s.cityId).name} · ` : ''}{c.questions.length} question{c.questions.length > 1 ? 's' : ''} · {c.pupils} pupils</p>
                  {c.status === 'draft' && <button type="button" className={primary} onClick={() => runClass(c.id)} data-testid="class-run">Start the class</button>}
                  {c.status === 'live' && <div className="flex flex-wrap gap-2">{onWatch && <button type="button" className={ghost} onClick={() => onWatch(c.streamId)}>Open the live</button>}<button type="button" className={primary} onClick={() => finishClass(c.id)} data-testid="class-end">End and see the summary</button></div>}
                  <Summary c={c} />
                </li>
              )
            })}
          </ul>
        ) : <Empty>No lesson yet. Prepare one above.</Empty>}
      </Block>
    </div>
  )
}
