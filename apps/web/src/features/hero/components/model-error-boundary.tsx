import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly onError: () => void;
}

/** Keep the rest of the screen usable when the renderer fails. */
export class ModelErrorBoundary extends Component<
  Props,
  { readonly failed: boolean }
> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
