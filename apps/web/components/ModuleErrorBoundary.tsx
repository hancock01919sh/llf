'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Keeps one broken module from taking down the page (TDD §6.4). Build-time render errors still fail
 * the build; this catches errors in client modules after hydration and renders nothing in their place.
 */
export class ModuleErrorBoundary extends Component<
  { moduleType: string; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Module "${this.props.moduleType}" failed to render`, error, info.componentStack);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
