"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Info,
  X,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLoading } from "@/components/loading_screen";

export type NotificationType =
  | "error"
  | "warning"
  | "success"
  | "info"
  | "normal";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = stay until dismissed
  action?: NotificationAction;
  onClose?: () => void;
}

export interface NotificationOptions {
  message?: string;
  duration?: number;
  action?: NotificationAction;
  onClose?: () => void;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (item: Omit<NotificationItem, "id">) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  notify: {
    error: (title: string, options?: NotificationOptions) => string;
    warning: (title: string, options?: NotificationOptions) => string;
    success: (title: string, options?: NotificationOptions) => string;
    info: (title: string, options?: NotificationOptions) => string;
    normal: (title: string, options?: NotificationOptions) => string;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const pathname = usePathname();

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target?.onClose) {
        try {
          target.onClose();
        } catch {
          // Non-blocking
        }
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback(
    (item: Omit<NotificationItem, "id">) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = item.duration !== undefined ? item.duration : 5000;

      const newNotif: NotificationItem = {
        ...item,
        id,
        duration,
      };

      setNotifications((prev) => [...prev, newNotif]);
      return id;
    },
    []
  );

  // Consume deferred notices after page transition and loading screen complete
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("dawh_pending_notice");
      if (raw) {
        sessionStorage.removeItem("dawh_pending_notice");
        const parsed = JSON.parse(raw);
        const timer = setTimeout(() => {
          showNotification(parsed);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [pathname, showNotification]);

  const notify = {
    error: useCallback(
      (title: string, options?: NotificationOptions) =>
        showNotification({ type: "error", title, ...options }),
      [showNotification]
    ),
    warning: useCallback(
      (title: string, options?: NotificationOptions) =>
        showNotification({ type: "warning", title, ...options }),
      [showNotification]
    ),
    success: useCallback(
      (title: string, options?: NotificationOptions) =>
        showNotification({ type: "success", title, ...options }),
      [showNotification]
    ),
    info: useCallback(
      (title: string, options?: NotificationOptions) =>
        showNotification({ type: "info", title, ...options }),
      [showNotification]
    ),
    normal: useCallback(
      (title: string, options?: NotificationOptions) =>
        showNotification({ type: "normal", title, ...options }),
      [showNotification]
    ),
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        clearAll,
        notify,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}

// ---------------------------------------------------------------------------
// Color Config per Type
// ---------------------------------------------------------------------------
const NOTIFICATION_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  normal: Bell,
};

// ---------------------------------------------------------------------------
// Toast Notification Card (Individual Item with Theme-Aware Background & Animated Bottom Progress Bar)
// ---------------------------------------------------------------------------
function NotificationToastCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isPaused, setIsPaused] = useState(false);

  const IconComponent =
    NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.normal;
  const hasDuration = !!(item.duration && item.duration > 0);

  // Colors based on Notification Type & Theme
  let accentColor = "#10B981";
  let badgeBg = isLight ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.18)";
  let actionText = "#FFFFFF";

  if (item.type === "error") {
    accentColor = "#EF4444";
    badgeBg = isLight ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.18)";
    actionText = "#FFFFFF";
  } else if (item.type === "warning") {
    accentColor = isLight ? "#D97706" : "#F59E0B";
    badgeBg = isLight ? "rgba(217, 119, 6, 0.14)" : "rgba(245, 158, 11, 0.18)";
    actionText = isLight ? "#FFFFFF" : "#000000";
  } else if (item.type === "info") {
    accentColor = isLight ? "#6366F1" : "#818CF8";
    badgeBg = isLight ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.18)";
    actionText = "#FFFFFF";
  } else if (item.type === "normal") {
    accentColor = isLight ? "#222222" : "#FFFFFF";
    badgeBg = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.14)";
    actionText = isLight ? "#FFFFFF" : "#18181B";
  }

  // Theme Styles: Light = White (#FFFFFF), Dark = Gray (#383838)
  const cardBg = isLight ? "#FFFFFF" : "#383838";
  const cardBorder = isLight ? "#E4E4E7" : "#444444";
  const titleColor = isLight ? "#222222" : "#FFFFFF";
  const messageColor = isLight ? "#666666" : "#D4D4D8";
  const closeColor = isLight ? "#999999" : "#A1A1AA";
  const closeHoverColor = isLight ? "#222222" : "#FFFFFF";
  const progressTrack = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.1)";
  const shadow = isLight
    ? "0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)"
    : "0 6px 20px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)";

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        pointerEvents: "auto",
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: shadow,
        borderRadius: "12px",
        padding: "14px 16px 16px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        color: titleColor,
        fontFamily: "var(--font-outfit), var(--font-prompt), sans-serif",
        animation: "slideInFromRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          flexShrink: 0,
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          backgroundColor: badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
        }}
      >
        <IconComponent size={18} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "13.5px",
            lineHeight: "18px",
            color: titleColor,
            wordBreak: "break-word",
          }}
        >
          {item.title}
        </div>

        {item.message && (
          <div
            style={{
              fontSize: "12px",
              lineHeight: "16px",
              color: messageColor,
              wordBreak: "break-word",
            }}
          >
            {item.message}
          </div>
        )}

        {item.action && (
          <div style={{ marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => {
                try {
                  item.action?.onClick();
                } finally {
                  onDismiss(item.id);
                }
              }}
              style={{
                padding: "4px 12px",
                borderRadius: "6px",
                backgroundColor: accentColor,
                color: actionText,
                fontWeight: 600,
                fontSize: "11.5px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {item.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        style={{
          flexShrink: 0,
          backgroundColor: "transparent",
          border: "none",
          color: closeColor,
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = closeHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = closeColor;
        }}
      >
        <X size={15} />
      </button>

      {/* Progress Bar (หลอดสีโหลดเวลาปิด ล่างสุดในกล่อง) */}
      {hasDuration && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            backgroundColor: progressTrack,
            overflow: "hidden",
          }}
        >
          <div
            onAnimationEnd={() => onDismiss(item.id)}
            style={{
              height: "100%",
              backgroundColor: accentColor,
              width: "0%",
              animationName: "notifProgressFill",
              animationDuration: `${item.duration}ms`,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Container at Bottom-Right (ขวาล่าง)
// ---------------------------------------------------------------------------
function NotificationContainer({
  notifications,
  onDismiss,
}: {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}) {
  const { isLoading } = useLoading();

  // ไม่แสดง notification ในระหว่างที่ Loading Screen กำลังแสดงผล
  if (isLoading || notifications.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        width: "calc(100vw - 40px)",
        pointerEvents: "none",
      }}
    >
      {notifications.map((item) => (
        <NotificationToastCard
          key={item.id}
          item={item}
          onDismiss={onDismiss}
        />
      ))}
    </aside>
  );
}
