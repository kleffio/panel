"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Textarea,
} from "@kleffio/ui";
import { Spinner } from "@/components/ui/Spinner";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/api/profiles";
import type { ThemePreference, UpdateProfilePayload } from "@/types/user";

const PROFILE_KEY = ["users", "me"] as const;

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
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

export function AccountProfilePage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: getMyProfile,
  });
  const profile = data?.data;

  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState<ThemePreference>("system");
  const initialisedRef = useRef(false);
  if (profile && !initialisedRef.current) {
    setBio(profile.bio ?? "");
    setTheme(profile.theme_preference);
    initialisedRef.current = true;
  }

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: (res) => { queryClient.setQueryData(PROFILE_KEY, res); toast.success("Profile saved."); },
    onError: () => toast.error("Could not save profile."),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (res) => { queryClient.setQueryData(PROFILE_KEY, res); toast.success("Avatar updated."); },
    onError: () => toast.error("Could not upload avatar. Max size is 5 MiB."),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    e.target.value = "";
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ bio, theme_preference: theme });
  }

  const displayName = auth.user?.profile?.name ?? auth.user?.profile?.preferred_username ?? "User";

  if (isLoading) return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>
      <ProfileSkeleton />
    </div>
  );

  const initials = (profile?.username ?? displayName).slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      {!isError && profile && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your avatar, bio, and appearance preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="size-16">
                  <AvatarImage src={profile.avatar_url} alt="Your avatar" />
                  <AvatarFallback>
                    {avatarMutation.isPending ? <Spinner size="sm" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} aria-label="Upload avatar" />
                  <Button type="button" variant="outline" size="sm" disabled={avatarMutation.isPending} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-1.5 size-3.5" />
                    {avatarMutation.isPending ? "Uploading…" : "Upload photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP · max 5 MiB</p>
                </div>
              </div>

              {profile.username && (
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile.username} disabled className="max-w-sm" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} placeholder="Tell us a little about yourself…" value={bio} onChange={(e) => setBio(e.target.value)} className="max-w-lg resize-none" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="theme">Appearance</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as ThemePreference)}>
                  <SelectTrigger id="theme" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Spinner size="xs" className="mr-1.5" />}
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently deletes your account and all associated data. This cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1.5 size-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
