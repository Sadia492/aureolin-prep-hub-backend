# TaskFlow - Project Harmony Backend

TaskFlow is a robust project management backend built with Node.js, Express, and MongoDB. It provides a comprehensive set of features for user authentication, role-based access control, project tracking, task management, and team collaboration.

## Features

- **Authentication & Authorization**: Secure JWT-based authentication with access and refresh tokens. Role-based access control (RBAC) with roles like `admin`, `projectManager`, and `teamMember`.
- **User Management**: Registration, login, profile management, and role assignment.
- **Project Management**: Create, update, delete, and list projects with member management.
- **Task Management**: Create tasks within projects, assign to members, set deadlines, and track status/priority.
- **Comments & Notifications**: Real-time interaction with comments on tasks and automated notifications for task assignments and activities.
- **Analytics & Dashboard**: Stats and progress tracking for projects and tasks.
- **File Uploads**: Integration with Cloudinary for handling attachments.
- **Activity Logging**: Automated tracking of key actions within the system.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/)
- **Validation**: [Joi](https://joi.dev/)
- **File Storage**: [Cloudinary](https://cloudinary.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account or local MongoDB instance

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd taskflow-project-harmony-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_ACCESS_EXPIRATION_MINUTES=30
   JWT_REFRESH_EXPIRATION_DAYS=30
   JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. Run the application:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

The API follows RESTful principles. Base URL: `http://localhost:3000/v1`

### Key Endpoints

- **Auth**: `/v1/auth` (register, login, logout, refresh-tokens)
- **Users**: `/v1/users` (CRUD operations, profile)
- **Projects**: `/v1/projects` (CRUD operations, member management)
- **Tasks**: `/v1/tasks` (CRUD operations, assignment)
- **Comments**: `/v1/comments` (Add, list, delete)
- **Notifications**: `/v1/notifications` (List, mark as read)
- **Analytics**: `/v1/analytics` (Project/Task stats)

## Deployment

This project is configured for deployment on **Vercel**. 
- Ensure all environment variables are added to the Vercel dashboard.
- MongoDB IP whitelisting (`0.0.0.0/0`) is required for Vercel's dynamic IPs.

## License

ISC
