Benue State Citizenship API Documentation - User Authentication
Base URL: https://api.citizenship.benuestate.gov.ng/api/auth

1. User Registration (Signup)
   Creates a new citizen user account.

Endpoint: POST /signup

Content-Type: application/json

Authentication: None

Request Body
{
"email": "user@example.com",
"password": "yourSecurePassword123",
"firstname": "John",
"lastname": "Doe",
"phone": "08012345678",
"NIN": "12345678901",
"stateOfOrigin":"Benue",
"lgaOfOrigin": "Gboko";
}

Error Responses
400 Bad Request: Invalid input data.

500 Internal Server Error: Server-side error.

2. Kindred/Agent Registration (Signup)
   Creates a new kindred or agent account. (Assumed to have different privileges).

Endpoint: POST /signup-kindred

Content-Type: application/json

Authentication: None

Request Body
{
"email": "user@example.com",
"password": "yourSecurePassword123",
"firstname": "John",
"lastname": "Doe",
"phone": "08012345678",
"NIN": "12345678901",
"stateOfOrigin":"Benue",
"lgaOfOrigin": "Gboko";
}
Error Responses
400 Bad Request: Invalid input data.

500 Internal Server Error: Server-side error.

3. User Login
   Authenticates a citizen user and returns an access token.

Endpoint: POST /login

Content-Type: application/json

Authentication: None

Request Body
json
{
"email": "user@example.com",
"password": "yourSecurePassword123"
}

Error Responses
401 Unauthorized: Invalid email or password.

4. Kindred/Agent Login
   Authenticates a kindred/agent and returns an access token.

Endpoint: POST /login-kindred

Content-Type: application/json

Authentication: None

Request Body
json
{
"email": "agent@kindred.com",
"password": "agentPassword123"
}
Error Responses
401 Unauthorized: Invalid email or password.

5. Verify NIN
   Checks the validity of a National Identification Number and returns associated demographic data. Note: This currently uses mock data.

Endpoint: POST /verify

Content-Type: application/json

Authentication: None

Request Body
json
{
"nin": "12345678901"
}
Success Response (200 OK)
json
{
"success": true,
"data": {
"firstname": "Godfrey",
"lastname": "Ejeh",
"stateOfOrigin": "Benue",

}
}
Error Responses
400 Bad Request: NIN not found in the system.

500 Internal Server Error: Server-side error.

6. Forgot Password
   Initiates a password reset process. Sends a reset link to the user's email.

Endpoint: POST /forgot-password

Content-Type: application/json

Authentication: None

Request Body
json
{
"email": "user@example.com"
}
Success Response (200 OK)
json
{
"message": "If this email is registered, a password reset link has been sent."
}

7. Reset Password
   Resets the user's password using a token received via email.

Endpoint: POST /reset-password/:token

Content-Type: application/json

Authentication: None

Request Body
json
{
"password": "newSecurePassword456"
}

Error Responses
400 Bad Request: Invalid or expired token.

500 Internal Server Error: Server-side error.

8. Resend Activation Email
   Resends the account activation email to the user.

Endpoint: POST /resend-activation

Content-Type: application/json

Authentication: None

Request Body
json
{
"email": "user@example.com"
}

9. Activate Account (Email Link)
   This endpoint is not directly consumed by the mobile app. It is a server-side route that handles the click from the activation email and redirects the user's browser to a success or failure page. The mobile app should deep link or handle these redirects appropriately.

Endpoint: GET /activate/:userId/:activationToken

Authentication: None

URL Parameters
Parameter Description
userId The ID of the user to activate.
activationToken The unique activation token.
Response
302 Redirect to either an activation success or failure webpage.

Benue State Citizenship API - User Management
Base URL: https://api.citizenship.benuestate.gov.ng/api/users

1. Get User Profile
   Retrieves the profile data for the authenticated user.

Endpoint: GET /:id

Authentication: Bearer Token (JWT)

Required Role: Any authenticated user can access their own profile.

Path Parameters
Parameter Type Description
id String The user's ID.
Success Response (200 OK)
Returns a comprehensive User object. Key fields include:

