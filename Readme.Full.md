คุณคือ Senior Full Stack Developer ให้พัฒนา OmniChat Backoffice โดยต้อง Integrate เข้ากับระบบ OmniChat ที่มีอยู่แล้ว

## Tech Stack

### Frontend
- Angular 19
- PrimeNG 19
- TypeScript
- RxJS
- Angular Reactive Forms
- Angular Router
- Tailwind CSS

### Backend
- NestJS
- TypeScript
- RESTful API
- JWT Authentication
- Role-Based Access Control (RBAC)
- Swagger / OpenAPI
- class-validator / class-transformer

### Database
- MongoDB
- Mongoose

### Cache / Queue
- Redis
- BullMQ สำหรับ Background Job

---

# เป้าหมาย

พัฒนา OmniChat Backoffice สำหรับเจ้าหน้าที่และผู้ใช้งานฝั่ง Client เพื่อบริหารจัดการ

Profile
Company
User
Role / Permission
Package / Subscription
Usage / Limit
Invoice
Expiration
Notification
Audit Log

ระบบ Chat หลักมีอยู่แล้ว ห้ามแก้ไขหรือกระทบ Business Logic ของระบบ Chat เดิมโดยไม่จำเป็น

---

# 1. Profile Management

สร้างระบบจัดการ Profile

Profile คือกลุ่มของ Company ที่อยู่ภายใต้ Profile เดียวกัน

ความสามารถ:

- เจ้าหน้าที่สามารถ Create / View / Edit / Disable Profile
- 1 Profile สามารถมีหลาย Company
- เจ้าหน้าที่สามารถกำหนด Company Limit ของแต่ละ Profile
- เจ้าหน้าที่สามารถกำหนด User Limit ของแต่ละ Profile
- สามารถกำหนด Start Date / Expiration Date
- มี Status:
  - Active
  - Inactive
  - Expired

ต้องมีการตรวจสอบ Limit ก่อนเพิ่ม Company หรือ User

ตัวอย่าง:

Profile A
- Company Limit = 5
- User Limit = 20

หากมี Company ครบ 5 บริษัทแล้ว ต้องไม่สามารถเพิ่ม Company ที่ 6 ได้

---

# 2. Company Management

Company อยู่ภายใต้ Profile

ความสามารถ:

- Create / View / Edit / Disable Company
- ผู้ใช้ฝั่ง Client สามารถเพิ่ม Company ได้เอง
- การเพิ่ม Company ต้องตรวจสอบ Company Limit ของ Profile
- กำหนด Start Date / Expiration Date
- Status:
  - Active
  - Inactive
  - Expired
- กำหนด Package ให้ Company
- แสดง Usage ของ Company

ควรรองรับการตรวจสอบว่า Company หมดอายุแล้วหรือไม่ก่อนอนุญาตให้ใช้งาน Feature ต่าง ๆ

---

# 3. User Management

ความสามารถ:

- เจ้าหน้าที่สามารถดูและจัดการ User
- ผู้ใช้ฝั่ง Client สามารถเพิ่ม User ได้เอง
- การเพิ่ม User ต้องตรวจสอบ User Limit ของ Profile
- Create / View / Edit / Disable User
- กำหนด Role
- กำหนด Company ที่ User สามารถเข้าถึงได้
- กำหนด Start Date / Expiration Date
- Reset Password
- Enable / Disable User

เมื่อ User หมดอายุ ต้องไม่สามารถ Login หรือใช้งานระบบได้ตาม Policy ที่กำหนด

---

# 4. Role & Permission

สร้างระบบ RBAC

รองรับ:

Role:
- Admin
- Manager
- User

Permission ระดับ:

- View
- Create
- Update
- Delete
- Export
- Approve

Permission สามารถกำหนดตาม Menu / Module ได้

ตัวอย่าง:

Profile
- View
- Create
- Update
- Delete

Company
- View
- Create
- Update
- Delete

User
- View
- Create
- Update
- Delete

Invoice
- View
- Create
- Export

ต้องออกแบบ Permission ให้สามารถเพิ่ม Module ใหม่ในอนาคตได้โดยไม่ต้องแก้ Core Authorization Logic

---

# 5. Package / Subscription

สร้างระบบ Package

Package สามารถกำหนด:

- Package Name
- Description
- Price
- Billing Cycle
- Company Limit
- User Limit
- Feature ที่สามารถใช้งานได้
- Start Date
- Expiration Date
- Status

รองรับ:

- Create Package
- Edit Package
- Disable Package
- Assign Package ให้ Company
- Upgrade Package
- Downgrade Package

---

# 6. Usage / Limit

