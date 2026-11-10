# Mentor–Mentee Management Dashboard
## Comprehensive Project Documentation & Placement Technical Guide

---

## 1. Executive Summary & Problem Context

In engineering and professional colleges, students accumulate academic reward points by participating in programming, aptitude, and core computer science assessments. 

Historically, this data—alongside student attendance percentages, CGPA records, and activity completions—was managed across separate, disconnected Excel spreadsheets by multiple faculty members. This legacy approach created severe operational issues:
- **Data Fragmentation & Inconsistency**: Excel files frequently suffered from version mismatch and accidental row clobbering.
- **Privacy Breaches**: Circulating shared spreadsheets exposed all students' sensitive academic standings, attendance percentages, and roll numbers to unauthorized peers.
- **Delayed Intervention**: Mentors could not systematically identify students at risk (e.g., attendance below the mandatory 75% threshold or low reward points) in real time.

This project transforms the manual process into a centralized, role-isolated, secure web application adhering to enterprise software engineering standards. Students update their academic achievements and attendance directly, which immediately updates their standing and reflects in their assigned mentor's dashboard, while mentors monitor student progress, review rankings, and provide direct feedback messages.

---

## 2. Design System & Theme (College PC(D)P Portal Theme)

The interface follows a clean, light, professional academic portal aesthetic:
- **Background**: Light blue-gray page canvas (`#F3F5FB`).
- **Surfaces**: Crisp white sidebar, white top navigation, and white dashboard cards with subtle borders (`#E5E7EB`).
- **Primary Accent**: Professional academic purple (`#7652F6`), with hover state (`#633BF3`) and light purple highlights (`#F3F0FE`).
- **Typography**: Dark navy headings (`#1F2937`), secondary gray text (`#6B7280`), and mono numerals for metrics.
- **Status Indicators**: Healthy attendance in emerald green, attendance shortage (<75%) in alert red, and reward points in royal purple.

---

## 2. System Architecture

```
                          ┌─────────────────────────────────────┐
                          │     React 18 Single Page App        │
                          │   (Tailwind CSS + Lucide Icons)     │
                          └──────────────────┬──────────────────┘
                                             │ HTTP + JWT Bearer
                                             ▼
                          ┌─────────────────────────────────────┐
                          │       Express.js REST Engine        │
                          │    (Node.js v22 Runtime Engine)     │
                          ├─────────────────────────────────────┤
                          │  • verifyAuth (JWT Verification)    │
                          │  • requireStudent (IDOR Prevention) │
                          │  • requireMentor (Role Enforcement) │
                          │  • requireAssignedMentee (Scope)    │
                          └──────┬────────────────────────┬─────┘
                                 │                        │
             ┌───────────────────┘                        └───────────────────┐
             ▼                                                                ▼
┌───────────────────────────────┐                                ┌───────────────────────────────┐
│     Student Controller        │                                │      Mentor Controller        │
│ • GET  /api/student/profile   │                                │ • GET  /api/mentor/mentees    │
│ • POST /api/student/submit    │                                │ • POST /api/mentor/review     │
│ • GET  /api/student/activities│                                │ • POST /api/mentor/feedback   │
│ • GET  /api/student/analytics │                                │ • GET  /api/mentor/analytics  │
└──────────────┬────────────────┘                                └───────────────┬───────────────┘
               │                                                                 │
               └────────────────────────┬────────────────────────────────────────┘
                                        │ ACID Transactions (WAL Mode)
                                        ▼
                          ┌─────────────────────────────────────┐
                          │   Relational SQL Database Engine    │
                          │   (Strict Foreign Keys & Locking)   │
                          └─────────────────────────────────────┘
```

---

## 3. Database Schema & Data Dictionary

The relational database architecture guarantees referential integrity, eliminates duplication, and isolates student data from cross-tenant visibility.

### 3.1 Entity Relationship Diagram

```
[users] 1 ──── 1 [students]
   │                 │
   │                 ├── 1 ─── N [update_requests]
   │                 ├── 1 ─── N [reward_point_history]
   │                 ├── 1 ─── N [attendance_history]
   │                 ├── 1 ─── N [student_activity_progress] ─── N ─── 1 [college_activities]
   │                 └── N ─── 1 [mentor_mentees] ─── 1 ─── N [mentors]
   │                                                             │
   └── 1 ──── 1 [mentors] ───────────────────────────────────────┘
```

### 3.2 Table Definitions

