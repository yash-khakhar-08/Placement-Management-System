# Placement & Interview Management System (PIMS)

A centralized web application designed to manage college placement drives, walk-in/off-campus interviews, and track candidate progress across various interview rounds. It provides role-based dashboards for Admins, Candidates, and Interviewers to streamline the entire recruitment pipeline.

## Features

- **Role-Based Access Control:** Secure JWT-based authentication for Admin, Candidate, and Interviewer roles.
- **College Placement Management:** Create placement sessions, define multiple interview rounds, and assign interviewers.
- **Walk-in/Off-Campus Interviews:** Post job openings, allow candidate registration, and manage walk-in drives.
- **Candidate Tracking:** Real-time application tracking mapping candidates through their respective interview rounds and result statuses.
- **Interviewer Portal:** Dedicated dashboard for assigned interviewers to provide structured feedback and mark selection status during their assigned rounds.
- **Resume Management:** Integrated file upload system for candidates to submit resumes.

## Tech Stack

### Frontend
- **Framework:** React with Vite
- **Styling:** Tailwind CSS, clsx, tailwind-merge
- **Routing:** React Router DOM
- **From Handling & Validation:** React Hook Form, Yup
- **API Communication:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js, Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **File Uploads:** Multer

## Folder Structure

```
/
├── backend/                  # Node.js Express backend
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # API route controllers
│   ├── middlewares/          # Custom middlewares (auth, file upload, etc.)
│   ├── models/               # Sequelize ORM models
│   ├── routes/               # Express API routes
│   ├── services/             # Core business logic layer
│   ├── uploads/              # Uploaded candidate resumes
│   ├── app.js                # Main Express server entry point
│   ├── create_db.js          # Script to initialize the MySQL database
│   └── sync.js               # Script to sync Sequelize models
│
└── frontend/                 # React Vite frontend
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── hooks/            # Custom React hooks
    │   ├── layouts/          # Application layouts (Sidebars, Navbars)
    │   ├── pages/            # View components mapping to routes
    │   └── services/         # API call services
```

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [MySQL](https://www.mysql.com/) server running locally

### 1. Database Configuration
1. Ensure your local MySQL server is running.
2. The default configuration connects with the following credentials:
   - **Username:** `root`
   - **Password:** `your_db_password`
   - **Host:** `127.0.0.1`
   - **Database Name:** `pims_db`

*(Note: If your local MySQL setup uses a different username or password, you will need to update the connection strings in `backend/create_db.js`, `backend/config/db.js`, and your environment variables accordingly.)*

### 2. Backend Setup
Navigate to the `backend` directory and set up the server:

```bash
cd backend

# Install dependencies
npm install

# Initialize the database (this will create `pims_db`)
node create_db.js

# Sync models to create tables (Ensure your database is created first)
node sync.js

# Start the development server
npm run dev
# Note: if `dev` script isn't defined, you can start the server via nodemon:
# npx nodemon app.js
```
The backend server will typically run on `http://localhost:5000` (or as defined in your `.env` / `app.js`).

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, and set up the client application:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend application will start and can be accessed at `http://localhost:5173`.

## Environment Variables
If applicable, create a `.env` file in the root of the `/backend` and configure your necessary environment variables like your database connection, JWT secret, and server port.

## Usage Guide
1. **Admin:** Can create new placement drives, add job postings for walk-ins, and assign interviewers.
2. **Candidate:** Can register, upload their resume, apply for jobs/placements, and view their progression through rounds.
3. **Interviewer:** Can log in to view assigned candidates for specific rounds and submit interview feedback/results.
