from django.core.exceptions import ValidationError

SUPPORTED_NETWORKS = {
    0: "ethereum",
    1: "polygon",
    2: "optimism",
    3: "arbitrum",
    4: "base",
    5: "solana",
    6: "near",
}


def validate_network(network):
    if network not in SUPPORTED_NETWORKS:
        raise ValidationError(f"Network {network} is not supported")
    return network
