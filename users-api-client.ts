export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export enum UserRole {
  GLOBAL_ADMIN = "global_admin",
  SUPPORT_ADMIN = "support_admin",
  USER = "user",
  ADMIN = "admin",
}

export enum Permission {
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  ROLE_CREATE = "role:create",
  ROLE_READ = "role:read",
  ROLE_UPDATE = "role:update",
  ROLE_DELETE = "role:delete",
  ROLE_ASSIGN = "role:assign",
  KINDRED_CREATE = "kindred:create",
  KINDRED_READ = "kindred:read",
  KINDRED_UPDATE = "kindred:update",
  KINDRED_DELETE = "kindred:delete",
  SYSTEM_CONFIG = "system:config",
  SYSTEM_LOGS = "system:logs",
  REPORTS_VIEW = "reports:view",
  REPORTS_GENERATE = "reports:generate",
  SUPPORT_TICKETS = "support:tickets",
  SUPPORT_RESPONSE = "support:response",
}

export const usersApi = {
  updateUserProfile: {
    method: "PUT",
    url: "/api/users/:id",
    auth: true,
    multipart: true,
    pathParams: { id: "" },
    payload: {
      passportPhoto: "<File>",
      firstname: "",
      lastname: "",
      middlename: "",
      email: "",
      phone: 0,
      DOB: "",
      gender: "" as Gender,
      community: "",
      religion: "",
      maritalStatus: "",
      house_number: "",
      street_name: "",
      nearest_bus_stop_landmark: "",
      city_town: "",
      countryOfResidence: "",
      address: "",
      nationality: "",
      lgaOfOrigin: "",
      stateOfOrigin: "",
      stateOfResidence: "",
      lgaOfResidence: "",
      identification: "",
      id_number: "",
      issue_date: "",
      expiry_date: "",
      nextOfKin: "",
      employmentHistory: "",
      business: "",
      neighbor: "",
      educationalHistory: "",
      healthInfo: "",
      family: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: "",
        email: "",
        firstname: "",
        lastname: "",
        middlename: "",
        phone: 0,
        NIN: "",
        role: "" as UserRole,
        isActive: true,
        isProfileCompleted: false,
        profileCompletionPercentage: 0,
        created_at: "",
        updated_at: "",
      },
    },
  },

  getVerificationHistory: {
    method: "GET",
    url: "/api/users/:id/verification-history/:refId",
    auth: true,
    pathParams: { id: "", refId: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Verification history retrieved successfully.",
      data: [
        {
          date: "",
          status: "",
          comments: "",
          deviceInfo: "",
          verifiedBy: "",
        },
      ],
    },
  },

  getVerificationTokens: {
    method: "GET",
    url: "/api/users/:id/verification-tokens",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Verification tokens retrieved",
      data: {
        neighbor: [
          {
            id: "",
            verificationToken: "",
            verificationLink: "",
            status: "",
          },
        ],
        family: [
          {
            id: "",
            verificationToken: "",
            verificationLink: "",
            status: "",
          },
        ],
      },
    },
  },

  getVerificationDetails: {
    method: "GET",
    url: "/api/users/verify-reference/:token",
    auth: false,
    pathParams: { token: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Verification details retrieved",
      data: {
        applicant: {
          firstname: "",
          lastname: "",
          email: "",
        },
        referenceType: "",
        referenceName: "",
      },
    },
  },

  verifyReference: {
    method: "POST",
    url: "/api/users/verify-reference/:token",
    auth: false,
    pathParams: { token: "" },
    payload: {
      knowsApplicant: true,
      knownDuration: "",
      isResident: true,
      comments: "",
    },
    response: {
      statusCode: 201,
      success: true,
      message: "Reference verified successfully",
      data: {
        success: true,
        referenceType: "",
        reference: {},
        applicant: {},
      },
    },
  },

  initiateVerification: {
    method: "POST",
    url: "/api/users/:id/initiate-verification",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 201,
      success: true,
      message: "Verification initiated",
      data: {
        _id: "",
        email: "",
        firstname: "",
        lastname: "",
        isVerified: false,
      },
    },
  },

  changeUserRole: {
    method: "PATCH",
    url: "/api/users/:id/role",
    auth: true,
    roles: ["global_admin"],
    pathParams: { id: "" },
    payload: {
      role: "" as UserRole,
      reason: "",
      lga: "",
      approvedBy: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "User role updated successfully",
      data: {
        _id: "",
        role: "" as UserRole,
        roleHistory: [],
      },
    },
  },

  getRoleHistory: {
    method: "GET",
    url: "/api/users/:id/role-history",
    auth: true,
    permissions: ["role:read"],
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Role history retrieved",
      data: [
        {
          _id: "",
          userId: "",
          previousRole: "",
          newRole: "",
          assignedBy: {
            _id: "",
            firstname: "",
            lastname: "",
            email: "",
          },
          reason: "",
          createdAt: "",
          updatedAt: "",
        },
      ],
    },
  },

  getRoles: {
    method: "GET",
    url: "/api/users/roles",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Roles retrieved",
      data: {
        status: "success",
        data: [
          { value: "support_admin", label: "Support Admin" },
          { value: "user", label: "User" },
          { value: "admin", label: "Admin" },
        ],
      },
    },
  },

  updateUser: {
    method: "PUT",
    url: "/api/users/:id/user-details",
    auth: true,
    roles: ["global_admin", "admin"],
    pathParams: { id: "" },
    payload: {
      firstname: "",
      lastname: "",
      email: "",
      phoneNumber: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "User updated successfully",
      data: {
        _id: "",
        firstname: "",
        lastname: "",
        email: "",
      },
    },
  },

  toggleUserStatus: {
    method: "PATCH",
    url: "/api/users/:id/toggle-status",
    auth: true,
    roles: ["global_admin"],
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "User successfully activated",
      data: {
        _id: "",
        isActive: true,
      },
    },
  },

  getRoleStats: {
    method: "GET",
    url: "/api/users/role-stats",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Role statistics retrieved",
      data: {
        global_admin: { count: 0, permissions: "Full system access" },
        super_admin: {
          count: 0,
          permissions: "Manage admins and system settings",
        },
        support_admin: {
          count: 0,
          permissions: "Manage requests, moderate users",
        },
        kindred_head: {
          count: 0,
          permissions: "LGA/Kindred certificate requests",
        },
        user: { count: 0, permissions: "Submit requests only" },
      },
    },
  },

  getAnalyticsStats: {
    method: "GET",
    url: "/api/users/analytics-stats",
    auth: true,
    roles: ["global_admin", "admin"],
    response: {
      statusCode: 200,
      success: true,
      message: "Analytics retrieved",
      data: {
        monthlyUserGrowth: { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 },
        monthlyRequestVolume: { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 },
        averageProcessingTime: { "Identity Card": 0, Certificate: 0, "Auctioneer Lincence": 0, Verification: 0, Approval: 0 },
        requestTypeDistribution: { "Identity Card": 0, "Certificate of Origin": 0, "Auctioneers Licence": 0, Verification: 0, Renewal: 0 },
      },
    },
  },

  getStats: {
    method: "GET",
    url: "/api/users/stats",
    auth: true,
    roles: ["global_admin", "admin"],
    response: {
      statusCode: 200,
      success: true,
      message: "Member statistics retrieved",
      data: {
        total: 0,
        ageDistribution: { "0-9": 0, "10-19": 0, "20-29": 0, "30-39": 0 },
        genderDistribution: { male: 0, female: 0 },
        stateDistribution: { Benue: 0 },
      },
    },
  },

  getDashboardStats: {
    method: "GET",
    url: "/api/users/dashboard-stats",
    auth: true,
    roles: ["global_admin", "admin"],
    query: {
      startDate: "",
      endDate: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Dashboard statistics retrieved",
      data: {
        totals: { certificates: 0, idcards: 0, auctioneers: 0, transactions: 0 },
        totalUsers: 0,
        activeUsers: 0,
        registrationTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        payments: { total: 0, success: 0, failed: 0, pending: 0, totalAmount: 0 },
        requestStatus: { Approved: 0, Pending: 0, Rejected: 0 },
        topLGAs: [{ name: "", count: 0 }],
        recentActivities: [
          { name: "", type: "", status: "", createdAt: "" },
        ],
      },
    },
  },

  exportDashboardPdf: {
    method: "GET",
    url: "/api/users/dashboard/export/pdf",
    auth: true,
    query: {
      startDate: "",
      endDate: "",
    },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "PDF report exported",
    },
  },

  getCurrentUser: {
    method: "GET",
    url: "/api/users/me",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Current user retrieved",
      data: {
        _id: "",
        email: "",
        firstname: "",
        lastname: "",
        middlename: "",
        phone: 0,
        NIN: "",
        role: "" as UserRole,
        isActive: true,
        isProfileCompleted: false,
        stateOfOrigin: "",
        lgaOfOrigin: "",
        created_at: "",
      },
    },
  },

  getUsersByLga: {
    method: "GET",
    url: "/api/users/by-lga",
    auth: true,
    roles: ["support_admin"],
    query: {
      lga: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Users retrieved by LGA",
      data: [
        {
          _id: "",
          email: "",
          firstname: "",
          lastname: "",
          phone: 0,
          role: "" as UserRole,
          lgaOfOrigin: "",
          created_at: "",
        },
      ],
    },
  },

  getTrends: {
    method: "GET",
    url: "/api/users/trends",
    auth: true,
    query: {
      lga: "",
      startDate: "",
      endDate: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Trends retrieved",
      data: {
        monthly: { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 },
        daily: {},
        hourly: {},
      },
    },
  },

  getDemographics: {
    method: "GET",
    url: "/api/users/demographics",
    auth: true,
    query: {
      lga: "",
      startDate: "",
      endDate: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Demographics retrieved",
      data: {
        genderDistribution: { labels: ["Male", "Female"], values: [0, 0] },
        ageDistribution: { labels: ["Under 18", "18-25", "26-35", "36-50", "51+"], values: [0, 0, 0, 0, 0] },
        combinedGroups: { labels: ["Male 18-35", "Female 18-35", "Male 36+", "Female 36+"], values: [0, 0, 0, 0] },
        hasData: false,
      },
    },
  },

  getKindredActivity: {
    method: "GET",
    url: "/api/users/kindred-activity",
    auth: true,
    query: {
      lga: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Kindred activity retrieved",
      data: {
        activity: {},
      },
    },
  },

  getRecentActivities: {
    method: "GET",
    url: "/api/users/recent-activities",
    auth: true,
    query: {
      lga: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Recent activities retrieved",
      data: [
        {
          time: "",
          content: "",
        },
      ],
    },
  },

  getLgaTrends: {
    method: "GET",
    url: "/api/users/lga-trends",
    auth: true,
    query: {
      startDate: "",
      endDate: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "LGA trends retrieved",
      data: {},
    },
  },

  initializeDashboard: {
    method: "GET",
    url: "/api/users/initialize",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Dashboard initialized",
      data: {
        analytics: {},
        activity: [],
        summary: {},
      },
    },
  },

  refreshAnalytics: {
    method: "GET",
    url: "/api/users/refresh-analytics",
    auth: true,
    query: {
      lga: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Full analytics data retrieved",
      data: {
        demographics: {
          genderDistribution: { labels: [], values: [] },
          ageDistribution: { labels: [], values: [] },
          combinedGroups: { labels: [], values: [] },
        },
        trends: {},
        transactions: {},
        lgaTrends: {},
      },
    },
  },

  getUserProfile: {
    method: "GET",
    url: "/api/users/:id",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "User profile retrieved",
      data: {
        user: {
          _id: "",
          email: "",
          firstname: "",
          lastname: "",
          middlename: "",
          phone: 0,
          NIN: "",
          role: "" as UserRole,
          isActive: true,
          isProfileCompleted: false,
          stateOfOrigin: "",
          lgaOfOrigin: "",
          created_at: "",
        },
      },
    },
  },

  getPaginatedUsers: {
    method: "GET",
    url: "/api/users/",
    auth: true,
    roles: ["global_admin", "admin"],
    response: {
      statusCode: 200,
      success: true,
      message: "Users retrieved",
      data: {
        data: [
          {
            _id: "",
            email: "",
            firstname: "",
            lastname: "",
            phone: 0,
            role: "" as UserRole,
            isActive: true,
            created_at: "",
          },
        ],
      },
    },
  },
};
