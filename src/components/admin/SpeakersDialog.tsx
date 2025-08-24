"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { Speaker } from "@/types/people";
import { z } from "zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { speakerAdminCreateSchema } from "@/types/validation";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/hooks/useUpload";

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
  const { uploading, uploadFile, discardTemp, commitTemp } =
    useMediaUpload("speakers");

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // dialog closing without submit -> cleanup any temp uploads
          void discardTemp();
        }
        onOpenChange(v);
      }}
    >
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
          <Form {...form}>
            <form
              className="grid gap-3"
              onSubmit={form.handleSubmit(async (values) => {
                await onSubmit?.(values);
                // commit any temp uploads since data has been saved
                commitTemp();
                onOpenChange(false);
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
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
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
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
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
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
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SpeakersDialog;
