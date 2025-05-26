import requests
from decimal import Decimal
from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()


def sqrtPriceX96_to_price_decimal(sqrt_price_x96, decimal0, decimal1):
    sqrt_price = Decimal(sqrt_price_x96)
    price = (sqrt_price / Decimal(2**96)) ** 2
    adjusted_price = price * Decimal(10) ** Decimal(decimal0 - decimal1)
    return adjusted_price


def get_eth_price_usd():
    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        )
        data = response.json()
        return float(data["ethereum"]["usd"])
    except Exception as e:
        print(f"Error fetching ETH price: {e}")
        return False


def get_slot0_from_blockchain(w3, state_view_address, pool_id):
    STATE_VIEW_ABI = [
        {
            "inputs": [
                {"internalType": "bytes32", "name": "poolId", "type": "bytes32"}
            ],
            "name": "getSlot0",
            "outputs": [
                {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
                {"internalType": "int24", "name": "tick", "type": "int24"},
                {"internalType": "uint24", "name": "protocolFee", "type": "uint24"},
                {"internalType": "uint24", "name": "lpFee", "type": "uint24"},
            ],
            "stateMutability": "view",
            "type": "function",
        }
    ]

    try:
        state_view_contract = w3.eth.contract(
            address=Web3.to_checksum_address(state_view_address), abi=STATE_VIEW_ABI
        )
        slot0_data = state_view_contract.functions.getSlot0(pool_id).call()
        result = {
            "sqrtPriceX96": slot0_data[0],
            "tick": slot0_data[1],
            "protocolFee": slot0_data[2],
            "lpFee": slot0_data[3],
        }
        return result

    except Exception as e:
        print(f"❌ RPC call to getSlot0 failed: {e}")
        print(f"   - Contract address: {state_view_address}")
        print(f"   - Pool ID: {pool_id}")
        return None


def main():
    STATE_VIEW_ADDRESS = "0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c"
    POOL_ID = "0xdcb7fb4f33aec4a3a9708e1634e53c30ba51d01fd78bd04693a11d5a02c0cd52"
    RPC_URL = f"https://sepolia.infura.io/v3/{os.environ.get('INFURA_PROJECT_ID')}"

    TOKEN0_DECIMALS = 18
    TOKEN1_DECIMALS = 18  # Shill Token

    w3 = Web3(Web3.HTTPProvider(RPC_URL))

    if w3.is_connected():
        print("✅ Connected to Ethereum Sepolia network")
    else:
        print("❌ Failed to connect to Ethereum network")
        return

    print("-" * 40)
    slot0_data = get_slot0_from_blockchain(w3, STATE_VIEW_ADDRESS, POOL_ID)
    if slot0_data is None:
        print("❌ Failed to get slot0 data from blockchain")
        return
    sqrt_price_x96 = slot0_data["sqrtPriceX96"]
    current_tick = slot0_data["tick"]
    try:
        raw_price = sqrtPriceX96_to_price_decimal(
            sqrt_price_x96, TOKEN0_DECIMALS, TOKEN1_DECIMALS
        )
        shill_price_in_eth = 1 / raw_price

        price_in_wei = float(shill_price_in_eth) * 10**18
        print(f"Shill token price in wei: {price_in_wei:.0f}")

        eth_price_usd = get_eth_price_usd()
        shill_price_usd = float(shill_price_in_eth) * eth_price_usd

        print(f"Shill Token Price (USD): ${shill_price_usd:.8f}")

    except Exception as e:
        print(f"❌ Error calculating Shill token price: {e}")
        return


if __name__ == "__main__":
    main()
