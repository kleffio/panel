"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Configuration, FrontendApi, RecoveryFlow, UiNode } from "@ory/client";
import { isUiNodeInputAttributes, getNodeLabel } from "@ory/integrations/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const frontend = new FrontendApi(
  new Configuration({
    basePath: "/ory",
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
        {getNodeLabel(node) || "Send recovery link"}
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
        autoComplete={attrs.name === "code" ? "one-time-code" : (attrs.autocomplete ?? undefined)}
      />
      {node.messages.map((msg) => (
        <p key={msg.id} className={`text-xs ${msg.type === "error" ? "text-red-400" : "text-muted-foreground"}`}>
          {msg.text}
        </p>
      ))}
    </div>
  );
}

function SSORecoveryContent() {
  const searchParams = useSearchParams();
  const flowId = searchParams.get("flow");
  const [flow, setFlow] = useState<RecoveryFlow | null>(null);

  useEffect(() => {
    if (!flowId) {
      window.location.href = "/ory/self-service/recovery/browser";
      return;
    }
    frontend
      .getRecoveryFlow({ id: flowId })
      .then(({ data }) => setFlow(data))
      .catch((err) => {
        console.error("Fatal Error fetching SSO recovery flow:", err);
        document.body.innerHTML = `
          <div style="padding: 2rem; background: #220000; color: #ff9999; min-height: 100vh; font-family: monospace;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">SSO Failed to Load the Recovery Flow</h1>
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
      const { data } = await frontend.updateRecoveryFlow({
        flow: String(flowId),
        updateRecoveryFlowBody: body as any,
      });
      setFlow(data);
    } catch (err: any) {
      if (err.response?.status === 422) {
        // Auth provider signals a browser redirect is required (e.g. to a settings flow to set new password)
        const redirectTo = err.response?.data?.redirect_browser_to;
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      }
      if (err.response?.status === 400) {
        setFlow(err.response.data);
      } else {
        console.error("Recovery failed unexpectedly:", err);
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8 space-y-6">

        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a recovery link
          </p>
        </div>

        {flow.ui.messages?.map((msg) => (
          <p
            key={msg.id}
            className={`text-sm text-center ${msg.type === "error" ? "text-red-400" : "text-green-400"}`}
          >
            {msg.text}
          </p>
        ))}

        <form onSubmit={handleSubmit} className="space-y-4">
          {flow.ui.nodes.map((node, i) => (
            <SSONode key={i} node={node} />
          ))}
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Remembered your password?{" "}
          <a
            href="/ory/self-service/login/browser"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}

export default function SSORecoveryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SSORecoveryContent />
    </Suspense>
  );
}
