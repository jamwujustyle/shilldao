from django.test import TestCase
from unittest.mock import patch
from django.core.cache import cache
import time
from eth_auth.eth_service import NonceManager, SignatureVerifier


class NonceManagerTests(TestCase):
    def setUp(self):
        self.eth_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.nonce = "test_nonce"
        self.timestamp = int(time.time())
        self.cache_key = f"{NonceManager.NONCE_PREFIX}{self.eth_address.lower()}"

        # Clear cache before each test
        cache.clear()

    def test_generate_nonce(self):
        # Test nonce generation
        nonce, timestamp = NonceManager.generate_nonce(self.eth_address)

        # Verify nonce is a string and timestamp is an int
        self.assertIsInstance(nonce, str)
        self.assertIsInstance(timestamp, int)

        # Verify nonce is stored in cache
        stored_data = cache.get(self.cache_key)
        self.assertIsNotNone(stored_data)
        self.assertIsInstance(stored_data, tuple)
        self.assertEqual(len(stored_data), 2)

        stored_nonce, stored_timestamp = stored_data
        self.assertEqual(stored_nonce, nonce)
        self.assertEqual(stored_timestamp, timestamp)

    def test_verify_nonce_success(self):
        # Store a nonce in cache
        cache.set(
            self.cache_key,
            (self.nonce, self.timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Verify the nonce
        result = NonceManager.verify_nonce(self.eth_address, self.nonce)

        # Assert verification succeeded
        self.assertTrue(result)

        # Verify nonce is still in cache (not deleted)
        self.assertIsNotNone(cache.get(self.cache_key))

    def test_verify_nonce_with_delete(self):
        # Store a nonce in cache
        cache.set(
            self.cache_key,
            (self.nonce, self.timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Verify the nonce with delete_on_success=True
        with patch("os.environ.get", return_value="false"):  # Ensure DEBUG is False
            result = NonceManager.verify_nonce(
                self.eth_address, self.nonce, delete_on_success=True
            )

        # Assert verification succeeded
        self.assertTrue(result)

        # Verify nonce was deleted from cache
        self.assertIsNone(cache.get(self.cache_key))

    def test_verify_nonce_expired(self):
        # Store an expired nonce in cache (timestamp from 2 hours ago)
        expired_timestamp = int(time.time()) - (2 * 3600)
        cache.set(
            self.cache_key,
            (self.nonce, expired_timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Verify the nonce
        result = NonceManager.verify_nonce(self.eth_address, self.nonce)

        # Assert verification failed
        self.assertFalse(result)

    def test_verify_nonce_mismatch(self):
        # Store a nonce in cache
        cache.set(
            self.cache_key,
            (self.nonce, self.timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Verify with a different nonce
        result = NonceManager.verify_nonce(self.eth_address, "different_nonce")

        # Assert verification failed
        self.assertFalse(result)

    def test_verify_nonce_not_found(self):
        # Don't store anything in cache

        # Verify a nonce
        result = NonceManager.verify_nonce(self.eth_address, self.nonce)

        # Assert verification failed
        self.assertFalse(result)

    def test_get_stored_nonce_data(self):
        # Store a nonce in cache
        cache.set(
            self.cache_key,
            (self.nonce, self.timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Get the stored nonce data
        stored_data = NonceManager.get_stored_nonce_data(self.eth_address)

        # Assert data was retrieved correctly
        self.assertIsNotNone(stored_data)
        self.assertEqual(stored_data[0], self.nonce)
        self.assertEqual(stored_data[1], self.timestamp)

    def test_get_stored_nonce_data_not_found(self):
        # Don't store anything in cache

        # Get the stored nonce data
        stored_data = NonceManager.get_stored_nonce_data(self.eth_address)

        # Assert no data was found
        self.assertIsNone(stored_data)

    def test_delete_nonce(self):
        # Store a nonce in cache
        cache.set(
            self.cache_key,
            (self.nonce, self.timestamp),
            timeout=NonceManager.NONCE_TIMEOUT,
        )

        # Delete the nonce
        result = NonceManager.delete_nonce(self.eth_address)

        # Assert deletion succeeded
        self.assertTrue(result)

        # Verify nonce was deleted from cache
        self.assertIsNone(cache.get(self.cache_key))


class SignatureVerifierTests(TestCase):
    def setUp(self):
        self.eth_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.nonce = "test_nonce"
        self.timestamp = int(time.time())
        self.message = (
            "Welcome to ShillDAO!\n\n"
            "Please sign this message to verify your wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.\n\n"
            "Verification Details:\n"
            f"- Nonce: {self.nonce}\n"
            f"- Time: {self.timestamp}\n\n"
            "This is a one-time security step to protect your account."
        )
        self.signature = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"

    @patch("eth_auth.eth_service.Web3")
    def test_verify_ethereum_signature_success(self, mock_Web3):
        # Setup mock to return the same address
        mock_w3_instance = mock_Web3.return_value
        mock_w3_instance.eth.account.recover_message.return_value = self.eth_address

        # Verify signature
        result = SignatureVerifier.verify_ethereum_signature(
            message=self.message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=self.nonce,
            timestamp=self.timestamp,
            w3=mock_w3_instance,
        )

        # Assert verification succeeded
        self.assertTrue(result)

        # Verify mock was called correctly
        mock_w3_instance.eth.account.recover_message.assert_called_once()

    @patch("eth_auth.eth_service.Web3")
    def test_verify_ethereum_signature_address_mismatch(self, mock_Web3):
        # Setup mock to return a different address
        mock_w3_instance = mock_Web3.return_value
        mock_w3_instance.eth.account.recover_message.return_value = "0xDifferentAddress"
        # Verify signature
        result = SignatureVerifier.verify_ethereum_signature(
            message=self.message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=self.nonce,
            timestamp=self.timestamp,
            w3=mock_w3_instance,
        )

        # Assert verification failed
        self.assertFalse(result)

        # Verify mock was called correctly
        mock_w3_instance.eth.account.recover_message.assert_called_once()

    def test_verify_ethereum_signature_nonce_mismatch(self):
        # Verify signature with a message that doesn't contain the correct nonce
        message = (
            "Welcome to ShillDAO!\n\n"
            "Please sign this message to verify your wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.\n\n"
            "Verification Details:\n"
            f"- Nonce: different_nonce\n"
            f"- Time: {self.timestamp}\n\n"
            "This is a one-time security step to protect your account."
        )

        result = SignatureVerifier.verify_ethereum_signature(
            message=message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=self.nonce,
            timestamp=self.timestamp,
        )

        # Assert verification failed
        self.assertFalse(result)

    def test_verify_ethereum_signature_timestamp_mismatch(self):
        # Verify signature with a message that doesn't contain the correct timestamp
        message = (
            "Welcome to ShillDAO!\n\n"
            "Please sign this message to verify your wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.\n\n"
            "Verification Details:\n"
            f"- Nonce: {self.nonce}\n"
            "- Time: 12345\n\n"
            "This is a one-time security step to protect your account."
        )

        result = SignatureVerifier.verify_ethereum_signature(
            message=message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=self.nonce,
            timestamp=self.timestamp,
        )

        # Assert verification failed
        self.assertFalse(result)

    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")  # Outer patch
    @patch("eth_auth.eth_service.Web3")  # Inner patch
    def test_verify_ethereum_signature_with_stored_data(
        self, mock_Web3, mock_get_stored_nonce
    ):  # mock_Web3 from inner, mock_get_stored_nonce from outer
        # Setup mock to return nonce data
        mock_get_stored_nonce.return_value = (self.nonce, self.timestamp)

        # Configure the mock Web3 instance
        mock_w3_instance = mock_Web3.return_value
        mock_w3_instance.eth.account.recover_message.return_value = self.eth_address

        # Verify signature without providing stored_nonce and timestamp
        result = SignatureVerifier.verify_ethereum_signature(
            message=self.message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=None,
            timestamp=None,
            w3=mock_w3_instance,
        )

        # Assert verification succeeded
        self.assertTrue(result)

        # Verify mocks were called correctly
        mock_get_stored_nonce.assert_called_once_with(self.eth_address.lower())
        mock_w3_instance.eth.account.recover_message.assert_called_once()

    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")
    def test_verify_ethereum_signature_no_stored_data(self, mock_get_stored_nonce):
        # Setup mock to return None (no stored data)
        mock_get_stored_nonce.return_value = None

        # Verify signature without providing stored_nonce and timestamp
        result = SignatureVerifier.verify_ethereum_signature(
            message=self.message,
            signature=self.signature,
            eth_address=self.eth_address,
            stored_nonce=None,
            timestamp=None,
        )

        # Assert verification failed
        self.assertFalse(result)

        # Verify mock was called correctly
        mock_get_stored_nonce.assert_called_once_with(self.eth_address.lower())
