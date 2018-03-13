# Frontier Lists - Docs 0.2

## About Version `[V0.2]`

* Includes a State machine with periodic voting included
* Usage of Lazy Execution from period and Stage from admin
* Voters and Candidates inclusion is centralized in admin
* Votes are public (result and provenance can be known upfront)

## Stages

### **Periodic Ballots**

To incentivise continuous activity on the platform, FrontierLists  processes periodic Ballots, where candidates included in the registry are eligible again to compete for the voting pool. To accomplish this goal, a state machine can be created, where different periods and its inner subsequent stages are automatically executed.

**Period:** Temporary repeated phases where voters can select for their candidates. The validity of the votes is restricted to each period.

**Stage:** To be able to manage the workflow, and move between periods, 4 different stages are created:

* `00 Inactive:`
* `01 Active:`
* `02 Claiming:`
* `03 Closed:`

## Stages

### List Creation

As a previous requirement to create the list, an ERC20 compliant token (main token) must have been created. This token will serve as the token to buy votes for every period. Additionally, the initial number of maximum candidates to be voted must be set.

* `_tokenAddress`: An address that defines the main token, (`FTR`) the only one that can get votes.
* `_maxNumCandidate`s: Maximum number of candidates that can be included in the List.
* _`initialTTL:` Time to live for each period.

```
    function PrivateList(address _tokenAddress, uint256 _maxNumCandidates, uint256 _initialTTL) public {
        token = Standard20Token(_tokenAddress);
        maxNumCandidates = _maxNumCandidates;
        periodTTL = _initialTTL;
        initPeriod();
    }
```

### Initialising the period

Once that the list has been created, you will need to start the first period. To do that, it will be needed to establish the `TTL` of the Period. At this point, the state is changed to ``active``.

```
    function initPeriod(){
        require(periods[currentPeriod].state == 0);
        periods[currentPeriod].TTL= periodTTL;
        periods[currentPeriod].state= 1;
        periods.startTime = now;
    }
```

### Staking (Buying period votes)

Token holders can decide at every period to stake tokens to vote in this period. Internally, this will be translated into a change in the voteBalance mapping. Only voters are allowed to do so.

```
    function buyTokenVotes(uint256 _amount) public {
      require(token.transferFrom(msg.sender,this, _amount));
      votesBalance[currentPeriod][msg.sender] += _amount;
    }
```

###
