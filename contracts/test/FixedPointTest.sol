// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import '../libraries/FixedPoint.sol';

contract FixedPointTest {
    function encode(uint112 x) external pure returns (FixedPoint.uq112x112 memory) {
        return FixedPoint.encode(x);
    }

    function encode144(uint144 x) external pure returns (FixedPoint.uq144x112 memory) {
        return FixedPoint.encode144(x);
    }

    function decode(FixedPoint.uq112x112 calldata self) external pure returns (uint112) {
        return FixedPoint.decode(self);
    }

    function decode144(FixedPoint.uq144x112 calldata self) external pure returns (uint144) {
        return FixedPoint.decode144(self);
    }

    function mul(FixedPoint.uq112x112 calldata self, uint256 y) external pure returns (FixedPoint.uq144x112 memory) {
        return FixedPoint.mul(self, y);
    }

    function muli(FixedPoint.uq112x112 calldata self, int256 y) external pure returns (int256) {
        return FixedPoint.muli(self, y);
    }

    function muluq(FixedPoint.uq112x112 calldata self, FixedPoint.uq112x112 calldata other)
        external
        pure
        returns (FixedPoint.uq112x112 memory)
    {
        return FixedPoint.muluq(self, other);
    }

    function getGasCostOfMuluq(FixedPoint.uq112x112 calldata self, FixedPoint.uq112x112 calldata other)
        external
        view
        returns (uint256)
    {
        uint256 gasBefore = gasleft();
        FixedPoint.muluq(self, other);
        return gasBefore - gasleft();
    }

    function divuq(FixedPoint.uq112x112 calldata self, FixedPoint.uq112x112 calldata other)
        external
        pure
        returns (FixedPoint.uq112x112 memory)
    {
        return FixedPoint.divuq(self, other);
    }

    function getGasCostOfDivuq(FixedPoint.uq112x112 calldata self, FixedPoint.uq112x112 calldata other)
        external
        view
        returns (uint256)
    {
        uint256 gasBefore = gasleft();
        FixedPoint.divuq(self, other);
        return gasBefore - gasleft();
    }

    function fraction(uint256 numerator, uint256 denominator) external pure returns (FixedPoint.uq112x112 memory) {
        return FixedPoint.fraction(numerator, denominator);
    }

    function getGasCostOfFraction(uint256 numerator, uint256 denominator) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        FixedPoint.fraction(numerator, denominator);
        return gasBefore - gasleft();
    }

    function reciprocal(FixedPoint.uq112x112 calldata self) external pure returns (FixedPoint.uq112x112 memory) {
        return FixedPoint.reciprocal(self);
    }

    function sqrt(FixedPoint.uq112x112 calldata self) external pure returns (FixedPoint.uq112x112 memory) {
        return FixedPoint.sqrt(self);
    }

    function getGasCostOfSqrt(FixedPoint.uq112x112 calldata self) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        FixedPoint.sqrt(self);
        return gasBefore - gasleft();
    }
}
