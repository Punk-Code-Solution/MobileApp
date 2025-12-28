# AI Coding Agent Instructions

## Architecture Overview
This is a telemedicine mobile application (Uber-style health app) with a NestJS backend and React Native frontend.

**Backend (backend-telemedicina/)**: NestJS API with Prisma ORM (v5), PostgreSQL database. Core modules: Auth (JWT), Users (Patients/Professionals), Professionals. Entities use transaction-based creation for User + Profile. Key tables: User (id, email, passwordHash, role), Professional (userId, fullName, licenseNumber, price), Specialty (N:N with Professional), upcoming Appointment (patientId, professionalId, date, status).

**Frontend (MobileTelemedicina/)**: React Native (CLI) app using axios for API calls. Simple login flow followed by doctors list view. API URL hardcoded to `http://10.0.2.2:3000` for Android emulator.

**Data Flow**: Mobile authenticates via `/auth/login`, receives JWT token, uses Bearer auth for protected endpoints like `/professionals`.

## Current Status
- **Backend**: Auth JWT, Users module (account creation), Professionals module (listing with specialties), Seed script (populated DB with specialties and doctors), Global Pipes/CORS.
- **Frontend**: Functional login (`/auth/login`), "Create Test Account" button, DoctorsList screen (fetches `/professionals`, displays cards with Name, Specialty, Price), JWT token in local state (preparing for AsyncStorage).

## Roadmap
- **Priority**: Appointment system (create Appointment table, POST /appointments route, mobile modal for date selection).
- **UX Improvements**: Loading/success feedback, friendly error handling.
- **Future**: Web dashboard for doctors' schedules.

## Key Workflows
- **Backend Dev**: `cd backend-telemedicina && npm run start:dev` (watches changes). Requires `DATABASE_URL` env var. Run `npx prisma migrate dev` for DB schema changes, `npx prisma generate` after schema updates.
- **Mobile Dev**: `cd MobileTelemedicina && npm start` (Metro), then `npm run android` or `npm run ios`. Environment: Android emulator on Windows 11.
- **Linting**: Backend uses ESLint with `--fix`. Mobile uses standard RN ESLint.
- **Testing**: Backend: `npm run test:e2e` for integration. Mobile: `npm test` (Jest).

## Conventions
- **TypeScript**: Strict mode (avoid `any`).
- **Backend DTOs**: Use class-validator decorators (e.g., `@IsEmail()`, `@IsNotEmpty()`). Enums like `Role` match Prisma schema.
- **Prisma Relations**: Always include related data in queries (e.g., `include: { specialties: { include: { specialty: true } } }` in professionals).
- **Auth**: JWT payload includes `sub`, `email`, `role`. Protect routes with `@UseGuards(JwtAuthGuard)`.
- **Mobile API Calls**: Use axios with `Authorization: Bearer ${token}` header. Handle errors with `error.response?.data?.message`. Use functional components + hooks (`useState`, `useEffect`), `StyleSheet.create`, `try/catch` with user alerts.
- **File Structure**: Follow NestJS module pattern (controller/service/dto/entity). Mobile components in `src/`.

## Examples
- **User Creation**: In `users.service.ts`, use `$transaction` to create User + Patient/Professional in one go.
- **Auth Login**: POST `/auth/login` with `{email, password}`, returns `{access_token, user}`.
- **Fetch Professionals**: GET `/professionals` with auth header, includes specialties via nested includes.

## Dependencies
- Backend: @nestjs/jwt, bcrypt, @prisma/client
- Mobile: axios, react-native-safe-area-context</content>
<parameter name="filePath">c:\Users\thiag\Documents\Repositorio\MobileApp\.github\copilot-instructions.md