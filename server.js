const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');

const app = express();

const SECRET_KEY = 'mysecretkey';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is working');
});


// ================= USERS =================
app.post('/users', (req, res) => {
  const { name, email, password, phone } = req.body;

  const sql = "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, email, password, phone], (err) => {
    if (err) return res.send('Error');
    res.send('User added');
  });
});


// ================= LOGIN =================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).send('Login error');

    if (result.length > 0) {
      const user = result[0];

      const token = jwt.sign(
        { user_id: user.user_id, email: user.email },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user
      });
    } else {
      res.status(401).send('Invalid email or password');
    }
  });
});


// ================= AUTH =================
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) return res.status(403).send('Token required');

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');

    req.user = decoded;
    next();
  });
}


// ================= STUDENTS =================
app.post('/students', (req, res) => {
  const { name, school_name, grade, user_id } = req.body;

  const sql = "INSERT INTO students (name, school_name, grade, user_id) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, school_name, grade, user_id], () => {
    res.send('Student added');
  });
});


// ================= DRIVERS =================
app.post('/drivers', (req, res) => {
  const { name, phone, license_number } = req.body;

  const sql = "INSERT INTO drivers VALUES (NULL, ?, ?, ?)";

  db.query(sql, [name, phone, license_number], () => {
    res.send('Driver added');
  });
});


// ================= BUSES =================
app.post('/buses', (req, res) => {
  const { plate_number, capacity, driver_id } = req.body;

  const sql = "INSERT INTO buses VALUES (NULL, ?, ?, ?)";

  db.query(sql, [plate_number, capacity, driver_id], () => {
    res.send('Bus added');
  });
});


// ================= PLANS =================
app.post('/plans', (req, res) => {
  const { name, semesters, price } = req.body;

  const sql = "INSERT INTO plans VALUES (NULL, ?, ?, ?)";

  db.query(sql, [name, semesters, price], () => {
    res.send('Plan added');
  });
});


// ================= ROUTES =================
app.post('/routes', (req, res) => {
  const { start_point, end_point, distance } = req.body;

  const sql = "INSERT INTO routes VALUES (NULL, ?, ?, ?)";

  db.query(sql, [start_point, end_point, distance], () => {
    res.send('Route added');
  });
});


// ================= SCHOOLS =================
app.get('/schools', (req, res) => {
  db.query("SELECT * FROM schools", (err, result) => {
    if (err) return res.send('Error');
    res.json(result);
  });
});

app.post('/schools', (req, res) => {
  const { school_name, address } = req.body;

  const sql = "INSERT INTO schools VALUES (NULL, ?, ?)";

  db.query(sql, [school_name, address], () => {
    res.send('School added');
  });
});


// ================= STATIONS =================
app.get('/stations', (req, res) => {
  db.query("SELECT * FROM stations", (err, result) => {
    if (err) return res.send('Error');
    res.json(result);
  });
});

app.post('/stations', (req, res) => {
  const { station_name, location_description } = req.body;

  const sql = "INSERT INTO stations VALUES (NULL, ?, ?)";

  db.query(sql, [station_name, location_description], () => {
    res.send('Station added');
  });
});


// ================= BOOKINGS =================
app.post('/bookings', verifyToken, (req, res) => {
  const { student_id, plan_id, bus_id, route_id, school_id, station_id, status, date } = req.body;

  const sql = `
    INSERT INTO bookings 
    (student_id, plan_id, bus_id, route_id, school_id, station_id, status, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [student_id, plan_id, bus_id, route_id, school_id, station_id, status, date], () => {
    res.send('Booking added');
  });
});


// ================= PAYMENTS =================
app.post('/payments', (req, res) => {
  const { booking_id, amount, method, status } = req.body;

  const sql = "INSERT INTO payments VALUES (NULL, ?, ?, ?, ?)";

  db.query(sql, [booking_id, amount, method, status], () => {
    res.send('Payment added');
  });
});


// ================= LOCATIONS =================
app.post('/locations', (req, res) => {
  const { student_id, latitude, longitude, address } = req.body;

  const sql = "INSERT INTO locations VALUES (NULL, ?, ?, ?, ?)";

  db.query(sql, [student_id, latitude, longitude, address], () => {
    res.send('Location added');
  });
});


// ================= BOOKINGS DETAILS =================
app.get('/bookings-details', (req, res) => {
  const sql = `
    SELECT 
      b.booking_id,
      s.name AS student_name,
      u.name AS parent_name,
      p.name AS plan_name,
      bus.plate_number,
      d.name AS driver_name,
      r.start_point,
      r.end_point,
      sc.school_name,
      st.station_name,
      b.status,
      b.date
    FROM bookings b
    JOIN students s ON b.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    JOIN plans p ON b.plan_id = p.plan_id
    JOIN buses bus ON b.bus_id = bus.bus_id
    JOIN drivers d ON bus.driver_id = d.driver_id
    JOIN routes r ON b.route_id = r.route_id
    LEFT JOIN schools sc ON b.school_id = sc.school_id
    LEFT JOIN stations st ON b.station_id = st.station_id
  `;

  db.query(sql, (err, result) => {
    if (err) return res.send('Error');
    res.json(result);
  });
});


// ================= STATS =================
app.get('/stats', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS users_count,
      (SELECT COUNT(*) FROM students) AS students_count,
      (SELECT COUNT(*) FROM bookings) AS bookings_count,
      (SELECT COUNT(*) FROM buses) AS buses_count
  `;

  db.query(sql, (err, result) => {
    if (err) return res.send('Error');
    res.json(result[0]);
  });
});


// ================= PROTECTED =================
app.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});


// ================= SERVER =================
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});