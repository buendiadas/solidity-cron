module.exports = {
  TRL: [
    {
      'constant': true,
      'inputs': [],
      'name': 'candidateRegistry',
      'outputs': [
        {
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'name': '',
          'type': 'uint256'
        },
        {
          'name': '',
          'type': 'address'
        }
      ],
      'name': 'votesReceived',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'name': 'votingConstraints',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'name': '',
          'type': 'uint256'
        },
        {
          'name': '',
          'type': 'address'
        }
      ],
      'name': 'votesBalance',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'periodicStages',
      'outputs': [
        {
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'owner',
      'outputs': [
        {
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'voterRegistry',
      'outputs': [
        {
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'name': 'stakingConstraints',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': 'newOwner',
          'type': 'address'
        }
      ],
      'name': 'transferOwnership',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'token',
      'outputs': [
        {
          'name': '',
          'type': 'address'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'name': '_tokenAddress',
          'type': 'address'
        },
        {
          'name': '_candidateRegistryAddress',
          'type': 'address'
        },
        {
          'name': '_voterRegistryAddress',
          'type': 'address'
        },
        {
          'name': '_initialTTL',
          'type': 'uint256'
        },
        {
          'name': '_initialActiveTime',
          'type': 'uint256'
        },
        {
          'name': '_initialClaimTime',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'constructor'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': 'previousOwner',
          'type': 'address'
        },
        {
          'indexed': true,
          'name': 'newOwner',
          'type': 'address'
        }
      ],
      'name': 'OwnershipTransferred',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': false,
          'name': '_T',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': '_active',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': '_claim',
          'type': 'uint256'
        }
      ],
      'name': 'PeriodInit',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': '_recipient',
          'type': 'address'
        },
        {
          'indexed': false,
          'name': '_amount',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': '_period',
          'type': 'uint256'
        }
      ],
      'name': 'VotesBought',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': '_recipient',
          'type': 'address'
        },
        {
          'indexed': false,
          'name': '_amount',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': '_period',
          'type': 'uint256'
        }
      ],
      'name': 'BountyRelased',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': false,
          'name': '_amount',
          'type': 'uint256'
        }
      ],
      'name': 'MinimumStakeSet',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'name': '_voterAddress',
          'type': 'address'
        },
        {
          'indexed': true,
          'name': '_candidateAddress',
          'type': 'address'
        },
        {
          'indexed': false,
          'name': '_amount',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'name': '_periodIndex',
          'type': 'uint256'
        }
      ],
      'name': 'Vote',
      'type': 'event'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_periodTTL',
          'type': 'uint256'
        },
        {
          'name': '_activeTime',
          'type': 'uint256'
        },
        {
          'name': '_claimTime',
          'type': 'uint256'
        }
      ],
      'name': 'initPeriod',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_amount',
          'type': 'uint256'
        }
      ],
      'name': 'buyTokenVotes',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_candidateAddress',
          'type': 'address'
        },
        {
          'name': '_amount',
          'type': 'uint256'
        }
      ],
      'name': 'vote',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [],
      'name': 'claimBounty',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_minimumStakeAmount',
          'type': 'uint256'
        }
      ],
      'name': 'setMinimumStake',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_maximumStakeAmount',
          'type': 'uint256'
        }
      ],
      'name': 'setMaximumStake',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_minVoteAmount',
          'type': 'uint256'
        }
      ],
      'name': 'setMinVotingLimit',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': false,
      'inputs': [
        {
          'name': '_maxVoteAmount',
          'type': 'uint256'
        }
      ],
      'name': 'setMaxVotingLimit',
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'currentPeriod',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [],
      'name': 'currentStage',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'constant': true,
      'inputs': [
        {
          'name': '_poolAmount',
          'type': 'uint256'
        },
        {
          'name': '_claimerVotes',
          'type': 'uint256'
        },
        {
          'name': '_totalVotes',
          'type': 'uint256'
        }
      ],
      'name': 'calculateReward',
      'outputs': [
        {
          'name': '',
          'type': 'uint256'
        }
      ],
      'payable': false,
      'stateMutability': 'pure',
      'type': 'function'
    }
  ]
}
