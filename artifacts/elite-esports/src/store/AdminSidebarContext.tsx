import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdminSidebarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);
  return (
    <AdminSidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const ctx = useContext(AdminSidebarContext);
  if (!ctx) throw new Error('useAdminSidebar must be used within AdminSidebarProvider');
  return ctx;
}
