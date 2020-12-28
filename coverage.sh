#!/bin/sh

while getopts "f:" arg; do
  case $arg in
    f) FILE=$OPTARG;;
  esac
done

# because compile with coverage will change the bytecode of xyzswap pair so we must replace them
sed -i '.original' -e 's/bcd83b5cb3a7787d385e9b6ce85f55121f9c7e3e45ff594acdcf51fc8329596e/d4d66cd94accf789f05fa86eabdea4423bfacfa9e432ae763c7a41f7813113f3/g' contracts/libraries/XYZSwapLibrary.sol
if [ -n "$FILE" ]
then
    yarn hardhat coverage --testfiles $FILE
else
    yarn hardhat coverage
fi
sed -i '.original' -e 's/d4d66cd94accf789f05fa86eabdea4423bfacfa9e432ae763c7a41f7813113f3/bcd83b5cb3a7787d385e9b6ce85f55121f9c7e3e45ff594acdcf51fc8329596e/g' contracts/libraries/XYZSwapLibrary.sol
