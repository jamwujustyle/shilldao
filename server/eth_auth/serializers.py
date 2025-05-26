from rest_framework import serializers
from eth_utils import is_checksum_address
from .eth_service import NonceManager, SignatureVerifier


def validate_eth_address(eth_address: str) -> str:
    if not is_checksum_address(eth_address):
        raise serializers.ValidationError("Invalid eth address")

    normalized = eth_address.lower()
    return normalized


class NonceSerializer(serializers.Serializer):
    eth_address = serializers.CharField(max_length=42)

    def create(self, validated_data) -> dict:
        try:
            eth_address = validate_eth_address(validated_data["eth_address"])
            nonce, timestamp = NonceManager.generate_nonce(eth_address)

            response = {"nonce": nonce, "timestamp": timestamp}
            return response
        except Exception:
            raise serializers.ValidationError({"error": "Invalid eth address"})


class SignatureSerializer(serializers.Serializer):

    eth_address = serializers.CharField(max_length=42)
    signature = serializers.CharField()
    message = serializers.CharField()

    def validate(self, attrs):
        try:
            # TODO: ENABLE IN PROD
            # eth_address = validate_eth_address(attrs["eth_address"])
            eth_address = attrs["eth_address"]
            message = attrs["message"]
            signature = attrs["signature"]

            stored_data = NonceManager.get_stored_nonce_data(eth_address)
            if stored_data:
                stored_nonce, timestamp = stored_data

                if not NonceManager.verify_nonce(
                    eth_address, stored_nonce, delete_on_success=False
                ):
                    raise serializers.ValidationError("Invalid or expired nonce")
                if not SignatureVerifier.verify_ethereum_signature(
                    message=message,
                    signature=signature,
                    eth_address=eth_address,
                    stored_nonce=stored_nonce,
                    timestamp=timestamp,
                ):
                    raise serializers.ValidationError("Invalid signature")

                NonceManager.delete_nonce(eth_address)
            else:
                raise serializers.ValidationError("Nonce not found")
            attrs["eth_address"] = eth_address
            return attrs
        except Exception as ex:
            raise serializers.ValidationError(f"Signature validation error: {str(ex)}")
