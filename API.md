# LifeLink API Documentation

This document describes the REST API endpoints and Socket.io events available in LifeLink v1.

---

## Authentication Endpoints

All auth routes are prefixed with `/api/v1/auth`.

### 1. Register User
* **URL:** `/register`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "email": "user@lifelink.org",
    "password": "Password123!",
    "role": "donor" 
  }
  ```
  *(Valid roles: `donor`, `recipient`, `admin`)*
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d04b32cef735d3c478de2a",
      "email": "user@lifelink.org",
      "role": "donor"
    }
  }
  ```

### 2. Login
* **URL:** `/login`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "email": "user@lifelink.org",
    "password": "Password123!"
  }
  ```
* **Response (200 OK):**
  Sets HTTP-only signed cookies: `access_token` (15m expiry) and `refresh_token` (7d expiry).
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "60d04b32cef735d3c478de2a",
        "email": "user@lifelink.org",
        "role": "donor"
      }
    }
  }
  ```

### 3. Get Current User Session
* **URL:** `/me`
* **Method:** `GET`
* **Headers:** Requires valid `access_token` cookie.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "60d04b32cef735d3c478de2a",
        "email": "user@lifelink.org",
        "role": "donor"
      }
    }
  }
  ```

### 4. Refresh Token
* **URL:** `/refresh`
* **Method:** `POST`
* **Headers:** Requires valid `refresh_token` cookie.
* **Response (200 OK):**
  Rotates cookies and issues a new access token.
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully"
  }
  ```

### 5. Logout
* **URL:** `/logout`
* **Method:** `POST`
* **Response (200 OK):**
  Clears session cookies and revokes the active refresh token.
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## Profile Endpoints

### 1. Create or Update Donor Profile
* **URL:** `/api/v1/donors/profile`
* **Method:** `POST`
* **Headers:** Requires valid `access_token` cookie. User role must be `donor`.
* **Request Body:**
  ```json
  {
    "organType": "Kidney",
    "bloodGroup": "O-",
    "availability": true,
    "weight": 70,
    "latitude": 28.6139,
    "longitude": 77.2090
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d04b68cef735d3c478de3b",
      "userId": "60d04b32cef735d3c478de2a",
      "organType": "Kidney",
      "bloodGroup": "O-",
      "availability": true,
      "location": {
        "type": "Point",
        "coordinates": [77.2090, 28.6139]
      },
      "weight": 70
    }
  }
  ```

### 2. Retrieve Donor Profile
* **URL:** `/api/v1/donors/profile`
* **Method:** `GET`
* **Headers:** Requires valid `access_token` cookie.
* **Response (200 OK):**
  Returns the active logged-in donor's profile.

### 3. Create or Update Recipient Profile
* **URL:** `/api/v1/recipients/profile`
* **Method:** `POST`
* **Headers:** Requires valid `access_token` cookie. User role must be `recipient`.
* **Request Body:**
  ```json
  {
    "organNeeded": "Kidney",
    "bloodGroup": "O+",
    "urgencyLevel": "HIGH",
    "weight": 65,
    "latitude": 28.6139,
    "longitude": 77.2090
  }
  ```
  *(Valid urgency levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)*
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d04b89cef735d3c478de4f",
      "userId": "60d04b4fcef735d3c478de30",
      "organNeeded": "Kidney",
      "bloodGroup": "O+",
      "urgencyLevel": "HIGH",
      "registrationDate": "2026-08-05T07:00:00.000Z",
      "location": {
        "type": "Point",
        "coordinates": [77.2090, 28.6139]
      },
      "weight": 65
    }
  }
  ```

### 4. Retrieve Recipient Profile
* **URL:** `/api/v1/recipients/profile`
* **Method:** `GET`
* **Headers:** Requires valid `access_token` cookie.
* **Response (200 OK):**
  Returns the active logged-in recipient's profile.

---

## Match Endpoints

All routes are prefixed with `/api/v1/matches`.

### 1. Get Logged-In User Matches
* **URL:** `/`
* **Method:** `GET`
* **Headers:** Requires valid `access_token` cookie.
* **Response (200 OK):**
  Returns matching records sorted descending by score. If role is `donor`, matches list recipients. If role is `recipient`, matches list donors.
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d04bc0cef735d3c478de61",
        "donorId": "60d04b68cef735d3c478de3b",
        "recipientId": {
          "_id": "60d04b89cef735d3c478de4f",
          "userId": {
            "email": "recipient@lifelink.org"
          },
          "organNeeded": "Kidney",
          "bloodGroup": "O+",
          "urgencyLevel": "HIGH"
        },
        "score": 80,
        "status": "PENDING"
      }
    ]
  }
  ```

### 2. Admin: Retrieve All System Matches
* **URL:** `/admin`
* **Method:** `GET`
* **Headers:** Requires valid `access_token` cookie. User role must be `admin`.
* **Query Parameters:** `page` (default: 1), `limit` (default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "matches": [ ... ],
      "total": 12,
      "page": 1,
      "pages": 2
    }
  }
  ```

### 3. Admin: Complete or Update Match Status
* **URL:** `/admin/:matchId`
* **Method:** `PATCH`
* **Headers:** Requires valid `access_token` cookie. User role must be `admin`.
* **Request Body:**
  ```json
  {
    "status": "COMPLETED"
  }
  ```
  *(Valid statuses: `ACCEPTED`, `DECLINED`, `COMPLETED`)*
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d04bc0cef735d3c478de61",
      "donorId": "60d04b68cef735d3c478de3b",
      "recipientId": "60d04b89cef735d3c478de4f",
      "score": 80,
      "status": "COMPLETED"
    }
  }
  ```
  *(Completing a match automatically sets `availability: false` on the matching donor profile).*

---

## Socket.io Real-Time Events

The Socket.io server connects on `/socket.io/` route. Handshake requires cookie authorization containing the `access_token`.

### Connection Handshake
Clients connect using `credentials: true`. The server reads the `access_token` cookie to verify authenticity, extracts `userId` and `role`, and automatically assigns them to:
- A private user room: `user:${userId}`
- A role room: `admin` (if role is admin)

### Outbound Events (Server -> Client)

#### 1. Target Alert: `match:new`
Emitted to `user:${userId}` for matching donors and recipients when a new match exceeds a score of 50.
* **Payload:**
  ```json
  {
    "matchId": "60d04bc0cef735d3c478de61",
    "score": 80,
    "status": "PENDING",
    "donor": {
      "userId": "60d04b32cef735d3c478de2a",
      "email": "donor@lifelink.org",
      "organType": "Kidney",
      "bloodGroup": "O-"
    },
    "recipient": {
      "userId": "60d04b4fcef735d3c478de30",
      "email": "recipient@lifelink.org",
      "organNeeded": "Kidney",
      "bloodGroup": "O+",
      "urgencyLevel": "HIGH"
    }
  }
  ```

#### 2. Administrative Alert: `match:admin_new`
Emitted to the `admin` room whenever any new compatible match is registered in the database.
* **Payload:** Same as `match:new`.
