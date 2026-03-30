"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@kleffio/ui";
import { Button } from "@kleffio/ui";
import { Input } from "@kleffio/ui";
import { Label } from "@kleffio/ui";
import { Separator } from "@kleffio/ui";
import { Skeleton } from "@kleffio/ui";
import { Textarea } from "@kleffio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kleffio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@kleffio/ui";

import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/api/profiles";
import type { ThemePreference, UpdateProfilePayload } from "@/types/user";

// ─── Query key ───────────────────────────────────────────────────────────────

const PROFILE_QUERY_KEY = ["users", "me"] as const;

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch profile ────────────────────────────────────────────────────────
  // On first call the backend lazily creates the profile for this Kratos
  // identity, so this query is always safe to fire.
  const { data, isLoading, isError } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
  });

  const profile = data?.data;

  // ── Local form state (controlled by server data once loaded) ─────────────
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState<ThemePreference>("system");

  // Sync form state from server data when it first arrives.
  // Using a ref-based initialised guard avoids resetting mid-edit on refetch.
  const initialisedRef = useRef(false);
  if (profile && !initialisedRef.current) {
    setBio(profile.bio ?? "");
    setTheme(profile.theme_preference);
    initialisedRef.current = true;
  }

  // ── Update profile mutation ───────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, res);
      toast.success("Profile saved.");
    },
    onError: () => {
      toast.error("Could not save profile. Please try again.");
    },
  });

  // ── Avatar upload mutation ────────────────────────────────────────────────
  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (res) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, res);
      toast.success("Avatar updated.");
    },
    onError: () => {
      toast.error("Could not upload avatar. Max size is 5 MiB.");
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    // Reset input so the same file can be re-selected after an error.
    e.target.value = "";
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ bio, theme_preference: theme });
  }

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load profile. Refresh to try again.
        </CardContent>
      </Card>
    );
  }

  // Derive initials for the avatar fallback.
  const initials = (profile.username ?? profile.id)
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your avatar, bio, and appearance preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          {/* ── Avatar ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16">
              <AvatarImage src={profile.avatar_url} alt="Your avatar" />
              <AvatarFallback>
                {avatarMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  initials
                )}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              {/* Hidden file input — triggered by the visible button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                aria-label="Upload avatar"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1.5 size-3.5" />
                {avatarMutation.isPending ? "Uploading…" : "Upload photo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP · max 5 MiB
              </p>
            </div>
          </div>

          {/* ── Username (read-only display) ────────────────────────────── */}
          {profile.username && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                disabled
                className="max-w-sm"
              />
            </div>
          )}

          {/* ── Bio ─────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Tell us a little about yourself…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="max-w-lg resize-none"
            />
          </div>

          {/* ── Theme ───────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="theme">Appearance</Label>
            <Select
              value={theme}
              onValueChange={(v) => setTheme(v as ThemePreference)}
            >
              <SelectTrigger id="theme" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls the panel colour scheme for your account only.
            </p>
          </div>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            )}
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Root view ────────────────────────────────────────────────────────────────

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and organization settings.
        </p>
      </div>

      {/* Profile — connects to GET/PATCH /api/v1/users/me */}
      <ProfileCard />

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Settings that apply to your entire organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" placeholder="acme-corp" />
            </div>
          </div>
          <Button size="sm">Save</Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Organization</p>
              <p className="text-xs text-muted-foreground">
                Permanently deletes all servers and data. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
