import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-xl border border-gray-200 px-4 sm:px-8 py-8 sm:py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mb-6 text-center">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}


