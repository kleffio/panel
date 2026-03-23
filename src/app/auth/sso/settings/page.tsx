"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Configuration, FrontendApi, SettingsFlow, UiNode } from "@ory/client";
import { isUiNodeInputAttributes, getNodeLabel } from "@ory/integrations/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const frontend = new FrontendApi(
  new Configuration({
    basePath: "/api/auth",
    baseOptions: { withCredentials: true },
  })
);

function SSONode({ node }: { node: UiNode }) {
  if (!isUiNodeInputAttributes(node.attributes)) return null;
  const attrs = node.attributes;

  if (attrs.type === "hidden") {
    return <input type="hidden" name={attrs.name} value={(attrs.value as string) ?? ""} />;
  }

  if (attrs.type === "submit") {
    return (
      <Button type="submit" name={attrs.name} value={(attrs.value as string) ?? ""} className="w-full">
        {getNodeLabel(node) || "Save"}
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={attrs.name}>{getNodeLabel(node)}</Label>
      <Input
        id={attrs.name}
        name={attrs.name}
        type={attrs.type}
        defaultValue={(attrs.value as string) ?? ""}
        required={attrs.required}
        disabled={attrs.disabled}
        autoComplete={attrs.autocomplete ?? undefined}
      />
      {node.messages.map((msg) => (
        <p key={msg.id} className={`text-xs ${msg.type === "error" ? "text-red-400" : "text-muted-foreground"}`}>
          {msg.text}
        </p>
      ))}
    </div>
  );
}

export default function SSOSettingsPage() {
  const searchParams = useSearchParams();
  const flowId = searchParams.get("flow");
  const [flow, setFlow] = useState<SettingsFlow | null>(null);

  useEffect(() => {
    if (!flowId) {
      window.location.href = "/api/auth/self-service/settings/browser";
      return;
    }
    frontend
      .getSettingsFlow({ id: flowId })
      .then(({ data }) => setFlow(data))
      .catch((err) => {
        console.error("Fatal Error fetching SSO settings flow:", err);
        document.body.innerHTML = `
          <div style="padding: 2rem; background: #220000; color: #ff9999; min-height: 100vh; font-family: monospace;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">SSO Failed to Load the Settings Flow</h1>
            <pre style="background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>
          </div>
        `;
      });
  }, [flowId]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const body = Object.fromEntries(new FormData(form, submitter).entries());
    try {
      const { data } = await frontend.updateSettingsFlow({
        flow: String(flowId),
        updateSettingsFlowBody: body as any,
      });
      setFlow(data);
      // Password saved — send back to login
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const redirectTo = err.response?.data?.redirect_browser_to;
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      }
      if (err.response?.status === 400) {
        setFlow(err.response.data);
      } else {
        console.error("Settings update failed unexpectedly:", err);
      }
    }
  };

  if (!flow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Group nodes by their group so we can render password section cleanly
  const passwordNodes = flow.ui.nodes.filter((n) => {
    if (!isUiNodeInputAttributes(n.attributes)) return false;
    return n.group === "password" || n.group === "default";
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8 space-y-6">

        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        {flow.ui.messages?.map((msg) => (
          <p key={msg.id} className={`text-sm text-center ${msg.type === "error" ? "text-red-400" : "text-green-400"}`}>
            {msg.text}
          </p>
        ))}

        <form onSubmit={handleSubmit} className="space-y-4">
          {passwordNodes.map((node, i) => (
            <SSONode key={i} node={node} />
          ))}
        </form>

      </div>
    </div>
  );
}
