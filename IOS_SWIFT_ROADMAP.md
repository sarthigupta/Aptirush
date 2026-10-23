# AptiRush iOS App Roadmap (Swift)

This document describes how to build AptiRush as a native iOS app in Swift, using the existing Express backend. The project currently has a Next.js web frontend and a separate backend. The iOS app should be a separate Swift app that communicates with the backend through REST and Socket.IO.

## 1. Current architecture and recommended direction

- **Web frontend:** Next.js, React, TypeScript.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** PostgreSQL through Prisma.
- **Realtime:** Socket.IO for battles.
- **iOS app:** Native Swift using SwiftUI, URLSession, Keychain, and a Socket.IO client library compatible with the server.

Keep the existing backend as the source of truth for accounts, questions, tests, attempts, results, and battle state. Build the iOS app as a new client; do not try to run the Next.js frontend inside the native app. The web client can continue to exist independently.

## 2. API inventory

### Base URLs

The web frontend currently defaults to these hosted addresses:

- **REST API:** `https://aptirush.onrender.com/api`
- **Socket.IO server:** `https://aptirush.onrender.com`

Use separate development, staging, and production configuration in the iOS app rather than hardcoding production values. A phone's `localhost` refers to the phone itself. For local development, use a reachable development machine address or a development tunnel, and configure the backend and Socket.IO server accordingly.

The backend exposes `GET /health` at the server root, outside `/api`.

### Authentication conventions

Protected REST routes use a JSON Web Token returned by login. Include it on each request as:

```http
Authorization: Bearer <token>
```

The backend currently signs tokens with a **24-hour expiry**. There is no refresh-token endpoint in the registered routes. The app should handle an expired or invalid token by clearing the local session and prompting the user to sign in again.

Store the token in the iOS **Keychain**. Do not store authentication credentials in `UserDefaults`.

### Authentication endpoints

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register a student account |
| `POST` | `/auth/login` | None | Sign in |
| `POST` | `/auth/admin/register` | None | Create an admin account |
| `POST` | `/auth/admin/login` | None | Sign in as admin |
| `GET` | `/auth/profile` | Bearer token | Get the signed-in user's profile |

Student registration body:

```json
{
  "name": "Student Name",
  "email": "student@example.com",
  "password": "at-least-six-characters"
}
```

The name must be at least 2 characters, the email must be valid, and the password must be at least 6 characters according to the current validation schema.

Login body:

```json
{
  "email": "student@example.com",
  "password": "your-password"
}
```

Successful login returns a message, `token`, and `user` object containing `id`, `name`, `email`, and `role`. Successful registration returns a message and user object but does **not** return a token, so the app should follow registration with login unless this behavior changes.

The profile response contains `id`, `name`, `email`, `role`, `created_at`, `updated_at`, and `is_active`.

The regular registration endpoint always creates a `STUDENT`. Admin registration creates an `ADMIN`; there is no faculty registration endpoint among the registered routes. Confirm how faculty accounts are created before including faculty sign-in in the app. Also confirm that admin self-registration is intentionally public before exposing it in a production client.

Typical authentication errors include a JSON object with an `error` string. Login can return `400` for invalid student credentials, `401` for admin login failures/unauthorized role, and protected routes can return `401` for a missing token or `403` for an invalid/expired token.

### Student endpoints

