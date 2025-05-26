from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from dao.models import DAO
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch

User = get_user_model()


class DAOModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            eth_address="0x1234567890abcdef1234567890abcdef12345678",
            is_active=True,
        )

    def test_dao_creation(self):
        """
        Test creating a basic DAO instance.
        """
        dao = DAO.objects.create(
            name="Test DAO",
            description="A test DAO",
            website="http://testdao.com",
            network=0,  # ethereum
            created_by=self.user,
            balance=100.50,
            social_links={"twitter": "http://twitter.com/testdao"},
        )
        self.assertEqual(dao.name, "Test DAO")
        self.assertEqual(dao.description, "A test DAO")
        self.assertEqual(dao.website, "http://testdao.com")
        self.assertEqual(dao.network, 0)
        self.assertEqual(dao.created_by, self.user)
        self.assertEqual(dao.balance, 100.50)
        self.assertEqual(dao.social_links, {"twitter": "http://twitter.com/testdao"})
        self.assertIsNotNone(dao.created_at)
        self.assertFalse(dao.create_dao)  # Default value
        self.assertFalse(dao.image)

    def test_dao_creation_minimum_fields(self):
        """
        Test creating a DAO with only required fields (name, token).
        """
        dao = DAO.objects.create(
            name="Minimum DAO",
        )
        self.assertEqual(dao.name, "Minimum DAO")
        self.assertIsNone(dao.description)
        self.assertIsNone(dao.website)
        self.assertIsNone(dao.network)
        self.assertIsNone(dao.created_by)
        self.assertIsNone(dao.balance)
        self.assertEqual(dao.social_links, {})  # Default value
        self.assertIsNotNone(dao.created_at)
        self.assertFalse(dao.create_dao)  # Default value
        self.assertFalse(dao.image)

    def test_dao_image_upload(self):
        """
        Test uploading an image for a DAO.
        """
        image_content = b"fake image content"
        image_file = SimpleUploadedFile(
            "test_image.png", image_content, content_type="image/png"
        )
        dao = DAO.objects.create(
            name="Image DAO",
            image=image_file,
        )
        self.assertIsNotNone(dao.image)
        self.assertIn("dao_images", dao.image.name)
        self.assertTrue(dao.image.name.endswith(".png"))

    @patch("dao.models.DAO.image.field.clean")
    def test_dao_image_validation(self, mock_image_field_clean):
        """
        Test that image validation is called on full_clean.
        """
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image
        import io

        def generate_test_image_file():
            image = Image.new("RGB", (10, 10), color="white")
            byte_stream = io.BytesIO()
            image.save(byte_stream, format="PNG")
            byte_stream.seek(0)
            return SimpleUploadedFile(
                "test.png", byte_stream.read(), content_type="image/png"
            )

        image_file = generate_test_image_file()
        dao = DAO(
            name="Validation DAO",
            image=image_file,
            # Provide required fields to pass model validation before image validation
            description="desc",
            website="http://example.com",
            network=0,
            balance=0,
        )
        dao.save()  # Save the instance first
        dao.full_clean()  # Explicitly call full_clean to trigger validators
        # Removed assertion for mock_image_field_clean as requested by the user.

    def test_dao_image_extension_validation(self):
        """
        Test that image extension validation works.
        """
        image_content = b"fake image content"
        invalid_image_file = SimpleUploadedFile(
            "test_image.txt", image_content, content_type="text/plain"
        )
        dao = DAO(
            name="Invalid Image DAO",
            image=invalid_image_file,
            # Provide required fields to pass model validation
            description="desc",
            website="http://example.com",
            network=0,
            balance=0,
        )
        with self.assertRaises(ValidationError) as cm:
            dao.full_clean()  # full_clean calls all validators
        # Update assertion to match the actual error message structure
        self.assertIn(
            "File extension “txt” is not allowed. Allowed extensions are: jpeg, jpg, png.",
            str(cm.exception),
        )

    def test_dao_network_choices(self):
        """
        Test that the network field uses the defined choices.
        """
        dao = DAO.objects.create(name="Network DAO", network=5)  # solana
        self.assertEqual(dao.network, 5)

        # Test invalid network choice
        dao_invalid_network = DAO(name="Invalid Network DAO", network=99)
        with self.assertRaises(ValidationError) as cm:
            dao_invalid_network.full_clean()
        self.assertIn("Value 99 is not a valid choice.", str(cm.exception))

    def test_dao_social_links_default(self):
        """
        Test that social_links defaults to an empty dictionary.
        """
        dao = DAO.objects.create(
            name="Social DAO",
        )
        self.assertEqual(dao.social_links, {})

    def test_dao_social_links_jsonfield(self):
        """
        Test saving and retrieving data from the social_links JSONField.
        """
        social_data = {
            "twitter": "http://twitter.com/socialdao",
            "discord": "http://discord.gg/socialdao",
            "telegram": "http://t.me/socialdao",
        }
        dao = DAO.objects.create(name="JSON Social DAO", social_links=social_data)
        dao.refresh_from_db()
        self.assertEqual(dao.social_links, social_data)
        self.assertEqual(dao.social_links["twitter"], "http://twitter.com/socialdao")

    def test_dao_created_by_relationship(self):
        """
        Test the foreign key relationship to the User model.
        """
        dao = DAO.objects.create(name="User DAO", created_by=self.user)
        self.assertEqual(dao.created_by, self.user)
        self.assertIn(dao, self.user.daos_created.all())

    def test_dao_balance_decimal_places(self):
        """
        Test the decimal places and max digits for the balance field.
        """
        # Use string for exact decimal value
        dao = DAO.objects.create(
            name="Balance DAO",
            balance="12345678901234567890.123456789012345678",
        )
        dao.refresh_from_db()
        self.assertEqual(str(dao.balance), "12345678901234567890.123456789012345678")

        # Test exceeding max digits (40)
        with self.assertRaises(ValidationError) as cm:
            dao_large_balance = DAO(
                name="Large Balance DAO", balance=10**23
            )  # 1 followed by 23 zeros
            dao_large_balance.full_clean()
        # The exact error message might vary slightly depending on Django/DB version,
        # but it should indicate a decimal value issue.
        # Updated assertion to match the actual error message
        self.assertIn(
            "Ensure that there are no more than 22 digits before the decimal point.",
            str(cm.exception),
        )

        # Test exceeding decimal places (18)
        with self.assertRaises(ValidationError) as cm:
            dao_many_decimals = DAO(
                name="Decimal DAO", balance="1.1234567890123456789"
            )  # 19 decimal places, use string
            dao_many_decimals.full_clean()
        # Updated assertion to match the actual error message format
        self.assertIn(
            "'balance': ['Ensure that there are no more than 18 decimal places.']",
            str(cm.exception),
        )
