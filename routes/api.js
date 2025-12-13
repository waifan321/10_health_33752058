// API route module: provides machine-readable endpoints for Health & Fitness Tracker
const express = require('express')
const router = express.Router()

// Access the global database connection
const db = global.db

// Base path (optional); defaults to empty for localhost
const BASE = process.env.HEALTH_BASE_PATH || '/usr/292'

// Helper to send an HTML meta-refresh redirect; used for unauthorized HTML clients
const sendRedirect = (res, target) => {
    const url = `${BASE}${target}`
    res.send(`
    <html>
        <head>
            <meta http-equiv="refresh" content="0; URL='${url}'" />
        </head>
        <body>
            Redirecting... <a href="${url}">Click here if not redirected.</a>
        </body>
    </html>
    `)
}

// Middleware to require authentication
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        // For API, keep JSON response to avoid HTML injection into API clients
        return res.status(401).json({ error: 'Unauthorized', redirect: `${BASE}/users/login` })
    }
    next()
}

// GET /api/workouts - return user's workouts as JSON
router.get('/workouts', requireAuth, function (req, res, next) {
    const userId = req.session.userId
    let sqlquery = "SELECT * FROM workouts WHERE user_id = ?"
    let params = [userId]
    
    // Add search filter by activity type
    if (req.query.activity) {
        sqlquery += " AND activity_type LIKE ?"
        params.push('%' + req.query.activity + '%')
    }
    
    // Add date range filter
    if (req.query.startDate) {
        sqlquery += " AND workout_date >= ?"
        params.push(req.query.startDate)
    }
    if (req.query.endDate) {
        sqlquery += " AND workout_date <= ?"
        params.push(req.query.endDate)
    }
    
    // Add sort option
    if (req.query.sort === 'date_asc') {
        sqlquery += " ORDER BY workout_date ASC"
    } else if (req.query.sort === 'calories') {
        sqlquery += " ORDER BY calories_burned DESC"
    } else {
        sqlquery += " ORDER BY workout_date DESC"
    }
    
    // Execute the sql query with parameterized queries
    db.query(sqlquery, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message || err })
        }
        res.json({ 
            success: true,
            count: result.length,
            workouts: result 
        })
    })
})

// GET /api/metrics - return user's health metrics as JSON
router.get('/metrics', requireAuth, function (req, res, next) {
    const userId = req.session.userId
    let sqlquery = "SELECT * FROM health_metrics WHERE user_id = ?"
    let params = [userId]
    
    // Add date range filter
    if (req.query.startDate) {
        sqlquery += " AND metric_date >= ?"
        params.push(req.query.startDate)
    }
    if (req.query.endDate) {
        sqlquery += " AND metric_date <= ?"
        params.push(req.query.endDate)
    }
    
    // Add sort option
    if (req.query.sort === 'date_asc') {
        sqlquery += " ORDER BY metric_date ASC"
    } else {
        sqlquery += " ORDER BY metric_date DESC"
    }
    
    // Execute the sql query
    db.query(sqlquery, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message || err })
        }
        res.json({
            success: true,
            count: result.length,
            metrics: result
        })
    })
})

// GET /api/stats - return user's fitness statistics as JSON
router.get('/stats', requireAuth, function (req, res, next) {
    const userId = req.session.userId
    
    // Get workout statistics
    const workoutSql = `
        SELECT 
            COUNT(*) as total_workouts,
            SUM(duration_minutes) as total_duration,
            SUM(calories_burned) as total_calories,
            AVG(calories_burned) as avg_calories,
            MAX(duration_minutes) as longest_workout
        FROM workouts 
        WHERE user_id = ?
    `
    
    db.query(workoutSql, [userId], (err, workoutStats) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        
        // Get health metrics statistics
        const metricsSql = `
            SELECT 
                COUNT(*) as total_records,
                AVG(weight_kg) as avg_weight,
                MIN(weight_kg) as min_weight,
                MAX(weight_kg) as max_weight,
                AVG(heart_rate) as avg_heart_rate,
                AVG(steps) as avg_steps,
                AVG(sleep_hours) as avg_sleep
            FROM health_metrics 
            WHERE user_id = ?
        `
        
        db.query(metricsSql, [userId], (err, metricsStats) => {
            if (err) {
                return res.status(500).json({ error: err.message })
            }
            
            res.json({
                success: true,
                workouts: workoutStats[0],
                metrics: metricsStats[0]
            })
        })
    })
})

module.exports = router