These endpoints require a Bearer token.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/student/modules` | List modules available to the student |
| `GET` | `/student/modules/:id` | Fetch a module quiz/questions |
| `POST` | `/student/attempts` | Save a completed test attempt |
| `GET` | `/student/dashboard-stats` | Fetch dashboard statistics |
| `GET` | `/student/custom-tests` | Fetch tests assigned to the student |
| `GET` | `/student/leaderboard` | Fetch leaderboard data |
| `GET` | `/student/mistake-vault` | Fetch the student's saved mistakes |
| `GET` | `/student/analytics` | Fetch performance analytics |

Attempt submission body accepted by the controller:

```json
{
  "moduleId": "module-uuid",
  "score": 8,
  "total": 10,
  "customTestId": null,
  "durationMs": 120000,
  "mistakes": []
}
```

The controller defaults `moduleId` and `customTestId` to `null`, `durationMs` to `0`, and `mistakes` to an empty array if omitted. Confirm the expected structure of each mistake item from the student service before implementing it in Swift.

The current request includes `score` and `total`, which means the controller accepts a client-provided score. For competitive or consequential tests, the backend should receive answers and calculate the score itself so a modified client cannot submit an inflated score.

### Faculty endpoints

These endpoints require a Bearer token and a `FACULTY` role.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/faculty/students` | List students associated with the faculty member |
| `GET` | `/faculty/questions` | Fetch questions available for test creation |
| `POST` | `/faculty/tests` | Create a custom test |
| `GET` | `/faculty/tests` | List tests created by the faculty member |

Create-test body:

```json
{
  "title": "Chapter 1 practice",
  "questionIds": ["question-uuid-1", "question-uuid-2"]
}
```

The current controller reads only `title` and `questionIds`. Scheduling, duration, assigned-student selection, and other test settings are not part of the visible route/controller contract. Add backend support and define the contract before designing mobile controls for those features.

### Admin endpoints

These endpoints require a Bearer token and an `ADMIN` role.

| Method | Endpoint | Request | Purpose |
|---|---|---|---|
| `POST` | `/admin/documents/upload` | Multipart form with file field `file` | Upload a document for question processing |
| `GET` | `/admin/documents` | None | List document processing jobs |
| `GET` | `/admin/questions/needs-review` | None | List questions awaiting review |
| `PATCH` | `/admin/questions/:id` | JSON | Update and publish a question |
| `GET` | `/admin/documents/:jobId/sync` | None | Fetch/process a document job from S3 |

For question publishing, the controller passes the request body to a service that reads `questionText`, `options`, and `correctAnswer`, then changes the question status to `PUBLISHED`.

The document upload route uses a multipart upload with the field name `file`. Confirm allowed file types, maximum file size, and upload failure handling with the backend before building the upload UI.

The sync route invokes processing from S3 and may return `202` when processing is not complete, or `200` on successful synchronization. Although its URL contains `sync`, verify the actual job state transitions and response bodies before treating it as a polling endpoint.

