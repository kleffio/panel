"use client";

import { useEffect, useState } from "react";
import { Users, Building2, ShieldAlert } from "lucide-react";
import { get, post } from "@/lib/api";
import { MetricCard } from "@/components/domain/MetricCard";
import { PluginSlot } from "@/components/plugin/PluginSlot";
import { Card, CardContent, CardHeader, CardTitle } from "@kleffio/ui";
import { Badge } from "@kleffio/ui";
import { Button } from "@kleffio/ui";

type AdminUser = { id: string; username: string; email: string; roles: string[]; status: string };
type AdminOrg = { id: string; name: string; plan: string; status: string; createdAt: string };

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);

  useEffect(() => {
    get<{ data: AdminUser[] }>("/api/v1/admin/users").then(d => setUsers(d.data ?? []));
    get<{ data: AdminOrg[] }>("/api/v1/admin/organizations").then(d => setOrgs(d.data ?? []));
  }, []);

  const suspendedUsers = users.filter(u => u.status === "suspended").length;
  const adminCount = users.filter(u => u.roles.includes("admin")).length;

  return (
    <div className="space-y-6">
      {/* Plugin top */}
      <PluginSlot name="admin.top" />

      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Platform-wide management. Handle with care.</p>
      </div>

      <PluginSlot name="admin.metrics" slotProps={{ users, orgs, suspendedUsers, adminCount }}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <MetricCard label="Total Users" value={users.length} icon={<Users className="size-4" />} />
          <MetricCard label="Organizations" value={orgs.length} icon={<Building2 className="size-4" />} />
          <MetricCard label="Suspended" value={suspendedUsers} icon={<ShieldAlert className="size-4" />} />
        </div>
      </PluginSlot>

      <div className="grid gap-6 lg:grid-cols-2">
        <PluginSlot name="admin.users" slotProps={{ users }}>
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.roles.includes("admin") && (
                      <Badge variant="secondary">admin</Badge>
                    )}
                    <Badge variant={user.status === "active" ? "outline" : "destructive"}>
                      {user.status}
                    </Badge>
                    {user.status !== "suspended" && !user.roles.includes("admin") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() =>
                          post(`/api/v1/admin/users/${user.id}/suspend`)
                            .then(() => setUsers(u => u.map(x => x.id === user.id ? { ...x, status: "suspended" } : x)))
                        }
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </PluginSlot>

        <PluginSlot name="admin.orgs" slotProps={{ orgs }}>
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orgs.map(org => (
                <div key={org.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">Plan: {org.plan}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={org.status === "active" ? "outline" : "destructive"}>
                      {org.status}
                    </Badge>
                    {org.status !== "suspended" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() =>
                          post(`/api/v1/admin/organizations/${org.id}/suspend`)
                            .then(() => setOrgs(o => o.map(x => x.id === org.id ? { ...x, status: "suspended" } : x)))
                        }
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </PluginSlot>
      </div>

      {/* Plugin bottom */}
      <PluginSlot name="admin.bottom" />
    </div>
  );
}
