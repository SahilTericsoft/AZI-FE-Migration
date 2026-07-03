"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiError } from "@/core/api/types";

import { useAuth } from "../auth-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    emailId?: string;
    password?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: { emailId?: string; password?: string } = {};
    if (!EMAIL_RE.test(emailId.trim())) errs.emailId = "Enter a valid email";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ emailId: emailId.trim().toLowerCase(), password });
      router.replace("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message ?? "Login failed");
      if (apiError?.fieldErrors) {
        setFieldErrors({
          emailId: apiError.fieldErrors.emailId?.[0],
          password: apiError.fieldErrors.password?.[0],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shadcn-scope flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-muted via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6E43DB] to-[#E86B3C] text-lg font-extrabold text-white">
            Aᶻ
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>AdvanzInnovation Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                aria-invalid={Boolean(fieldErrors.emailId)}
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
              />
              {fieldErrors.emailId && (
                <p className="text-xs text-destructive">{fieldErrors.emailId}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
