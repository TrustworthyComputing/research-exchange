import json
from pathlib import Path
import solcx
# print(solcx.get_installable_solc_versions())

solcx.install_solc('0.8.30', solcx_binary_path=Path(__file__).parent / "solc-bin")

# Compile contract

sol_file = Path("2_App.sol")
source_code = sol_file.read_text()

compiled_sol =  solcx.compile_standard(
    {
        "language": "Solidity",
        "sources": {sol_file.name: {"content": source_code}},
        "settings": {
            "optimizer": {"enabled": True, "runs": 200},
            "evmVersion": "london",
            "outputSelection": {
                "*": {"*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"]}
            },
        },
    },
    allow_paths=str(sol_file.parent)  # allow relative imports like 1_Owner.sol
)

# Extract ABI and bytecode
contract_name = "App"
abi = compiled_sol["contracts"][sol_file.name][contract_name]["abi"]
bytecode = compiled_sol["contracts"][sol_file.name][contract_name]["evm"]["bytecode"]["object"]

with open("abi.json", "w") as f:
    json.dump(abi, f)
