"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface BoundaryProps {
  pluginId: string;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

export class PluginErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[kleff] Plugin "${this.props.pluginId}" threw an error:`, error, info);
  }

  render() {
    if (this.state.error) {
      return null; // Fail silently — don't break the panel
    }
    return this.props.children;
  }
}
