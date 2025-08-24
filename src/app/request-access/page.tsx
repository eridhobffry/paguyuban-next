"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { requestAccessFormSchema } from "@/types/validation";

type RequestAccessFormValues = z.infer<typeof requestAccessFormSchema>;

export default function RequestAccessPage() {
  const [requestedType, setRequestedType] = useState<string>("general");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRequestedType(params.get("type") || "general");
    } catch {}
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<RequestAccessFormValues>({
    resolver: zodResolver(requestAccessFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RequestAccessFormValues) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        form.reset();
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Choose a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting Request..." : "Request Access"}
              </Button>
            </form>
          </Form>
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
