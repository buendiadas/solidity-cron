let config={}

config.admin_account_priv = web3.eth.accounts.privateKeyToAccount(process.env.TRL_ADMIN_KEY)
config.ttl = 10000
config.candidate_length = 100
config.voter_length = 100
config.initial_balance = 10000000

module.exports = config
