from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model

User = get_user_model()


class NonceManagerViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("nonce")
        self.valid_eth_address = "0x742d35Cc6634C0532925a3B844Bc454e4438F44e"  # Corrected to a valid checksum address
        self.invalid_eth_address = "invalid_address"

    @patch("eth_auth.eth_service.NonceManager.generate_nonce")
    @patch(
        "eth_auth.serializers.validate_eth_address"
    )  # This one is correct as validate_eth_address is in serializers
    def test_create_nonce_success(self, mock_validate, mock_generate_nonce):
        # Setup mocks
        mock_validate.return_value = self.valid_eth_address.lower()
        mock_generate_nonce.return_value = (
            "test_nonce",
            1747848978,
        )  # Use a fixed timestamp for consistency

        # Make request
        response = self.client.post(
            self.url, {"eth_address": self.valid_eth_address}, format="json"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("nonce", response.data)
        self.assertIn("timestamp", response.data)
        mock_validate.assert_called_once_with(self.valid_eth_address)
        mock_generate_nonce.assert_called_once_with(self.valid_eth_address.lower())

    def test_create_nonce_invalid_address(self):
        # Make request with invalid address
        response = self.client.post(
            self.url, {"eth_address": self.invalid_eth_address}, format="json"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_nonce_missing_address(self):
        # Make request without address
        response = self.client.post(self.url, {}, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("eth_address", response.data)


class SignatureVerifierViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("verify")
        self.valid_eth_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.valid_signature = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"
        self.valid_message = (
            "Sign this message to authenticate: nonce=abc123 timestamp=1620000000"
        )
        self.nonce = "abc123"
        self.timestamp = 1620000000

    @patch("eth_auth.eth_service.SignatureVerifier.verify_ethereum_signature")
    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")
    @patch("eth_auth.eth_service.NonceManager.verify_nonce")
    @patch("eth_auth.eth_service.NonceManager.delete_nonce")
    def test_verify_signature_success(
        self,
        mock_delete_nonce,
        mock_verify_nonce,
        mock_get_stored_nonce,
        mock_verify_signature,
    ):
        # Setup mocks
        mock_get_stored_nonce.return_value = (self.nonce, self.timestamp)
        mock_verify_nonce.return_value = True
        mock_verify_signature.return_value = True
        mock_delete_nonce.return_value = True

        # Make request
        response = self.client.post(
            self.url,
            {
                "eth_address": self.valid_eth_address,
                "signature": self.valid_signature,
                "message": self.valid_message,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_success"])
        self.assertIn("refresh", response.data)
        self.assertIn("access", response.data)
        self.assertIn("role", response.data)

        # Verify user was created
        self.assertTrue(
            User.objects.filter(eth_address=self.valid_eth_address.lower()).exists()
        )

        # Verify mocks were called correctly
        mock_get_stored_nonce.assert_called_once_with(self.valid_eth_address)
        mock_verify_nonce.assert_called_once_with(
            self.valid_eth_address, self.nonce, delete_on_success=False
        )
        mock_verify_signature.assert_called_once_with(
            message=self.valid_message,
            signature=self.valid_signature,
            eth_address=self.valid_eth_address,
            stored_nonce=self.nonce,
            timestamp=self.timestamp,
        )
        mock_delete_nonce.assert_called_once_with(self.valid_eth_address)

    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")
    def test_verify_signature_nonce_not_found(self, mock_get_stored_nonce):
        # Setup mocks
        mock_get_stored_nonce.return_value = None

        # Make request
        response = self.client.post(
            self.url,
            {
                "eth_address": self.valid_eth_address,
                "signature": self.valid_signature,
                "message": self.valid_message,
            },
            format="json",
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Nonce not found", str(response.data))

    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")
    @patch("eth_auth.eth_service.NonceManager.verify_nonce")
    def test_verify_signature_invalid_nonce(
        self, mock_verify_nonce, mock_get_stored_nonce
    ):
        # Setup mocks
        mock_get_stored_nonce.return_value = (self.nonce, self.timestamp)
        mock_verify_nonce.return_value = False

        # Make request
        response = self.client.post(
            self.url,
            {
                "eth_address": self.valid_eth_address,
                "signature": self.valid_signature,
                "message": self.valid_message,
            },
            format="json",
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid or expired nonce", str(response.data))

    @patch("eth_auth.eth_service.NonceManager.get_stored_nonce_data")
    @patch("eth_auth.eth_service.NonceManager.verify_nonce")
    @patch("eth_auth.eth_service.SignatureVerifier.verify_ethereum_signature")
    def test_verify_signature_invalid_signature(
        self, mock_verify_signature, mock_verify_nonce, mock_get_stored_nonce
    ):
        # Setup mocks
        mock_get_stored_nonce.return_value = (self.nonce, self.timestamp)
        mock_verify_nonce.return_value = True
        mock_verify_signature.return_value = False

        # Make request
        response = self.client.post(
            self.url,
            {
                "eth_address": self.valid_eth_address,
                "signature": self.valid_signature,
                "message": self.valid_message,
            },
            format="json",
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid signature", str(response.data))

    def test_verify_signature_missing_fields(self):
        # Make request without required fields
        response = self.client.post(self.url, {}, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("eth_address", response.data)
        self.assertIn("signature", response.data)
        self.assertIn("message", response.data)
