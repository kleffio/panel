"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AmbientOrbField,
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@kleffio/ui";
import {
  ArrowRightIcon,
  Layers3Icon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AuthThemeShell } from "@/components/layout/AuthThemeShell";
import { useSetupCatalog } from "@/features/setup/hooks/useSetupCatalog";
import { useSetupInstall } from "@/features/setup/hooks/useSetupInstall";
import { OIDC_FALLBACK_FIELDS } from "@/features/setup/model/types";
import type { CatalogPlugin, Step } from "@/features/setup/model/types";
import { ConfigForm } from "@/features/setup/ui/ConfigForm";

function SetupShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AuthThemeShell showDots={false}>
      <div className="-mx-6 -my-10 w-[calc(100%+3rem)] self-stretch">
        <div className="bg-auth-kleff-shell min-h-screen overflow-hidden lg:flex">
          <section className="bg-auth-kleff-hero relative min-h-[320px] overflow-hidden px-8 py-10 text-white sm:px-10 sm:py-12 lg:min-h-screen lg:basis-[52%] lg:px-12 lg:py-14">
            <AmbientOrbField showEdgeScrim={false} />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/72 backdrop-blur-sm">
                  Setup wizard
                </div>

                <div className="max-w-xl space-y-4">
                  <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Bring authentication online before your first sign-in.
                  </h2>
                  <p className="max-w-lg text-sm leading-7 text-white/72 sm:text-base">
                    Connect an existing OIDC provider or launch a bundled
                    identity provider with the same polished authentication
                    surface your login and signup flows already use.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:max-w-lg sm:grid-cols-2">
                <Card className="gap-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] py-0 text-white shadow-none ring-0 backdrop-blur-md">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center gap-2 text-white/72">
                      <ShieldCheckIcon className="size-4" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.24em]">
                        Existing OIDC
                      </p>
                    </div>
                    <p className="text-sm font-medium leading-6 text-white">
                      Bring Authentik, Okta, Auth0, Ory, Azure AD, or another
                      provider you already trust.
                    </p>
                  </CardContent>
                </Card>

                <Card className="gap-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] py-0 text-white shadow-none ring-0 backdrop-blur-md">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center gap-2 text-white/72">
                      <Layers3Icon className="size-4" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.24em]">
                        Bundled options
                      </p>
                    </div>
                    <p className="text-sm font-medium leading-6 text-white">
                      Spin up a ready-to-run provider and activate it without
                      leaving the panel.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="bg-auth-kleff-panel relative z-10 overflow-visible px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:basis-[48%] lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute inset-y-0 -left-[18%] z-20 hidden w-[18%] min-w-24 max-w-48 lg:block">
              <div className="bg-auth-kleff-seam-right absolute inset-0" />
              <div
                className="bg-auth-kleff-seam-soft-right absolute inset-0 opacity-95"
                style={{
                  filter: "blur(24px)",
                  transform: "scaleX(1.16) scaleY(1.08)",
                }}
              />
            </div>

            <div className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col justify-center">
              <div className="w-full space-y-8">
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Authentication setup
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </div>
                {children}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AuthThemeShell>
  );
}

function SetupSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-[1.75rem]" />
        <Skeleton className="h-28 w-full rounded-[1.75rem]" />
        <Skeleton className="h-28 w-full rounded-[1.75rem]" />
      </div>
    </div>
  );
}

