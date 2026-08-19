// server.js
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- Data file path ---
const DATA_FILE = path.join(process.cwd(), 'users.json');

// --- Utility: read/write users ---
const readUsers = () => {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeUsers = (users) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

// --- Routes ---

// ✅ Register new user
app.post('/register', (req, res) => {
  const { email, password, address, name } = req.body;
  if (!email || !password || !address)
    return res.status(400).json({ message: 'Missing required fields' });

  const users = readUsers();
  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: 'User already exists' });

  const newUser = {
    email,
    password,
    address,
    name,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  res.json(newUser);
});

// ✅ Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  res.json(user);
});

// ✅ Update user (name / password)
app.post('/update', (req, res) => {
  const { email, name, password } = req.body;
  const users = readUsers();
  const index = users.findIndex((u) => u.email === email);
  if (index === -1) return res.status(404).json({ message: 'User not found' });

  if (name) users[index].name = name;
  if (password) users[index].password = password;
  writeUsers(users);

  res.json({ message: 'User updated successfully', user: users[index] });
});

// ✅ Get all users (optional - debugging)
app.get('/users', (req, res) => {
  res.json(readUsers());
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
