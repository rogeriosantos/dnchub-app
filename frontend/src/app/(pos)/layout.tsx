"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        {children}
      </div>
    </ThemeProvider>
  );
}
