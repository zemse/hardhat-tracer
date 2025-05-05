contract OpCodes {
    uint256 internal constant maxUint256 = type(uint256).max;
    int256 internal constant maxInt256 = type(int256).max;
    uint8 internal constant maxUint8 = type(uint8).max;
    int8 internal constant maxInt8 = type(int8).max;
    uint256 internal constant minUint256 = type(uint256).min;
    int256 internal constant minInt256 = type(int256).min;
    uint8 internal constant minUint8 = type(uint8).min;
    int8 internal constant minInt8 = type(int8).min;

    error MathError(int256[]);

    uint256 internal constant ZERO = 0;
    uint256 internal constant ONE = 1;
    uint256 internal constant TWO = 2;
    uint256 internal constant THREE = 3;
    uint256 internal constant FOUR = 4;

    function _iterateInt256(
        uint256 limit,
        int256[] calldata list,
        function(int256[] calldata) internal pure returns (bool) fn
    ) internal pure {
        unchecked {
            uint256 i;
            uint256 len = list.length / limit;
            uint256 a;
            do {
                a = i * limit;
                if (!fn(list[a:a + limit])) {
                    revert MathError(list[a:a + limit]);
                }
                ++i;
            } while (i < len);
        }
    }

    function _iterateUint256(
        uint256 limit,
        uint256[] calldata list,
        function(uint256[] calldata) internal pure returns (bool) fn
    ) internal pure {
        unchecked {
            uint256 i;
            uint256 len = list.length / limit;
            uint256 a;
            do {
                a = i * limit;
                if (!fn(list[a:a + limit])) {
                    revert MathError(new int256[](0));
                }
                ++i;
            } while (i < len);
        }
    }

    function addInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _add);
    }

    function _add(int256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] + inputs[ONE]) == inputs[TWO];
        }
    }

    function subInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _sub);
    }

    function _sub(int256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] - inputs[ONE]) == inputs[TWO];
        }
    }

    function mulInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _mul);
    }

    function _mul(int256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] * inputs[ONE]) == inputs[TWO];
        }
    }

    function divInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _div);
    }

    function _div(int256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] / inputs[ONE]) == inputs[TWO];
        }
    }

    function divUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _divUint);
    }

    function _divUint(uint256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] / inputs[ONE]) == inputs[TWO];
        }
    }

    function modUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _modUint);
    }

    function _modUint(uint256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] % inputs[ONE]) == inputs[TWO];
        }
    }

    function modInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _modInt);
    }

    function _modInt(int256[] calldata inputs) internal pure returns (bool) {
        unchecked {
            return (inputs[ZERO] % inputs[ONE]) == inputs[TWO];
        }
    }

    function mulModUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(FOUR, inputs, _mulModUint);
    }

    function _mulModUint(uint256[] calldata inputs) internal pure returns (bool) {
        return mulmod(inputs[ZERO], inputs[ONE], inputs[TWO]) == inputs[THREE];
    }

    function addModUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(FOUR, inputs, _addModUint);
    }

    function _addModUint(uint256[] calldata inputs) internal pure returns (bool) {
        return addmod(inputs[ZERO], inputs[ONE], inputs[TWO]) == inputs[THREE];
    }

    function isZeroUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(TWO, inputs, _isZeroUint);
    }

    function _isZeroUint(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] == ZERO) == (inputs[ONE] == ONE);
    }

    function notInt256(int256[] calldata inputs) external pure {
        _iterateInt256(TWO, inputs, _notInt256);
    }

    function _notInt256(int256[] calldata inputs) internal pure returns (bool) {
        return ~inputs[ZERO] == inputs[ONE];
    }

    function expUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _expUint256);
    }

    function _expUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return inputs[ZERO] ** inputs[ONE] == inputs[TWO];
    }

    function ltUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _ltUint256);
    }

    function _ltUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] < inputs[ONE]) == (inputs[TWO] == ONE);
    }

    function sltInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _sltInt256);
    }

    function _sltInt256(int256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] < inputs[ONE]) == (inputs[TWO] == int256(ONE));
    }

    function gtUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _gtUint256);
    }

    function _gtUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] > inputs[ONE]) == (inputs[TWO] == ONE);
    }

    function sgtInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _sgtInt256);
    }

    function _sgtInt256(int256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] > inputs[ONE]) == (inputs[TWO] == int256(ONE));
    }

    function eqUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _eqUint256);
    }

    function _eqUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] == inputs[ONE]) == (inputs[TWO] == ONE);
    }

    function andUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _andUint256);
    }

    function _andUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] & inputs[ONE]) == inputs[TWO];
    }

    function orUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _orUint256);
    }

    function _orUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] | inputs[ONE]) == inputs[TWO];
    }

    function xorUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _xorUint256);
    }

    function _xorUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] ^ inputs[ONE]) == inputs[TWO];
    }

    function shlUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _shlUint256);
    }

    function _shlUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] << inputs[ONE]) == inputs[TWO];
    }

    function shrUint256(uint256[] calldata inputs) external pure {
        _iterateUint256(THREE, inputs, _shrUint256);
    }

    function _shrUint256(uint256[] calldata inputs) internal pure returns (bool) {
        return (inputs[ZERO] >> inputs[ONE]) == inputs[TWO];
    }

    function sarInt256(int256[] calldata inputs) external pure {
        _iterateInt256(THREE, inputs, _sarInt256);
    }

    function _sarInt256(int256[] calldata inputs) internal pure returns (bool) {
        int256 a = inputs[ZERO];
        int256 b = inputs[ONE];
        int256 c;
        assembly {
            c := sar(b, a)
        }
        return c == inputs[TWO];
    }
}
