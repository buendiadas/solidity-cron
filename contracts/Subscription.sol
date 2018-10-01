pragma solidity ^0.4.24;

import "./TRL.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@frontier-token-research/cron/contracts/Period.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
* Handle subscription details and permissions
* If subscription conditions are met, the contract will eventually call buyTokenVotes, and fire SubscriptionExecuted event
*/

contract Subscription is Ownable {
    using SafeMath for uint256;

    event SubscriptionCreated(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionCancelled(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionExecuted(address indexed _from, address indexed _to, uint256 _tokenAmounts);
    event SubscriptionFailed(address indexed _from, address indexed _to, uint256 _tokenAmount);


    address public trlAddress;
    uint256[2] public bounds = [0, 2^256 - 1];
    mapping (address => SubscriptionDetails) public subscriptions;

    constructor(address _target) public {
        trlAddress = _target;
    }

    struct SubscriptionDetails {
        bool active;
        uint256 amount;
        uint256 nextEpoch;
    }

    /**
    * @dev Includes a subscription on the account of the sender
    * @param _amount Subscription amount that the sender is approving to be charged
    * NOTICE: It will charge the first payment in order to include the subscription
    */

    function subscribe(uint256 _amount) external {
        require(_amount > bounds[0] && _amount < bounds[1]);
        subscriptions[msg.sender] = SubscriptionDetails(true, _amount, TRL(trlAddress).height());
        bool firstPayment = _execute(msg.sender); // Require a first payment in order to start the subscription
        if (firstPayment) {
            emit SubscriptionCreated(msg.sender, trlAddress, _amount);
        }
        else {
            subscriptions[msg.sender].active = false;
            emit SubscriptionFailed(msg.sender, trlAddress, _amount);
        }
    }

    /**
    * @dev Cancels the subscription of an account
    * @param _account Account where the subscription will be canceled
    */

    function cancel(address _account) external { 
        require(canCancel(msg.sender, _account));
        subscriptions[_account].active = false;
        emit SubscriptionCreated(_account, trlAddress, subscriptions[_account].amount);
    }


    /**
    * @dev Sets the minimum subscription, only allowed to be done by the owner
    * @param _bound Minimum value of the subscription accepte
    */

    function setMin(uint256 _bound) external onlyOwner {
        bounds[0] = _bound;
    }
    
    /**
    * @dev Sets the maximum subscription, only allowed to be done by the owner
    * @param _bound Maximum value of the subscription accepte
    */

    function setMax(uint256 _bound) external onlyOwner {
        bounds[1] = _bound;
    }

    /**
    * @dev Executes a subscription on behalf of the user
    * @param _account Address of the user where the subscription is executed
    */
    
    function execute(address _account) public returns (bool) {
        require(subscriptions[_account].nextEpoch <= TRL(trlAddress).height() && subscriptions[_account].active);
        _execute(_account);
       
    }

    /**
    * @dev Executes a subscription on behalf of the user
    * @param _account Target account where the subsciption is going to be executed
    */
    
    function _execute(address _account) internal returns (bool) {
        require(subscriptions[_account].nextEpoch <= TRL(trlAddress).height() && subscriptions[_account].active);
        StandardToken token = StandardToken(address(TRL(trlAddress).token()));
        token.transferFrom(_account, this, subscriptions[_account].amount);
        token.approve(trlAddress,subscriptions[_account].amount);
        bool success = TRL(trlAddress).executeSubscription(_account, subscriptions[_account].amount);
        if (success){
            subscriptions[_account].nextEpoch ++;   
            emit SubscriptionExecuted(_account, trlAddress, subscriptions[_account].amount);
        }
        else {
             emit SubscriptionFailed(_account, trlAddress, subscriptions[_account].amount);
        }
        return true;
    }



    function canCancel(address _from, address _to ) public view returns(bool){
        if(_from == owner || _from == _to) {
            return true;
        } 
        return false;
    }
}
