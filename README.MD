# Health & Fitness Tracker

A comprehensive web application for tracking workouts, health metrics, and fitness progress.

Built with Node.js, Express.js, EJS, and MySQL.

## Quick Start

To install and run:

```bash
npm install
node index.js
```

The application will start on port 8000.

## Overview

Health & Fitness Tracker is an Express.js application that helps users monitor their fitness activities and health metrics. Features include:

- **Workout Logging**: Record fitness activities with duration and calories burned
- **Health Metrics**: Track weight, heart rate, steps, and sleep patterns
- **Search & Analysis**: Search through workouts and generate health reports
- **User Authentication**: Secure registration and login with bcrypt password hashing
- **Audit Logging**: Monitor successful and failed login attempts
- **Responsive Design**: Modern, user-friendly interface

## Requirements

- Node.js (v14+)
- MySQL server (local or remote)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Database

Run the provided SQL scripts to set up the database:

```bash
# Using MySQL client
mysql -u root -p < create_db.sql
mysql -u root -p < insert_test_data.sql
```

Or manually in your MySQL client:
- Run `create_db.sql` to create tables and database user
- Run `insert_test_data.sql` to insert test data including default user

### 3. Environment Configuration

Create a `.env` file in the root directory (optional - defaults are provided):

```
HEALTH_HOST=localhost
HEALTH_USER=health_app
HEALTH_PASSWORD=qwertyuiop
HEALTH_DATABASE=health
HEALTH_BASE_PATH=http://localhost:8000
PORT=8000
```

### 4. Start the Application

```bash
node index.js
```

The app will listen on `http://localhost:8000`

## Default Login Credentials

For testing purposes, default users are created by `insert_test_data.sql`:

**Option 1 (Simple password):**
- **Username**: gold
- **Password**: smiths

**Option 2 (Strong password):**
- **Username**: gold2
- **Password**: smiths123ABC$

## Project Structure

```
.
├── index.js                    # Application entry point
├── routes/
│   ├── main.js                # Home, about, dashboard routes
│   ├── users.js               # Authentication and user management
│   ├── workouts.js            # Workout logging and searching
│   ├── metrics.js             # Health metrics tracking
│   └── api.js                 # API endpoints
├── views/                     # EJS templates
│   ├── index.ejs              # Home page
│   ├── dashboard.ejs          # User dashboard
│   ├── login.ejs              # Login form
│   ├── register.ejs           # Registration form
│   ├── workout_form.ejs       # Workout logging form
│   ├── workout_confirmed.ejs  # Workout confirmation
│   ├── list.ejs               # Workout list
│   ├── metrics_*.ejs          # Health metrics views
│   └── ...
├── public/
│   └── main.css               # Stylesheet
├── create_db.sql              # Database schema
├── insert_test_data.sql       # Sample data
└── package.json               # Dependencies
```

## Key Features

### Workout Tracking
- Log fitness activities (running, gym, cycling, etc.)
- Record duration and automatically calculate calories
- Search and filter workouts by activity type
- View workout history

### Health Metrics
- Daily health tracking (weight, heart rate, steps, sleep)
- Historical data and trend analysis
- Generate reports for date ranges
- Statistical summaries

### User Management
- Secure registration with password validation
- Email verification ready
- Login with audit logging
- Session management

### Security
- Password hashing using bcrypt
- Input sanitization to prevent XSS
- SQL injection protection with parameterized queries
- Session-based authentication
- Audit trail for login attempts

Visit `http://localhost:8000` in your browser.

## dotenv

To avoid hard-coding database credentials in source code the project uses the `dotenv` module. Steps to use it:

