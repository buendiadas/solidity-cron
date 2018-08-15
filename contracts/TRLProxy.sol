pragma solidity ^0.4.24;

import "./TRLStorage.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TRLProxy is TRLStorage, Ownable {

    address trl_logic;

    function setContractLogic(address _account) public returns (bool success){
        require(msg.sender == owner);
        trl_logic = _account;
        return true;
    }

    function () payable public {
        address target = trl_logic;
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, target, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)
            switch result
            case 0 { revert(ptr, size) }
            case 1 { return(ptr, size) }
        }
    }
}