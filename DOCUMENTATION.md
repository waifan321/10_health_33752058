Outline

This Health & Fitness Tracker is a Node.js + Express web application that enables registered users to log in, record workouts (activity type, duration, calories) and health metrics (weight, heart rate, steps, sleep), and view summaries and recent entries. It offers search, history, and simple analytics to support healthy habits. Data is stored in a MySQL database with secure password hashing and session-backed authentication. The UI uses EJS templates, server-side routing, and basic input validation/sanitization to reduce common risks. The app is designed to run locally and (optionally) under a subdirectory on university hosting with minimal configuration.

Architecture

- App Tier: Node.js (Express), EJS views, session management, input validation/sanitization.
- Data Tier: MySQL via mysql2 pool; relational tables for users, workouts, health metrics, audit logs.
- Diagram: Browser → Express routes → EJS views; Express → mysql2 pool → MySQL DB; Sessions via express-session cookies.

Data Model

- Tables:
  - users(id, username, first_name, last_name, email, hashedPassword)
  - workouts(id, user_id, activity_type, duration_minutes, calories_burned, workout_date, notes, created_at)
  - health_metrics(id, user_id, metric_date, weight_kg, heart_rate, steps, sleep_hours, notes, created_at)
  - audit(id, username, success, event_time, ip_address, message)
- Diagram: users (1) → workouts (many); users (1) → health_metrics (many).

User Functionality

- Registration & Login: Users register with email, username, and strong password; login compares bcrypt hash against stored value. Views: [views/register.ejs](views/register.ejs), [views/login.ejs](views/login.ejs). Authentication routes in [routes/users.js](routes/users.js).
- Dashboard: Shows latest workouts and health metrics for the logged-in user. Route/View: [routes/main.js](routes/main.js), [views/dashboard.ejs](views/dashboard.ejs).
- Workouts: Add workouts, list recent workouts, and search by activity type or date. Routes/Views: [routes/workouts.js](routes/workouts.js), [views/workout_form.ejs](views/workout_form.ejs), [views/list.ejs](views/list.ejs), [views/search.ejs](views/search.ejs), [views/search_result.ejs](views/search_result.ejs).
- Health Metrics: Log weight, heart rate, steps, sleep; view history and reports with average/min/max. Routes/Views: [routes/metrics.js](routes/metrics.js), [views/metrics_add.ejs](views/metrics_add.ejs), [views/metrics_history.ejs](views/metrics_history.ejs), [views/metrics_report.ejs](views/metrics_report.ejs).
- Audit: Displays login attempts (success/failure). Route/View: [routes/users.js](routes/users.js), [views/audit.ejs](views/audit.ejs).
- Suggested screenshots: Login page, Dashboard, Add Workout, Add Metrics, Metrics Report, Search Results, Audit Log.

Advanced Techniques

- Secure password hashing with bcrypt:
  - Hash: see [routes/users.js](routes/users.js#L20-L44) using `bcrypt.hash(plainPassword, saltRounds, ...)`.
  - Verify: see [routes/users.js](routes/users.js#L109-L150) using `bcrypt.compare(req.body.password, hashedPassword, ...)`.
- Connection pooling and parameterized queries (prevents SQL injection):
  - Pool setup in [index.js](index.js#L20-L33).
  - Examples:
    - Workouts search in [routes/workouts.js](routes/workouts.js#L19-L52): `db.query("SELECT * FROM workouts WHERE user_id = ? AND activity_type LIKE ? ...", [userId, '%' + searchTerm + '%'])`.
    - Metrics insert in [routes/metrics.js](routes/metrics.js#L29-L55): `db.query("INSERT INTO health_metrics (...) VALUES (?,?,?,?,?,?,?)", newrecord)`.
- Input validation and sanitization:
  - `express-validator` on forms in [routes/workouts.js](routes/workouts.js#L58-L87) and [routes/metrics.js](routes/metrics.js#L16-L29).
  - `express-sanitizer` used to sanitize free-text inputs (e.g., [routes/users.js](routes/users.js#L49-L62)).
- Session persistence before redirect:
  - Ensures reliable auth transitions: [routes/users.js](routes/users.js#L126-L145) uses `req.session.save(() => res.redirect('/dashboard'))`.
