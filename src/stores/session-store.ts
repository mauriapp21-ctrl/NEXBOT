"use client";

import { create } from "zustand";

import { notificationService, userService } from "@/services";
import type { AppNotification, Role, User } from "@/types";

import type { LoadStatus } from "./types";

interface SessionStore {
  currentUser: User | null;
  users: User[];
  roles: Role[];
  notifications: AppNotification[];
  status: LoadStatus;
  load: (options?: { force?: boolean }) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

/** Current user, team, roles and notifications. */
export const useSessionStore = create<SessionStore>()((set, get) => ({
  currentUser: null,
  users: [],
  roles: [],
  notifications: [],
  status: "idle",

  async load({ force = false } = {}) {
    if (!force && (get().status === "ready" || get().status === "loading")) return;
    set({ status: "loading" });
    try {
      const [currentUser, users, roles, notifications] = await Promise.all([
        userService.getCurrentUser(),
        userService.listUsers(),
        userService.listRoles(),
        notificationService.list(),
      ]);
      set({ currentUser, users, roles, notifications, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  async markNotificationRead(id) {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    await notificationService.markRead(id);
  },

  async markAllNotificationsRead() {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    await notificationService.markAllRead();
  },
}));
