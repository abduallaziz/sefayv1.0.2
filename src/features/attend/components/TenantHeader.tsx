'use client'

import { useEffect, useState } from 'react'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function TenantHeader({ token }: { token: string }) {
  const [tenant, setTenant] = useState<{ name: string | null; logo_url: string | null } | null>(null)

  useEffect(() => {
    fetch(`/api/v1/attend/${token}`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setTenant({ name: data.tenant_name ?? null, logo_url: data.tenant_logo_url ?? null })
      })
      .catch(() => {})
  }, [token])

  if (!tenant?.name) return null

  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-gray-800">
      {tenant.logo_url ? (
        <img src={tenant.logo_url} alt={tenant.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-md bg-[#0C447C] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
          {initials(tenant.name)}
        </div>
      )}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{tenant.name}</p>
    </div>
  )
}