สร้างระบบตรวจสอบ Usage

แสดง:

Company Usage:
5 / 10 Companies

User Usage:
15 / 50 Users

Feature Usage ตามที่ระบบกำหนด

ระบบต้อง:

- ตรวจสอบ Limit ก่อน Create
- แจ้งเตือนเมื่อใกล้ถึง Limit
- ป้องกันการเพิ่มข้อมูลเกิน Limit
- แสดง Usage บน Dashboard

---

# 7. Invoice Management

สร้างระบบ Invoice

รองรับ:

- Create Invoice
- View Invoice
- Edit Invoice
- Cancel Invoice
- Export / Download PDF
- Search
- Filter
- Pagination

Invoice Status:

- Draft
- Pending
- Paid
- Overdue
- Cancelled

ข้อมูลหลัก:

- Invoice Number
- Company
- Profile
- Invoice Date
- Due Date
- Billing Period
- Amount
- VAT
- Total Amount
- Status

ควรออกแบบ Invoice Number ให้ไม่ซ้ำกัน

---

# 8. Expiration Management

รองรับ Expiration สำหรับ:

- Profile
- Company
- User
- Package / Subscription

สามารถกำหนด:

- Start Date
- Expiration Date

ระบบต้องมี Background Job สำหรับตรวจสอบ Expiration

ตัวอย่าง:

- แจ้งเตือนก่อนหมดอายุ 30 วัน
- แจ้งเตือนก่อนหมดอายุ 15 วัน
- แจ้งเตือนก่อนหมดอายุ 7 วัน
- เมื่อหมดอายุเปลี่ยน Status เป็น Expired

ใช้ Redis + BullMQ สำหรับ Scheduled / Background Job

---

# 9. Notification

สร้างระบบ Notification

รองรับ Notification เช่น:

- Company ใกล้หมดอายุ
- User ใกล้หมดอายุ
- Package ใกล้หมดอายุ
- Usage ใกล้ถึง Limit
- Invoice ใกล้ครบกำหนด
- Invoice Overdue

ออกแบบ Notification ให้สามารถเพิ่ม Channel ในอนาคตได้ เช่น:

- In-App
- Email
- LINE
- SMS

ใน Phase แรกสามารถ Implement In-App Notification ก่อน

---

# 10. Audit Log

ทุก Action ที่สำคัญต้องมี Audit Log

ตัวอย่าง:

- Login
- Logout
- Create
- Update
- Delete
- Disable
- Enable
- Change Role
- Change Permission
- Change Package
- Change Limit
- Create Invoice
- Update Invoice
- Cancel Invoice

Audit Log ควรเก็บ:

- User ID
- User Name
- Action
- Module
- Resource ID
- Before Data
- After Data
- IP Address
- User Agent
- Timestamp

ต้องสามารถ Search / Filter / Pagination ได้

---

# 11. Dashboard

สร้าง Dashboard สำหรับเจ้าหน้าที่

แสดง:

- Total Profiles
- Total Companies
- Total Users
- Active Companies
- Active Users
- Expired Companies
- Expired Users
- Expiring Soon
- Active Subscriptions
- Pending Invoices
- Overdue Invoices
- Revenue
- Usage / Limit

Dashboard ต้องออกแบบให้สามารถเพิ่ม Widget ในอนาคตได้

---

# 12. Frontend

สร้าง Angular Pages:

/backoffice/dashboard

/backoffice/profiles
/backoffice/profiles/:id

/backoffice/companies
/backoffice/companies/:id

/backoffice/users
/backoffice/users/:id

/backoffice/roles
/backoffice/permissions

/backoffice/packages
/backoffice/packages/:id

/backoffice/invoices
/backoffice/invoices/:id

/backoffice/notifications

/backoffice/audit-logs

ทุกหน้าต้องรองรับ:

- Search
- Filter
- Pagination
- Loading State
- Empty State
- Error State
- Form Validation
- Confirmation Dialog
- Success / Error Notification

---

# 13. Backend Architecture

NestJS ต้องออกแบบเป็น Module แยกตาม Domain เช่น:

ProfileModule
CompanyModule
UserModule
RoleModule
PermissionModule
PackageModule
SubscriptionModule
UsageModule
InvoiceModule
NotificationModule
AuditLogModule

ใช้ Controller / Service / Repository หรือ Data Access Layer แยกตามความเหมาะสม

ห้ามเขียน Business Logic ไว้ใน Controller

---

# 14. MongoDB

ออกแบบ MongoDB Schema ให้เหมาะสมกับระบบ

Collection ที่คาดว่าจะมี:

profiles
companies
users
roles
permissions
packages
subscriptions
invoices
notifications
audit_logs

