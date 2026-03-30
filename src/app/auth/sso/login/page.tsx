"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Configuration, FrontendApi, LoginFlow, UiNode } from "@ory/client";
import { isUiNodeInputAttributes, getNodeLabel } from "@ory/integrations/ui";
import { Button } from "@kleffio/ui";
import { Input } from "@kleffio/ui";
import { Label } from "@kleffio/ui";

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
        {getNodeLabel(node) || "Sign in"}
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

function SSOLoginContent() {
  const searchParams = useSearchParams();
  const flowId = searchParams.get("flow");
  const [flow, setFlow] = useState<LoginFlow | null>(null);

  useEffect(() => {
    if (!flowId) {
      const loginChallenge = searchParams.get("login_challenge");
      const url = loginChallenge
        ? `/ory/self-service/login/browser?login_challenge=${loginChallenge}`
        : "/ory/self-service/login/browser";
      window.location.href = url;
      return;
    }
    frontend
      .getLoginFlow({ id: flowId })
      .then(({ data }) => setFlow(data))
      .catch((err) => {
        console.error("Fatal Error fetching SSO flow:", err);
        document.body.innerHTML = `
          <div style="padding: 2rem; background: #220000; color: #ff9999; min-height: 100vh; font-family: monospace;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">SSO Failed to Load the Flow</h1>
            <p style="margin-bottom: 2rem;">Something blocked the browser from fetching the login fields. Check the F12 Network tab!</p>
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
      await frontend.updateLoginFlow({
        flow: String(flowId),
        updateLoginFlowBody: body as any,
      });
      window.location.href = flow?.return_to ?? "/dashboard";
    } catch (err: any) {
      if (err.response?.status === 422) {
        // Auth provider signals browser location change required (e.g. back to the authorization server)
        const redirectTo = err.response?.data?.redirect_browser_to;
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      }
      if (err.response?.status === 400) {
        setFlow(err.response.data);
      } else {
        console.error("Login failed unexpectedly:", err);
      }
    }
  };

  if (!flow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Initializing secure session...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-kleff-grid">
      <div className="bg-kleff-spotlight pointer-events-none absolute inset-0" />
      <div className="glass-panel relative w-full max-w-sm p-8 space-y-6">

        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gradient-kleff text-2xl font-bold tracking-tight">Kleff</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Panel
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your game servers</p>
        </div>

        {flow.ui.messages?.map((msg) => (
          <p key={msg.id} className={`text-sm text-center ${msg.type === "error" ? "text-red-400" : "text-muted-foreground"}`}>
            {msg.text}
          </p>
        ))}

        <form onSubmit={handleSubmit} className="space-y-4">
          {flow.ui.nodes.map((node, i) => (
            <SSONode key={i} node={node} />
          ))}
        </form>

        <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground">
          <button
            onClick={() => {
              const returnTo = encodeURIComponent(window.location.origin + "/auth/login");
              window.location.href = `/ory/self-service/recovery/browser?return_to=${returnTo}`;
            }}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Forgot your password?
          </button>
          <span>
            Don&apos;t have an account?{" "}
            <a href="/ory/self-service/registration/browser" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Create one
            </a>
          </span>
        </div>

      </div>
    </div>
  );
}

export default function SSOLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Initializing secure session...</p>
      </div>
    }>
      <SSOLoginContent />
    </Suspense>
  );
}
