// Main route module: handles top-level pages like home and about for Health & Fitness Tracker
const express = require("express");
const router = express.Router();

// Access the global database connection
const db = global.db;

// Base path from env; empty locally, set to /usr/292 on doc.gold
const BASE = process.env.HEALTH_BASE_PATH || '';

// Middleware to require a logged-in session
const redirectLogin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect(302, `/users/login`);
    }
    next();
};

// Home page route - redirects to dashboard if logged in, otherwise shows landing page
router.get('/', function (req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect(302, `/dashboard`);
    }
    res.render('index.ejs');
});

// About page route - renders `views/about.ejs`
router.get('/about',function(req, res, next){
    res.render('about.ejs')
});

// Dashboard route - shows user's health summary (requires login)
router.get(`/dashboard`, redirectLogin, function(req, res, next) {
    const userId = req.session.userId;
    
    // Get recent workouts
    const workoutSql = "SELECT * FROM workouts WHERE user_id = ? ORDER BY workout_date DESC LIMIT 5";
    db.query(workoutSql, [userId], (err, workouts) => {
        if (err) return next(err);
        
        // Get recent health metrics
        const metricsSql = "SELECT * FROM health_metrics WHERE user_id = ? ORDER BY metric_date DESC LIMIT 5";
        db.query(metricsSql, [userId], (err, metrics) => {
            if (err) return next(err);
            
            res.render(`dashboard.ejs`, { workouts: workouts, metrics: metrics });
        });
    });
});

// Logout route
router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        const target = `${BASE || ''}/`;
        if (err) {
            return res.redirect(302, target);
        }
        return res.redirect(302, target);
    });
});

// Export the router object so `index.js` can mount it
module.exports = router;