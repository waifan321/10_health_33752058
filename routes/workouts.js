// Workout routes module: handles workout tracking, searching and adding
const express = require("express")
const router = express.Router()
const { check, validationResult } = require('express-validator');

// Access the global database connection
const db = global.db

// Base path for Goldsmiths deployment
const BASE = process.env.HEALTH_BASE_PATH || "";

// Middleware to require a logged-in session for protected routes
const redirectLogin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect(BASE + '/users/login')
    }
    next()
}

// Render the search form for workouts
router.get('/search', redirectLogin, function(req, res, next){
    res.render("search.ejs", { searchType: 'workouts' })
});

// Handle search results for workouts
// Supports searching by activity type or date range
router.get('/search-result', redirectLogin, function (req, res, next) {
    const userId = req.session.userId
    const searchTerm = req.sanitize ? req.sanitize(req.query.search_text || '') : (req.query.search_text || '');
    
    let sqlquery, params;
    
    if (!searchTerm) {
        // No search term - show all user's workouts
        sqlquery = "SELECT * FROM workouts WHERE user_id = ? ORDER BY workout_date DESC"
        params = [userId]
    } else if (req.query.advanced === '1') {
        // Advanced partial search on activity type
        sqlquery = "SELECT * FROM workouts WHERE user_id = ? AND activity_type LIKE ? ORDER BY workout_date DESC"
        params = [userId, '%' + searchTerm + '%']
    } else {
        // Basic exact search on activity type
        sqlquery = "SELECT * FROM workouts WHERE user_id = ? AND activity_type = ? ORDER BY workout_date DESC"
        params = [userId, searchTerm]
    }

    db.query(sqlquery, params, (err, result) => {
        if (err) return next(err)
        res.render('search_result.ejs', { 
            workouts: result,
            term: searchTerm,
            searchType: 'workouts'
        })
    })
});

// Show a list of all user's workouts
router.get('/list', redirectLogin, function(req, res, next) {
    const userId = req.session.userId
    let sqlquery = "SELECT * FROM workouts WHERE user_id = ? ORDER BY workout_date DESC";
    
    db.query(sqlquery, [userId], (err, result) => {
        if (err) {
            return next(err)
        }
        res.render("list.ejs", { 
            workouts: result,
            pageTitle: 'My Workouts'
        })
    });
});

// Recent workouts: list workouts from last 7 days
router.get('/recent', redirectLogin, function(req, res, next) {
    const userId = req.session.userId
    const sql = 'SELECT * FROM workouts WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY workout_date DESC'
    db.query(sql, [userId], (err, result) => {
        if (err) return next(err)
        res.render('list.ejs', { 
            workouts: result,
            pageTitle: 'Recent Workouts (Last 7 Days)'
        })
    })
});

// Display form to add a new workout
router.get('/addworkout', redirectLogin, function(req, res, next) {
    res.render('workout_form.ejs', { pageTitle: 'Log Workout' })
});

// Handle form submission - save workout and show confirmation
router.post('/workoutadded', redirectLogin, [
    check('name').isLength({ min: 1, max: 50 }).withMessage('Activity type required (1-50 chars)'),
    check('price').isInt({ min: 1, max: 480 }).withMessage('Duration must be 1-480 minutes')
], function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('workout_form.ejs', { pageTitle: 'Log Workout' })
    }

    // Sanitize inputs
    const activityType = req.sanitize ? req.sanitize(req.body.name) : req.body.name
    const durationMinutes = parseInt(req.body.price)
    const caloriesBurned = req.body.notes ? parseInt(req.body.notes) : null
    const workoutDate = new Date().toISOString().split('T')[0]
    const userId = req.session.userId

    // Calculate calories if not provided (rough estimate: 7 calories per minute average)
    const calories = caloriesBurned || Math.round(durationMinutes * 7)

    // Prepare SQL to insert the new workout
    let sqlquery = "INSERT INTO workouts (user_id, activity_type, duration_minutes, calories_burned, workout_date) VALUES (?,?,?,?,?)"
    let newrecord = [userId, activityType, durationMinutes, calories, workoutDate]
    
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            return next(err)
        }
        else {
            res.render('workout_confirmed.ejs', { 
                name: activityType,
                message: `Workout logged successfully! ${durationMinutes} minutes of ${activityType}, ${calories} calories burned`
            })
        }
    })
});

// Export the router object so `index.js` can mount it
module.exports = router
