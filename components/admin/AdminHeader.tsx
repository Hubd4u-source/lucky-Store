"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function AdminHeader({
  onAdd,
  onEditSite,
}: {
  onAdd: () => void
  onEditSite: () => void
}) {
  const router = useRouter()
  const [signingOut, setSigningOut] = React.useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await fetch("/api/auth/session", { method: "DELETE" })
      router.replace("/admin/login")
      router.refresh()
    } catch (err) {
      console.error("Sign-out failed:", err)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-border-default bg-bg-surface/95 backdrop-blur">
      <div className="container-custom flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center">
            <span className="font-display text-base font-black tracking-wider text-text-primary transition-colors group-hover:text-accent md:text-lg">
              LUCKY
            </span>
            <span className="ml-0.5 font-display text-base font-normal tracking-wider text-accent md:text-lg">
              STORE
            </span>
          </Link>
          <span className="text-border-strong text-base md:text-lg">/</span>
          <span className="pt-0.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Admin Panel
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Settings}
            onClick={onEditSite}
            className="min-h-11 w-full md:w-auto"
          >
            Site Settings
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onAdd}
            className="min-h-11 w-full md:w-auto"
          >
            Add Asset
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            loading={signingOut}
            onClick={handleSignOut}
            className="col-span-2 min-h-11 w-full md:col-span-1 md:w-auto"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
