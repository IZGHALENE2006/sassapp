# Clinic Management System

Full-stack clinic management platform built with:

- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Frontend: React (Vite), TailwindCSS

## 1) Backend First (MVC + REST)

### Backend folder structure

```txt
backend/
  src/
    config/
      db.js
      env.js
    constants/
      roles.js
    controllers/
      appointmentController.js
      authController.js
      dashboardController.js
      patientController.js
      paymentController.js
      queueController.js
      visitController.js
    middlewares/
      auth.js
      errorHandler.js
      validateRequest.js
    models/
      Appointment.js
      Patient.js
      Payment.js
      QueueEntry.js
      User.js
      Visit.js
    routes/
      appointmentRoutes.js
      authRoutes.js
      dashboardRoutes.js
      index.js
      patientRoutes.js
      paymentRoutes.js
      queueRoutes.js
      visitRoutes.js
    scripts/
      seedAdmin.js
    utils/
      ApiError.js
      asyncHandler.js
      jwt.js
    validators/
      appointmentValidators.js
      authValidators.js
      patientValidators.js
      paymentValidators.js
      queueValidators.js
      visitValidators.js
    app.js
    server.js
  .env.example
  package.json
```

### Mongoose schema summary

- `User`: `name`, `email` (unique), `password` (hashed), `role`
- `Patient`: `patientNumber` (auto-increment), `cin` (unique), `name`, `phone`, `dateOfBirth`, `gender`, `address`
- `QueueEntry`: `patient`, `queueDate`, `queueNumber`, `status`, `checkedInAt`, `calledAt`
- `Appointment`: `patient`, `doctorName`, `reason`, `dateTime`, `status`, `createdBy`
- `Visit`: `patient`, `doctor`, `notes`, `diagnosis`, `prescribedMedication`, `visitDate`
- `Payment`: `patient`, `amount`, `type`, `method`, `paymentDate`, `createdBy`

### API endpoints

Base URL: `http://localhost:5000/api/v1`

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Patients:
- `GET /patients`
- `POST /patients`
- `GET /patients/search?cin=&phone=&name=`
- `GET /patients/:id`
- `PUT /patients/:id`
- `GET /patients/:id/history`
- `DELETE /patients/:id`

Queue:
- `POST /queue/check-in`
- `GET /queue/today`
- `GET /queue/current`
- `PATCH /queue/:id/status`

Appointments:
- `GET /appointments`
- `GET /appointments/upcoming`
- `POST /appointments`
- `PUT /appointments/:id`
- `DELETE /appointments/:id`

Visits:
- `POST /visits`
- `GET /visits/patient/:patientId`

Payments:
- `GET /payments`
- `POST /payments`

Dashboard:
- `GET /dashboard/today`

### Run backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Optional admin seed:

```bash
npm run seed:admin
```

## 2) Frontend Dashboard (React + Tailwind)

### Frontend folder structure

```txt
frontend/
  src/
    api/
      client.js
    components/
      layout/
        AppShell.jsx
        ProtectedRoute.jsx
      ui/
        Badge.jsx
        Button.jsx
        Card.jsx
        Input.jsx
        Select.jsx
    context/
      AuthContext.jsx
    pages/
      AppointmentsPage.jsx
      DashboardPage.jsx
      LoginPage.jsx
      PatientsPage.jsx
      PaymentsPage.jsx
      QueuePage.jsx
    App.jsx
    index.css
    main.jsx
  index.html
  package.json
  postcss.config.js
  tailwind.config.js
  vite.config.js
```

### Frontend features included

- Login with JWT
- Dashboard with today metrics and upcoming appointments
- Patient management: create/search/history + visit notes
- Queue screen: check-in + live waiting room section
- Appointment manager: create, edit, delete, upcoming list
- Payment manager: create and list
- Language switcher: French (`FR`) and Arabic (`AR`) with RTL support for Arabic

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

Set API URL if needed:

```bash
VITE_API_URL=http://localhost:5000/api/v1
```

## 3) Production-readiness notes

- MVC architecture for backend modules
- Centralized error handling and request validation
- JWT-based auth middleware
- Mongoose indexes for common query fields
- Reusable React UI components and protected routes