- Copy `.env.example` to `.env` and edit values (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`).
- The app loads environment variables from `.env` at startup; `index.js` uses these to configure the MySQL pool.
- Do NOT commit your `.env` file to version control — keep it out of public repositories.

This keeps secrets out of the repo and allows different credentials on the VM or production.

## Routes

- `/` — Home page (`views/index.ejs`)
- `/about` — About page (`views/about.ejs`)
- `/workouts/list` — List all workouts (`views/list.ejs`)
- `/workouts/addworkout` — Form to log a workout (`views/workout_form.ejs`)
- `POST /workouts/workoutadded` — Inserts a workout and shows confirmation (`views/workout_confirmed.ejs`)
- `/workouts/search` — Search workouts by activity type (`views/search.ejs`)
- `/workouts/recent` — Recent workouts from last 7 days (`views/list.ejs`)
- `/metrics/add` — Add health metrics (`views/metrics_form.ejs`)
- `/metrics/history` — View health metrics history (`views/metrics_history.ejs`)
- `/users/register` — Register form (`views/register.ejs`)
- `/users/login` — Login form (`views/login.ejs`)
- `/users/dashboard` — User dashboard (`views/dashboard.ejs`)

## API

The application exposes a JSON API for workouts and health metrics at `/api`.

- `GET /api/workouts` — returns all workouts as JSON.
- `GET /api/metrics` — returns all health metrics as JSON.
- Optional query parameters for workouts:
	- `activity`: substring to match in activity type (case-insensitive). Example: `/api/workouts?activity=running`.
	- `min_duration` and `max_duration`: numeric range filter for workout duration in minutes. Example: `/api/workouts?min_duration=30&max_duration=60`.
	- `sort`: either `activity` or `date` to sort results. Example: `/api/workouts?sort=date`.

Examples:
```
GET /api/workouts
GET /api/workouts?activity=running
GET /api/workouts?min_duration=30&max_duration=60&sort=date
GET /api/metrics
```

The API returns HTTP 500 with a JSON error object if a database error occurs.


## Audit

The application records login attempts (successful and failed) in an `audit` table so administrators can review authentication activity. Implementation details:

- `create_db.sql` includes a `CREATE TABLE audit (...)` statement to store `username`, `success` (0/1), `event_time`, `ip_address`, and a `message`.
- Login attempts are recorded by the `/users/loggedin` route (successful and failed attempts both inserted into `audit`).
- The audit history is viewable at `/users/audit` (renders `views/audit.ejs`).

To create the table and user, run the SQL in `create_db.sql` on your MySQL server (or import the file using your client).

## Validation & Sanitization

This project includes comprehensive server-side validation and input sanitization to reduce malformed input and XSS risks.

- **Registration (`/users/register`)**: `express-validator` checks are applied to ensure:
	- `email` is a valid email address (`isEmail()`),
	- `username` length is between 5 and 20 characters (`isLength()`),
	- `password` meets security requirements:
		- At least 8 characters long
		- Contains uppercase and lowercase letters
		- Contains at least one number
		- Contains at least one special character
	- The register handler also sanitizes `first`, `last`, `username`, and `email` using `express-sanitizer` before storing.

- **Login (`/users/loggedin`)**: the supplied `username` is sanitized before use in audit logging and DB queries.

- **Log Workout (`/workouts/addworkout` → POST `/workouts/workoutadded`)**:
	- `name` (activity type) is required and limited to 50 characters,
	- `price` (duration) must be a positive integer between 1 and 480 minutes.
	- Activity type is sanitized before insertion.

- **Add Health Metrics (`/metrics/add` → POST `/metrics/added`)**:
	- `metric_type` must be one of: weight, heart_rate, steps, sleep_hours
	- `metric_value` must be a positive number
	- All inputs are sanitized before storage.

- **Search (`/workouts/search`)**: all search terms are sanitized before use in queries.

Notes:
- All database queries use parameterized statements to prevent SQL injection.
- EJS escapes output by default when rendering with `<%= %>`. Avoid using unescaped output (`<%- %>`) for user-supplied data.
- Validation failures re-render forms; templates can be extended to display `validationResult(req).array()` for detailed error feedback.

## Notes and Tips

- The app uses a global `db` pool (defined in `index.js`) that route modules access as `db`.
- The database includes three main tables:
	- `users`: stores user credentials with bcrypt-hashed passwords
	- `workouts`: tracks fitness activities with duration and calories
	- `health_metrics`: stores daily health measurements
	- `audit`: logs all login attempts for security monitoring
- Sessions are stored server-side using `express-session` with a secret key.
- If you prefer a POST-Redirect-GET pattern, convert POST handlers to redirect after insertion.
- To run automated tests or CI, set up a test database and adjust credentials in `.env`.
- For production deployment, ensure:
	- Change the session secret in `index.js`
	- Use a strong database password
	- Enable HTTPS
	- Set appropriate CORS policies for the API

## Technologies Used

- **Backend**: Node.js with Express.js
- **Database**: MySQL with `mysql2` driver
- **Templating**: EJS (Embedded JavaScript)
- **Security**: bcrypt for password hashing, express-sanitizer for XSS prevention
- **Validation**: express-validator
- **Session Management**: express-session

