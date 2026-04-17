"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AmbientOrbField, Card, cn } from "@kleffio/ui";

import { AuthThemeShell } from "@/components/layout/AuthThemeShell";

type AuthMode = "login" | "signup";

const AUTH_PANEL_EASE = [0.12, 0.9, 0.22, 1] as const;
const AUTH_PANE_EASE = [0.1, 0.88, 0.2, 1] as const;
const AUTH_ORB_REVEAL_DELAY_MS = 2000;
const AUTH_PANEL_LAYOUT_TRANSITION = {
  duration: 0.52,
  ease: AUTH_PANEL_EASE,
} as const;
const AUTH_HERO_SEAM_LAYER_CLASS_NAME =
  "pointer-events-none absolute inset-y-0 z-20 hidden w-[18%] min-w-24 max-w-48 lg:block";

function getAuthMode(pathname: string | null): AuthMode | null {
  if (pathname === "/auth/login") {
    return "login";
  }

  if (pathname === "/auth/signup") {
    return "signup";
  }

  return null;
}

function getDirection(previousMode: AuthMode | null, currentMode: AuthMode | null) {
  if (!previousMode || !currentMode || previousMode === currentMode) {
    return 0;
  }

  return previousMode === "login" && currentMode === "signup" ? 1 : -1;
}

export function AuthRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const currentMode = getAuthMode(pathname);
  const isSignupMode = currentMode === "signup";
  const previousModeRef = useRef<AuthMode | null>(currentMode);
  const isInitialRenderRef = useRef(true);

  const previousMode = previousModeRef.current;
  const direction = getDirection(previousMode, currentMode);
  const shouldAnimate = !shouldReduceMotion && !isInitialRenderRef.current && direction !== 0;
  const orbRevealDelayMs = shouldAnimate
    ? Math.round(AUTH_PANEL_LAYOUT_TRANSITION.duration * 1000) + AUTH_ORB_REVEAL_DELAY_MS
    : 0;

  useEffect(() => {
    previousModeRef.current = currentMode;
    isInitialRenderRef.current = false;
  }, [currentMode]);

  return (
    <AuthThemeShell showDots={false}>
      <div className="-mx-6 -my-10 w-[calc(100%+3rem)] self-stretch">
        <Card className="bg-auth-kleff-shell min-h-screen gap-0 overflow-hidden rounded-none border-0 py-0 shadow-none lg:flex lg:flex-row">
          <section
            className={cn(
              "relative min-h-[320px] overflow-hidden px-8 py-10 text-white sm:px-10 sm:py-12 lg:min-h-screen lg:px-12 lg:py-14",
              isSignupMode
                ? "bg-auth-kleff-hero bg-auth-kleff-hero--panel-left lg:order-2 lg:basis-[52%]"
                : "bg-auth-kleff-hero lg:order-1 lg:basis-[52%]"
            )}
          >
            <AmbientOrbField showEdgeScrim={false} />
          </section>

          <motion.section
            layout={!shouldReduceMotion}
            transition={AUTH_PANEL_LAYOUT_TRANSITION}
            className={cn(
              "bg-auth-kleff-panel relative z-10 overflow-visible px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-14",
              isSignupMode ? "lg:order-1 lg:basis-[48%]" : "lg:order-2 lg:basis-[48%]"
            )}
            style={{
              willChange: shouldAnimate ? "transform" : undefined,
            }}
          >
            <div
              className={cn(
                AUTH_HERO_SEAM_LAYER_CLASS_NAME,
                isSignupMode ? "-right-[18%]" : "-left-[18%]"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0",
                  isSignupMode ? "bg-auth-kleff-seam-left" : "bg-auth-kleff-seam-right"
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 opacity-95",
                  isSignupMode
                    ? "bg-auth-kleff-seam-soft-left"
                    : "bg-auth-kleff-seam-soft-right"
                )}
                style={{
                  filter: shouldReduceMotion ? "blur(16px)" : "blur(24px)",
                  transform: "scaleX(1.16) scaleY(1.08)",
                }}
              />
            </div>
            <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col justify-center">
              <div className="relative min-h-[34rem] w-full overflow-hidden sm:min-h-[36rem]">
                {currentMode ? (
                  <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    <motion.div
                      key={currentMode}
                      custom={direction}
                      initial={
                        shouldAnimate
                          ? {
                              x: direction > 0 ? 18 : -18,
                              opacity: 0.8,
                            }
                          : false
                      }
                      animate={{
                        x: 0,
                        opacity: 1,
                        transition: {
                          duration: shouldReduceMotion ? 0.2 : 0.46,
                          ease: AUTH_PANE_EASE,
                        },
                      }}
                      exit={
                        shouldAnimate
                          ? {
                              x: direction > 0 ? -18 : 18,
                              opacity: 0.68,
                              transition: {
                                duration: 0.38,
                                ease: AUTH_PANE_EASE,
                              },
                            }
                          : undefined
                      }
                      style={{
                        willChange: shouldAnimate ? "transform, opacity" : undefined,
                      }}
                      className="w-full"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">{children}</div>
                )}
              </div>
            </div>
          </motion.section>
        </Card>
      </div>
    </AuthThemeShell>
  );
}
