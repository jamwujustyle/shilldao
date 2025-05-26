from celery import shared_task
import requests
from django.core.cache import cache
import os
from decimal import Decimal
from web3 import Web3
from dotenv import load_dotenv
from logging_config import logger

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
        logger.critical(f"❌ RPC call to getSlot0 failed: {e}")
        logger.critical(f"   - Contract address: {state_view_address}")
        logger.critical(f"   - Pool ID: {pool_id}")
        return None


@shared_task
def fetch_shill_price():

    STATE_VIEW_ADDRESS = "PLACEHOLDER"
    POOL_ID = "PLACEHOLDER"
    RPC_URL = "https://sepolia.infura.io/v3/PLACEHOLDER"
    TOKEN0_DECIMALS = 18
    TOKEN1_DECIMALS = 18  # Shill Token

    w3 = Web3(Web3.HTTPProvider(RPC_URL))

    if w3.is_connected():
        print("✅ Connected to Ethereum Sepolia network")
    else:
        print("❌ Failed to connect to Ethereum network")
        return

    slot0_data = get_slot0_from_blockchain(w3, STATE_VIEW_ADDRESS, POOL_ID)
    if slot0_data is None:
        print("❌ Failed to get slot0 data from blockchain")
        return
    sqrt_price_x96 = slot0_data["sqrtPriceX96"]
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

        cache.set("shill_price_usd", shill_price_usd, timeout=60 * 3)

    except Exception as e:
        print(f"❌ Error calculating Shill token price: {e}")
        return
