import { SettingsShell } from '@/features/settings/components/SettingsShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
