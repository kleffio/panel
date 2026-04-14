"use client";

import { ExternalLink } from "lucide-react";
import { Button, Card, CardHeader, CardTitle } from "@kleffio/ui";
import { useBackendPlugins } from "@/lib/plugins/use-backend-plugins";

export function AdminPluginSections() {
  const { settingsPages } = useBackendPlugins();
  const adminPages = settingsPages.filter((page) => page.iframe_url);

  if (adminPages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Identity Provider</h2>
        <p className="text-sm text-muted-foreground">
          Administration pages injected by the active identity provider plugin.
        </p>
      </div>
      {adminPages.map((page) => (
        <Card key={page.path}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{page.label}</CardTitle>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <a href={page.iframe_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 size-3.5" />
                Open
              </a>
            </Button>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