| Table Name | Primary Key | Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `id` | None | Core authentication table storing email, salt-hashed passwords, role (`student` or `mentor`), and full names. |
| `mentors` | `id` | `user_id -> users(id)` | Mentor faculty details (employee ID, department, designation). |
| `students` | `id` | `user_id -> users(id)` | Official verified student records: roll number, department, verified points, verified attendance, CGPA, official rank position. |
| `mentor_mentees` | `id` | `mentor_id -> mentors(id)`, `student_id -> students(id)` | Strict assignment mapping establishing supervisory boundaries. Unique constraint on `(mentor_id, student_id)`. |
| `college_activities` | `id` | None | Bank of upcoming SEB reward point activities in Java, Python, SQL, Aptitude, Core CS. Maintained by college management (read-only for mentors). |
| `student_activity_progress` | `id` | `student_id -> students(id)`, `activity_id -> college_activities(id)` | Personal activity progress tracking (`completed`, `pending`, `missed`). |
| `update_requests` | `id` | `student_id -> students(id)`, `mentor_id -> mentors(id)`, `activity_id -> college_activities(id)` | Unverified student submissions (`reward_points`, `attendance`, `cgpa`) queued for mentor approval/rejection. |
| `reward_point_history` | `id` | `student_id -> students(id)`, `update_request_id -> update_requests(id)` | Immutable ledger of verified points additions and balance updates. |
| `attendance_history` | `id` | `student_id -> students(id)`, `update_request_id -> update_requests(id)` | Historic record of verified attendance percentage changes. |
| `mentor_feedback` | `id` | `mentor_id -> mentors(id)`, `student_id -> students(id)` | Individual directives and guidance from mentors to students. |
| `notifications` | `id` | `user_id -> users(id)` | User-specific alert messages (approvals, rejections, feedback). |
| `audit_logs` | `id` | `user_id -> users(id)` | Security audit trail recording login, review, and submission events. |

---

## 4. Multi-User Security & Data Isolation Architecture

### 4.1 Insecure Direct Object Reference (IDOR) Prevention
- In naive implementations, endpoints like `GET /api/student/profile?id=12` or `POST /api/student/update-details` with `{ studentId: 12 }` allow malicious students to read or tamper with another student's record by modifying query or body parameters.
- **Our Implementation**: The backend completely ignores any user-supplied student ID. The `verifyAuth` middleware decodes the cryptographically signed JWT Bearer token and extracts `req.user.studentId`. All SQL queries bind strictly to `req.user.studentId`. A student cannot access or modify another student's record through any URL, header, or body manipulation.

### 4.2 Mentor Supervisory Boundaries
- Mentors must never access student profiles belonging to other mentors.
- The `requireAssignedMentee` middleware intercepts all mentor operations on specific students:
  ```sql
  SELECT id FROM mentor_mentees WHERE mentor_id = ? AND student_id = ?
  ```
  If no record exists, the API halts immediately with `403 Forbidden: You can only access and supervise your assigned mentees`.

### 4.3 High Concurrency & Transactional Integrity (20+ Simultaneous Users)
- **Problem**: When 20 students submit updates concurrently, race conditions in file-based or unsynchronized stores cause dirty reads, missed updates, and JSON corruption.
- **Solution**:
  1. Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) allows concurrent readers to query while transactions write.
  2. ACID Transactions (`BEGIN IMMEDIATE TRANSACTION; ... COMMIT;`) wrap the entire approval and ranking pipeline.
  3. Busy timeouts (`PRAGMA busy_timeout = 10000;`) ensure concurrent write queues wait smoothly without throwing locking exceptions.

---

## 5. Verification Workflow & Official Ranking System

1. **Submission**:
   A student enters reward points earned from a Safe Exam Browser assessment. A row is inserted into `update_requests` with `status = 'pending'`. The official `students.verified_points` remains completely untouched.
2. **Notification**:
   A notification row is generated for the assigned mentor: *"Student X submitted Y points for verification."*
3. **Mentor Review**:
   - **Approval**:
     Wrapped in an atomic transaction:
     - `students.verified_points` is incremented.
     - `reward_point_history` receives an audit log entry.
     - `update_requests.status` transitions to `'approved'`.
     - The student is notified.
     - Official college rankings are immediately recalculated across all students using standard competition ranking (`DENSE_RANK` behavior).
   - **Rejection**:
     The mentor enters a mandatory rejection reason (e.g., *"SEB completion certificate mismatch"*). The request status transitions to `'rejected'`. The student's official points remain intact, and an alert is delivered with the mentor's explanation.

---

## 6. Pre-Seeded Demonstration Accounts

