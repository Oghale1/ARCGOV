'use client';
// ArcGov — arcgov.vercel.app
// A React "error boundary": if any UI below it crashes while rendering,
// instead of showing a blank white page we show a friendly message with a
// "Try again" button. This is the standard React way to contain crashes.

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // In production you'd send this to an error tracker (e.g. Sentry).
    console.error('UI crash caught by ErrorBoundary:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center text-center px-4 py-24 gap-4">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 max-w-md">
          The page hit an unexpected error. Your data is safe — try again, and if
          it keeps happening, refresh the browser.
        </p>
        {this.state.message && (
          <code className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg max-w-md break-words">
            {this.state.message}
          </code>
        )}
        <button
          onClick={this.handleReset}
          className="mt-2 px-6 h-12 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all uppercase tracking-widest text-xs"
        >
          Try again
        </button>
      </div>
    );
  }
}
