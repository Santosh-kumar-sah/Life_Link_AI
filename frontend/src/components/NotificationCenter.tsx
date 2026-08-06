import React, { useEffect, useState } from "react";
import { Bell, Check, X, Inbox } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { fetchClient } from "../utils/fetchClient";
import { Notification, ApiResponse } from "../types/api";

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const socket: Socket = io({ withCredentials: true });
    socket.on("notification:new", (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetchClient<ApiResponse<Notification[]>>("/api/v1/notifications");
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read).length);
      } else {
        // Fallback for mocked response
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetchClient<ApiResponse<Notification>>(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1/3 -translate-y-1/3">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#0b0f19] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-bold text-slate-200">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">No notifications</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-4 transition-colors ${notif.read ? "bg-transparent" : "bg-blue-500/5"} hover:bg-slate-800/50`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${notif.read ? "bg-transparent" : "bg-blue-500"}`} />
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm ${notif.read ? "text-slate-300" : "text-white font-semibold"}`}>{notif.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-500 pt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
