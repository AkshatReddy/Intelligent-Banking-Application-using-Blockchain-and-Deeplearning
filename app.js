import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import LandingPage from './LandingPage';

const darkTheme = createTheme({
  palette: { mode: 'dark', primary: { main: '#00bfff' } },
  typography: { fontFamily: "'Poppins', sans-serif" },
});

export default function App() {
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tab, setTab] = useState(0);

  // TRANSFER state
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // HISTORY state
  const [transactions, setTransactions] = useState([]);

  // SETTINGS state
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  useEffect(() => {
    if (user) fetchUsersFromServer();
  }, [user]);

  const fetchUsersFromServer = async () => {
    try {
      const res = await fetch('http://localhost:5000/users');
      const data = await res.json();
      const filtered = data.filter((u) => u.email !== user.email);
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Auto-refresh balance
  useEffect(() => {
    if (!user || !provider) return;
    const refresh = async () => {
      const bal = await provider.getBalance(user.address);
      setBalance(ethers.formatEther(bal));
    };
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [user, provider]);

  const sendEth = async () => {
    if (!recipient || !amount) return setMessage('Select user and amount');
    try {
      setMessage('Sending...');
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount),
      });
      await tx.wait();

      const txRecord = {
        from: user.address,
        to: recipient,
        amount,
        timestamp: new Date().toISOString(),
      };
      const txs = JSON.parse(localStorage.getItem('transactions') || '[]');
      txs.push(txRecord);
      localStorage.setItem('transactions', JSON.stringify(txs));

      loadHistory();
      setMessage(`✅ Sent ${amount} ETH!`);
      setAmount('');
    } catch (err) {
      setMessage('❌ Failed: ' + err.message);
    }
  };

  const loadHistory = async () => {
    const all = JSON.parse(localStorage.getItem('transactions') || '[]');
    const res = await fetch('http://localhost:5000/users');
    const users = await res.json();

    // Map address -> user name
    const addressToName = {};
    users.forEach((u) => {
      addressToName[u.address] = u.name;
    });

    const filtered = all.filter(
      (t) => t.from === user.address || t.to === user.address
    );

    // Add readable names
    const enhanced = filtered.map((t) => ({
      ...t,
      fromName: addressToName[t.from] || t.from,
      toName: addressToName[t.to] || t.to,
    }));

    setTransactions(enhanced);
  };

  const handleUpdateUser = async () => {
    try {
      const payload = {
        email: user.email,
        name: newName || user.name,
        password: newPassword || user.password,
      };
      const res = await fetch('http://localhost:5000/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.user);
      setUpdateMsg('✅ Profile updated successfully!');
      setNewName('');
      setNewPassword('');
      fetchUsersFromServer();
    } catch (err) {
      setUpdateMsg('❌ Failed to update user: ' + err.message);
    }
  };

  if (!user) return <LandingPage onLogin={setUser} />;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {/* Navbar */}
      <AppBar position="sticky" sx={{ background: '#0b0b0b', boxShadow: '0 0 20px #00bfff55' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Tabs
            value={tab}
            onChange={(e, v) => {
              setTab(v);
              if (v === 1) loadHistory();
            }}
            sx={{
              '& .MuiTab-root': {
                color: '#aaa',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { color: '#00bfff', textShadow: '0 0 8px #00bfff' },
              },
              '& .Mui-selected': {
                color: '#00bfff',
                textShadow: '0 0 10px #00bfff',
              },
            }}
          >
            <Tab label="Transfer" />
            <Tab label="History" />
            <Tab label="Balance" />
            <Tab label="Settings" />
          </Tabs>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip label={user.name} color="primary" sx={{ mr: 2, background: '#00bfff22' }} />
            <Button
              color="inherit"
              onClick={() => setUser(null)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { color: '#00bfff', textShadow: '0 0 10px #00bfff' },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* TRANSFER TAB */}
          {tab === 0 && (
            <Card
              sx={{
                background: 'linear-gradient(145deg, #0d0d0d, #121212)',
                boxShadow: '0 0 20px #00bfff33',
                border: '1px solid #1e1e1e',
                borderRadius: 3,
                p: 2,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: '#00bfff', fontWeight: 600 }}>
                  Send Ethereum
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Send to</InputLabel>
                  <Select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      background: '#141414',
                    }}
                  >
                    {allUsers
                      .filter((u) => u.email !== user.email)
                      .map((u) => (
                        <MenuItem key={u.address} value={u.address}>
                          {u.name} ({u.address.slice(0, 6)}...{u.address.slice(-4)})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  label={`Amount (ETH) — Balance: ${balance}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  sx={{
                    mb: 3,
                    background: '#141414',
                    borderRadius: 2,
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={sendEth}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #00bfff, #0088ff)',
                    '&:hover': { boxShadow: '0 0 15px #00bfff99' },
                  }}
                >
                  🚀 Send ETH
                </Button>

                {message && (
                  <Alert
                    severity={message.includes('Failed') ? 'error' : 'success'}
                    sx={{ mt: 3 }}
                  >
                    {message}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* HISTORY TAB */}
          {tab === 1 && (
            <Card
              sx={{
                background: 'linear-gradient(145deg, #0d0d0d, #121212)',
                border: '1px solid #1e1e1e',
                boxShadow: '0 0 20px #00bfff33',
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: '#00bfff', fontWeight: 600 }}>
                  Transaction History
                </Typography>
                <Divider sx={{ mb: 2, borderColor: '#1e1e1e' }} />

                {transactions.length === 0 ? (
                  <Typography color="text.secondary">No transactions yet.</Typography>
                ) : (
                  transactions.map((t, i) => (
                    <Box
                      key={i}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        background: '#1a1a1a',
                        border: '1px solid #222',
                        transition: '0.3s',
                        '&:hover': {
                          boxShadow: '0 0 10px #00bfff44',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#90caf9' }}>
                        {t.from === user.address ? '🟢 Sent' : '🔵 Received'} {t.amount} ETH
                      </Typography>
                      <Typography variant="body2">
                        <strong>From:</strong> {t.fromName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>To:</strong> {t.toName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* BALANCE TAB */}
          {tab === 2 && (
            <Card
              sx={{
                background: 'linear-gradient(145deg, #0d0d0d, #121212)',
                border: '1px solid #1e1e1e',
                boxShadow: '0 0 20px #00bfff33',
                borderRadius: 3,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" sx={{ color: '#00bfff', fontWeight: 700 }}>
                💰 {balance} ETH
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#aaa', mt: 1 }}>
                Your current wallet balance
              </Typography>
            </Card>
          )}

          {/* SETTINGS TAB */}
          {tab === 3 && (
            <Card
              sx={{
                background: 'linear-gradient(145deg, #0d0d0d, #121212)',
                border: '1px solid #1e1e1e',
                boxShadow: '0 0 20px #00bfff33',
                borderRadius: 3,
                p: 2,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: '#00bfff', fontWeight: 600 }}>
                  Update Profile
                </Typography>
                <TextField
                  label="New Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  fullWidth
                  sx={{ mb: 2, background: '#141414', borderRadius: 2 }}
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  sx={{ mb: 2, background: '#141414', borderRadius: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUpdateUser}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #00bfff, #0088ff)',
                    '&:hover': { boxShadow: '0 0 15px #00bfff99' },
                  }}
                >
                  Update
                </Button>
                {updateMsg && (
                  <Alert
                    severity={updateMsg.includes('Failed') ? 'error' : 'success'}
                    sx={{ mt: 2 }}
                  >
                    {updateMsg}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </Container>
    </ThemeProvider>
  );
}
