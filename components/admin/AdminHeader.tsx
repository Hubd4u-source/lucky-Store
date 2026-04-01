"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function AdminHeader({ onAdd }: { onAdd: () => void }) {
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
    <header className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-border-default bg-bg-surface px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center group">
          <span className="font-display font-black text-lg tracking-wider text-text-primary group-hover:text-accent transition-colors">
            LUCKY
          </span>
          <span className="font-display font-normal text-lg tracking-wider text-accent ml-0.5">
            STORE
          </span>
        </Link>
        <span className="text-border-strong text-lg">/</span>
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest pt-0.5">
          Admin Panel
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onAdd}
        >
          Add Asset
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={LogOut}
          loading={signingOut}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </header>
  )
}