export function SetupPage() {
  const { bundledPlugins, oidcPlugin, loading, error } = useSetupCatalog();
  const {
    configValues,
    installing,
    installError,
    initConfig,
    setField,
    handleInstall,
  } = useSetupInstall();

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<CatalogPlugin | null>(null);

  const currentStep = step === "pick" ? 1 : 2;
  const title =
    step === "pick"
      ? "Set up authentication"
      : step === "existing"
        ? "Connect your identity provider"
        : `Configure ${selected?.name}`;
  const description =
    step === "pick"
      ? "Choose how users will log in to your Kleff instance."
      : step === "existing"
        ? "Enter your OIDC provider details and Kleff will handle the rest through discovery."
        : `Review the ${selected?.name} configuration and activate it for sign-in.`;
  const stepItems = [
    {
      title: "Choose IDP",
      description: "Select an existing OIDC provider or launch a bundled one.",
    },
    {
      title: step === "existing" ? "Connect provider" : "Configure provider",
      description:
        step === "existing"
          ? "Enter issuer and client credentials."
          : selected
            ? `Review ${selected.name} and activate it.`
            : "Complete the provider setup.",
    },
  ];

  function startExisting() {
    const plugin = oidcPlugin ?? {
      id: "idp-oidc",
      name: "Generic OIDC",
      type: "idp",
      description: "",
      author: "Kleff",
      version: "1.0.0",
      verified: true,
      config: OIDC_FALLBACK_FIELDS,
    };
    setSelected(plugin);
    initConfig(plugin);
    setStep("existing");
  }

  function selectBundled(plugin: CatalogPlugin) {
    setSelected(plugin);
    initConfig(plugin);
    setStep("bundled");
  }

  function resetSelection() {
    setStep("pick");
    setSelected(null);
  }

  if (loading) {
    return (
      <SetupShell
        title="Set up authentication"
        description="Choose how users will log in to your Kleff instance."
      >
        <SetupSkeleton />
      </SetupShell>
    );
  }

  return (
    <SetupShell title={title} description={description}>
      <Stepper
        value={currentStep}
        indicators={{
          completed: <ShieldCheckIcon className="size-3.5" />,
          loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
        }}
        className="w-full space-y-8"
      >
        <StepperNav className="pointer-events-none relative mx-auto grid w-full max-w-[29rem] grid-cols-2 gap-8 sm:gap-10">
          <div
            aria-hidden="true"
            className="absolute left-[calc(25%+0.75rem)] right-[calc(25%+0.75rem)] top-3 h-px rounded-full bg-white/12"
          >
            <div
              className={`h-full rounded-full bg-primary/80 transition-all duration-200 ${currentStep > 1 ? "w-full" : "w-0"
                }`}
            />
          </div>

          {stepItems.map((item, index) => (
            <StepperItem
              key={item.title}
              step={index + 1}
              loading={index === 1 && installing}
              className="relative z-10 min-w-0 items-start justify-center gap-3 text-center"
            >
              <StepperTrigger className="relative flex w-full flex-col items-center gap-3 rounded-none px-0 pt-10">
                <StepperIndicator className="absolute left-1/2 top-0 z-10 shrink-0 -translate-x-1/2 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  {index + 1}
                </StepperIndicator>

                <div className="w-full space-y-1.5 px-2 text-center">
                  <StepperTitle className="text-sm font-semibold data-[state=inactive]:text-white/60 sm:text-base">
                    {item.title}
                  </StepperTitle>
                  <StepperDescription className="text-xs leading-6 text-muted-foreground data-[state=inactive]:text-white/45">
                    {item.description}
                  </StepperDescription>
                </div>
              </StepperTrigger>
            </StepperItem>
          ))}
        </StepperNav>

        {(error || installError) && (
          <Alert variant="destructive">
            <TriangleAlertIcon className="size-4" />
            <AlertTitle>Setup needs attention</AlertTitle>
            <AlertDescription>{installError ?? error}</AlertDescription>
          </Alert>
        )}

        <StepperPanel className="text-sm">
          <StepperContent value={1} className="space-y-4">
            <div className="space-y-4">
              <Card
                className="cursor-pointer gap-0 rounded-[1.75rem] border border-white/8 bg-white/[0.03] py-0 shadow-none ring-0 transition-all duration-200 hover:border-primary/35 hover:bg-white/[0.05]"
                onClick={startExisting}
              >
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-medium text-foreground">
                    I already have an identity provider
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Connect Authentik, Ory, Okta, Auth0, Azure AD, or any other
                    OIDC-compatible provider. You&apos;ll need an issuer URL and
                    client credentials.
                  </p>
                </CardContent>
              </Card>

              {bundledPlugins.length > 0 && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/80" />
                    <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      or launch one here
                    </span>
                    <div className="h-px flex-1 bg-border/80" />
                  </div>

                  <div className="space-y-3">
                    {bundledPlugins.map((plugin) => (
                      <Card
                        key={plugin.id}
                        className="cursor-pointer gap-0 rounded-[1.75rem] border border-white/8 bg-white/[0.03] py-0 shadow-none ring-0 transition-all duration-200 hover:border-primary/35 hover:bg-white/[0.05]"
                        onClick={() => selectBundled(plugin)}
                      >
                        <CardContent className="flex items-start justify-between gap-4 p-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {plugin.name}
                              </p>
                              {plugin.verified && (
                                <Badge variant="secondary">verified</Badge>
                              )}
                            </div>
                            <p className="text-sm leading-7 text-muted-foreground">
                              {plugin.description}
                            </p>
                          </div>
                          <div className="pt-0.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            v{plugin.version}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </StepperContent>

          <StepperContent value={2} className="space-y-4">
            {step === "existing" && selected && (
              <form
                onSubmit={(e) => handleInstall(e, selected)}
                className="space-y-5 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6"
              >
                <ConfigForm
                  fields={selected.config}
                  values={configValues}
                  onChange={setField}
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    onClick={resetSelection}
                    disabled={installing}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-full bg-gradient-kleff text-primary-foreground shadow-[0_18px_40px_rgba(196,143,0,0.22)] hover:opacity-95"
                    disabled={installing}
                  >
                    {installing ? "Connecting..." : "Connect"}
                    {!installing && <ArrowRightIcon className="size-4" />}
                  </Button>
                </div>
              </form>
            )}

            {step === "bundled" && selected && (
              <form
                onSubmit={(e) => handleInstall(e, selected)}
                className="space-y-5 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6"
              >
                {!selected.config.some((field) => field.required) && (
                  <p className="text-center text-sm leading-7 text-muted-foreground">
                    No configuration is required. Kleff will start{" "}
                    {selected.name} automatically.
                    {selected.config.length > 0 &&
                      " You can optionally connect an existing instance below."}
                  </p>
                )}
                {selected.dependencies && selected.dependencies.length > 0 && (
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                    <p className="mb-1 text-sm font-medium">
                      Required dependencies
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      The following plugins will be installed and activated
                      before {selected.name}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selected.dependencies.map((dep) => (
                        <Badge
                          key={dep}
                          variant="secondary"
                          className="border-primary/20 px-2 py-0"
                        >
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selected.config.length > 0 && (
                  <ConfigForm
                    fields={selected.config}
                    values={configValues}
                    onChange={setField}
                  />
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    onClick={resetSelection}
                    disabled={installing}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-full bg-gradient-kleff text-primary-foreground shadow-[0_18px_40px_rgba(196,143,0,0.22)] hover:opacity-95"
                    disabled={installing}
                  >
                    {installing ? "Installing..." : "Install & Activate"}
                    {!installing && <ArrowRightIcon className="size-4" />}
                  </Button>
                </div>
              </form>
            )}
          </StepperContent>
        </StepperPanel>
      </Stepper>
    </SetupShell>
  );
}
