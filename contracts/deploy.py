import compile
from web3 import Web3

# RPC Provider (Ganache)
RPC_PROVIDER_URL = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(RPC_PROVIDER_URL))

print(web3.is_connected())  # should be True

# Set deployer account
PRIVATE_KEY = "0xc01209860b06f83a0bbd6f59ab11f71537f37a3d9e36d8771748f3c743d7c0c2"
account = web3.eth.account.from_key(PRIVATE_KEY)
address = account.address

print("Deploying from account:", address)

# Create contract instance
AppContract = web3.eth.contract(abi=compile.abi, bytecode=compile.bytecode)

# Build transaction
nonce = web3.eth.get_transaction_count(address)
estimated_gas = AppContract.constructor().estimate_gas({'from': address})
transaction = AppContract.constructor().build_transaction({
    "from": address,
    "nonce": nonce,
    "gasPrice": web3.eth.gas_price
})
signed_txn = web3.eth.account.sign_transaction(transaction, PRIVATE_KEY)

# Send the transaction
txn_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
print("Transaction hash:", txn_hash.hex())
print("Waiting for transaction to be mined...")

# Wait for the receipt
txn_receipt = web3.eth.wait_for_transaction_receipt(txn_hash, timeout=120)  # increase timeout if needed
print(f"Done! Contract deployed to {txn_receipt.contractAddress}")