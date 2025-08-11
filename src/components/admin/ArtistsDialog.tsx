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
import { artistAdminCreateSchema } from "@/types/validation";
import { useMediaUpload } from "@/hooks/useUpload";

export type ArtistFormValues = z.infer<typeof artistAdminCreateSchema>;

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
    resolver: zodResolver(
      artistAdminCreateSchema
    ) as Resolver<ArtistFormValues>,
    defaultValues: {
      name: "",
      role: "",
      company: "",
      imageUrl: "",
      bio: "",
      tags: [],
      slug: "",
      instagram: "",
      youtube: "",
      twitter: "",
      linkedin: "",
      website: "",
      sortOrder: undefined,
    },
  });
  const { uploading, uploadFile, discardTemp, commitTemp } =
    useMediaUpload("artists");

  useEffect(() => {
    if (initial) {
      form.reset({
        ...initial,
        tags: initial?.tags ?? [],
      } as ArtistFormValues);
    } else {
      form.reset({
        name: "",
        role: "",
        company: "",
        imageUrl: "",
        bio: "",
        tags: [],
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          void discardTemp();
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Artist" : "Add Artist"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit(async (values: ArtistFormValues) => {
            await onSubmit({
              ...values,
              tags: values.tags ?? [],
            });
            commitTemp();
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
          <div className="grid gap-2">
            <Label>Upload Image</Label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file =
                  (e.target as HTMLInputElement).files?.[0] ?? undefined;
                if (!file) return;
                try {
                  const url = await uploadFile(file);
                  form.setValue("imageUrl", url, { shouldValidate: true });
                } catch {}
              }}
            />
            {form.watch("imageUrl") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.watch("imageUrl") ?? ""}
                alt="Preview"
                className="mt-2 h-24 w-24 object-cover rounded"
              />
            ) : null}
            {uploading && (
              <p className="text-xs text-muted-foreground">Uploading...</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label>
              Image URL <span className="text-red-500">*</span>
            </Label>
            <Input {...form.register("imageUrl")} />
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.imageUrl.message as string}
              </p>
            )}
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
            <Label>Sort Order</Label>
            <Input type="number" {...form.register("sortOrder")} />
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
