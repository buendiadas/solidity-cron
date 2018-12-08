pragma solidity ^0.4.24;

import "./TRL.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";   
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* Handle subscription details and permissions
* If subscription conditions are met, the contract will eventually call buyTokenVotes, and fire SubscriptionExecuted event
*/

contract Subscription is Ownable {
    using SafeMath for uint256;

    event SubscriptionCreated(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionCancelled(address indexed _from, address indexed _to, uint256 _tokenAmount);
    event SubscriptionExecuted(address indexed _from, address indexed _to, uint256 _tokenAmounts);
    event SubscriptionRefunded(address indexed _from, address indexed _to, uint256 _tokenAmount);


    uint256[2] public bounds = [0, 2^256 - 1];
    mapping (address => Conditions) public subscriptions;


    struct Conditions {
        address target;
        bool active;
        uint256 amount;
        uint256 nextEpoch;
    }

    /**
    * @dev Includes a subscription on the account of the sender
    * @param _amount Subscription amount that the sender is approving to be charged
    * NOTICE: It will charge the first payment in order to include the subscription
    */

    function subscribe(uint256 _amount, address _target) external {
        require(_amount >= bounds[0] && _amount <= bounds[1]);
        subscriptions[msg.sender] = Conditions(_target, false, _amount, TRL(_target).height());
        _execute(msg.sender);
        subscriptions[msg.sender].active = true;
        emit SubscriptionCreated(msg.sender, _target, _amount);
    }

    /**
    * @dev Executes a subscription on behalf of the user
    * @param _account Address of the user where the subscription is executed
    */
    
    function execute(address _account) external returns (bool) {
        require(subscriptions[_account].active);
        _execute(_account);
    }

    /**
    * @dev Cancels the subscription of an account
    * @param _account Account where the subscription will be canceled
    */

    function cancel(address _account) external { 
        require(canCancel(msg.sender, _account));
        subscriptions[_account].active = false;
        emit SubscriptionCancelled(_account, subscriptions[_account].target, subscriptions[_account].amount);
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
    * @dev Conditions required to cancel a subscription
    * @param _from subscriber
    * @param _to publisher address
    */

    function canCancel(address _from, address _to ) public view returns(bool) {
        return (_from == owner() || _from == _to);
    }

    /**
    * @dev Check if the subscription from an account is accepted to be executed
    * @param _account Account that is checked to have an active subscription
    */

    function canBeExecuted(address _account) public view returns (bool) {
        return subscriptions[_account].nextEpoch <= TRL(subscriptions[_account].target).height();
    }
    
    /**
    * @dev Settles the subscription for the current period
    * @param _account Address of the user that is having its Subscription executed
    */

    function _execute(address _account) internal returns (bool) {
        require(canBeExecuted(_account));
        _relayApprove(_account);
        TRL(subscriptions[_account].target).executeSubscription(_account, subscriptions[_account].amount);
        _successfulExecution(_account);
    }

    /**
    * @dev Relays the approval received from subscriber to the target contract
    * @param _account Address of subscriber.
    */

    function _relayApprove(address _account) internal returns (bool) {
        ERC20 token = ERC20(address(TRL(subscriptions[_account].target).token()));
        token.transferFrom(_account, this, subscriptions[_account].amount);
        token.approve(subscriptions[_account].target, subscriptions[_account].amount);
    }

    /**
    * @dev Internal handler for successful executions
    * @param _account Address of the user that just realized a succesful execution
    */

    function _successfulExecution(address _account) internal returns (bool) {
        subscriptions[_account].nextEpoch++;   
        emit SubscriptionExecuted(_account, subscriptions[_account].target, subscriptions[_account].amount);
        return true;
    }
}
