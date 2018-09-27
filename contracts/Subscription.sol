pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/ECRecovery.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@frontier-token-research/cron/contracts/Period.sol";
import "./TRL.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* Handle subscription details and permissions
* If subscription conditions are met, the contract will eventually call buyTokenVotes, and fire SubscriptionExecuted event
*/

contract Subscription is Ownable {
    using ECRecovery for bytes32;
    using SafeMath for uint256;

    event SubscriptionCreated(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionCancelled(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionExecuted(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionFailed(address indexed _from, address indexed _to, uint256 _tokenAmount);
    

    address public trlAddress;
    uint256[2] public limits;
    mapping (address => SubscriptionDetails) public subscriptions;

    struct SubscriptionDetails {
        bool active;
        uint256 amount;
        uint256 nextEpoch;
    }


    function subscribe(uint256 _amount){
        require(_amount > limits[0] && _amount < limits[1]);
        subscriptions[msg.sender] = SubscriptionDetails(true, _amount, TRL(trlAddress).height());
        emit SubscriptionCreated(msg.sender, trlAddress, _amount);
    }


    /**
    * @dev Executes a subscription on behalf of the user
    */
    
    function execute(address _who) public returns (bool) {
        require(subscriptions[_who].nextEpoch <= TRL(trlAddress).height());
        ERC20 token = ERC20(address(TRL(trlAddress).token));
        token.transferFrom(msg.sender, this, subscriptions[_who].amount);
        token.approve(trlAddress,subscriptions[_who].amount);
        TRL(trlAddress).executeSubscription(_who, subscriptions[_who].amount);
        subscriptions[_who].nextEpoch ++;
        return (true);
    }
}
