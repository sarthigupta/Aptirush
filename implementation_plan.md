# Platform Implementation File

Based on your functional requirements, here is the exact implementation structure mapped to your MVP and Phase 2 goals.

## Tech Stack
- **Frontend**: React.js / Next.js
- **Backend**: Node.js (Express) OR Python (FastAPI - recommended for PDF parsing)
- **Database**: PostgreSQL / MongoDB
- **Real-time Sync**: Socket.io / WebSockets (for live tests & 1v1)
- **PDF Extraction**: PyPDF/pdfplumber + LLM API (for extracting Q&As into structured formats)

## MVP Implementation

### 1. Login & Roles
- **Implementation**: Implement JWT authentication. Define 3 roles: `Student`, `Faculty`, `Admin`. Serve different dashboards based on the user's role so they see their respective modules upon logging in.

### 2. PDF Question Upload -> Question Bank
- **Implementation**: 
  - Create a file upload endpoint for faculty/admin to upload the CRPC PDF (or any module PDF).
  - Extract raw text from the PDF on the backend.
  - Pass the text to an AI parsing service to extract questions, options, and correct answers.
  - Save the structured output directly into the `Questions` table in the database.

### 3. Practice Module
- **Implementation**: Create an endpoint to fetch questions from the Question Bank. Build a UI for students to practice these questions in a non-timed, self-paced environment.

### 4. Test Creation
- **Implementation**: Build a Faculty UI to select specific questions from the Question Bank, set a start time, test duration, and generate a unique Test ID.

### 5. Test Attempt (Simultaneous)
- **Implementation**: 
  - Students join the lobby using the Test ID.
  - Use WebSockets to broadcast a global "Start" event so all students begin at the exact same time.
  - Auto-submit answers to the backend when the timer concludes.

### 6. Result & Leaderboard
- **Implementation**: Calculate scores server-side immediately upon submission. Create a leaderboard endpoint that sorts students by score and displays it.

---

## Phase 2 Implementation

### 1. 1-vs-1 Challenge
- **Implementation**: 
  - Create a challenge endpoint where a student gets a unique `Challenge Code`.
  - The opponent inputs the code to join the room.
  - Use WebSockets to create a private room between the two students to stream questions and live scores.

### 2. Coding Questions
- **Implementation**: Integrate a secure code execution sandbox API (like Piston or an isolated Docker container) to compile, run, and test student code against predefined test cases.

### 3. Advanced Test Analysis & Topic-wise Weakness Detection
- **Implementation**: 
  - Tag every question in the Question Bank with specific `Topics`.
  - On test submission, log the topics of incorrectly answered questions.
  - Build an analysis dashboard that aggregates wrong answers by topic to show students their weak areas and provide explanations for wrong answers.
