import { ethers } from 'ethers';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  TextField,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import { Login, PersonAdd } from '@mui/icons-material';

export default function LandingPage({ onLogin }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return setError('Fill all fields');
    if (!window.ethereum) return setError('MetaMask not detected');

    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      const user = {
        email,
        password,
        address,
        name: email.split('@')[0],
      };

      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      onLogin(user);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDE IMAGE */}
      <Box
        sx={{
          flex: 3,
          backgroundImage:
            'url("https://images.pexels.com/photos/8369836/pexels-photo-8369836.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
        <Typography
          variant="h3"
          sx={{
            position: 'relative',
            zIndex: 1,
            color: '#fff',
            fontWeight: 700,
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          Welcome to WalletChain
        </Typography>
      </Box>

      {/* RIGHT SIDE LOGIN/REGISTER */}
      <Box
        sx={{
          flex: 1,
          bgcolor: '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: '50px'
        }}
      >
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: 400, padding: '2rem' }}
        >
          <Paper
            elevation={10}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: '#252525',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
            }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: 700, color: '#90caf9' }}
            >
              WalletChain
            </Typography>

            <Typography
              variant="body2"
              align="center"
              sx={{ mb: 2, color: '#ccc' }}
            >
              Private Blockchain Transfers
            </Typography>

            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              centered
              sx={{
                mb: 2,
                '& .MuiTab-root': { color: '#aaa' },
                '& .Mui-selected': { color: '#90caf9' },
              }}
            >
              <Tab icon={<Login />} label="Login" />
              <Tab icon={<PersonAdd />} label="Register" />
            </Tabs>

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={tab === 0 ? handleLogin : handleRegister}
              fullWidth
              disabled={connecting}
              sx={{ mt: 1, py: 1.5 }}
            >
              {connecting
                ? 'Connecting...'
                : tab === 0
                ? 'Login'
                : 'Register & Connect'}
            </Button>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
}
