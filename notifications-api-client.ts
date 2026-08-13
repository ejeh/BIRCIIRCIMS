export enum NotificationType {
  GENERAL = "general",
  IDCARD = "idcard",
  CERTIFICATE = "certificate",
  SYSTEM = "system",
  ALERT = "alert",
  AUCTIONEER = "auctioneer",
  PAYMENT = "payment",
  RECEIPT = "receipt",
}

export enum NotificationTarget {
  USER = "user",
  ALL = "all",
  ROLE = "role",
  LGA = "lga",
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  read: boolean;
  link?: string;
  lga?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface NotificationsPaginated {
  data: NotificationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export const notificationsApi = {
  sendNotification: {
    method: "POST" as const,
    url: "/api/notifications",
    auth: true,
    roles: ["global_admin", "support_admin", "admin"],
    payload: {
      title: "",
      message: "",
      type: "" as NotificationType,
      link: "",
      target: "user" as NotificationTarget,
      userId: "",
      lga: "",
      roles: [""],
    },
    response: {
      statusCode: 201,
      success: true,
      message: "Notification sent to 1 recipient(s)",
      delivered: 0,
      data: [] as NotificationItem[],
    },
  },

  getNotifications: {
    method: "GET" as const,
    url: "/api/notifications",
    auth: true,
    query: {
      page: 1,
      limit: 20,
      type: "" as NotificationType,
      read: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "",
      data: {
        data: [] as NotificationItem[],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          unreadCount: 0,
        },
      } as NotificationsPaginated,
    },
  },

  getUnreadCount: {
    method: "GET" as const,
    url: "/api/notifications/unread-count",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "",
      data: {
        unreadCount: 0,
      },
    },
  },

  markAllAsRead: {
    method: "PATCH" as const,
    url: "/api/notifications/mark-all-read",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "All notifications marked as read",
      modifiedCount: 0,
    },
  },

  clearAll: {
    method: "DELETE" as const,
    url: "/api/notifications/clear",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "All notifications cleared",
    },
  },

  getNotification: {
    method: "GET" as const,
    url: "/api/notifications/:id",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "",
      data: {} as NotificationItem,
    },
  },

  markAsRead: {
    method: "PATCH" as const,
    url: "/api/notifications/:id/mark-read",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "",
      data: {} as NotificationItem,
    },
  },

  deleteNotification: {
    method: "DELETE" as const,
    url: "/api/notifications/:id",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Notification deleted",
    },
  },
};
