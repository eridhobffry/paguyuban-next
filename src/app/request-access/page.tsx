"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function RequestAccessPage() {
  const [requestedType, setRequestedType] = useState<string>("general");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRequestedType(params.get("type") || "general");
    } catch {}
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Request failed");
      }
    } catch (error) {
      console.error("Request access error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-green-600">
              Request Submitted
            </CardTitle>
            <CardDescription className="text-center">
              Your access request has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your request is pending approval. You will be notified once an
              administrator reviews your request.
            </p>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const headingByType: Record<string, string> = {
    general: "Request Access",
    notify: "Get Notified",
    updates: "Stay Updated",
    speaker: "Apply to Speak",
    sponsor: "Secure Sponsorship",
    docs: "Request Documentation",
    demo: "Request Platform Demo",
    register: "Register Interest",
    workshop: "Reserve Workshop Spot",
  };

  const descriptionByType: Record<string, string> = {
    general: "Submit a request to access the Paguyuban Messe 2026 portal",
    notify: "Leave your email and we'll notify you about schedule updates.",
    updates: "Get announcements about new speakers, sponsors, and tickets.",
    speaker: "Tell us you're interested in speaking. Our team will reach out.",
    sponsor: "Express interest in sponsorship. We'll follow up with details.",
    docs: "Request the complete documentation package for review.",
    demo: "Request a demo of our AI-powered platform.",
    register: "Register your interest to attend the event.",
    workshop: "Reserve your spot in a cultural workshop.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {headingByType[requestedType] ?? headingByType.general}
          </CardTitle>
          <CardDescription className="text-center">
            {descriptionByType[requestedType] ?? descriptionByType.general}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting Request..." : "Request Access"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have access?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
