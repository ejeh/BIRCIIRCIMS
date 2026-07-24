export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export const indigeneCertificateApi = {
  createCertificate: {
    method: "POST",
    url: "/api/indigene/certificate/create",
    auth: true,
    payload: {
      firstname: "",
      lastname: "",
      middlename: "",
      gender: "" as Gender,
      lgaOfOrigin: "",
      ward: "",
      phone: "",
      kindred: "",
      village: "",
    },
    response: {
      statusCode: 201,
      success: true,
      message: "Certificate created successfully",
      data: {
        _id: "",
        userId: "",
        firstname: "",
        lastname: "",
        middlename: "",
        gender: "",
        ward: "",
        phone: "",
        kindred: "",
        village: "",
        status: "Pending",
        lgaOfOrigin: "",
        refNumber: "",
        certificateNumber: 0,
        isValid: true,
        isVerified: false,
        downloaded: false,
        downloadCount: 0,
        resubmissionAllowed: true,
        resubmissionAttempts: 0,
        qrCodeUrl: null as string | null,
        rejectionReason: null as string | null,
        approvalDate: null as string | null,
        approvedBy: null as string | null,
        paymentStatus: "pending",
        reprintCount: 0,
        reprintPaymentStatus: "NotRequired",
        requiresReprintPayment: false,
        created_at: "",
        updated_at: "",
      },
    },
  },

  updateCertificate: {
    method: "PATCH",
    url: "/api/indigene/certificate/:id",
    auth: true,
    pathParams: { id: "" },
    payload: {
      firstname: "",
      lastname: "",
      middlename: "",
      gender: "" as Gender,
      lgaOfOrigin: "",
      ward: "",
      phone: "",
      kindred: "",
      village: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate updated successfully",
      data: {
        _id: "",
        userId: "",
        firstname: "",
        lastname: "",
        middlename: "",
        gender: "",
        ward: "",
        phone: "",
        kindred: "",
        village: "",
        status: "Pending",
        lgaOfOrigin: "",
        refNumber: "",
        certificateNumber: 0,
        updated_at: "",
      },
    },
  },

  downloadCertificate: {
    method: "GET",
    url: "/api/indigene/certificate/download/:id",
    auth: false,
    pathParams: { id: "" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "PDF file stream",
    },
  },

  downloadCertificateAlternate: {
    method: "GET",
    url: "/api/indigene/certificate/download/certificate/:id",
    auth: false,
    pathParams: { id: "" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "PDF file stream",
    },
  },

  getCertificateDetails: {
    method: "GET",
    url: "/api/indigene/certificate/certificate/:id",
    auth: false,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate details retrieved",
      data: {
        id: "",
        name: "",
        lga: "",
        state: "",
        kindred: "",
      },
    },
  },

  viewCertificate: {
    method: "GET",
    url: "/api/indigene/certificate/view/:id",
    auth: false,
    pathParams: { id: "" },
    responseType: "text" as const,
    response: {
      statusCode: 200,
      message: "HTML certificate view page",
    },
  },

  getAllRequests: {
    method: "GET",
    url: "/api/indigene/certificate/get-all-request",
    auth: true,
    roles: ["global_admin", "admin"],
    response: {
      statusCode: 200,
      success: true,
      message: "All certificate requests retrieved",
      data: [
        {
          _id: "",
          userId: {
            _id: "",
            firstname: "",
            lastname: "",
            email: "",
            stateOfOrigin: "",
            lgaOfOrigin: "",
            isProfileCompleted: false,
          },
          firstname: "",
          lastname: "",
          middlename: "",
          gender: "",
          ward: "",
          phone: "",
          kindred: "",
          village: "",
          status: "Pending",
          lgaOfOrigin: "",
          refNumber: "",
          certificateNumber: 0,
          approvedBy: {
            _id: "",
            firstname: "",
            lastname: "",
            email: "",
          },
          created_at: "",
          updated_at: "",
        },
      ],
    },
  },

  approveCertificate: {
    method: "PATCH",
    url: "/api/indigene/certificate/:id/approve",
    auth: true,
    roles: ["support_admin", "global_admin", "admin"],
    pathParams: { id: "" },
    payload: {
      approvedBy: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate approved",
      data: {
        _id: "",
        status: "Approved",
        approvalDate: "",
        approvedBy: "",
      },
    },
  },

  rejectCertificate: {
    method: "PATCH",
    url: "/api/indigene/certificate/:id/reject",
    auth: true,
    roles: ["support_admin", "global_admin", "admin"],
    pathParams: { id: "" },
    payload: {
      rejectionReason: "",
      approvedBy: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate rejected",
      data: {
        _id: "",
        status: "Rejected",
        rejectionReason: "",
        approvedBy: "",
      },
    },
  },

  resubmitRequest: {
    method: "POST",
    url: "/api/indigene/certificate/:id/resubmit",
    auth: true,
    pathParams: { id: "" },
    payload: {
      firstname: "",
      lastname: "",
      middlename: "",
      gender: "" as Gender,
      lgaOfOrigin: "",
      ward: "",
      phone: "",
      kindred: "",
      village: "",
    },
    response: {
      statusCode: 201,
      success: true,
      message: "Certificate resubmitted",
      data: {
        _id: "",
        status: "Pending",
        resubmissionAttempts: 1,
        lastResubmittedAt: "",
      },
    },
  },

  getPaginatedCertificates: {
    method: "GET",
    url: "/api/indigene/certificate/",
    auth: true,
    query: {
      page: 1,
      limit: 10,
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificates retrieved",
      data: {
        data: [
          {
            _id: "",
            userId: "",
            firstname: "",
            lastname: "",
            middlename: "",
            gender: "",
            ward: "",
            phone: "",
            kindred: "",
            village: "",
            status: "Pending",
            lgaOfOrigin: "",
            refNumber: "",
            certificateNumber: 0,
            created_at: "",
            updated_at: "",
          },
        ],
        hasNextPage: false,
      },
    },
  },

  getCertificatesByLga: {
    method: "GET",
    url: "/api/indigene/certificate/by-lga",
    auth: true,
    query: {
      lga: "",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificates by LGA retrieved",
      data: [
        {
          _id: "",
          userId: "",
          firstname: "",
          lastname: "",
          lgaOfOrigin: "",
          status: "Approved",
          created_at: "",
        },
      ],
    },
  },

  getLatestCertificate: {
    method: "GET",
    url: "/api/indigene/certificate/latest",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Latest certificate retrieved",
      data: {
        _id: "",
        userId: "",
        firstname: "",
        lastname: "",
        status: "Pending",
        created_at: "",
      },
    },
  },

  getLatestApprovedCertificate: {
    method: "GET",
    url: "/api/indigene/certificate/latest-approved",
    auth: true,
    response: {
      statusCode: 200,
      success: true,
      message: "Latest approved certificate retrieved",
      data: {
        _id: "",
        userId: "",
        firstname: "",
        lastname: "",
        status: "Approved",
        approvalDate: "",
        created_at: "",
      },
    },
  },

  getApprovedCert: {
    method: "GET",
    url: "/api/indigene/certificate/approval",
    auth: true,
    roles: ["support_admin"],
    query: {
      page: 1,
      limit: 10,
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Approved certificates retrieved",
      data: {
        data: [
          {
            _id: "",
            userId: "",
            firstname: "",
            lastname: "",
            status: "Approved",
            approvalDate: "",
            created_at: "",
          },
        ],
        hasNextPage: false,
      },
    },
  },

  getRequestsByStatuses: {
    method: "GET",
    url: "/api/indigene/certificate/request",
    auth: true,
    roles: ["support_admin", "global_admin", "admin"],
    query: {
      page: 1,
      limit: 10,
      statuses: "Pending,Rejected",
    },
    response: {
      statusCode: 200,
      success: true,
      message: "Requests by statuses retrieved",
      data: {
        data: [
          {
            _id: "",
            userId: "",
            firstname: "",
            lastname: "",
            status: "Pending",
            created_at: "",
          },
        ],
        hasNextPage: false,
      },
    },
  },

  getCertById: {
    method: "GET",
    url: "/api/indigene/certificate/:id/get",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved",
      data: {
        _id: "",
        userId: {
          _id: "",
          firstname: "",
          lastname: "",
          email: "",
        },
        firstname: "",
        lastname: "",
        status: "Pending",
        created_at: "",
      },
    },
  },

  getCertByUserId: {
    method: "GET",
    url: "/api/indigene/certificate/:id",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved",
      data: {
        _id: "",
        userId: {
          _id: "",
          firstname: "",
          lastname: "",
        },
        firstname: "",
        lastname: "",
        status: "Pending",
        created_at: "",
      },
    },
  },

  getRequestsByUserId: {
    method: "GET",
    url: "/api/indigene/certificate/:id/requests",
    auth: true,
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "User requests retrieved",
      data: [
        {
          _id: "",
          userId: "",
          firstname: "",
          lastname: "",
          status: "Pending",
          created_at: "",
        },
      ],
    },
  },

  getUserRequestAdmin: {
    method: "GET",
    url: "/api/indigene/certificate/:id/request",
    auth: true,
    roles: ["support_admin", "global_admin", "admin"],
    pathParams: { id: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate request retrieved",
      data: {
        _id: "",
        userId: {
          _id: "",
          firstname: "",
          lastname: "",
          email: "",
        },
        firstname: "",
        lastname: "",
        status: "Pending",
        created_at: "",
      },
    },
  },

  deleteCertificate: {
    method: "DELETE",
    url: "/api/indigene/certificate/:item",
    auth: true,
    pathParams: { item: "" },
    response: {
      statusCode: 200,
      success: true,
      message: "Certificate deleted",
      data: {
        deleted: true,
      },
    },
  },

  streamPdfFromUrl: {
    method: "GET",
    url: "/api/indigene/certificate/pdf/:encodedUrl",
    auth: false,
    pathParams: { encodedUrl: "" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "PDF stream",
    },
  },

  streamDocument: {
    method: "GET",
    url: "/api/indigene/certificate/:requestId/document/:docType",
    auth: false,
    pathParams: { requestId: "", docType: "idCard" as "idCard" | "birthCertificate" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "Document stream",
    },
  },

  verifyCertificate: {
    method: "GET",
    url: "/api/indigene/certificate/verify/:id/:hash",
    auth: false,
    throttle: { limit: 5, ttl: 60000 },
    pathParams: { id: "", hash: "" },
    responseType: "text" as const,
    response: {
      statusCode: 200,
      message: "HTML verification page",
    },
  },

  requestReprint: {
    method: "POST",
    url: "/api/indigene/certificate/:id/request-reprint",
    auth: true,
    throttle: { limit: 3, ttl: 60000 },
    pathParams: { id: "" },
    payload: {
      documentId: "",
      userId: "",
      amount: 0,
      email: "",
      documentAmount: 0,
      documentType: "certificate" as const,
    },
    response: {
      statusCode: 201,
      success: true,
      message: "Reprint request initiated",
      data: {
        success: true,
        message: "Reprint request initiated",
        data: {
          paymentReference: "",
          amount: 0,
          skipCredo: false,
        },
      },
    },
  },

  downloadReprint: {
    method: "GET",
    url: "/api/indigene/certificate/reprint/download/:id",
    auth: true,
    throttle: { limit: 5, ttl: 60000 },
    pathParams: { id: "" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "Reprint PDF buffer",
    },
  },

  streamCertificateInline: {
    method: "GET",
    url: "/api/indigene/certificate/stream/:id",
    auth: false,
    pathParams: { id: "" },
    responseType: "blob" as const,
    response: {
      statusCode: 200,
      message: "PDF stream (inline)",
    },
  },
};