json
{
"\_id": "507f1f77bcf86cd799439011",
"firstname": "John",
"lastname": "Doe",
"email": "user@example.com",
"phone": "08012345678",
"NIN": "12345678901",
"DOB": "1990-01-01",
"stateOfOrigin": "Benue",
"lgaOfOrigin": "Gboko",
"passportPhoto": "https://res.cloudinary.com/.../profile.jpg",
"profileCompletionPercentage": 75,
"isProfileCompleted": false,
"role": "user",
"created_at": "2023-08-10T12:00:00.000Z"
// ... other fields from UpdateProfileDto
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

404 Not Found: User with the provided ID was not found.

2. Update User Profile
   Updates the user's profile. This endpoint supports multipart/form-data for uploading a passport photo.

Endpoint: PUT /:id

Content-Type: multipart/form-data

Authentication: Bearer Token (JWT)

Required Role: User can only update their own profile.

Path Parameters
Parameter Type Description
id String The user's ID.
Request Body (Form Data)
This endpoint accepts all fields defined in UpdateProfileDto. Complex fields like educationalHistory and employmentHistory should be sent as JSON strings.

Field Type Description Required
passportPhoto File (Image) User's profile picture. Accepted types: JPEG, PNG, JPG. Max size: 5MB. No
firstname, lastname, etc. String All other standard string fields (e.g., lastname, community, religion, stateOfOrigin). No
educationalHistory String (JSON) A JSON string representing the user's educational background. No
employmentHistory String (JSON) A JSON string representing the user's work history. No
family String (JSON) A JSON string representing the user's family members (for verification). No
neighbor String (JSON) A JSON string representing the user's neighbors (for verification). No
Example JSON for educationalHistory:

json
"{
\"primarySchool\": { \"name\": \"Primary School\", \"address\": \"123 Main St\", \"yearOfAttendance\": \"2000-2006\" },
\"secondarySchool\": { \"name\": \"Secondary School\", \"address\": \"456 High St\", \"yearOfAttendance\": \"2006-2012\" },
\"tertiaryInstitutions\": [{ \"name\": \"University\", \"address\": \"789 College Ave\", \"yearOfAttendance\": \"2012-2016\", \"degree\": \"B.Sc\" }]
}"
Success Response (200 OK)
Returns the complete, updated User object.

json
{
"\_id": "507f1f77bcf86cd799439011",
"firstname": "John",
"lastname": "Doe",
// ... updated fields
"profileCompletionPercentage": 85,
"isProfileCompleted": false
}
Error Responses
400 Bad Request: Invalid file type, file too large, or malformed JSON in a field.

401 Unauthorized: Missing or invalid JWT token.

404 Not Found: User with the provided ID was not found.

500 Internal Server Error: Server error during file upload or profile update.

3. Get User Verification Tokens
   Retrieves verification tokens and links for the user's family and neighbors. This is used to initiate the background verification process.

Endpoint: GET /:id/verification-tokens

Authentication: Bearer Token (JWT)

Required Role: User can only access their own tokens.

