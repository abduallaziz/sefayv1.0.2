import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// Replaces the old `useState(false) + useEffect(() => setState(true), [])`
// "has mounted on the client" idiom. That pattern trips
// react-hooks/set-state-in-effect and is also strictly worse: this returns
// `false` for both the server render and the client's first render (so they
// still match, no hydration mismatch), then flips to `true` synchronously
// once hydration completes — no extra render-triggered-by-effect roundtrip.
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
