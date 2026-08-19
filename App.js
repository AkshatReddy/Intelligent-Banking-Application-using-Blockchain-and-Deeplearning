import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Box,
  Chip,
  Container,
  Card,
  CardContent,
  TextField,
  Alert,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  Grid,
} from "@mui/material";
import { motion } from "framer-motion";
import LandingPage from "./LandingPage";

const API = "http://localhost:5000";

const darkTheme = createTheme({
  palette: { mode: "dark", primary: { main: "#00bfff" } },
  typography: { fontFamily: "'Poppins', sans-serif" },
});

export default function App() {
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tab, setTab] = useState(0);

  const [balances, setBalances] = useState({ ETH: 0, SOL: 0, DOGE: 0 });
  const [rates, setRates] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updateMsg, setUpdateMsg] = useState("");

  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("SOL");
  const [convertAmount, setConvertAmount] = useState("");
  const [convertMsg, setConvertMsg] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUsers();
      loadRates();
      loadHistory();
      loadBalances();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !provider) return;
    const refresh = async () => {
      try {
        const bal = await provider.getBalance(user.address);
        setBalances((b) => ({ ...b, ETH: Number(ethers.formatEther(bal)) }));
      } catch (err) {
        console.error(err);
      }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [user, provider]);

  const loadUsers = async () => {
    const res = await fetch(`${API}/users`);
    const data = await res.json();
    setAllUsers(data.filter((u) => u.email !== user?.email));
  };

  const loadBalances = async () => {
    const res = await fetch(`${API}/balances?email=${user.email}`);
    const data = await res.json();
    setBalances((prev) => ({ ...prev, ...data.balances }));
  };

  const loadRates = async () => {
    const res = await fetch(`${API}/rates`);
    const data = await res.json();
    setRates(data);
  };

  const loadHistory = async () => {
    const res = await fetch(`${API}/history?email=${user.email}`);
    const data = await res.json();
    setTransactions(data);
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !token) return setMessage("⚠️ Fill all fields");
    try {
      setMessage("Fetching conversion rate...");
      const q = await fetch(`${API}/quote?token=${token}&amount=${amount}`).then((r) =>
        r.json()
      );

      setMessage("Waiting for wallet confirmation...");
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(q.ethEquivalent.toString()),
      });
      await tx.wait();

      await fetch(`${API}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEmail: user.email,
          toAddress: recipient,
          token,
          amount,
          ethEquivalent: q.ethEquivalent,
          txHash: tx.hash,
        }),
      });

      setMessage(`✅ Sent ${amount} ${token}`);
      setAmount("");
      loadBalances();
      loadHistory();
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  const handleConvert = async () => {
    if (!convertAmount) return setConvertMsg("⚠️ Enter amount");
    const res = await fetch(`${API}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        fromToken,
        toToken,
        amount: convertAmount,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setConvertMsg(
        `✅ Converted ${convertAmount} ${fromToken} → ${data.amountTo.toFixed(3)} ${toToken}`
      );
      setConvertAmount("");
      loadBalances();
    } else setConvertMsg("❌ " + data.message);
  };

  const handleUpdateUser = async () => {
    const res = await fetch(`${API}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, name: newName, password: newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setUpdateMsg("✅ Profile updated!");
      setNewName("");
      setNewPassword("");
    } else setUpdateMsg("❌ " + data.message);
  };

  if (!user) return <LandingPage onLogin={setUser} />;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="sticky" sx={{ background: "#0b0b0b", boxShadow: "0 0 20px #00bfff55" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Tabs
            value={tab}
            onChange={(e, v) => {
              setTab(v);
              if (v === 1) loadHistory();
            }}
            sx={{
              "& .MuiTab-root": {
                color: "#aaa",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { color: "#00bfff", textShadow: "0 0 8px #00bfff" },
              },
              "& .Mui-selected": { color: "#00bfff", textShadow: "0 0 10px #00bfff" },
            }}
          >
            <Tab label="Transfer" />
            <Tab label="History" />
            <Tab label="Balance" />
            <Tab label="Settings" />
          </Tabs>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip label={user.name} color="primary" sx={{ mr: 2, background: "#00bfff22" }} />
            <Button
              color="inherit"
              onClick={() => setUser(null)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { color: "#00bfff", textShadow: "0 0 10px #00bfff" },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 5 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tab === 0 && (
            <Card sx={{ p: 3, background: "#0b1e2b", borderRadius: 3, boxShadow: "0 0 20px #00bfff33" }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Transfer
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Send To</InputLabel>
                    <Select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                      {allUsers.map((u) => (
                        <MenuItem key={u.address} value={u.address}>
                          {u.name} ({u.address.slice(0, 6)}...{u.address.slice(-4)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Token</InputLabel>
                    <Select value={token} onChange={(e) => setToken(e.target.value)}>
                      <MenuItem value="ETH">ETH</MenuItem>
                      <MenuItem value="SOL">SOL</MenuItem>
                      <MenuItem value="DOGE">DOGE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label={`Amount (${token})`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    fullWidth
                    type="number"
                    inputProps={{ step: "any" }}
                  />
                </Grid>
              </Grid>
              <Button variant="contained" fullWidth sx={{ mt: 3, py: 1.3 }} onClick={handleTransfer}>
                Send
              </Button>
              {message && (
                <Alert sx={{ mt: 2 }} severity={message.includes("❌") ? "error" : "info"}>
                  {message}
                </Alert>
              )}
            </Card>
          )}

          {tab === 1 && (
            <Card sx={{ p: 3, background: "#0b1e2b", borderRadius: 3, boxShadow: "0 0 20px #00bfff33" }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                History
              </Typography>
              {transactions.length === 0 ? (
                <Typography>No transactions yet.</Typography>
              ) : (
                transactions.map((t, i) => (
                  <Box key={i} sx={{ mb: 2, p: 2, borderRadius: 2, background: "#111" }}>
                    <Typography>
                      {t.fromName} → {t.toName}
                    </Typography>
                    <Typography variant="body2">
                      {t.amount} {t.token} ({t.ethEquivalent} ETH)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Card>
          )}

          {tab === 2 && (
            <Card sx={{ p: 3, background: "#0b1e2b", borderRadius: 3, boxShadow: "0 0 20px #00bfff33" }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Balances
              </Typography>
              <Typography>💎 ETH: {balances.ETH?.toFixed(4)}</Typography>
              <Typography>🌕 SOL: {balances.SOL?.toFixed(4)}</Typography>
              <Typography>🐶 DOGE: {balances.DOGE?.toFixed(4)}</Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Select fullWidth value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
                    <MenuItem value="ETH">ETH</MenuItem>
                    <MenuItem value="SOL">SOL</MenuItem>
                    <MenuItem value="DOGE">DOGE</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select fullWidth value={toToken} onChange={(e) => setToToken(e.target.value)}>
                    <MenuItem value="ETH">ETH</MenuItem>
                    <MenuItem value="SOL">SOL</MenuItem>
                    <MenuItem value="DOGE">DOGE</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Amount"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button fullWidth variant="contained" onClick={handleConvert}>
                    Convert
                  </Button>
                </Grid>
              </Grid>

              {convertMsg && (
                <Alert sx={{ mt: 2 }} severity={convertMsg.includes("❌") ? "error" : "success"}>
                  {convertMsg}
                </Alert>
              )}
            </Card>
          )}

          {tab === 3 && (
            <Card sx={{ p: 3, background: "#0b1e2b", borderRadius: 3, boxShadow: "0 0 20px #00bfff33" }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Settings
              </Typography>
              <TextField
                label="New Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                type="password"
              />
              <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleUpdateUser}>
                Update
              </Button>
              {updateMsg && (
                <Alert sx={{ mt: 2 }} severity={updateMsg.includes("❌") ? "error" : "success"}>
                  {updateMsg}
                </Alert>
              )}
            </Card>
          )}
        </motion.div>
      </Container>
    </ThemeProvider>
  );
}