### Operational endpoint

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/health` | None | Check that the backend is running |

This endpoint is at the server root, not under `/api`.

### Webhook (not for the mobile app)

`POST /api/webhook/pdf-processed` accepts `{ "jobId": "...", "payload": ... }` and starts PDF processing. It is intended for a processing pipeline callback, not an iOS client. It has no authentication middleware in the current route definition. Do not call it from the app; the backend should secure it for its intended caller.

### REST response and model discovery

The route and controller source confirms endpoint names, access checks, and some request fields, but it does not fully document every response shape. Before writing final Swift `Codable` models, inspect the corresponding services and capture representative responses for:

- Module lists and module quiz questions.
- Saved attempts and mistake items.
- Dashboard statistics and analytics.
- Assigned custom tests and leaderboard entries.
- Faculty questions, students, and tests.
- Document jobs, review questions, and publish responses.

Create a small API contract document with success and error examples for each endpoint. Handle optional and nullable fields explicitly in Swift.

## 3. Socket.IO battle API

Battles use Socket.IO events on the server root URL rather than REST routes. The event names below come from the current `backend/src/modules/battle/battle.gateway.ts` implementation.

### Client-to-server events

| Event | Data | Purpose |
|---|---|---|
| `join_queue` | `{ "userId": "..." }` | Join matchmaking |
| `leave_queue` | No required data | Leave matchmaking queue |
| `create_private_room` | `{ "userId": "..." }` | Create a private battle room |
| `join_private_room` | `{ "userId": "...", "roomId": "..." }` | Join a private room |
| `cancel_private_room` | `{ "roomId": "..." }` | Cancel a private room |
| `join_battle` | `{ "battleId": "...", "userId": "..." }` | Join/resynchronize a battle |
| `submit_answer` | `{ "battleId": "...", "userId": "...", "optionKey": "...", "questionIndex": 0 }` | Submit an answer |

### Server-to-client events

| Event | When to handle it |
|---|---|
| `private_room_created` | A private room was created; show its room code |
| `room_error` | Room join/create failed; show the supplied message |
| `match_found` | A match started; set up players, questions, and battle state |
| `battle_sync` | Reconcile question index, scores, lock state, and claimed state after joining/reconnecting |
| `answer_incorrect` | The current user's answer was wrong |
| `opponent_missed` | The opponent missed the current question |
| `question_resolved` | A question was claimed or resolved; update scores and reveal answer as provided |
| `next_question` | Advance to the next question and update scores |
| `battle_completed` | Show final scores, winner/draw, and ELO changes |

The gateway's payload fields include:

- `private_room_created`: `roomId`.
- `room_error`: `message`.
- `match_found`: `battleId`, `p1Id`, `p2Id`, and `questions`.
- `battle_sync`: `currentQIndex`, `p1Score`, `p2Score`, `p1Id`, `p2Id`, `questionClaimed`, `claimedBy`, and `isLocked`.
- `answer_incorrect`: `questionIndex`, `selectedOption`.
- `opponent_missed`: `questionIndex`.
- `question_resolved`: `questionIndex`, `claimedBy`, `isCorrect`, `correctAnswer`, `selectedOption`, `p1Score`, and `p2Score`.
- `next_question`: `currentQIndex`, `p1Score`, and `p2Score`.
- `battle_completed`: `battleId`, `p1Score`, `p2Score`, `winnerId`, `isDraw`, and `eloChanges` keyed by user ID.

### Realtime security and behavior work required

Review these points before shipping battles:

1. **Authenticate the Socket.IO connection.** The current event handlers accept `userId` in event payloads and do not visibly verify that the caller owns that identity. A client can potentially claim another user's ID. Send the REST token during the Socket.IO handshake and validate it server-side; derive the user ID from the verified token rather than trusting event payloads.
2. **Check question-answer disclosure.** `match_found` currently sends question objects fetched from the database, including `correctAnswer`. Confirm whether exposing the answer to clients before the question is resolved is intentional. Prefer sending a public question shape without the answer and reveal it only when the server resolves the question.
3. **Make battle state resilient.** The in-memory matchmaking queue, private-room map, and active-battle map are lost if the server process restarts. Decide whether that is acceptable or persist/restore state for production.
4. **Handle identity and authorization for every event.** Check that only battle participants can join, sync, submit answers, or cancel a room, and validate question indexes and answer keys on the server.
5. **Define disconnect behavior.** Decide whether a disconnected player can reconnect, how long an opponent waits, and what happens if a player leaves permanently.

## 4. Recommended Swift app architecture

Use **SwiftUI** for the interface. Keep networking, data models, session handling, and feature logic separate from views. A possible project layout is:

```text
AptiRush/
  App/
  Core/
    Networking/
    Authentication/
    Storage/
    Configuration/
  Models/
  Features/
    Login/
    Dashboard/
    Modules/
    Tests/
    Results/
    Battles/
    Analytics/
    Faculty/
    Admin/
