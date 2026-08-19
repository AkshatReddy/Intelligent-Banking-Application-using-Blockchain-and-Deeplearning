import { ethers } from 'ethers';

const ABI = [
  "event TransferLogged(address indexed from, address indexed to, uint256 value)",
  "function logTransfer(address to, uint256 value) external payable"
];

const CONTRACT_ADDRESS = '0x54480441b2E5B389CCc09238eDdFA8016d5eC058'; // Paste from truffle migrate

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
};