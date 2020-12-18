#!/bin/sh

while getopts "f:" arg; do
  case $arg in
    f) FILE=$OPTARG;;
  esac
done

# because compile with coverage will change the bytecode of xyzswap pair so we must replace them
sed -i '.original' -e 's/7758da37ec9dc9f1767a949ef04002a4b1d760a3cc3e9d653bd9f533af89a56c/f47ba6db7cfd756d55d252e01baaf7235550b0dc69da25554193241f43b7ee0c/g' contracts/libraries/XYZSwapLibrary.sol
if [ -n "$FILE" ]
then
    yarn hardhat coverage --testfiles $FILE
else
    yarn hardhat coverage
fi
sed -i '.original' -e 's/f47ba6db7cfd756d55d252e01baaf7235550b0dc69da25554193241f43b7ee0c/7758da37ec9dc9f1767a949ef04002a4b1d760a3cc3e9d653bd9f533af89a56c/g' contracts/libraries/XYZSwapLibrary.sol
