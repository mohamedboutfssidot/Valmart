// Private chat for the people of one group. The live chat stays open to everyone else.
import { useEffect, useRef, useState } from 'react'
import { useGroup, type Group } from '../groupStore'
import { field, primary } from './kit'

export default function GroupChat({ group, me }: { group: Group; me: string }) {
  const send = useGroup((s) => s.sendGroupMessage)
  const [text, setText] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const chat = group.chat ?? []
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [chat.length])
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line p-3" data-testid="group-chat">
      <p className="text-xs text-fg-muted">Group chat. Only the {group.members.length} people in this group see it. The live chat stays open to everyone.</p>
      <div ref={ref} className="flex max-h-48 flex-col gap-1 overflow-y-auto" data-testid="group-msgs">
        {chat.map((m) => m.sys
          ? <p key={m.id} className="text-center text-xs text-fg-muted">{m.text}</p>
          : <p key={m.id} className="text-sm"><b>{m.user}</b> {m.text}</p>)}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(me, text); setText('') } }}>
        <input aria-label="Group message" data-testid="group-input" className={`${field} !py-1.5`} value={text} maxLength={300} onChange={(e) => setText(e.target.value)} placeholder="Message the group" />
        <button type="submit" className={primary} data-testid="group-send">Send</button>
      </form>
    </div>
  )
}
