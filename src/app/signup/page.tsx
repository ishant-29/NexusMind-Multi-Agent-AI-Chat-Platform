"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-[var(--border-strong)] text-[14px] text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.82_0.13_205_/_0.18)]";

const oauthClass =
  "nx-press flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-raised text-[13px] font-medium text-ink-secondary hover:text-ink hover:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
      } else {
        router.push("/chat");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn(provider, {
        callbackUrl: "/chat",
        redirect: false,
      });

      if (result?.error) {
        setError(`${provider === "google" ? "Google" : "GitHub"} sign-in failed. Try email and password instead.`);
        setLoading(false);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(`${provider === "google" ? "Google" : "GitHub"} sign-in failed. Try email and password instead.`);
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Set up your NexusMind workspace">
      {error && (
        <div
          role="alert"
          className="mb-5 px-3.5 py-2.5 rounded-[10px] border border-[oklch(0.68_0.19_20_/_0.4)] bg-[oklch(0.68_0.19_20_/_0.1)] text-[13px] text-[oklch(0.8_0.12_20)]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-[13px] font-medium text-ink-secondary mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Ada Lovelace"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-ink-secondary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-ink-secondary mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <p className="mt-1.5 text-[12px] text-ink-faint">At least 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="nx-press w-full flex items-center justify-center gap-2 bg-accent text-accent-ink py-2.5 rounded-[10px] text-[14px] font-semibold hover:bg-accent-strong transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-subtle)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-surface text-[12px] text-ink-faint">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleOAuthSignIn("google")} disabled={loading} className={oauthClass}>
          <SiGoogle size={15} />
          Google
        </button>
        <button onClick={() => handleOAuthSignIn("github")} disabled={loading} className={oauthClass}>
          <SiGithub size={15} />
          GitHub
        </button>
      </div>

      <p className="mt-8 text-center text-[13px] text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium hover:text-accent-strong transition-colors">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
