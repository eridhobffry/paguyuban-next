"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  instagram: z.string().url({ message: "Instagram URL is required" }),
  youtube: z.string().url({ message: "YouTube URL is required" }),
  twitter: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  sortOrder: z.coerce.number().optional().nullable(),
});

export type ArtistFormValues = z.infer<typeof Schema>;

export function ArtistsDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ArtistFormValues> | null;
  onSubmit: (values: ArtistFormValues) => Promise<void>;
}) {
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(Schema) as Resolver<ArtistFormValues>,
    defaultValues: {
      name: "",
      role: "",
      company: "",
      imageUrl: "",
      bio: "",
      tags: "",
      slug: "",
      instagram: "",
      youtube: "",
      twitter: "",
      linkedin: "",
      website: "",
      sortOrder: undefined,
    },
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        ...initial,
        tags: Array.isArray(initial?.tags)
          ? (initial?.tags as string[]).join(", ")
          : typeof initial?.tags === "string"
          ? (initial?.tags as string)
          : "",
      } as ArtistFormValues);
    } else {
      form.reset({
        name: "",
        role: "",
        company: "",
        imageUrl: "",
        bio: "",
        tags: "",
        slug: "",
        instagram: "",
        youtube: "",
        twitter: "",
        linkedin: "",
        website: "",
        sortOrder: undefined,
      } as ArtistFormValues);
    }
  }, [initial, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Artist" : "Add Artist"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit(async (values: ArtistFormValues) => {
            await onSubmit({
              ...values,
              tags: values.tags ?? "",
            });
            onOpenChange(false);
          })}
        >
          <div className="grid gap-1">
            <Label>
              Name <span className="text-red-500">*</span>
            </Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message as string}
              </p>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label>Role/Genre</Label>
              <Input {...form.register("role")} />
            </div>
            <div>
              <Label>Company/Label</Label>
              <Input {...form.register("company")} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Image URL</Label>
            <Input {...form.register("imageUrl")} />
          </div>
          <div className="grid gap-1">
            <Label>Bio</Label>
            <Textarea rows={4} {...form.register("bio")} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                placeholder="rock, band, jakarta"
                {...form.register("tags")}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input placeholder="dewa-19" {...form.register("slug")} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <Label>Twitter URL</Label>
              <Input {...form.register("twitter")} />
            </div>
            <div>
              <Label>
                Instagram URL <span className="text-red-500">*</span>
              </Label>
              <Input {...form.register("instagram")} />
              {form.formState.errors.instagram && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.instagram.message as string}
                </p>
              )}
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input {...form.register("linkedin")} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label>
                YouTube URL <span className="text-red-500">*</span>
              </Label>
              <Input {...form.register("youtube")} />
              {form.formState.errors.youtube && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.youtube.message as string}
                </p>
              )}
            </div>
            <div>
              <Label>Website URL</Label>
              <Input {...form.register("website")} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>
              Sort Order <span className="text-red-500">*</span>
            </Label>
            <Input type="number" {...form.register("sortOrder")} />
            {form.formState.errors.sortOrder && (
              <p className="text-sm text-red-500 mt-1">
                Sort order is required
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
