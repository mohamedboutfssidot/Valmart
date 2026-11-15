// A clip the user picks on their own device, used to test the video player.
// It lives only in memory (an object URL): nothing is uploaded and it is gone on reload.
import { create } from 'zustand'

interface ClipStore {
  url: string | null
  name: string | null
  pick: (file: File) => void
  clear: () => void
}

export const useClip = create<ClipStore>((set, get) => ({
  url: null,
  name: null,
  pick: (file) => {
    const old = get().url
    if (old) URL.revokeObjectURL(old)
    set({ url: URL.createObjectURL(file), name: file.name })
  },
  clear: () => {
    const old = get().url
    if (old) URL.revokeObjectURL(old)
    set({ url: null, name: null })
  },
}))