```

Recommended implementation choices:

- **Networking:** `URLSession` with async/await; a shared API client attaches the Bearer token and decodes backend errors.
- **Data models:** Swift `Codable` request/response types, with optional fields where the backend can return `null` or omit a value.
- **Authentication:** a session store backed by Keychain; fetch `/auth/profile` on launch to validate a stored session.
- **Navigation:** SwiftUI navigation with role-aware entry points.
- **Realtime:** a Socket.IO client library compatible with the server version; explicit connection state, event listeners, and cleanup.
- **Uploads:** multipart `URLSession` upload for admin document upload if that feature is in scope.
- **Configuration:** separate API and socket URLs for development, staging, and production.
- **Error handling:** map HTTP status codes and `{ "error": "..." }` responses to clear user-facing states; handle no network, timeouts, invalid data, and expired sessions.
- **State management:** keep feature state in observable view models or another consistent SwiftUI state approach, rather than embedding network calls in view bodies.

## 5. Detailed development roadmap

### Phase 1: Confirm scope and API contract

1. Choose which roles the first iOS version supports. A student-first release is the smallest useful scope; faculty and admin can follow.
2. For every endpoint above, capture representative success and error responses.
3. Inspect student and faculty services to document response fields and the exact mistake submission format.
4. Confirm how faculty accounts are provisioned.
5. Confirm whether assigned tests have a start time, duration, deadline, assignment list, or attempt limit.
6. Confirm how PDF processing status changes and how a client should check job progress.
7. Decide whether the app must support offline practice or only survive temporary connectivity loss.
8. Document the Socket.IO event schemas and authentication behavior.

**Deliverable:** an agreed MVP feature list and API contract with JSON examples.

### Phase 2: Create the Xcode project and mobile foundation

1. Create a SwiftUI iOS app and set the bundle identifier, deployment target, signing team, and app display name.
2. Set up separate development and production URL configuration.
3. Add an API client using `URLSession` and async/await.
4. Add Codable models for login, registration, profile, modules, questions, attempts, and backend errors.
5. Add Keychain token persistence and a session store.
6. Add shared loading, empty, error, and offline states.
7. Establish app navigation and a basic design system for typography, colors, spacing, forms, and buttons.

**Deliverable:** the app launches, can reach the configured backend, and has a reusable authenticated request path.

### Phase 3: Authentication and account lifecycle

1. Build student login and registration screens.
2. On successful login, persist the token in Keychain and keep the returned user profile in session state.
3. On app launch, call `/auth/profile` when a token exists.
4. On `401`/`403`, clear the invalid session and route to login.
5. Add sign-out by clearing the local token and session data.
6. Add admin login only if an admin mobile workflow is approved for the MVP.
7. Do not implement faculty sign-up until the backend has a faculty account creation process.

**Deliverable:** complete sign-in, session restore, expiry handling, and sign-out behavior.

### Phase 4: Student dashboard and learning experience

Build in this order:

1. Dashboard statistics using `/student/dashboard-stats`.
2. Module list using `/student/modules`.
3. Module quiz detail using `/student/modules/:id`.
4. Assigned test list using `/student/custom-tests`.
5. Quiz-taking UI, answer selection, progress, and timer behavior if applicable.
6. Attempt submission using `/student/attempts`.
7. Results and review experience.
8. Mistake vault, analytics, and leaderboard.

Before implementing timed or competitive tests, decide who owns scoring and timing. The current attempt route accepts score and total from the client; the backend should validate answers and calculate authoritative scores for competitive assessments. Define whether a timer continues while the app is backgrounded or closed, and preserve in-progress answers through temporary network failures.

**Deliverable:** a student can log in, study a module, complete an attempt, and review the outcome.

### Phase 5: Battle experience

Implement private rooms first, then matchmaking:

1. Connect to Socket.IO using the authenticated session token.
2. Create a private room and display its code.
3. Join a room or enter the matchmaking queue.
4. Process `match_found` and set up the players and initial game state.
5. Render the current question and submit answers.
6. Handle `answer_incorrect`, `opponent_missed`, `question_resolved`, and `next_question` events.
7. Show the final result from `battle_completed`, including score, winner/draw, and ELO changes.
8. On reconnect, use `join_battle` and reconcile from `battle_sync`.
9. Remove event listeners and leave queues/rooms when the user exits.

Test duplicate events, Wi-Fi/cellular switching, app suspension, disconnects during an answer, and reconnect after the server advances. Make server events authoritative for score and question progression.

**Deliverable:** a battle can be completed reliably across normal reconnect scenarios.

### Phase 6: Faculty features (if included)

1. Display faculty students using `/faculty/students`.
2. Display available questions using `/faculty/questions`.
3. Build question selection and test creation using `POST /faculty/tests`.
4. Show existing tests using `GET /faculty/tests`.
5. Add scheduling, duration, targeting, or result reporting only after the backend supports and documents those fields.

**Deliverable:** faculty can create and review the test types supported by the backend.

### Phase 7: Admin document and question review (if included)

1. Select a document using iOS document picker.
2. Upload it as multipart field `file` to `/admin/documents/upload` and show progress.
3. Display processing jobs from `/admin/documents`.
4. Check processing state using the confirmed job workflow.
5. Display questions from `/admin/questions/needs-review`.
6. Edit question text, options, and correct answer, then publish via `PATCH /admin/questions/:id`.
7. Show upload, processing, and review failures with actionable retry behavior.

**Deliverable:** an admin can manage the document processing/review flow from an iPhone, if needed.

### Phase 8: Backend hardening and mobile readiness

Before production, address or explicitly accept these current backend gaps:

- Authenticate Socket.IO connections and derive user identity from a verified token.
- Validate participant membership for all battle events.
- Avoid sending correct answers in `match_found` if they should remain hidden.
- Add server-side answer validation/scoring for tests and validate submitted attempt payloads.
- Define refresh-token support or document the 24-hour sign-in cycle.
- Add input validation to test creation and attempt submission.
- Standardize response schemas and error formats.
- Confirm upload file type and size limits.
- Confirm production REST and Socket.IO origins/configuration.
- Protect or disable public admin registration if public admin creation is not intended.
- Decide how in-memory battle state should behave across server restarts.
- Secure the PDF webhook for the processing service that is expected to call it.

**Deliverable:** backend behavior and mobile expectations are agreed, secure, and documented.

### Phase 9: Quality, TestFlight, and App Store release

Test using both iOS Simulator and physical iPhones. Cover:

- Fresh install, registration, login, session restore, logout, and expired token.
- Empty data, server errors, timeouts, and intermittent connectivity.
- Different screen sizes, landscape/portrait behavior where appropriate, Dynamic Type, and VoiceOver.
- Test interruptions, backgrounding, timer behavior, answer preservation, and submission retries.
- Socket.IO reconnect, duplicate event handling, and battle completion.
- Faculty/admin role restrictions if those features are included.
- Document selection/upload and processing failure if admin features are included.

Release activities:

1. Configure app icon, launch screen, signing, and App Store Connect app record.
2. Prepare privacy disclosures, support contact, screenshots, and store listing.
3. Distribute a TestFlight build to internal testers.
4. Collect issues, fix release blockers, and create a release candidate.
5. Submit through App Store Connect and monitor the production release.

Review the current Apple submission requirements when preparing the actual release, since platform rules and store requirements can change.

## 6. Suggested first release scope

A manageable initial release is:

- Student registration and login.
- Student dashboard and modules.
- Quiz/test taking and attempt results.
- Mistake vault and basic analytics.

Add live battles after Socket.IO identity, authorization, answer disclosure, and reconnect behavior are addressed. Add faculty and admin screens if iOS workflows are needed by those users.

## 7. Key decisions to make before implementation

1. Is the first release student-only, or must it include faculty/admin?
2. Should the iOS app support offline study, or only recover from short network interruptions?
3. Are tests timed, scheduled, or assigned to specific students?
4. Should attempts be scored only by the backend? (Recommended for reliable and fair results.)
5. Do battles need to survive backend restarts and prolonged disconnections?
6. Who creates faculty accounts, and should admin account creation be available from a client?

These decisions affect both the Swift UI and the backend API contract. Confirm them before locking screen flows or data models.
