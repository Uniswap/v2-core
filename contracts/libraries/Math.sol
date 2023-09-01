pragma solidity =0.5.16;

// a library for performing various math operations

library Math {
    function min(uint x, uint y) internal pure returns (uint z) {
        z = x < y ? x : y;
    }

function sqrt(uint256 x) internal pure returns (uint256) {
    unchecked {
        if (x <= 1) { return x; }
        if (x >= ((1 << 128) - 1)**2) { return (1 << 128) - 1; }
        uint256 xAux = x;
        uint256 result = 1;
        if (xAux >= (1 << 128)) { xAux >>= 128; result = 1 << 64; }
        if (xAux >= (1 << 64 )) { xAux >>= 64;  result <<= 32; }
        if (xAux >= (1 << 32 )) { xAux >>= 32;  result <<= 16; }
        if (xAux >= (1 << 16 )) { xAux >>= 16;  result <<= 8;  }
        if (xAux >= (1 << 8  )) { xAux >>= 8;   result <<= 4;  }
        if (xAux >= (1 << 4  )) { xAux >>= 4;   result <<= 2;  }
        if (xAux >= (1 << 2  )) {               result <<= 1;  }
        result = (3 * result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        if (result * result <= a) {
            return result;
        }
        return result-1;
    }
}
