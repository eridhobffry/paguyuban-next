"use client";

import React, { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Sponsor, SponsorTier } from "@/types/people";
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

// Zod schema for sponsor form validation
const sponsorSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .optional()
    .or(z.literal("")),
  tierId: z.string().optional().or(z.literal("")),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      return val
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    return val;
  }, z.array(z.string()).default([])),
  sortOrder: z.number().min(0, "Sort order must be 0 or greater").optional(),
});

type SponsorFormData = {
  name: string;
  url?: string;
  slug?: string;
  tierId?: string;
  logoUrl?: string;
  tags: string[];
  sortOrder?: number;
};

export function SponsorDialog({
  open,
  onOpenChange,
  sponsor,
  tiers,
  onSubmit,
  uploadLogo,
  uploading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sponsor: Sponsor | null;
  tiers: SponsorTier[];
  onSubmit: (values: Partial<Sponsor>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploading: boolean;
}) {
  const form = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema) as Resolver<SponsorFormData>,
    defaultValues: {
      name: "",
      url: "",
      slug: "",
      tierId: "",
      logoUrl: "",
      tags: [],
      sortOrder: undefined,
    },
  });

  const {
    setValue,
    watch,
    formState: { isSubmitting },
    reset,
  } = form;

  const watchedLogoUrl = watch("logoUrl");

  // Helper function to handle form submission
  const onFormSubmit = async (data: SponsorFormData) => {
    try {
      await onSubmit({
        name: data.name,
        url: data.url || null,
        slug: data.slug || null,
        tierId: data.tierId || null,
        logoUrl: data.logoUrl || null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        sortOrder: data.sortOrder || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Helper function to handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadLogo(file);
      setValue("logoUrl", url);
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  useEffect(() => {
    if (open && sponsor) {
      reset({
        name: sponsor.name,
        url: (sponsor.url as string | null) ?? "",
        slug: (sponsor.slug as string | null) ?? "",
        tierId: (sponsor.tierId as string | null) ?? "",
        logoUrl: (sponsor.logoUrl as string | null) ?? "",
        tags: (sponsor.tags as string[] | null) ?? [],
        sortOrder: (sponsor.sortOrder as number | null) ?? undefined,
      });
    } else if (open && !sponsor) {
      reset({
        name: "",
        url: "",
        slug: "",
        tierId: "",
        logoUrl: "",
        tags: [],
        sortOrder: undefined,
      });
    }
  }, [open, sponsor, reset, setValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="sponsor-dialog"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl rounded-md bg-background p-4 shadow-xl"
        data-testid="sponsor-dialog-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-3">
          {sponsor ? "Edit Sponsor" : "Add Sponsor"}
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="grid gap-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="sponsor-name"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="sponsor-url"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="sponsor-slug"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <FormControl>
                      <select
                        data-testid="sponsor-tier"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">None</option>
                        {tiers.map((tier) => (
                          <option key={tier.id} value={tier.id as string}>
                            {tier.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        data-testid="sponsor-sort-order"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                data-testid="logo-file"
                onChange={handleFileUpload}
              />
              {uploading && (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              )}
              {watchedLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={watchedLogoUrl}
                  alt="Logo"
                  className="mt-2 h-16 w-16 object-contain"
                />
              ) : null}
            </div>
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input data-testid="sponsor-logo-url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input data-testid="sponsor-tags" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
