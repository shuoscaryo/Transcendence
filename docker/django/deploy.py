import os
import json
from web3 import Web3
from solcx import compile_source, install_solc, set_solc_version
from eth_account import Account

# Config
GANACHE_URL = "http://ganache:7545"
CONTRACT_PATH = "/ganache/Tournaments.sol"
CONTRACT_JSON = "/ganache/Tournaments.json"
WALLET_JSON = "/ganache/wallet.json"
SOLC_VERSION = "0.8.0"
ACCOUNT_PATH = "m/44'/60'/0'/0/0"

# Connect to ganache
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# Get the wallet and private key from mnemonic
Account.enable_unaudited_hdwallet_features()
mnemonic = os.environ.get("MNEMONIC")
if not mnemonic:
    raise RuntimeError("Missing MNEMONIC environment variable")
account = Account.from_mnemonic(mnemonic, account_path=ACCOUNT_PATH)
wallet_address = account.address
private_key = account.key.hex()

# Save wallet address and private key
os.makedirs(os.path.dirname(WALLET_JSON), exist_ok=True)
with open(WALLET_JSON, "w") as f:
    json.dump({
        "address": wallet_address,
        "private_key": private_key
    }, f, indent=2)

# Check if a contract already deployed
if os.path.exists(CONTRACT_JSON):
    print("Found existing contract file, validating...")
    with open(CONTRACT_JSON) as f:
        data = json.load(f)
        contract_address = data.get("address")

    if contract_address:
        code = w3.eth.get_code(contract_address)
        if code != b"":
            print(f"Contract already deployed at {contract_address}, skipping deployment.")
            exit(0)
        else:
            print("Contract address found but no code on-chain. Will redeploy.")

install_solc(SOLC_VERSION)
set_solc_version(SOLC_VERSION)

with open(CONTRACT_PATH) as f:
    source_code = f.read()

compiled = compile_source(source_code, output_values=["abi", "bin"])
_, contract_interface = compiled.popitem()
abi = contract_interface["abi"]
bytecode = contract_interface["bin"]

# Send contract to ganache
contract = w3.eth.contract(abi=abi, bytecode=bytecode)

tx = contract.constructor().build_transaction({
    'from': wallet_address,
    'nonce': w3.eth.get_transaction_count(wallet_address),
    'gas': 2000000,
    'gasPrice': w3.to_wei('50', 'gwei'),
})
signed_tx = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

# Save address and abi of contract
os.makedirs(os.path.dirname(CONTRACT_JSON), exist_ok=True)
with open(CONTRACT_JSON, "w") as f:
    json.dump({
        "address": tx_receipt.contractAddress,
        "abi": abi
    }, f, indent=2)

print(f"Contract deployed at {tx_receipt.contractAddress}")
