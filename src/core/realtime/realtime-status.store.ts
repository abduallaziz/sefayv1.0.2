import { create } from 'zustand'

interface RealtimeStatusState {
  connected: boolean
  setConnected: (connected: boolean) => void
}

// Read by the tables/kitchen list hooks to decide whether their fallback
// refetchInterval should be active — polling only kicks in while Realtime isn't
// actually delivering events (initial connect, dropped connection, tenant with no
// realtime_token because minting one failed), per the "no polling except as a
// fallback" requirement.
export const useRealtimeStatusStore = create<RealtimeStatusState>()((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}))
