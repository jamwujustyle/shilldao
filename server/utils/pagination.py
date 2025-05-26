from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class TenResultsSetPagination(PageNumberPagination):
    page_size = 10


class DAOResultsSetPagination(PageNumberPagination):
    """Pagination class specifically for DAO list view to align with 4-column grid."""

    page_size = 12
    page_size_query_param = "page_size"  # Allow overriding via query param if needed
    max_page_size = 96  # Optional: Set a reasonable max page size
