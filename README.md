# 🏥 Schedula API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)

A robust, scalable, and secure backend application built with **NestJS** and **TypeScript** for managing doctor appointments. Schedula acts as the core engine powering the interactions between healthcare providers (doctors) and patients, handling authentication, profile management, intricate scheduling logistics, and availability overrides.

---

## 🏗️ Architecture & Features

- **Role-Based Access Control (RBAC):** Secure JWT authentication enforcing strict boundaries between `DOCTOR` and `PATIENT` roles.
- **Advanced Scheduling Engine:** Supports recurring weekly schedules (Stream) and custom date-specific overrides (Wave scheduling models).
- **Separation of Concerns:** Highly modular architecture utilizing NestJS controllers, services, and DTOs to ensure maintainability.
- **Robust Data Validation:** Leveraging `class-validator` to intercept and sanitize payloads before they reach business logic.
- **Relational Integrity:** Fully normalized PostgreSQL database orchestrated via TypeORM.

---

## ⚙️ Environment Configuration

To run this project, you will need to configure your environment variables. Create a `.env` file in the root directory and populate it with the following keys:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | The PostgreSQL connection string | `postgresql://user:password@host:port/dbname` |
| `SECRET` | The secret key used for signing JWT tokens | `your_super_secret_jwt_key_here` |

*Note: Never commit your `.env` file to version control.*

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- PostgreSQL (Local or Cloud instance)

### Setup Instructions

```bash
# 1. Clone the repository
$ git clone <repository-url>
$ cd schedula-piyush

# 2. Install dependencies
$ npm install

# 3. Configure your .env file
$ cp .env.example .env # (or create manually based on the table above)

# 4. Start the application in development mode
$ npm run start:dev
```

---

## 📖 API Documentation

Below is the swagger-style reference for the RESTful API endpoints exposed by the Schedula engine.

### 🔐 Auth

<details>
<summary><code>POST</code> <b>/auth/signup</b> - Register a new user</summary>

**Request Body** (`application/json`)
```json
{
  "email": "doctor@example.com",
  "password": "SecurePassword123!",
  "role": "DOCTOR" // or "PATIENT"
}
```
**Responses:**
- `201 Created` - User successfully registered.
- `400 Bad Request` - User already exists or invalid payload.
</details>

<details>
<summary><code>POST</code> <b>/auth/login</b> - Authenticate a user</summary>

**Request Body** (`application/json`)
```json
{
  "email": "doctor@example.com",
  "password": "SecurePassword123!"
}
```
**Responses:**
- `201 Created` - Returns `{ "access_token": "eyJhbG..." }`
- `401 Unauthorized` - Invalid credentials.
</details>

<details>
<summary><code>GET</code> <b>/auth/doctor/profile</b> - Get authenticated doctor's basic auth profile</summary>

**Headers:** `Authorization: Bearer <token>`
**Responses:**
- `200 OK` - Returns user object.
- `401 Unauthorized` - Missing or invalid token.
</details>

<details>
<summary><code>GET</code> <b>/auth/patient/profile</b> - Get authenticated patient's basic auth profile</summary>

**Headers:** `Authorization: Bearer <token>`
**Responses:**
- `200 OK` - Returns user object.
</details>

---

### 👤 Profiles

<details>
<summary><code>POST</code> <b>/doctor/profile</b> - Create doctor profile</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "fullName": "Dr. Sarah Smith",
  "specialization": "Cardiologist",
  "experience": 10,
  "qualification": "MBBS, MD",
  "consultationFee": 500,
  "availability": "Mon-Fri 09:00-17:00"
}
```
</details>

<details>
<summary><code>PATCH</code> <b>/doctor/profile</b> - Update doctor profile</summary>

**Headers:** `Authorization: Bearer <token>`  
*Accepts partial payload of the Create object.*
</details>

<details>
<summary><code>POST</code> <b>/patient/profile</b> - Create patient profile</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "fullName": "John Doe",
  "age": 30,
  "gender": "Male", // 'Male', 'Female', 'Other'
  "contactDetails": "+1234567890",
  "basicHealthInformation": "No known allergies."
}
```
</details>

<details>
<summary><code>PATCH</code> <b>/patient/profile</b> - Update patient profile</summary>

**Headers:** `Authorization: Bearer <token>`  
*Accepts partial payload of the Create object.*
</details>

---

### 📅 Doctor Availability

<details>
<summary><code>POST</code> <b>/doctor/availability</b> - Add recurring weekly availability</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "dayOfWeek": 1, 
  "startTime": "09:00",
  "endTime": "17:00"
}
```
</details>

<details>
<summary><code>POST</code> <b>/doctor/availability/override</b> - Add date-specific schedule override</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "specificDate": "2024-12-25",
  "startTime": "10:00",
  "endTime": "14:00"
}
```
</details>

<details>
<summary><code>GET</code> <b>/doctor/availability</b> - Get all recurring availabilities</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

<details>
<summary><code>GET</code> <b>/doctor/availability/date?date=YYYY-MM-DD</b> - Get custom availability for specific date</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

<details>
<summary><code>PATCH</code> <b>/doctor/availability/:id</b> - Update recurring availability</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "dayOfWeek": 1,
  "startTime": "10:00",
  "endTime": "18:00"
}
```
</details>

<details>
<summary><code>DELETE</code> <b>/doctor/availability/:id</b> - Remove recurring availability</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

---

### 🗓️ Appointments

<details>
<summary><code>POST</code> <b>/appointment</b> - Book an appointment</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "doctorId": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-10-15",
  "startTime": "10:00",
  "endTime": "10:30"
}
```
</details>

<details>
<summary><code>PATCH</code> <b>/appointment/:id/reschedule</b> - Reschedule appointment</summary>

**Headers:** `Authorization: Bearer <token>`  
**Request Body** (`application/json`)
```json
{
  "newDate": "2024-10-16",
  "newStartTime": "14:00",
  "newEndTime": "14:30",
  "newSchedulingType": "WAVE" // 'STREAM' or 'WAVE'
}
```
</details>

<details>
<summary><code>PATCH</code> <b>/appointment/:id/cancel</b> - Cancel appointment</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

<details>
<summary><code>GET</code> <b>/appointment/my</b> - Get my appointments (Patient)</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

<details>
<summary><code>GET</code> <b>/appointment/doctor</b> - Get doctor appointments</summary>

**Headers:** `Authorization: Bearer <token>`
</details>

---

## 🧪 Testing Protocol

Run the automated test suites to ensure system integrity:

```bash
# Unit tests
$ npm run test

# End-to-end (e2e) tests
$ npm run test:e2e

# Test coverage report
$ npm run test:cov
```

## 📜 License

This project is licensed under the MIT License.
