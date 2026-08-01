"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import styles from "./page.module.css";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result =
      mode === "login"
        ? await login(email, password)
        : await register(name, email, password);
    setLoading(false);
    if (result.success) {
      router.push(redirect);
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "Sign in to track orders and continue your build."
            : "Save addresses, track orders, and check out faster."}
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}
        {mode === "register" && (
          <Input
            label="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>
      </form>

      <p className={styles.footer}>
        By continuing you agree to TechChasers&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
