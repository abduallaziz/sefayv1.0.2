import { Header } from './header'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080810' }}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'radial-gradient(ellipse at top, #0f0a1e 0%, #080810 60%)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}