| Role | Identifier (Email or Roll Number) | Password | Notes / Scope |
| :--- | :--- | :--- | :--- |
| **Faculty Mentor 1** | `mentor@bitsathy.ac.in` | `mentor123` | Dr. Rajesh Kumar (CSE). Supervised: 12 students (`7376231CS101` – `7376231CS112`). |
| **Faculty Mentor 2** | `meena.mentor@bitsathy.ac.in` | `mentor123` | Dr. Meena Devi (IT). Supervised: 12 students (`7376232IT201` – `7376232IT212`). |
| **Student 1** | `7376231CS102` (or `benielraja.cs23@bitsathy.ac.in`) | `password123` | Beniel Raja. Verified points: 950, Rank: #5, Regular attendance. |
| **Student 2** | `7376231CS105` (or `eswar.cs23@bitsathy.ac.in`) | `password123` | Eswar Sundar. Low attendance: 68.0% (Triggers Low Attendance Warning). |
| **Student 3** | `7376232IT203` (or `oviya.it23@bitsathy.ac.in`) | `password123` | Oviya Selvan (Mentor 2 Mentee). Verified points: 980, Rank: #1. |

---

## 7. Technical Interview Questions & Answers

### Q1: What architectural flaw did you identify in the legacy codebase, and how did you resolve it?
> **Answer**: 
> *"The legacy codebase relied on unauthenticated endpoints where `studentRoutes.js` and `mentorRoutes.js` bypassed token validation. Endpoints accepted raw emails or roll numbers directly from query parameters (`/profile?email=...`) and request bodies, enabling trivial Insecure Direct Object Reference (IDOR) attacks where any student could modify another peer's scores. Furthermore, the database fell back to regex parsing on an in-memory JSON file (`data_store.json`), which suffered from race conditions under concurrent access.*
> 
> *We resolved this by creating a normalized relational schema with strict foreign keys, wrapping all mutations inside ACID transactions with WAL mode, and implementing JWT authentication middleware that resolves the student identity exclusively from verified token claims (`req.user.studentId`)."*

### Q2: How did you ensure data isolation between different faculty mentors?
> **Answer**:
> *"We introduced a relational assignment table `mentor_mentees` with a composite unique constraint on `(mentor_id, student_id)`. In the backend, we created a specialized authorization middleware `requireAssignedMentee`. Before a mentor can view a mentee's detailed profile or approve a submission, the middleware executes `SELECT id FROM mentor_mentees WHERE mentor_id = ? AND student_id = ?`. If the student is not assigned to that mentor, the API rejects the request with HTTP `403 Forbidden`, preventing any cross-cohort data leakage."*

### Q3: Why is it critical to separate pending submissions from verified points in an academic evaluation system?
> **Answer**:
> *"College reward points directly impact students' internal assessment marks and corporate placement rankings. Allowing direct client-side updates creates an integrity vulnerability where students could inflate points fraudulently. By modeling `update_requests` as a separate table in a pending state, official marks and leaderboard rankings are strictly computed from `students.verified_points`. Only a verified mentor approval executes an atomic transaction that credits points and appends to an immutable audit history."*

### Q4: How does the application maintain data consistency when 20 students submit updates simultaneously?
> **Answer**:
> *"We implemented SQLite in WAL (Write-Ahead Logging) mode (`PRAGMA journal_mode = WAL;`) with a 10-second busy timeout. In WAL mode, read operations do not block write operations, and writes do not block reads. When multiple students post submissions or mentors review records concurrently, our backend wraps each modification in an immediate SQL transaction (`BEGIN IMMEDIATE TRANSACTION; ... COMMIT;`), ensuring row-level serialization without deadlocks or file corruption. Our automated test suite verified 20 simultaneous concurrent requests in under 210ms with zero errors."*

### Q5: Why is client-side authorization insufficient for modern web applications?
> **Answer**:
> *"Client-side checks (such as hiding UI buttons with `if (role === 'mentor')`) only alter presentation. Any user can open Chrome DevTools, inspect network traffic, and dispatch `POST` or `DELETE` requests directly to backend endpoints using tools like Postman or curl. Security must always be enforced at the API layer by cryptographically validating the bearer token, inspecting the user's role, and checking entity ownership before executing database queries."*

---

## 8. Verification & Test Commands

To run the automated backend test suite covering authentication, IDOR prevention, mentor boundaries, verification workflows, and 20 simultaneous concurrent users:

```bash
cd backend
npm test
```

To re-seed or reset the database to factory demonstration state:

```bash
cd backend
npm run seed
```

To start the backend server:

```bash
cd backend
npm start
```

To run the frontend:

```bash
cd frontend
npm start
```

