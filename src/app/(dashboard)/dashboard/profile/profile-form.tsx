"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ProfileActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageField } from "@/components/ui/image-field";

interface Props {
  initial: {
    name: string;
    image: string;
    headline: string;
    bio: string;
    phone: string;
    location: string;
    skills: string;
    careerInterests: string;
    languages: string;
    isPublic: boolean;
  };
}

export function ProfileForm({ initial }: Props) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(updateProfile, {});
  const [image, setImage] = useState(initial.image);

  return (
    <form action={action} className="space-y-5">
      {state.ok ? (
        <Alert variant="success">
          <AlertDescription>Profile saved.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label>Profile picture</Label>
        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-16 rounded-full border object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full border bg-muted text-lg font-semibold text-muted-foreground">
              {initial.name.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1">
            <ImageField value={image} onChange={setImage} kind="profile-image" />
          </div>
        </div>
        <input type="hidden" name="image" value={image} />
        <p className="text-xs text-muted-foreground">PNG, JPG or WebP, up to 3&nbsp;MB.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="headline">Professional title</Label>
          <Input id="headline" name="headline" defaultValue={initial.headline} placeholder="e.g. Frontend Engineer" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biography</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initial.bio}
          rows={4}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={initial.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={initial.location} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills</Label>
        <Input id="skills" name="skills" defaultValue={initial.skills} placeholder="Comma separated" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="careerInterests">Career interests</Label>
        <Input id="careerInterests" name="careerInterests" defaultValue={initial.careerInterests} placeholder="Comma separated" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="languages">Languages</Label>
        <Input id="languages" name="languages" defaultValue={initial.languages} placeholder="Comma separated" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublic" defaultChecked={initial.isPublic} className="size-4" />
        Make my profile publicly visible
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
