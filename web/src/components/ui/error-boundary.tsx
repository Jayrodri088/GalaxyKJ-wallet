/**
 * Error Boundary Component
 * Catches React errors and reports them to analytics and monitoring systems
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportReactError } from '@/lib/monitoring/crash-reporter';
import { trackAnalyticsError } from '@/lib/analytics';

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({ error, errorInfo }: { error: Error; errorInfo: ErrorInfo }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
            <p className="text-sm text-gray-500">An unexpected error occurred</p>
          </div>
        </div>
        
        <div className="mt-4">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer hover:text-gray-800 font-medium">
              Error Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded">
              <p className="font-mono text-xs break-all">
                <strong>Error:</strong> {error.message}
              </p>
              <p className="font-mono text-xs break-all mt-2">
                <strong>Stack:</strong> {error.stack}
              </p>
              <p className="font-mono text-xs break-all mt-2">
                <strong>Component Stack:</strong> {errorInfo.componentStack}
              </p>
            </div>
          </details>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error information
    this.setState({ error, errorInfo });

    // Report error to monitoring systems
    try {
      // Report to crash reporter
      reportReactError(error, { componentStack: errorInfo.componentStack || '' });
      
      // Track with analytics
      trackAnalyticsError(error, {
        type: 'react_error_boundary',
        componentStack: errorInfo.componentStack || '',
        errorBoundary: true
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when props change (if enabled)
    if (this.props.resetOnPropsChange && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Render fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo);
        }
        return this.props.fallback;
      }

      // Render default fallback
      return <DefaultErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

/**
 * Hook to create an error boundary with custom configuration
 * @param fallback - Custom fallback component or function
 * @param onError - Custom error handler
 * @returns Error boundary component
 */
export function createErrorBoundary(
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode),
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return ({ children }: { children: ReactNode }) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Higher-order component to wrap components with error boundary
 * @param Component - Component to wrap
 * @param fallback - Custom fallback component or function
 * @param onError - Custom error handler
 * @returns Wrapped component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode),
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
