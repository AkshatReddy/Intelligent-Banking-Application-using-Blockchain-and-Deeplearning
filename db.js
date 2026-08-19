// src/db.js
import localforage from 'localforage';

localforage.config({
  name: 'BlockchainWallet',
  storeName: 'users',
});

export const db = localforage;