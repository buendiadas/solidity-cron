pragma solidity ^0.4.24;

import "./TRLStorage.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * A proxy Smart Contract following ERC897. Delegate calls to a target contract accessible via implementation() 
 */

contract Proxy is Ownable, TRLStorage {

    address public logicContract;

    /**
     * @dev Sets the target address where the calls will be delegated. 
     * @param _account Target address, that will be accesible via implementation()
     */
     
    function setContractLogic(address _account) public returns (bool success) {
        require(msg.sender == owner());
        logicContract = _account;
        return true;
    }
    
    /**
     * @dev ERC897, whether it is a forwarding (1) or an upgradeable (2) proxy
     */

    function proxyType() public pure returns (uint256 proxyTypeId) {
        return 2;
    }

    /**
    * @dev ERC897, the address the proxy would delegate calls to
    */

    function implementation() public view returns (address) {
        return logicContract;
    }

    /**
    * @dev Proxy function. Delegate calls to the address taken on implementation()
    */

    function () payable public {
        address target = implementation();
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