// app.js
// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const path = require('path');


// Initialize Express app
const app = express();

// Set up MongoDB connection
mongoose.connect('mongodb+srv://DrasecGoner:DrasecGoner@cluster0.qq5ml9f.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize MongoDB session store
const store = new MongoDBStore({
  uri: 'mongodb+srv://DrasecGoner:DrasecGoner@cluster0.qq5ml9f.mongodb.net/',
  collection: 'sessions',
});

// Set up session middleware
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set up static directory
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Define routes
app.get('/', (req, res) => {
  res.render('index');
});

// In app.js

const User = require('./models/User');

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error signing up');
  }
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('User not found');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Invalid password');
    }
    req.session.userId = user._id;
    req.session.message = { type: 'success', text: 'Logged in successfully.' };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
    req.session.message = { type: 'error', text: 'Invalid email or password.' };
    res.redirect('/login');
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  // Render the dashboard view
  res.render('dashboard');
});

// In app.js

const fileUpload = require('express-fileupload');
app.use(fileUpload());

// In app.js

const fs = require('fs');
const csvParser = require('csv-parser');

// File upload route
app.post('/upload', (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // Check if file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // Access the uploaded file
  const timetableFile = req.files.timetable;

  // Move the file to the public/uploads directory
  const filePath = path.join(__dirname, 'public', 'uploads', timetableFile.name);
  timetableFile.mv(filePath, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    // Parse the CSV file
    const timetableData = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        timetableData.push(row);
      })
      .on('end', () => {
        // Process timetable data
        console.log(timetableData);
        res.send('File uploaded and parsed successfully.');
      });
// Inside the .on('end') event handler for parsing CSV file

// Extract course information
const courses = {};
timetableData.forEach((row) => {
  Object.keys(row).forEach((key) => {
    if (key.startsWith('CourseCode')) {
      const courseCode = row[key];
      const courseType = row[key.replace('Code', 'type')];
      const courseName = row[key.replace('Code', 'Name')];
      const lectures = parseInt(row[key.replace('Code', 'Lectures')]) || 0;
      const tutorials = parseInt(row[key.replace('Code', 'Tutorial')]) || 0;
      const practicals = parseInt(row[key.replace('Code', 'Practical')]) || 0;
      const credits = parseInt(row[key.replace('Code', 'Credits')]) || 0;
      const faculty = row[key.replace('Code', 'Faculty___Block___RoomNo___Cabin_No___')];
      courses[courseCode] = {
        courseType,
        courseName,
        lectures,
        tutorials,
        practicals,
        credits,
        faculty,
      };
    }
  });
});
console.log(courses);


// Inside the .on('end') event handler for parsing CSV file

// Generate updated timetable with self-study periods
const updatedTimetable = {};
Object.keys(courses).forEach((courseCode) => {
  const { courseType, courseName, lectures, tutorials, practicals } = courses[courseCode];
  // Calculate total hours for the course
  const totalHours = lectures + tutorials + practicals;
  // Add self-study periods to updated timetable
  updatedTimetable[courseCode] = {
    courseType,
    courseName,
    selfStudyHours: Math.ceil(totalHours * 1.5), // Assuming 1.5 hours of self-study per lecture/tutorial/practical
  };
});
console.log(updatedTimetable);

// In app.js

// Inside the .on('end') event handler for parsing CSV file

// Render the dashboard view with timetable data
res.render('dashboard', { updatedTimetable });
  });
});
  gi

// Dashboard route
app.get('/dashboard', requireAuth, (req, res) => {
  // Render the dashboard view with timetable data
  res.render('dashboard', { updatedTimetable });
});

// In app.js

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});

// In app.js



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});