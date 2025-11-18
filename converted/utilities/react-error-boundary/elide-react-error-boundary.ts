/**
 * React Error Boundary - Error boundary component for React
 *
 * Core features:
 * - Error catching
 * - Fallback UI
 * - Error logging
 * - Reset functionality
 * - TypeScript support
 * - Hooks support
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 3M+ downloads/week
 */

export interface ErrorBoundaryProps {
  children?: any;
  fallback?: any;
  FallbackComponent?: any;
  onError?: (error: Error, errorInfo: any) => void;
  onReset?: () => void;
  resetKeys?: any[];
}

export interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary {
  state: ErrorBoundaryState = { error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary(): void {
    this.setState({ error: null });
    this.props.onReset?.();
  }

  setState(state: Partial<ErrorBoundaryState>): void {
    this.state = { ...this.state, ...state };
  }

  render(): any {
    if (this.state.error) {
      if (this.props.FallbackComponent) {
        return this.props.FallbackComponent({
          error: this.state.error,
          resetErrorBoundary: () => this.resetErrorBoundary(),
        });
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function useErrorHandler(givenError?: Error): (error: Error) => void {
  return (error: Error) => {
    if (givenError) throw givenError;
    throw error;
  };
}

export function withErrorBoundary<P>(Component: any, errorBoundaryProps: ErrorBoundaryProps): any {
  return (props: P) => new ErrorBoundary({ ...errorBoundaryProps, children: Component });
}

if (import.meta.url.includes("elide-react-error-boundary")) {
  console.log("⚛️  React Error Boundary for Elide\n");
  console.log("=== Error Handling ===");
  
  const boundary = new ErrorBoundary({
    fallback: 'Error occurred',
    onError: (error) => console.log("Caught:", error.message),
  });
  
  console.log("Error boundary created");
  console.log("Has error:", boundary.state.error !== null);
  
  console.log();
  console.log("✅ Use Cases: Error handling, Fallback UI, Error logging, Recovery");
  console.log("🚀 3M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default ErrorBoundary;
