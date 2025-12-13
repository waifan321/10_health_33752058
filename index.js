// Application entry point for Health app web
// Import framework and database modules
var express = require ('express')
var ejs = require('ejs')
var mysql = require('mysql2');
const path = require('path')
var session = require ('express-session')
const expressSanitizer = require('express-sanitizer')
// Load environment variables from .env (if present)
require('dotenv').config()

// Create the express application object
const app = express()
const port = process.env.PORT || 8000
// Configurable base path for hosting under subdirectory (e.g., /usr/292 on doc.gold)
// Defaults to '' locally so / works in development
const BASE_PATH = process.env.HEALTH_BASE_PATH || ''

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs')

// Define the database connection pool using mysql2's connection pooling.
// Updated to match the coursework's required env names and defaults.
const db = mysql.createPool({
    host: process.env.HEALTH_HOST || 'localhost',
    user: process.env.HEALTH_USER || 'health_app',
    password: process.env.HEALTH_PASSWORD || 'qwertyuiop',
    database: process.env.HEALTH_DATABASE || 'health',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONN_LIMIT) || 10,
    queueLimit: 0,
});
// Expose the pool as a global so route modules can access it via `db`.
global.db = db;

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    }
}))

// Parse URL-encoded request bodies (forms)
app.use(express.urlencoded({ extended: true }))

// Create an input sanitizer (protects against basic XSS in text fields)
app.use(expressSanitizer())


// Serve static assets from the `public` folder (CSS, client JS, images)
// Mount under BASE_PATH so assets resolve correctly on doc.gold
app.use(express.static(path.join(__dirname, 'public')))

// Application-wide data available in EJS views via `shopData`
app.locals.shopData = {shopName: "Health & Fitness Tracker"}

// Load the route handlers
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)

// Load the route handlers for /users
const usersRoutes = require('./routes/users')
app.use('/users', usersRoutes)

// Load the route handlers for /workouts
const workoutsRoutes = require('./routes/workouts')
app.use('/workouts', workoutsRoutes)

// Load the route handlers for /health-metrics
const metricsRoutes = require('./routes/metrics')
app.use('/metrics', metricsRoutes)

// Load API routes (machine-readable endpoints)
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)

// Start the web server
app.listen(port, () => console.log(`Server listening on port ${port} at base '${BASE_PATH}'`))