// Health Metrics routes module: handles health measurements tracking and reporting
const express = require("express")
const router = express.Router()
const { check, validationResult } = require('express-validator');

// Access the global database connection
const db = global.db

// Base path (optional); defaults to empty for localhost
const BASE = process.env.HEALTH_BASE_PATH || '/usr/292'

// Helper to send an HTML meta-refresh redirect (instead of res.redirect)
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

// Middleware to require a logged-in session
const redirectLogin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return sendRedirect(res, '/users/login')
    }
    next()
}

// Display form to log health metrics
router.get('/add', redirectLogin, function(req, res, next) {
    res.render('metrics_add.ejs')
});

// Handle health metrics form submission
router.post('/added', redirectLogin, [
    check('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20-300 kg'),
    check('heart_rate').isInt({ min: 30, max: 200 }).withMessage('Heart rate must be between 30-200 bpm'),
    check('steps').isInt({ min: 0, max: 100000 }).withMessage('Steps must be 0-100000'),
    check('sleep').isFloat({ min: 0, max: 24 }).withMessage('Sleep must be 0-24 hours')
], function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('metrics_add.ejs')
    }

    // Sanitize inputs
    const weight = parseFloat(req.body.weight)
    const heartRate = parseInt(req.body.heart_rate)
    const steps = parseInt(req.body.steps)
    const sleepHours = parseFloat(req.body.sleep)
    const notes = req.sanitize ? req.sanitize(req.body.notes || '') : (req.body.notes || '')
    const metricDate = req.body.date || new Date().toISOString().split('T')[0]
    const userId = req.session.userId

    // Prepare SQL to insert the health metrics
    const sqlquery = "INSERT INTO health_metrics (user_id, metric_date, weight_kg, heart_rate, steps, sleep_hours, notes) VALUES (?,?,?,?,?,?,?)"
    const newrecord = [userId, metricDate, weight, heartRate, steps, sleepHours, notes]

    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            return next(err)
        }
        res.render('metric_added.ejs', {
            message: `Health metrics logged successfully for ${metricDate}!`,
            weight: weight,
            heartRate: heartRate,
            steps: steps,
            sleepHours: sleepHours
        })
    })
});

// Show health metrics history
router.get('/history', redirectLogin, function(req, res, next) {
    const userId = req.session.userId
    const sqlquery = "SELECT * FROM health_metrics WHERE user_id = ? ORDER BY metric_date DESC LIMIT 30"

    db.query(sqlquery, [userId], (err, result) => {
        if (err) {
            return next(err)
        }
        res.render('metrics_history.ejs', { metrics: result })
    })
});

// Get health metrics for a specific date range
router.get('/report', redirectLogin, function(req, res, next) {
    const userId = req.session.userId
    const startDate = req.query.start_date || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    const endDate = req.query.end_date || new Date().toISOString().split('T')[0]

    const sqlquery = "SELECT * FROM health_metrics WHERE user_id = ? AND metric_date BETWEEN ? AND ? ORDER BY metric_date DESC"
    
    db.query(sqlquery, [userId, startDate, endDate], (err, result) => {
        if (err) {
            return next(err)
        }

        // Calculate statistics
        let stats = {
            avgWeight: 0,
            avgHeartRate: 0,
            totalSteps: 0,
            avgSleep: 0,
            count: result.length
        };

        if (result.length > 0) {
            let totalWeight = 0, totalHR = 0, totalSleep = 0;
            result.forEach(metric => {
                totalWeight += metric.weight_kg || 0;
                totalHR += metric.heart_rate || 0;
                totalSleep += metric.sleep_hours || 0;
                stats.totalSteps += metric.steps || 0;
            });
            stats.avgWeight = (totalWeight / result.length).toFixed(1);
            stats.avgHeartRate = Math.round(totalHR / result.length);
            stats.avgSleep = (totalSleep / result.length).toFixed(1);
        }

        res.render('metrics_report.ejs', {
            metrics: result,
            startDate: startDate,
            endDate: endDate,
            stats: stats
        })
    })
});

// Search health metrics
router.get('/search', redirectLogin, function(req, res, next) {
    res.render('metrics_search.ejs')
});

// Export the router object
module.exports = router
