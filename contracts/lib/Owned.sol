pragma solidity 0.4.19;


contract Owned {

    address public owner;

    event OwnerChanged(address oldOwner, address newOwner);

    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert();
        _;
    }

    /**
     * Transfers the ownership of the contract
     * @param _newOwner Address of the new owner
     * TODO: Check KeyRecovery
     */
    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
        OwnerChanged(msg.sender, _newOwner);

    }

    function isOwner(address _addr) public constant returns(bool) {
        return _addr == owner;
    }
}
