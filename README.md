# Aureolin - University Admission Platform Backend

Aureolin is a university admission preparation and mentoring platform backend built with Node.js, Express, and MongoDB. It provides authentication, course management, exam management, student results, and academic Q&A functionality.

## Features

* **Authentication & Authorization**: JWT-based authentication with role-based access control for `student`, `teacher`, and `admin`.
* **User Management**: Student, teacher, and admin registration, login, profile management, and role management.
* **Course Management**: Create, update, delete, and retrieve courses with student enrollment.
* **Exam Management**: Create and manage MCQ exams, questions, duration, marks, negative marking, and schedules.
* **Exam Submission & Results**: Submit exams, calculate scores, track correct/wrong/unanswered questions, accuracy, and performance.
* **Question Bank**: Manage reusable MCQ questions with subjects, options, correct answers, and explanations.
* **Q&A System**: Students can ask academic questions and teachers can provide answers.
* **Study Materials & Notices**: Course-related materials and notices.
* **Dashboard & Statistics**: Student, teacher, and admin statistics calculated from existing data.

## Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB with Mongoose
* **Authentication**: JSON Web Tokens (JWT)
* **Password Security**: bcryptjs
* **Configuration**: dotenv
* **API**: RESTful API
* **CORS**: cors

## Getting Started

### Prerequisites

* Node.js
* MongoDB Atlas account or local MongoDB instance
* Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd aureolin-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Run the application:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

The API follows RESTful principles.

### Key Endpoints

* **Auth**: `/api/auth` — register, login, current user
* **Courses**: `/api/courses` — list and manage courses
* **Exams**: `/api/exams` — create, retrieve, and manage exams
* **Exam Submission**: `/api/exams/:id/submit` — submit an exam
* **Attempts**: `/api/attempts` — student exam attempts and results
* **Q&A**: `/api/qna` — ask questions and provide answers

### Core Models

The backend uses six primary MongoDB models:

* `User`
* `Course`
* `Exam`
* `Question`
* `Attempt`
* `QnA`

## Project Structure

```text
backend/
├── models/
├── controllers/
├── routes/
├── middleware/
├── config/
├── utils/
├── app.js
└── server.js
```

## Deployment

The backend can be deployed on platforms such as **Vercel** or other Node.js hosting services.

Before deployment:

* Add all environment variables to the hosting platform.
* Configure the MongoDB connection properly.
* Ensure the production environment uses a secure JWT secret.
* Configure CORS for the frontend domain.

## License

ISC
