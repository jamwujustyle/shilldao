from django.core.cache import cache
from web3 import Web3
from dotenv import load_dotenv
import secrets
import os
from eth_account.messages import encode_defunct
from logging_config import logger
import time

load_dotenv()


class NonceManager:

    NONCE_TIMEOUT = 3600
    NONCE_PREFIX = "eth_nonce:"

    @classmethod
    def generate_nonce(cls, eth_address: str) -> tuple[str, int]:
        eth_address = eth_address.lower()

        nonce = secrets.token_hex(16)
        timestamp = int(time.time())
        cache_key = f"{cls.NONCE_PREFIX}{eth_address}"

        cache.set(cache_key, (nonce, timestamp), timeout=cls.NONCE_TIMEOUT)

        return nonce, timestamp

    @classmethod
    def verify_nonce(
        cls, eth_address: str, nonce: str, delete_on_success: bool = False
    ) -> bool:
        eth_address = eth_address.lower()

        cache_key = f"{cls.NONCE_PREFIX}{eth_address}"
        stored_data = cache.get(cache_key)

        try:
            if not stored_data:
                return False

            if not isinstance(stored_data, tuple) or len(stored_data) != 2:
                return False

            stored_nonce, timestamp = stored_data
            current_time = int(time.time())

            if current_time - timestamp > cls.NONCE_TIMEOUT:
                return False

            if stored_nonce != nonce:
                return False

            if (
                delete_on_success
                and not os.environ.get("DEBUG", "False").lower() == "true"
            ):
                cache.delete(cache_key)

            return True

        except Exception:
            return False

    @classmethod
    def get_stored_nonce_data(cls, eth_address: str) -> tuple:
        eth_address = eth_address.lower()

        cache_key = f"{cls.NONCE_PREFIX}{eth_address}"
        return cache.get(cache_key)

    @classmethod
    def delete_nonce(cls, eth_address: str) -> bool:

        eth_address = eth_address.lower()
        cache_key = f"{cls.NONCE_PREFIX}{eth_address}"

        cache.delete(cache_key)
        return True


class SignatureVerifier:
    @staticmethod
    def construct_expected_message(stored_nonce: str, timestamp: int) -> str:
        """Construct the exact message format that should be signed"""
        return f"""Welcome to ShillDAO!

Please sign this message to verify your wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.

Verification Details:
- Nonce: {stored_nonce}
- Time: {timestamp}

This is a one-time security step to protect your account."""

    @staticmethod
    def verify_ethereum_signature(
        message: str,
        signature: str,
        eth_address: str,
        stored_nonce: str,
        timestamp: int,
        w3: Web3 = None,  # Add w3 as an argument with a default value
    ) -> bool:
        try:
            eth_address = eth_address.lower()

            if stored_nonce is None or timestamp is None:
                stored_data = NonceManager.get_stored_nonce_data(eth_address)
                if not stored_data:
                    return False
                stored_nonce, timestamp = stored_data

            # Construct expected message and compare
            expected_message = SignatureVerifier.construct_expected_message(
                stored_nonce, timestamp
            )

            # Normalize whitespace for comparison
            if message.strip() != expected_message.strip():
                return False
            logger.critical("Debug Info: Message mismatch")
            logger.critical(f"Received message: {repr(message)}")
            logger.critical(f"Expected message: {repr(expected_message)}")
            logger.critical(f"Expected nonce: {stored_nonce}")
            logger.critical(f"Expected timestamp: {timestamp}")
            logger.critical(f"ETH Address: {eth_address}")
            logger.critical(f"Signature: {signature}")

            # Use the provided w3 instance or create a new one
            _w3 = w3 if w3 else Web3()
            message_hash = encode_defunct(text=message)
            recovered_address: str = _w3.eth.account.recover_message(
                message_hash, signature=signature
            )

            result = recovered_address.lower() == eth_address.lower()
            return result

        except Exception as ex:
            print(f"Signature verification error: {ex}")
            return False
