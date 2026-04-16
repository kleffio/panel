"use client";

import { createContext, useContext, type ReactNode } from "react";

export type GroupEventHandler = {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const GroupEventContext = createContext<GroupEventHandler | null>(null);

export function GroupEventProvider({
  children,
  onDelete,
  onEdit,
}: {
  children: ReactNode;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <GroupEventContext.Provider value={{ onDelete, onEdit }}>
      {children}
    </GroupEventContext.Provider>
  );
}

export function useGroupEvents(): GroupEventHandler {
  const ctx = useContext(GroupEventContext);
  if (!ctx) {
    throw new Error("useGroupEvents must be used inside GroupEventProvider");
  }
  return ctx;
}
