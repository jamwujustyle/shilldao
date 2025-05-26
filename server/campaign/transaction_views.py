from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.exception_handler import ErrorHandlingMixin
from .serializers import CampaignCreateSerializer, CampaignSerializer
from drf_spectacular.utils import extend_schema, OpenApiResponse
from web3 import Web3
from django.conf import settings
import logging
import time
from eth_utils import to_checksum_address

logger = logging.getLogger(__name__)

# Contract addresses - these should match the frontend
SHILL_TOKEN_ADDRESS = "0x652159c7f62e9c1613476ca600f3b591dbfc920e"
DAO_CONTRACT_ADDRESS = "0xE5FE82ec6482d0291f22B5269eDBC4a046eEA763"

# ERC20 Transfer event signature
TRANSFER_EVENT_SIGNATURE = (
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
)


class TransactionVerifiedCampaignCreateView(ErrorHandlingMixin, APIView):
    """
    Create a campaign after verifying that the required SHILL token transfer
    has been completed on the blockchain.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["campaigns"],
        summary="Create Campaign with Transaction Verification",
        description="Create a new campaign after verifying that the required SHILL token transfer has been completed on the blockchain.",
        request=CampaignCreateSerializer,
        responses={
            201: OpenApiResponse(
                response=CampaignSerializer,
                description="Campaign created successfully after transaction verification.",
            ),
            400: OpenApiResponse(
                description="Invalid data or transaction verification failed."
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
            403: OpenApiResponse(
                description="User is not allowed to create a campaign for the specified DAO."
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        # Get transaction hash from request
        transaction_hash = request.data.get("transaction_hash")
        if not transaction_hash:
            return Response(
                {"error": "Transaction hash is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate campaign data
        serializer = CampaignCreateSerializer(
            data=request.data,
            context={"request": request, "view_action": "create-verified"},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Verify the transaction
        try:
            if not self._verify_transaction(
                transaction_hash,
                request.user.eth_address,
                serializer.validated_data["budget"],
            ):
                return Response(
                    {"error": "Transaction verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            logger.error(f"Transaction verification error: {str(e)}")
            return Response(
                {"error": "Failed to verify transaction"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the campaign
        campaign = serializer.save()

        # Return the created campaign
        response_serializer = CampaignCreateSerializer(campaign)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def _verify_transaction(
        self, tx_hash: str, user_address: str, expected_amount: float
    ) -> bool:  # noqa
        """
        Verify that the transaction:
        1. Exists and is confirmed
        2. Is a transfer from user_address to DAO_CONTRACT_ADDRESS
        3. Transfers the expected amount of SHILL tokens
        4. Was mined within the last 2 minutes
        """

        try:
            # Initialize Web3 connection
            web3_provider_url = getattr(
                settings,
                "WEB3_PROVIDER_URL",
                None,  # Default to None to make misconfiguration more obvious
            )
            if not web3_provider_url or web3_provider_url.endswith("/None"):
                logger.error(
                    "WEB3_PROVIDER_URL is not configured correctly in Django settings."
                )
                return False

            w3 = Web3(Web3.HTTPProvider(web3_provider_url))

            if not w3.is_connected():
                logger.error(
                    f"Web3 connection failed for provider: {web3_provider_url}"
                )
                return False

            # Get transaction receipt
            try:
                tx_receipt = w3.eth.get_transaction_receipt(tx_hash)
            except Exception as e:
                logger.error(
                    f"Failed to get transaction receipt for {tx_hash}: {str(e)}"
                )
                return False

            if not tx_receipt:
                logger.error(f"Transaction receipt not found for {tx_hash}.")
                return False

            # Check 1: Transaction successful on-chain
            if tx_receipt.status != 1:
                logger.error(
                    f"Transaction {tx_hash} failed on-chain (status {tx_receipt.status})"
                )
                return False
            logger.critical(f"Transaction {tx_hash} status is success (1).")

            # Check 2: Transaction timeliness (within 2 minutes of its mining relative to current server time)
            block_hash = tx_receipt.blockHash
            if not block_hash:
                logger.error(
                    f"Block hash not found in receipt for transaction {tx_hash}."
                )
                return False

            try:
                block = w3.eth.get_block(block_hash)
            except Exception as e:
                logger.error(
                    f"Failed to get block details for {block_hash.hex()}: {str(e)}"
                )
                return False

            if not block:
                logger.error(f"Block not found for hash {block_hash.hex()}.")
                return False

            transaction_timestamp = (
                block.timestamp
            )  # Timestamp of the block where tx was included
            current_server_time_unix = int(time.time())
            age_seconds = current_server_time_unix - transaction_timestamp

            if age_seconds > 120:  # 2 minutes = 120 seconds
                logger.error(
                    f"Transaction {tx_hash} is too old. "
                    f"Mined at: {transaction_timestamp} (block {tx_receipt.blockNumber}), Current time: {current_server_time_unix}. "
                    f"Age: {age_seconds}s > 120s"
                )
                return False

            # Get transaction details
            try:
                tx = w3.eth.get_transaction(tx_hash)
            except Exception as e:
                logger.error(
                    f"Failed to get transaction details for {tx_hash}: {str(e)}"
                )
                return False

            if not tx:
                logger.error(f"Transaction details not found for {tx_hash}.")
                return False

            # Check 3: Transaction 'to' address is the SHILL token contract
            if tx["to"] is None or tx["to"].lower() != SHILL_TOKEN_ADDRESS.lower():
                logger.error(
                    f"Transaction {tx_hash} 'to' address mismatch or missing. "
                    f"Expected: {SHILL_TOKEN_ADDRESS}, Got: {tx['to']}"
                )
                return False

            # Check 4: Transaction 'from' address is the authenticated user
            if tx["from"] is None or tx["from"].lower() != user_address.lower():
                logger.error(
                    f"Transaction {tx_hash} 'from' address mismatch or missing. "
                    f"Expected: {user_address}, Got: {tx['from']}"
                )
                return False

            # Check 5: Parse transfer events from logs to confirm details
            found_valid_transfer = False

            for i, log_entry in enumerate(
                tx_receipt.logs
            ):  # Renamed 'log' to 'log_entry'
                logger.critical(f"Processing log #{i} for tx {tx_hash}:")
                log_entry_address_lower = log_entry.address.lower()
                shill_token_address_lower = SHILL_TOKEN_ADDRESS.lower()
                is_correct_contract = (
                    log_entry_address_lower == shill_token_address_lower
                )

                actual_topic_count = len(log_entry.topics)
                has_enough_topics = actual_topic_count >= 3

                is_transfer_event_signature = False
                if has_enough_topics:
                    log_topic_0_hex = log_entry.topics[0].hex()
                    is_transfer_event_signature = (
                        log_topic_0_hex == TRANSFER_EVENT_SIGNATURE
                        or log_topic_0_hex
                        == TRANSFER_EVENT_SIGNATURE[
                            2:
                        ]  # Remove "0x" prefix for comparison
                    )

                if (
                    is_correct_contract
                    and has_enough_topics
                    and is_transfer_event_signature
                ):
                    event_from_address = to_checksum_address(
                        "0x" + log_entry.topics[1].hex()[-40:]
                    )
                    event_to_address = to_checksum_address(
                        "0x" + log_entry.topics[2].hex()[-40:]
                    )
                    event_amount_wei = int(log_entry.data.hex(), 16)

                    # Verify transfer details within the event
                    if (
                        event_from_address.lower()
                        == user_address.lower()  # Tokens transferred FROM the user
                        and event_to_address.lower()
                        == DAO_CONTRACT_ADDRESS.lower()  # Tokens transferred TO the DAO
                    ):
                        amount_in_tokens = event_amount_wei / (
                            10**18
                        )  # Assuming 18 decimals for SHILL

                        # Verify amount matches expected (with small tolerance for precision)
                        if (
                            abs(amount_in_tokens - float(expected_amount)) < 0.000001
                        ):  # Increased precision for safety
                            logger.critical(
                                f"Successfully verified Transfer event in {tx_hash}: "
                                f"From {user_address} To {DAO_CONTRACT_ADDRESS}, Amount {expected_amount} SHILL."
                            )
                            found_valid_transfer = True
                            break  # Valid transfer found, no need to check other logs
                        else:
                            logger.error(
                                f"Transfer event amount mismatch for {tx_hash}. "
                                f"Expected: {expected_amount}, Got: {amount_in_tokens} (from WEI: {event_amount_wei}). "
                                f"User: {user_address}, EventFrom: {event_from_address}, EventTo: {event_to_address}"
                            )
                    else:
                        logger.warning(
                            f"Transfer event in {tx_hash} did not match expected parties. "
                            f"EventFrom: {event_from_address} (ExpectedUser: {user_address}), "
                            f"EventTo: {event_to_address} (ExpectedDAO: {DAO_CONTRACT_ADDRESS})"
                        )

            if not found_valid_transfer:
                logger.error(
                    f"No valid SHILL token Transfer event found in transaction {tx_hash} from user {user_address} to DAO {DAO_CONTRACT_ADDRESS} for amount {expected_amount}."
                )
                return False

            return True  # All checks passed

        except Exception as e:
            logger.exception(
                f"Unexpected error during transaction verification for {tx_hash}: {str(e)}"
            )  # Use logger.exception for stack trace
            return False
