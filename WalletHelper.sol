// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract WalletHelper {
    event TransferLogged(address indexed from, address indexed to, uint256 value);

    // Log a transfer (optional, for demo history)
    function logTransfer(address to, uint256 value) external payable {
        emit TransferLogged(msg.sender, to, value);
    }
}