# Buildora

Buildora is a full-stack MERN construction and interior marketplace where customers post project requirements, contractors submit quotations, and both roles chat in real time.

## Tech Stack

- React, Tailwind CSS, React Router, Axios, Socket.io client
- Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs
- Socket.io realtime chat
- Multer and Cloudinary uploads

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Configure environment variables:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start MongoDB locally or use MongoDB Atlas, then update `backend/.env`.

4. Run the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Flow

- Register as a `customer` and post a project with images or floor plans.
- Register as a `contractor`, create a profile, browse projects, and submit a bid.
- The customer can accept or reject bids and open a one-to-one chat with the contractor.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id/status`
- `POST /api/bids`
- `PATCH /api/bids/:id/status`
- `GET /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/start`
- `GET /api/users/contractors`
- `PUT /api/users/profile`

## Notes

- Image uploads use Cloudinary when credentials are present. In development, the API still accepts requests without files.
- Socket events: `join`, `sendMessage`, `typing`, `disconnect`.
