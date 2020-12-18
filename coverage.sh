#!/bin/sh

while getopts "f:" arg; do
  case $arg in
    f) FILE=$OPTARG;;
  esac
done

# because compile with coverage will change the bytecode of xyzswap pair so we must replace them
sed -i '.original' -e 's/15662c04ddb9eb17f65b0b5a5aee6fc09bae4621351e6d4cdd9b545ced72f24d/ae92ffd383b3eaba87e776c46b4dd76867c8e0d7d5cbbad7f04e9585f95d138b/g' contracts/libraries/XYZSwapLibrary.sol
if [ -n "$FILE" ]
then
    yarn hardhat coverage --testfiles $FILE
else
    yarn hardhat coverage
fi
sed -i '.original' -e 's/ae92ffd383b3eaba87e776c46b4dd76867c8e0d7d5cbbad7f04e9585f95d138b/15662c04ddb9eb17f65b0b5a5aee6fc09bae4621351e6d4cdd9b545ced72f24d/g' contracts/libraries/XYZSwapLibrary.sol
