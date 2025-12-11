-- insert_test_data.sql - Insert sample data into `health` database

USE health;

-- Insert test user 'gold' with password 'smiths' (hashed)
-- Password: smiths (for backward compatibility)
INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES
	('gold', 'Gold', 'Smith', 'gold@example.com', '$2b$10$Jdjt6lZh36qOqedlpY9Du.QOLMmFaiXjBy2snESku2cO0Gi2lNmbW');

-- Insert test user 'gold2' with stronger password 'smiths123ABC$' (hashed)
-- This account uses a password that meets all validation requirements
INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES
	('gold2', 'Gold', 'Smith', 'gold2@example.com', '$2b$10$kHkKztqf5XJCK/.8nMU1MO77QESzLD3O.Qk3mvizIXlOtbLPSbbvm');

-- Insert sample workouts
INSERT INTO workouts (user_id, activity_type, duration_minutes, calories_burned, workout_date, notes) VALUES
	(1, 'Running', 30, 300, '2025-12-10', 'Morning jog at the park'),
	(1, 'Gym', 45, 400, '2025-12-09', 'Upper body strength training'),
	(1, 'Cycling', 60, 450, '2025-12-08', 'Outdoor cycling session');

-- Insert sample health metrics
INSERT INTO health_metrics (user_id, metric_date, weight_kg, heart_rate, steps, sleep_hours, notes) VALUES
	(1, '2025-12-10', 75.5, 65, 8500, 7.5, 'Feeling good'),
	(1, '2025-12-09', 75.8, 68, 7200, 7.0, 'Slightly tired'),
	(1, '2025-12-08', 76.0, 70, 9100, 8.0, 'Great energy levels');