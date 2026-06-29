# Ticketing System

A modern full-stack Ticket Management System built with Django REST Framework and React. The application provides role-based access control, real-time messaging, file attachments, dashboards, analytics, and ticket lifecycle management.

---

## Features

### Authentication
- JWT Authentication
- User Registration & Login
- Profile Management
- Change Password
- Role-Based Authorization

### Ticket Management
- Create Tickets
- Update Tickets
- Delete Tickets
- Assign Tickets to Agents
- Ticket Categories
- Priority Levels
- Status Management
- Search & Filtering
- Pagination

### Real-Time Communication
- Live Ticket Chat
- Instant Message Updates
- Real-Time Notifications
- Socket.IO Integration

### Attachments
- Upload Files
- Download Attachments
- Image/File Support

### Dashboards

#### User Dashboard
- My Tickets
- Ticket Statistics
- Ticket History

#### Agent Dashboard
- Assigned Tickets
- Performance Statistics
- Open/Pending/Closed Tickets

#### Admin Dashboard
- User Management
- Agent Management
- Ticket Overview
- Category Management
- System Statistics

### Additional Features
- Activity Logging
- Ticket History
- Excel Export
- Swagger API Documentation
- Responsive UI

---

## Tech Stack

### Backend

- Python
- Django
- Django REST Framework
- JWT Authentication
- Socket.IO
- SQLite
- drf-spectacular
- django-filter

### Frontend

- React
- React Router
- Axios
- Socket.IO Client
- CSS

---

## Project Structure

```
ticketing-system/
│
├── backend/
│   ├── authentication/
│   ├── tickets/
│   ├── users/
│   ├── media/
│   ├── manage.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/ticketing-system.git

cd ticketing-system
```

---

## Backend Setup

Create Virtual Environment

```bash
python -m venv .venv
```

Activate

Windows

```bash
.venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
```

Create Superuser

```bash
python manage.py createsuperuser
```

Run Backend

```bash
python manage.py runserver
```

Backend:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

## API Documentation

Swagger

```
http://127.0.0.1:8000/api/schema/swagger-ui/
```

OpenAPI Schema

```
http://127.0.0.1:8000/api/schema/
```

---

## Roles

### User

- Create Tickets
- Send Messages
- Upload Attachments
- View Own Tickets

### Agent

- View Assigned Tickets
- Reply to Tickets
- Update Ticket Status
- Manage Assigned Tickets

### Admin

- Manage Users
- Manage Categories
- Assign Tickets
- View Analytics
- Full System Access

---

## Ticket Workflow

```
Open
   ↓
Pending
   ↓
Revision
   ↓
Closed
```

---

## API Features

- RESTful API
- JWT Authentication
- Pagination
- Filtering
- Ordering
- File Upload
- Statistics Endpoints

---

## Future Improvements

- Email Notifications
- Push Notifications
- Dark Mode
- Advanced Reporting
- Docker Deployment
- Kubernetes Deployment
- CI/CD Pipeline
- Unit Testing
- Audit Reports

---

## Author

Developed by **Fatemeh Nazari**

Backend Developer

Python • Django • React
