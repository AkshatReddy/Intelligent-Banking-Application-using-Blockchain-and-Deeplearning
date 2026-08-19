import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Paths for simple local "database" ---
const usersFile = path.resolve("./data_users.json");
const txFile = path.resolve("./data_transactions.json");

// --- Load helper functions ---
const readJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
};
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- Initialize files if not exist ---
if (!fs.existsSync(usersFile)) writeJSON(usersFile, []);
if (!fs.existsSync(txFile)) writeJSON(txFile, []);

// --- Default rates ---
let rates = { ETH: 1, SOL: 0.1, DOGE: 0.00001 };

// --- Register ---
app.post("/register", (req, res) => {
  const { email, password, address, name } = req.body;
  const users = readJSON(usersFile);
  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: "User already exists" });

  const newUser = {
    email,
    password,
    name,
    address,
    balances: { ETH: 100, SOL: 50, DOGE: 1000 }, // start balances
  };
  users.push(newUser);
  writeJSON(usersFile, users);
  res.json(newUser);
});

// --- Login ---
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  res.json(user);
});

// --- Get users ---
app.get("/users", (req, res) => {
  const users = readJSON(usersFile);
  res.json(users);
});

// --- Get balances ---
app.get("/balances", (req, res) => {
  const { email } = req.query;
  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ balances: user.balances });
});

// --- Get rates ---
app.get("/rates", (req, res) => res.json(rates));

// --- Quote endpoint ---
app.get("/quote", (req, res) => {
  const { token, amount } = req.query;
  const numAmount = parseFloat(amount);
  if (!token || isNaN(numAmount)) return res.status(400).json({ message: "Invalid params" });
  const ethEquivalent = numAmount * (rates[token] || 1);
  res.json({ ethEquivalent });
});

// --- Transfer ---
app.post("/transfer", (req, res) => {
  const { fromEmail, toAddress, token, amount, ethEquivalent, txHash } = req.body;
  const amt = parseFloat(amount);
  const users = readJSON(usersFile);
  const from = users.find((u) => u.email === fromEmail);
  const to = users.find((u) => u.address === toAddress);

  if (!from) return res.status(400).json({ message: "Sender not found" });
  if (!to) return res.status(400).json({ message: "Recipient not found" });
  if (from.balances[token] < amt)
    return res.status(400).json({ message: "Insufficient balance" });

  // Update balances
  from.balances[token] -= amt;
  to.balances[token] = (to.balances[token] || 0) + amt;

  // Save users
  writeJSON(usersFile, users);

  // Record transaction
  const txs = readJSON(txFile);
  const tx = {
    fromEmail,
    fromAddress: from.address,
    toAddress,
    token,
    amount: amt,
    ethEquivalent,
    txHash,
    timestamp: new Date().toISOString(),
  };
  txs.push(tx);
  writeJSON(txFile, txs);

  res.json({ message: "Transfer recorded", tx });
});

// --- Conversion ---
app.post("/convert", (req, res) => {
  const { email, fromToken, toToken, amount } = req.body;
  const amt = parseFloat(amount);
  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });
  if (user.balances[fromToken] < amt)
    return res.status(400).json({ message: "Insufficient balance" });

  // Convert based on rate ratio
  const ethVal = amt * (rates[fromToken] || 1);
  const amountTo = ethVal / (rates[toToken] || 1);

  user.balances[fromToken] -= amt;
  user.balances[toToken] += amountTo;
  writeJSON(usersFile, users);

  // Log transaction
  const txs = readJSON(txFile);
  txs.push({
    fromEmail: email,
    fromAddress: user.address,
    toAddress: user.address,
    token: `${fromToken}->${toToken}`,
    amount: amt,
    ethEquivalent: amountTo,
    timestamp: new Date().toISOString(),
  });
  writeJSON(txFile, txs);

  res.json({ message: "Converted", amountTo });
});

// --- History ---
app.get("/history", (req, res) => {
  const { email } = req.query;
  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const txs = readJSON(txFile);
  const related = txs.filter(
    (t) =>
      t.fromAddress === user.address ||
      t.toAddress === user.address ||
      t.fromEmail === email
  );
  res.json(related.reverse());
});

// --- Update user ---
app.post("/update", (req, res) => {
  const { email, name, password } = req.body;
  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (name) user.name = name;
  if (password) user.password = password;
  writeJSON(usersFile, users);
  res.json({ user });
});

// --- Start server ---
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
