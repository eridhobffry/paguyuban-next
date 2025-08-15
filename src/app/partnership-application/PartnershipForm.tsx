"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const partnershipSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name" }),
  company: z.string().min(2, { message: "Please enter your company" }),
  email: z.string().email({ message: "Enter a valid email" }),
  phone: z.string().optional(),
  interest: z.enum(["sponsorship", "partnership", "media", "vendor", "other"], {
    message: "Select your interest",
  }),
  budget: z.string().optional(),
  message: z
    .string()
    .min(10, { message: "Please tell us a bit more (10+ chars)" }),
  consent: z.boolean().refine((v) => v, {
    message: "You must consent to be contacted",
  }),
});

type PartnershipFormValues = z.infer<typeof partnershipSchema>;

export function PartnershipForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<PartnershipFormValues>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      fullName: "",
      company: "",
      email: "",
      phone: "",
      interest: "sponsorship",
      budget: "",
      message: "",
      consent: false,
    },
    mode: "onTouched",
  });

  const onSubmit = async (values: PartnershipFormValues) => {
    try {
      const res = await fetch("/api/partnership-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.fullName,
          email: values.email,
          company: values.company,
          phone: values.phone,
          interest: values.interest,
          budget: values.budget,
          message: values.message,
          source: "partnership_application_form",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setSubmitted(true);
      form.reset({ ...form.getValues(), consent: false });
    } catch {
      // Keep form visible on error; UI shows validation messages already
    }
  };

  if (submitted) {
    return (
      <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 text-sm">
        Thanks for your interest. We&apos;ll reach out shortly.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+62 812-3456-7890"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="partnership">
                      Strategic Partnership
                    </SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated budget (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 100M IDR" {...field} />
                </FormControl>
                <FormDescription>Rough ranges are fine.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What would you like to achieve?</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Tell us a bit about your goals and timeline"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to be contacted about this inquiry
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit">Submit application</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PartnershipForm;
