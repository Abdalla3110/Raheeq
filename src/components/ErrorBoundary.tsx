"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0E0D0C] p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1A1816] border border-[#E3DCD2] dark:border-[#26211C] p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-2xl font-display font-bold text-[#1A1816] dark:text-[#FAF8F5] mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm text-[#595248] dark:text-[#A8A096] mb-6">
              نحن نعمل على إصلاح المشكلة. يرجى المحاولة مرة أخرى.
            </p>
            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="text-xs text-[#736B61] dark:text-[#8B8379] cursor-pointer mb-2">
                  تفاصيل الخطأ
                </summary>
                <pre className="text-xs bg-[#F2EFE9] dark:bg-[#151311] p-3 rounded border border-[#E0D9CE] dark:border-[#2E2822] overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold hover:bg-[#38332D] dark:hover:bg-[#B88E4F] transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}