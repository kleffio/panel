import * as React from "react";
import * as ReactDOM from "react-dom";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { definePlugin, PluginCtx, usePluginContext } from "@kleffio/sdk";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { pluginRegistry } from "./registry";

export function initPluginGlobals() {
  if (typeof window === "undefined") return;
  (window as any).__kleff__ = {
    React,
    ReactDOM,
    jsxRuntime: { jsx, jsxs, Fragment },
    definePlugin,
    PluginCtx,
    usePluginContext,
    registry: pluginRegistry,
    Link,
    navigation: { usePathname, useRouter },
    toast,
  };
}