Path Parameters
Parameter Type Description
id String The user's ID.
Success Response (200 OK)
json
{
"neighbor": [
{
"id": "64d2a1b2c3e4f5g6h7i8j9k",
"verificationToken": "nbr_abc123token456",
"verificationLink": "https://.../verify-reference/nbr_abc123token456",
"status": "pending" // or "verified", "denied"
}
],
"family": [
{
"id": "64d2a1b2c3e4f5g6h7i8j9l",
"verificationToken": "fam_xyz789token012",
"verificationLink": "https://.../verify-reference/fam_xyz789token012",
"status": "pending"
}
]
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

404 Not Found: User with the provided ID was not found.

4. Initiate Verification Process
   Manually triggers the generation and sending of verification links to all listed family and neighbors. This is often done after profile completion.

Endpoint: POST /:id/initiate-verification

Authentication: Bearer Token (JWT)

Required Role: User can only initiate for their own profile.

Path Parameters
Parameter Type Description
id String The user's ID.
Success Response (200 OK)
Returns a confirmation message.

json
{
"message": "Verification emails/SMS have been sent to your references."
}

5. Get Verification Details (Public)
   Public endpoint. Retrieves the details of a reference for verification using the token sent to them. This is used to pre-fill the verification form for the referee.

Endpoint: GET /verify-reference/:token

Authentication: None (Public)

Path Parameters
Parameter Type Description
token String The verification token from the link.
Success Response (200 OK)
json
{
"applicantName": "John Doe",
"referenceType": "neighbor", // or "family"
"referenceName": "Jane Smith"
}
Error Responses
404 Not Found: Invalid or expired verification token.

6. Submit Verification (Public)
   Public endpoint. Allows a family member or neighbor to submit their verification response for a user.

Endpoint: POST /verify-reference/:token

Content-Type: application/json

Authentication: None (Public)

Path Parameters
Parameter Type Description
token String The verification token from the link.
Request Body
json
{
"knowsApplicant": true,
"knownDuration": "5 years",
"isResident": true,
"comments": "I have known John for many years."
}
Success Response (200 OK)
json
{
"message": "Thank you for your verification.",
"status": "verified"
}
Error Responses
400 Bad Request: Invalid request body.

404 Not Found: Invalid or expired verification token.

7. Get Paginated Users (Admin)
   Retrieves a paginated list of all users. This is an admin-only endpoint.

Endpoint: GET /?page=1&limit=10

Authentication: Bearer Token (JWT)

Required Roles: SUPER_ADMIN, SUPPORT_ADMIN, KINDRED_HEAD

Query Parameters
Parameter Type Description Default
page Integer The page number to retrieve. 1
limit Integer The number of items per page. 10
Success Response (200 OK)
json
{
"users": [
{ /* User object */ },
{ /* User object */ }
],
"currentPage": 1,
"totalPages": 5,
"totalUsers": 42
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required admin role.

8. Update User Role (Super Admin)
   Updates a user's role (e.g., to support_admin). Assigning the support_admin role requires an lgaId.

Endpoint: PATCH /:id/role

Content-Type: application/json

Authentication: Bearer Token (JWT)

Required Role: SUPER_ADMIN

Path Parameters
Parameter Type Description
id String The user's ID to update.
Request Body
json
{
"role": "support_admin",
"lgaId": "64d2c3a1f2e8b9a7c0b1d123"
}
Success Response (200 OK)
Returns the updated User object.

json
{
"\_id": "507f1f77bcf86cd799439011",
"email": "admin@lga.gov.ng",
"role": "support_admin",
"lgaId": {
"\_id": "64d2c3a1f2e8b9a7c0b1d123",
"name": "Gboko",
"headquaters": "Gboko Town"
}
}
Error Responses
400 Bad Request: Missing lgaId for support_admin role or invalid lgaId format.

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User is not a SUPER_ADMIN.

404 Not Found: User with the provided ID was not found.

Benue State Citizenship API - Kindred Management
Base URL: https://api.citizenship.benuestate.gov.ng/api/kindred

1. Get All Kindred Heads (Paginated)
   Retrieves a paginated list of all kindred heads. This is an admin-only endpoint.

Endpoint: GET /?page=1&limit=10

Authentication: Bearer Token (JWT)

Required Role: Any authenticated user.

Query Parameters
Parameter Type Description Default
page Integer The page number to retrieve. 1
limit Integer The number of items per page. 10
Success Response (200 OK)
Returns an array of Kindred objects with pagination metadata.

json
{
"data": [
{
"_id": "64d3a1b2c3e4f5g6h7i8j9k",
"firstname": "Terfa",
"lastname": "Ordue",
"email": "kindred.head@example.com",
"phone": "08012345678",
"NIN": "12345678901",
"kindred": "Mbayion",
"lga": "Gboko",
"stateOfOrigin": "Benue",
"address": "1 Mbayion Street, Gboko",
"role": "kindred_head",
"isVerified": true
}
],
"currentPage": 1,
"totalPages": 5,
"totalItems": 42
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

2. Get Kindred Heads by LGA (Support Admin)
   Retrieves a paginated list of kindred heads filtered by a specific LGA. This endpoint is for Support Admins to manage kindred heads within their assigned LGA.

Endpoint: GET /:userId?page=1&limit=10

Authentication: Bearer Token (JWT)

Required Roles: SUPPORT_ADMIN, SUPER_ADMIN

Path Parameters
Parameter Type Description
userId String This is the LGA ID. The ID of the Local Government Area to filter kindred heads by.
Query Parameters
Parameter Type Description Default
page Integer The page number to retrieve. 1
limit Integer The number of items per page. 10
Success Response (200 OK)
Returns an array of Kindred objects belonging to the specified LGA.

json
{
"data": [
{
"_id": "64d3a1b2c3e4f5g6h7i8j9k",
"firstname": "Terfa",
"lastname": "Ordue",
"kindred": "Mbayion",
"lga": "Gboko",
// ... other fields
}
],
"currentPage": 1,
"totalPages": 3,
"totalItems": 25
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPPORT_ADMIN or SUPER_ADMIN role.

3. Update a Kindred Head
   Updates the information of a specific kindred head. This endpoint is for Support Admins.

Endpoint: PUT /:id

Content-Type: application/json

Authentication: Bearer Token (JWT)

Required Role: SUPPORT_ADMIN

Path Parameters
Parameter Type Description
id String The ID of the kindred head to update.
Request Body
Accepts fields from UpdateKindredDto. All fields are optional.

json
{
"address": "Updated Address, Gboko",
"phone": "08087654321",
"kindred": "Updated Kindred Name",
"middlename": "Iorwase"
}
Success Response (200 OK)
Returns the updated Kindred object.

json
{
"\_id": "64d3a1b2c3e4f5g6h7i8j9k",
"firstname": "Terfa",
"lastname": "Ordue",
"middlename": "Iorwase",
"address": "Updated Address, Gboko",
"phone": "08087654321",
"kindred": "Updated Kindred Name",
// ... other fields
}
Error Responses
400 Bad Request: Invalid data provided in the request body.

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPPORT_ADMIN role.

404 Not Found: Kindred head with the provided ID was not found.

4. Delete a Kindred Head or LGA Assignment
   Deletes a kindred head user or removes an LGA assignment. The specific behavior depends on the backend implementation (deleting a user vs. removing a relationship). This endpoint is for Support Admins.

Endpoint: DELETE /:item

Authentication: Bearer Token (JWT)

Required Role: SUPPORT_ADMIN

Path Parameters
Parameter Type Description
item String The ID of the kindred head user or the ID of a specific kindred-LGA assignment to delete.
Success Response (200 OK)
Returns a confirmation message. The exact structure may vary.

json
{
"message": "Kindred head deleted successfully."
}
OR

json
{
"message": "LGA assignment removed successfully."
}

Error Responses
401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPPORT_ADMIN role.

404 Not Found: The item with the provided ID was not found.

Benue State Citizenship API - LGA Management
Base URL: https://api.citizenship.benuestate.gov.ng/api/lgas

1. Get All LGAs (Paginated)
   Retrieves a paginated list of all Local Government Areas (LGAs). This endpoint requires authentication.

Endpoint: GET /?page=1&limit=10

Authentication: Bearer Token (JWT)

Required Role: Any authenticated user.

Query Parameters
Parameter Type Description Default
page Integer The page number to retrieve. 1
limit Integer The number of items per page. 10
Success Response (200 OK)
Returns an array of LGA objects with pagination metadata.

json
{
"data": [
{
"_id": "64d3a1b2c3e4f5g6h7i8j9k0",
"name": "Gboko",
"headquaters": "Gboko Town",
"createdBy": "64d2c3a1f2e8b9a7c0b1d123",
"createdAt": "2023-08-10T12:00:00.000Z",
"updatedAt": "2023-08-10T12:00:00.000Z"
},
{
"_id": "64d3a1b2c3e4f5g6h7i8j9k1",
"name": "Makurdi",
"headquaters": "Makurdi Town",
"createdBy": "64d2c3a1f2e8b9a7c0b1d123",
"createdAt": "2023-08-10T12:00:00.000Z",
"updatedAt": "2023-08-10T12:00:00.000Z"
}
],
"currentPage": 1,
"totalPages": 5,
"totalItems": 42
}
Error Responses
401 Unauthorized: Missing or invalid JWT token.

2. Create a New LGA (Super Admin)
   Creates a new Local Government Area. This is a super admin-only endpoint.

Endpoint: POST /

Content-Type: application/json

Authentication: Bearer Token (JWT)

Required Role: SUPER_ADMIN

Request Body
Field Type Description Constraints
name String The name of the LGA (e.g., "Gboko"). Required, Length between 2-100.
headquaters String The headquarters of the LGA. Required, Length between 2-20.
Example:

json
{
"name": "Buruku",
"headquaters": "Buruku Town"
}
Success Response (201 Created)
Returns the newly created LGA object.

json
{
"\_id": "64d3a1b2c3e4f5g6h7i8j9k2",
"name": "Buruku",
"headquaters": "Buruku Town",
"createdBy": "64d2c3a1f2e8b9a7c0b1d123", // ID of the Super Admin who created it
"createdAt": "2023-08-10T12:00:00.000Z",
"updatedAt": "2023-08-10T12:00:00.000Z"
}
Error Responses
400 Bad Request: Invalid data provided (e.g., missing fields, name already exists).

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPER_ADMIN role.

3. Update an LGA (Super Admin)
   Updates the information of an existing Local Government Area. This is a super admin-only endpoint.

Endpoint: PATCH /:id

Content-Type: application/json

Authentication: Bearer Token (JWT)

Required Role: SUPER_ADMIN

Path Parameters
Parameter Type Description
id String The ID of the LGA to be updated.
Request Body
Accepts fields from UpdateLgaDto. All fields are optional.

Field Type Description Constraints
name String The updated name of the LGA. Optional, Length between 2-100.
headquaters String The updated headquarters. Optional, Length between 2-20.
Example:

json
{
"headquaters": "New Headquarters Name"
}
Success Response (200 OK)
Returns the updated LGA object.

json
{
"\_id": "64d3a1b2c3e4f5g6h7i8j9k0",
"name": "Gboko",
"headquaters": "New Headquarters Name", // Updated field
"createdBy": "64d2c3a1f2e8b9a7c0b1d123",
"createdAt": "2023-08-10T12:00:00.000Z",
"updatedAt": "2023-08-11T10:30:00.000Z" // Timestamp updated
}
Error Responses
400 Bad Request: Invalid data provided.

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPER_ADMIN role.

404 Not Found: LGA with the provided ID was not found.

4. Delete an LGA (Super Admin)
   Permanently deletes a Local Government Area. This is a super admin-only endpoint.

Endpoint: DELETE /:id

Authentication: Bearer Token (JWT)

Required Role: SUPER_ADMIN

Path Parameters
Parameter Type Description
id String The ID of the LGA to be deleted.
Success Response (200 OK)
Returns a confirmation message.

json
{
"message": "LGA deleted successfully."
}

Error Responses
401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required SUPER_ADMIN role.

404 Not Found: LGA with the provided ID was not found.

409 Conflict: Cannot delete LGA because it is associated with existing users (implementation-dependent)

Benue State Citizenship API - Kindred Management
Base URL: https://api.citizenship.benuestate.gov.ng

1. Get Paginated Kindred List
   Retrieves a paginated list of all kindred records.

Endpoint: GET /api/kindred

Authentication: Required (JWT)

Authorization: Any authenticated user.

Query Parameters:

Parameter Type Required Default Description
page integer No 1 The page number to retrieve.
limit integer No 10 The number of items per page.
Success Response:

Code: 200 OK

Content: An array of Kindred objects.

Example:

json
[
{
"id": "abc123",
"kindred": "Ukwu",
"middlename": "Akaa",
"address": "1 Murtala Mohammed Way, Makurdi",
"phone": 08012345678
},
{
"id": "def456",
"kindred": "Ikyogen",
"middlename": "Igbawua",
"address": "Custom Layout, Gboko",
"phone": 09098765432
}
]
Error Responses:

401 Unauthorized: Missing or invalid JWT token.

500 Internal Server Error: An unexpected server error occurred.

2. Get Kindred Heads for a User
   Retrieves a paginated list of kindred heads associated with a specific user. This endpoint requires an admin role.

Endpoint: GET /api/kindred/:userId

Authentication: Required (JWT)

Authorization: SUPPORT_ADMIN or SUPER_ADMIN roles only.

URL Parameters:

Parameter Type Required Description
userId string Yes The unique identifier of the user.
Query Parameters:

Parameter Type Required Default Description
page integer No 1 The page number to retrieve.
limit integer No 10 The number of items per page.
Success Response:

Code: 200 OK

Content: An array of Kindred objects for the specified user.

Example: (Same structure as Endpoint 1)

Error Responses:

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required admin role.

404 Not Found: User with the provided userId was not found.

500 Internal Server Error: An unexpected server error occurred.

3. Update a Kindred Record
   Updates the details of a specific kindred record. This endpoint requires a support admin role.

Endpoint: PUT /api/kindred/:id

Authentication: Required (JWT)

Authorization: SUPPORT_ADMIN role only.

URL Parameters:

Parameter Type Required Description
id string Yes The unique identifier of the kindred record to update.
Request Body:
The body should be a JSON object containing the fields you wish to update. All fields are optional.

Field Type Constraints Description
address string Optional, Max 255 chars The residential address.
phone integer Optional, Max 11 digits The phone number.
kindred string Optional, Max 255 chars The name of the kindred.
middlename string Optional, Max 255 chars The middle name.
Example:

json
{
"address": "Updated Address, Makurdi",
"phone": 08055556666
}
Success Response:

Code: 200 OK

Content: The updated Kindred object.

Example:

json
{
"id": "abc123",
"kindred": "Ukwu",
"middlename": "Akaa",
"address": "Updated Address, Makurdi",
"phone": 08055556666
}
Error Responses:

400 Bad Request: Invalid data provided in the request body (e.g., string longer than 255 chars).

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required support admin role.

404 Not Found: Kindred record with the provided id was not found.

500 Internal Server Error: An unexpected server error occurred.

4. Delete a Kindred Record
   Deletes a specific kindred record. This endpoint requires a support admin role.

Endpoint: DELETE /api/kindred/:item

Authentication: Required (JWT)

Authorization: SUPPORT_ADMIN role only.

URL Parameters:

Parameter Type Required Description
item string Yes The unique identifier of the kindred record to delete.
Success Response:

Code: 200 OK

Content: A confirmation message.

Example:

json
{
"message": "Kindred record deleted successfully",
"deletedId": "abc123"
}
Error Responses:

401 Unauthorized: Missing or invalid JWT token.

403 Forbidden: User does not have the required support admin role.

404 Not Found: Kindred record with the provided item ID was not found.

500 Internal Server Error: An unexpected server error occurred.

Benue State Citizenship API Documentation: ID Card Management
Base URL: https://api.citizenship.benuestate.gov.ng

Authentication & Headers
Most endpoints require a valid JWT (JSON Web Token) for authentication. The token must be included in the Authorization header of every request.

Header:

text
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json // For requests with a body
Note: Endpoints marked with [PUBLIC] do not require authentication.

1. Create ID Card Request
   Submits a new request for an ID card. This involves uploading two documents.

Endpoint: POST /api/idcard/create

Authentication: Required (JWT)

Authorization: Any authenticated user.

Content-Type: multipart/form-data

Request Body (Form Data):

Field Type Required Description
files File[] Yes An array of exactly 2 files. The first file is the Reference Letter, the second is the Utility Bill.
body JSON Yes A JSON string containing the application data. See below for its structure.
Structure of body JSON:

json
{
"firstname": "string",
"lastname": "string",
"email": "string",
"phone": "integer",
"card_type": "string",
"userId": "string" // ObjectId of the user
// ...other user-related fields
}
Success Response:

Code: 201 Created

Content: The created IdCard object.

Example:

json
{
"status": "Pending",
"resubmissionAllowed": true,
"resubmissionAttempts": 0,
"downloaded": false,
"isValid": true,
"\_id": "507f1f77bcf86cd799439011",
"userId": "userId123",
"firstname": "John",
"lastname": "Doe",
"email": "john.doe@example.com",
"phone": 08012345678,
"card_type": "Standard",
"ref_letter": "https://res.cloudinary.com/.../ref_letter.pdf",
"utilityBill": "https://res.cloudinary.com/.../bill.pdf",
"bin": "BEN123456",
"dateOfIssue": "2023-10-05T12:34:56.789Z",
"dateOfExpiration": "2028-10-05T12:34:56.789Z",
"created_at": "2023-10-05T12:34:56.789Z",
"updated_at": "2023-10-05T12:34:56.789Z",
"\_\_v": 0
}
Error Responses:

400 Bad Request: Missing files or invalid body JSON.

401 Unauthorized: Missing or invalid JWT token.

500 Internal Server Error: File upload failed or an unexpected server error occurred.

3. Get Paginated & Filtered Requests [ADMIN/HEAD]
   Fetches ID card requests filtered by their status.

Endpoint: GET /api/idcard/card-request

Authentication: Required (JWT)

Authorization: SUPER_ADMIN, SUPPORT_ADMIN, or KINDRED_HEAD roles.

Query Parameters:

Parameter Type Required Default Description
page integer No 1 Page number for pagination.
limit integer No 10 Number of items per page.
statuses string No "Pending,Rejected" Comma-separated list of statuses to filter by (e.g., "Pending,Approved").
Success Response:

Code: 200 OK

Content: A paginated response containing an array of IdCard objects.

Example:

json
{
"items": [...],
"meta": {
"totalItems": 50,
"itemCount": 10,
"itemsPerPage": 10,
"totalPages": 5,
"currentPage": 1
}
}
Error Responses:

401 Unauthorized

403 Forbidden

7. Reject a Request [SUPER ADMIN]
   Rejects a pending ID card request and specifies a reason.

Endpoint: PATCH /api/idcard/:id/reject

Authentication: Required (JWT)

Authorization: SUPER_ADMIN role only.

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the ID card request to reject.
Request Body:

json
{
"rejectionReason": "The provided utility bill is not clear."
}
Success Response:

Code: 200 OK

Content: The updated IdCard object with status: "Rejected" and rejectionReason populated.

Error Responses:

400 Bad Request: Missing rejectionReason.

401 Unauthorized, 403 Forbidden, 404 Not Found

8. Get a Specific Request by ID
   Fetches the details of a specific ID card request.

Endpoint: GET /api/idcard/:id/request

Authentication: Required (JWT)

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the ID card request.
Success Response: 200 OK with an IdCard object.

Error Responses:

401 Unauthorized

404 Not Found

9. Download ID Card PDF
   Generates and downloads the ID card as a PDF. Can only be downloaded once.

Endpoint: GET /api/idcard/download/:id

Authentication: Required (JWT)

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the approved ID card request.
Success Response:

Code: 200 OK

Content: A PDF file stream with headers:

text
Content-Type: application/pdf
Content-Disposition: attachment; filename=certificate.pdf
Error Responses:

400 Bad Request: Card has already been downloaded.

401 Unauthorized

404 Not Found: Card not found or not approved.

10. View Uploaded Documents [PUBLIC]
    Streams a specific document (utility bill or reference letter) for a request. Does not require authentication.

Endpoint: GET /api/idcard/:requestId/document/:docType [PUBLIC]

URL Parameters:

Parameter Type Required Description
requestId string Yes The ID of the ID card request.
docType string Yes The type of document. Must be either utilityBill or ref_letter.
Success Response:

Code: 200 OK

Content: The file stream (e.g., PDF, image) with Content-Disposition: inline.

Error Responses:

404 Not Found: Request or document not found.

11. Verify ID Card [PUBLIC]
    Public endpoint to verify an ID card's authenticity using its ID and a secure hash. Intended for QR code scanning.

Endpoint: GET /api/idcard/verify/:id/:hash [PUBLIC]

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the ID card.
hash string Yes The 12-character verification hash.
Success Response:

Code: 200 OK

Content: An HTML page displaying the verification result and card details.

Error Responses:

404 Not Found: Card not found.

400 Bad Request: Hash is invalid.

Data Types (DTO / Schema)
IdCard Object
Field Type Description
\_id string Unique identifier for the request.
userId string ID of the user who made the request.
firstname string User's first name.
lastname string User's last name.
email string User's email.
status string Request status: Pending, Approved, Rejected.
rejectionReason string Reason provided if the request was rejected.
phone integer User's phone number.
card_type string Type of card requested.
ref_letter string Cloudinary URL to the reference letter.
utilityBill string Cloudinary URL to the utility bill.
bin string Unique Benue Identification Number (BIN).
qrCodeUrl string Data URL of the generated QR code.
downloaded boolean Indicates if the PDF has been downloaded.
dateOfIssue ISO Date Date the card was issued.
dateOfExpiration ISO Date Date the card expires.
created_at ISO Date When the request was created.
updated_at ISO Date When the request was last updated.
Important Notes for Mobile Developers:
Multipart Uploads: Use a reliable library (e.g., axios with FormData, or http.MultipartRequest in Dart) for the POST /create endpoint.

Single Download: The download endpoint is designed to be called only once per approved card. The downloaded flag will be set to true afterwards.

QR Code Generation: The QR code on the downloaded PDF contains a URL with the id and hash parameters, which points to the public verification endpoint.

Error Handling: Pay close attention to the 403 Forbidden and 404 Not Found status codes to guide users appropriately (e.g., prompting them to log in again or showing an error message).

Throttling: The public verify endpoint is rate-limited (5 requests per minute per IP) to prevent abuse.

Benue State Citizenship API Documentation: Certificate of Indigene Management
Base URL: https://api.citizenship.benuestate.gov.ng

Authentication & Headers
Most endpoints require a valid JWT (JSON Web Token) for authentication. The token must be included in the Authorization header of every request.

Header:

text
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json // For requests with a body
Note: Endpoints marked with [PUBLIC] do not require authentication

1. Create Certificate Request
   Submits a new request for a Certificate of Indigene. This involves uploading three required documents.

Endpoint: POST /api/indigene/certificate/create

Authentication: Required (JWT)

Authorization: Any authenticated user.

Content-Type: multipart/form-data

Request Body (Form Data):

Field Name Type Required Description Accepted Formats
| passportPhoto | File | Yes | A recent passport photograph. | .jpg, .jpeg, .png |
| idCard | File | Yes | A copy of a valid means of identification. | .pdf |
| birthCertificate | File | Yes | A copy of your birth certificate. | .pdf |
| body | string | Yes | A JSON string containing the application data. | N/A |

text
**Structure of the `body` JSON string:**

```json
{
  "userId": "string (ObjectId)",
  "email": "string",
  "firstname": "string",
  "lastname": "string",
  "middlename": "string",
  "DOB": "ISO Date String",
  "maritalStatus": "string",
  "gender": "string",
  "stateOfOrigin": "string",
  "lgaOfOrigin": "string",
  "ward": "string",
  "address": "string",
  "phone": "integer",
  "kindred": "string",
  "fathersName": "string",
  "fathersStateOfOrigin": "string",
  "mothersName": "string",
  "mothersStateOfOrigin": "string",
  "purpose": "string (Optional)"
}
```

Success Response:

Code: 201 Created

Content: The created Certificate object with a unique refNumber.

Example:

json
{
"status": "Pending",
"resubmissionAllowed": true,
"resubmissionAttempts": 0,
"downloaded": false,
"isValid": true,
"isVerified": false,
"\_id": "507f1f77bcf86cd799439011",
"userId": "userId123",
"firstname": "John",
"lastname": "Doe",
"email": "john.doe@example.com",
"phone": 08012345678,
"refNumber": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"passportPhoto": "https://res.cloudinary.com/.../passport.jpg",
"idCard": "https://res.cloudinary.com/.../idcard.pdf",
"birthCertificate": "https://res.cloudinary.com/.../birthcert.pdf",
"created_at": "2023-10-05T12:34:56.789Z",
"updated_at": "2023-10-05T12:34:56.789Z",
"\_\_v": 0
}
Error Responses:

400 Bad Request: Missing required files, invalid file type, or malformed body JSON.

401 Unauthorized: Missing or invalid JWT token.

500 Internal Server Error: File upload failed or an unexpected server error occurred.

2. Download Certificate PDF
   Generates and downloads the Certificate of Indigene as a PDF. Can only be downloaded once per approved request.

Endpoint: GET /api/indigene/certificate/download/:id

Authentication: Required (JWT)

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the approved certificate request.
Success Response:

Code: 200 OK

Content: A PDF file stream with headers:

text
Content-Type: application/pdf
Content-Disposition: attachment; filename=certificate.pdf
Error Responses:

400 Bad Request: Certificate has already been downloaded.

401 Unauthorized

404 Not Found: Certificate not found or not approved.

3. Get All Certificate Requests [SUPER ADMIN]
   Fetches all certificate requests. Super Admin only.

Endpoint: GET /api/indigene/certificate/get-all-request

Authentication: Required (JWT)

Authorization: SUPER_ADMIN role only.

Success Response:

Code: 200 OK

Content: An array of all Certificate objects.

4. Approve a Request [SUPER ADMIN/HEAD]
   Approves a pending certificate request.

Endpoint: PATCH /api/indigene/certificate/:id/approve

Authentication: Required (JWT)

Authorization: SUPER_ADMIN or KINDRED_HEAD roles only.

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the certificate request to approve.
Success Response:

Code: 200 OK

Content: The updated Certificate object with status: "Approved".

5. Verify a Request [SUPER ADMIN/HEAD]
   Marks a request as verified. Distinct from the public verification endpoint.

Endpoint: PATCH /api/indigene/certificate/:id/verify

Authentication: Required (JWT)

Authorization: SUPER_ADMIN or KINDRED_HEAD roles only.

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the certificate request to verify.
Success Response:

Code: 200 OK

Content: The updated Certificate object with isVerified: true.

6. Reject a Request [SUPER ADMIN]
   Rejects a pending certificate request and specifies a reason.

Endpoint: PATCH /api/indigene/certificate/:id/reject

Authentication: Required (JWT)

Authorization: SUPER_ADMIN role only.

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the certificate request to reject.
Request Body:

json
{
"rejectionReason": "The provided birth certificate is not clear."
}
Success Response:

Code: 200 OK

Content: The updated Certificate object with status: "Rejected".

7. Get Paginated & Filtered Requests [ADMIN/HEAD]
   Fetches certificate requests, optionally filtered by their status.

Endpoint: GET /api/indigene/certificate/request

Authentication: Required (JWT)

Authorization: SUPER_ADMIN, SUPPORT_ADMIN, or KINDRED_HEAD roles.

Query Parameters:

Parameter Type Required Default Description
page integer No 1 Page number for pagination.
limit integer No 10 Number of items per page.
statuses string No "Pending,Rejected" Comma-separated list of statuses to filter by.
Success Response:

Code: 200 OK

Content: A paginated list of Certificate objects.

8. View Uploaded Documents [PUBLIC]
   Streams a specific document (ID card or birth certificate) for a request. Does not require authentication.

Endpoint: GET /api/indigene/certificate/:requestId/document/:docType [PUBLIC]

URL Parameters:

Parameter Type Required Description
requestId string Yes The ID of the certificate request.
docType string Yes The type of document. Must be either idCard or birthCertificate.
Success Response:

Code: 200 OK

Content: The file stream (PDF) with Content-Disposition: inline.

9. Verify Certificate [PUBLIC]
   Public endpoint to verify a certificate's authenticity using its ID and a secure hash. Intended for QR code scanning.

Endpoint: GET /api/indigene/certificate/verify/:id/:hash [PUBLIC]

URL Parameters:

Parameter Type Required Description
id string Yes The ID of the certificate.
hash string Yes The 12-character verification hash.
Success Response:

Code: 200 OK

Content: An HTML page displaying the verification result and certificate details.

Error Responses:

404 Not Found: Certificate not found.

400 Bad Request: Hash is invalid.

Other Key Endpoints (Summarized)
Endpoint Method Auth Role Description
/api/indigene/certificate/latest GET Yes Any Gets the user's most recent certificate request.
/api/indigene/certificate/:id GET Yes Any Gets a specific certificate by ID.
/api/indigene/certificate/:id/resubmit POST Yes Any Resubmits a rejected request with updated data.
/api/indigene/certificate/approval GET Yes SUPPORT_ADMIN, SUPER_ADMIN Gets a paginated list of approved certificates.
Data Types (Schema)
Certificate Object
Field Type Description
\_id string Unique identifier for the request.
userId string ID of the user who made the request.
status string Pending, Approved, or Rejected.
rejectionReason string Reason for rejection, if applicable.
refNumber string Unique reference number for the application.
email, firstname, lastname, etc. string Applicant's personal information.
passportPhoto string URL to the uploaded passport photo.
idCard string URL to the uploaded ID card document.
birthCertificate string URL to the uploaded birth certificate.
downloaded boolean Indicates if the PDF has been downloaded.
isVerified boolean Indicates if an admin has verified the request.
verificationHash string Hash used for public QR code verification.
created_at ISO Date When the request was created.
Important Notes for Mobile Developers:
Complex File Upload: The POST /create endpoint is complex. Use a library that robustly handles multipart/form-data and allows you to attach both files and a JSON string in a single field (body).

Single Download: The download endpoint can only be used once. After that, the downloaded flag is set to true.

QR Code Verification: The QR code on the downloaded PDF contains a URL with the id and hash parameters, which points to the public verification endpoint.

Admin Flows: Implement role checks in your mobile app UI to conditionally show/hide admin functionality (Approve, Reject, Get All Requests) based on the user's role retrieved from their JWT token.