ต้องออกแบบ:

- Index
- Unique Index
- Reference / Relationship
- CreatedAt
- UpdatedAt
- Soft Delete หากเหมาะสม

พิจารณาเรื่อง Query Performance และ Pagination ตั้งแต่ต้น

---

# 15. Redis / BullMQ

ใช้ Redis สำหรับ:

- Cache
- Background Job
- Scheduled Job

BullMQ Jobs ตัวอย่าง:

expiration-check
invoice-reminder
usage-check
notification
cleanup

ต้องออกแบบ Job ให้:

- Idempotent
- Retry ได้
- มี Failed Job Handling
- มี Logging
- ป้องกัน Job ทำงานซ้ำโดยไม่จำเป็น

---

# 16. Security

ต้องคำนึงถึง:

- JWT Authentication
- RBAC
- Input Validation
- Rate Limiting
- API Authorization
- MongoDB Injection Protection
- Sensitive Data Protection
- Audit Log
- Secure Password Handling
- CORS
- HTTP Security Headers

ห้าม Trust ค่า Role / Company ID จาก Frontend โดยตรง ต้องตรวจสอบสิทธิ์จาก Backend ทุกครั้ง

---

# 17. API

ทุก API ต้อง:

- RESTful
- มี Swagger
- มี DTO
- มี Validation
- มี Standard Response Format
- มี Error Handling
- มี Pagination
- มี Filter / Search ตามความเหมาะสม

ตัวอย่าง:

GET    /api/backoffice/profiles
POST   /api/backoffice/profiles
GET    /api/backoffice/profiles/:id
PATCH  /api/backoffice/profiles/:id
DELETE /api/backoffice/profiles/:id

GET    /api/backoffice/companies
POST   /api/backoffice/companies

GET    /api/backoffice/users
POST   /api/backoffice/users

GET    /api/backoffice/invoices
POST   /api/backoffice/invoices

---

# 18. Development Rules

ก่อนเริ่มเขียน Code:

1. วิเคราะห์ Project Structure ปัจจุบันก่อน
2. ตรวจสอบ Angular Version
3. ตรวจสอบ NestJS Version
4. ตรวจสอบ MongoDB / Mongoose ที่ใช้อยู่
5. ตรวจสอบ Redis Configuration
6. ตรวจสอบ Authentication เดิม
7. ตรวจสอบ User / Company / Chat Model เดิม
8. ตรวจสอบ Coding Convention ของ Project
9. ตรวจสอบ Existing API และ Module
10. ห้ามสร้างซ้ำสิ่งที่มีอยู่แล้ว

หากมีระบบ Authentication / User / Company อยู่แล้ว ให้ Reuse ของเดิมแทนการสร้างใหม่

หากต้องแก้ไข Existing Code ให้พยายามแก้ไขให้น้อยที่สุดและต้องไม่กระทบระบบ Chat ที่ทำงานอยู่

---

# 19. Implementation Approach

ให้ทำงานเป็น Phase:

Phase 1
- Project Analysis
- Architecture
- Database Schema
- Profile
- Company
- User

Phase 2
- Role / Permission
- Package
- Subscription
- Usage / Limit

Phase 3
- Invoice
- Expiration
- Notification
- BullMQ Jobs

Phase 4
- Dashboard
- Audit Log
- Reporting

Phase 5
- Unit Test
- Integration Test
- Security Review
- Performance Review

อย่า Implement ทุกอย่างในครั้งเดียว

เริ่มจากวิเคราะห์ Project ปัจจุบันก่อน แล้วสรุป:

1. Existing Architecture
2. Existing Modules
3. Existing Models
4. Existing Authentication
5. Existing API
6. สิ่งที่สามารถ Reuse ได้
7. สิ่งที่ต้องสร้างใหม่
8. Proposed Architecture
9. Database Schema ที่เสนอ
10. Development Plan

จากนั้นรอการยืนยันก่อนเริ่มแก้ไข Code

#Folder Stucture

deployment
    - development.yaml
    - production.yaml
src
    - client
    - api
jenkinsfile

# ENV Local
MONGO_URI=mongodb://admin:jrAM8BTd5BkO1pSClGu9bow8pBDRlc0C@45.91.134.13:27017/omnichat-local?authSource=admin
# ENV Development
MONGO_URI=mongodb://admin:jrAM8BTd5BkO1pSClGu9bow8pBDRlc0C@45.91.134.13:27017/omnichat?authSource=admin
# ENV Production
MONGO_URI=mongodb://admin:UXe9oYbwtv2dtuBw@45.91.134.9:27017/omnichat?authSource=admin