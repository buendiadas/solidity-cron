pragma solidity ^0.4.11;

contract Owned {
    address public owner;
    event OwnerChanged(address oldOwner, address newOwner);
    modifier onlyOwner(){
        if(msg.sender != owner)
            throw;
        _;
    }
    function Owned() {
        owner = msg.sender;
    }
    /**
     * Transfers the ownership of the contract
     * @param _newOwner Address of the new owner
     * TODO: Check KeyRecovery
     */
    function changeOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
        OwnerChanged(msg.sender, _newOwner);

    }

    function isOwner(address _addr) constant returns(bool) {
        return _addr == owner;
    }
}
