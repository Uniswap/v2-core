#!/bin/sh

while getopts "f:" arg; do
  case $arg in
    f) FILE=$OPTARG;;
  esac
done

# because compile with coverage will change the bytecode of xyzswap pair so we must replace them
sed -i '.original' -e 's/58d7b9de6e5378515305636a2a3f1e1716b9f8bd33bc7097f553b75eee56ff89/2bfa4c965b8ebcdb59d2d3cc3a0006b855631bcaf6710e2a88f41292410f27cd/g' contracts/libraries/XYZSwapLibrary.sol
if [ -n "$FILE" ]
then
    yarn hardhat coverage --testfiles $FILE
else
    yarn hardhat coverage
fi
sed -i '.original' -e 's/2bfa4c965b8ebcdb59d2d3cc3a0006b855631bcaf6710e2a88f41292410f27cd/58d7b9de6e5378515305636a2a3f1e1716b9f8bd33bc7097f553b75eee56ff89/g' contracts/libraries/XYZSwapLibrary.sol
