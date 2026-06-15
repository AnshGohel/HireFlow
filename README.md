# JobHive - MERN Job Portal

A full-stack Job Portal application built with the MERN stack. The platform allows employers to post jobs and manage applications while job seekers can browse jobs and apply online.

---

## Features

### Authentication
- User Registration
- User Login
- JWT Authentication
- Role-Based Access Control
- Secure Cookie Authentication

### Job Seeker
- Browse Available Jobs
- View Job Details
- Apply for Jobs
- Upload Resume
- Manage Applications
- Delete Applications

### Employer
- Post New Jobs
- Update Existing Jobs
- Delete Jobs
- View Posted Jobs
- Review Candidate Applications

### File Uploads
- Resume Upload Support
- Cloudinary Integration
- Image Validation
- File Size Validation

---

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- React Hot Toast
- React Icons
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cloudinary
- Express File Upload
- Cookie Parser

---

## Project Structure

```
root
│
├── backend
│   ├── controllers
│   ├── database
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── utils
│   └── server.js
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   └── assets
│   └── vite.config.js
│
└── README.md
```

---

## Environment Variables

### Backend

Create:

`backend/config/config.env`

```env
PORT=4000

DB_URL=your_mongodb_connection_string

JWT_SECRET_KEY=your_secret_key
JWT_EXPIRE=7d

COOKIE_EXPIRE=7

FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend

Create:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/jobhive.git
cd jobhive
```

---

### Backend Setup

```bash
cd backend

npm install
```

Create config file:

```bash
backend/config/config.env
```

Start backend:

```bash
npm run dev
```

Backend runs on:

```bash
http://localhost:4000
```

---

### Frontend Setup

```bash
cd frontend

npm install
```

Create:

```bash
frontend/.env
```

Start frontend:

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

## API Routes

### User

| Method | Endpoint |
|----------|----------|
| POST | /api/v1/user/register |
| POST | /api/v1/user/login |
| GET | /api/v1/user/logout |
| GET | /api/v1/user/getuser |

### Jobs

| Method | Endpoint |
|----------|----------|
| GET | /api/v1/job/getall |
| POST | /api/v1/job/post |
| GET | /api/v1/job/getmyjobs |
| PUT | /api/v1/job/update/:id |
| DELETE | /api/v1/job/delete/:id |
| GET | /api/v1/job/:id |

### Applications

| Method | Endpoint |
|----------|----------|
| POST | /api/v1/application/post |
| GET | /api/v1/application/employer/getall |
| GET | /api/v1/application/jobseeker/getall |
| DELETE | /api/v1/application/delete/:id |

---

## Deployment

### Frontend
- Vercel
- Netlify

### Backend
- Render
- Railway

### Database
- MongoDB Atlas

### File Storage
- Cloudinary

---

## Future Improvements

- Resume PDF Support
- Job Search Filters
- Company Profiles
- Email Notifications
- Saved Jobs
- Admin Dashboard
- Real-Time Messaging

---

## License

This project is open-source and available under the MIT License.

---

## Author

Developed by Nakum using the MERN Stack.