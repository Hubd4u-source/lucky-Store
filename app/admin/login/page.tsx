"use client"

import * as React from "react"
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth"
import { useForm } from "react-hook-form"
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

type LoginFormValues = {
  email: string
  password: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/auth\/(invalid-credential|wrong-password|user-not-found)/.test(error.message)) {
      return "Invalid credentials."
    }

    return error.message
  }

  return "Authentication failed."
}

export default function LoginPage() {
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const submitLogin = async (idToken: string) => {
    const auth = getFirebaseAuth()
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) {
      await signOut(auth)

      if (response.status === 403) {
        throw new Error("Access denied.")
      }

      throw new Error("Authentication failed.")
    }

    window.location.assign("/admin/dashboard")
  }

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    setError("")

    try {
      const auth = getFirebaseAuth()
      const result = await signInWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      )

      const idToken = await result.user.getIdToken()
      await submitLogin(idToken)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const onGoogleSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = getFirebaseAuth()
      const result = await signInWithPopup(auth, getGoogleProvider())
      const idToken = await result.user.getIdToken()
      await submitLogin(idToken)
    } catch (error) {
      if (error instanceof Error && error.message.includes("auth/popup-closed-by-user")) {
        setError("")
      } else {
        setError(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-[380px] border border-border-default bg-bg-surface p-10">
        <div className="mb-10">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-black tracking-wider text-text-primary">
              LUCKY
            </span>
            <span className="font-display text-xl font-normal tracking-wider text-accent">
              STORE
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Admin Panel
          </p>
        </div>

        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogleSignIn}
            loading={loading}
          >
            Continue With Google
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-default" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Or
          </span>
          <div className="h-px flex-1 bg-border-default" />
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
              Email Address
            </label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="admin@luckystore.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required.",
              })}
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
              Password
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required.",
              })}
            />
          </div>

          {error ? (
            <div className="border-l-2 border-danger pl-3">
              <p className="font-mono text-[11px] text-danger">{error}</p>
            </div>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Sign In
          </Button>

          <a
            href="/"
            className="text-center font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-text-secondary"
          >
            Back to Store
          </a>
        </form>
      </div>
    </main>
  )
}
