"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Speaker } from "@/types/people";
import { z } from "zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { speakerAdminCreateSchema } from "@/types/validation";
import { Button } from "@/components/ui/button";
import { useSpeakersAdmin } from "@/hooks/useSpeakers";

export function SpeakersDialog({
  open,
  onOpenChange,
  speaker,
  mode = "view",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  speaker: Speaker | null;
  mode?: "view" | "edit" | "add";
  onSubmit?: (
    values: z.infer<typeof speakerAdminCreateSchema>
  ) => Promise<void>;
}) {
  type SpeakerForm = z.infer<typeof speakerAdminCreateSchema>;
  const form = useForm<SpeakerForm>({
    resolver: zodResolver(speakerAdminCreateSchema) as Resolver<SpeakerForm>,
    defaultValues: {
      name: "",
      role: "",
      company: "",
      imageUrl: "",
      bio: "",
      tags: [],
      slug: "",
      twitter: "",
      linkedin: "",
      website: "",
      speakerType: null,
      sortOrder: undefined,
    },
  });
  const { uploadSpeakerImage, uploading } = useSpeakersAdmin();

  useEffect(() => {
    if (open) {
      form.reset({
        name: speaker?.name ?? "",
        role: speaker?.role ?? "",
        company: speaker?.company ?? "",
        imageUrl: speaker?.imageUrl ?? "",
        bio: (speaker?.bio as string | null) ?? "",
        tags: (speaker?.tags as string[] | null) ?? [],
        slug: (speaker?.slug as string | null) ?? "",
        twitter: (speaker?.twitter as string | null) ?? "",
        linkedin: (speaker?.linkedin as string | null) ?? "",
        website: (speaker?.website as string | null) ?? "",
        speakerType:
          (speaker?.speakerType as SpeakerForm["speakerType"]) ?? null,
        sortOrder: (speaker?.sortOrder as number | null) ?? undefined,
      } as SpeakerForm);
    }
  }, [open, speaker, form]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Add Speaker"
              : mode === "edit"
              ? "Edit Speaker"
              : "Speaker Details"}
          </DialogTitle>
        </DialogHeader>
        {mode === "view" ? (
          speaker ? (
            <div className="grid gap-2 text-sm">
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{speaker.name}</div>
              <div className="text-muted-foreground">Role</div>
              <div>{speaker.role ?? "-"}</div>
              <div className="text-muted-foreground">Company</div>
              <div>{speaker.company ?? "-"}</div>
              <div className="text-muted-foreground">Type</div>
              <div>{speaker.speakerType ?? "-"}</div>
              <div className="text-muted-foreground">Image URL</div>
              <div>{speaker.imageUrl ?? "-"}</div>
              <div className="text-muted-foreground">Website</div>
              <div>
                {speaker.website ? (
                  <a
                    href={speaker.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {speaker.website}
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ) : null
        ) : (
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit?.(values);
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
                <Label>Role</Label>
                <Input {...form.register("role")} />
              </div>
              <div>
                <Label>Company</Label>
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
                    const url = await uploadSpeakerImage(file);
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
              <Label>Image URL</Label>
              <Input {...form.register("imageUrl")} />
              {form.formState.errors.imageUrl && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.imageUrl.message as string}
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Label>Bio</Label>
              <Textarea rows={3} {...form.register("bio")} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Tags (comma separated)</Label>
                <Input {...form.register("tags")} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input {...form.register("slug")} />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <Label>Twitter URL</Label>
                <Input {...form.register("twitter")} />
              </div>
              <div>
                <Label>LinkedIn URL</Label>
                <Input {...form.register("linkedin")} />
              </div>
              <div>
                <Label>Website URL</Label>
                <Input {...form.register("website")} />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.website.message as string}
                  </p>
                )}
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
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SpeakersDialog;
