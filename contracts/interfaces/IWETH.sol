// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.5.16;

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}