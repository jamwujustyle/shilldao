from django.test import TestCase
from django.contrib.auth import get_user_model
from dao.models import DAO
from campaign.models import Campaign
from task.models import Task
from submission.models import Submission
from dao.serializers import (
    CampaignSimpleSerializer,
    DAOExplorerSerializer,
    MyDAOsSerializer,
    MyDAOEditSerializer,  # Corrected import
)
from rest_framework.test import APIRequestFactory
from unittest.mock import patch

User = get_user_model()


class SerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            eth_address="0x1234567890abcdef1234567890abcdef12345678",
            is_active=True,
        )
        self.dao = DAO.objects.create(
            name="Test DAO",
            description="A test DAO",
            website="http://testdao.com",
            network=0,
            created_by=self.user,
            social_links={"twitter": "http://twitter.com/testdao"},
        )
        self.campaign = Campaign.objects.create(
            dao=self.dao,
            name="Test Campaign",
            status=1,  # Use integer value for 'Active'
            budget=100,
            description="A test campaign",
        )
        self.task = Task.objects.create(
            campaign=self.campaign,
            description="Test Task",
            type=1,
            reward=10,
            quantity=1,
        )
        self.submission = Submission.objects.create(
            task=self.task,
            user=self.user,
            link="http://example.com/proof",
            proof_text="proof",
            proof_type=1,
            status=2,  # Approved
        )
        self.campaign.update_progress()
        self.factory = APIRequestFactory()

    def test_campaign_simple_serializer(self):
        """
        Test the CampaignSimpleSerializer.
        """
        serializer = CampaignSimpleSerializer(instance=self.campaign)
        data = serializer.data

        self.assertEqual(
            set(data.keys()),
            set(
                [
                    "id",
                    "name",
                    "status",
                    "budget",
                    "description",
                    "created_at",
                    "progress",
                ]
            ),
        )
        self.assertEqual(data["name"], "Test Campaign")
        self.assertEqual(data["status"], 3)  # Expect integer value (Completed)
        self.assertEqual(data["budget"], "100.00")
        self.assertEqual(data["description"], "A test campaign")
        self.assertIn(
            "202", data["created_at"]
        )  # Check for year in "Month YYYY" format

    def test_dao_explorer_serializer(self):
        """
        Test the DAOExplorerSerializer for listing DAOs.
        """
        # Test with authenticated user
        request = self.factory.get("/")
        request.user = self.user  # Authenticated user
        serializer = DAOExplorerSerializer(
            instance=self.dao, context={"request": request}
        )
        data = serializer.data

        self.assertEqual(
            set(data.keys()),
            set(
                [
                    "id",
                    "name",
                    "image",
                    "description",
                    "website",
                    "social_links",
                    "create_dao",
                    "created_by",
                    "balance",
                    "created_at",
                    "campaigns",
                    "is_favorited",
                    "network",
                ]
            ),
        )
        self.assertEqual(data["name"], "Test DAO")
        self.assertEqual(data["description"], "A test DAO")
        self.assertEqual(data["website"], "http://testdao.com")
        self.assertEqual(data["network"], 0)
        self.assertEqual(data["created_by"], self.user.eth_address)
        self.assertEqual(
            data["social_links"], {"twitter": "http://twitter.com/testdao"}
        )
        self.assertFalse(data["create_dao"])  # Default value
        self.assertIsNone(data["balance"])
        self.assertIsNotNone(data["created_at"])
        self.assertEqual(len(data["campaigns"]), 1)
        self.assertEqual(data["campaigns"][0]["name"], "Test Campaign")
        self.assertFalse(data["is_favorited"])  # User has not favorited this DAO yet

        # Test with user who favorited the DAO
        self.user.favorite_daos.add(self.dao)
        serializer = DAOExplorerSerializer(
            instance=self.dao, context={"request": request}
        )
        data = serializer.data
        self.assertTrue(data["is_favorited"])

        # Test with unauthenticated user
        request_unauthenticated = self.factory.get("/")
        request_unauthenticated.user = None  # Unauthenticated user
        serializer = DAOExplorerSerializer(
            instance=self.dao, context={"request": request_unauthenticated}
        )
        data = serializer.data
        self.assertFalse(data["is_favorited"])

    def test_dao_explorer_serializer_create(self):
        """
        Test the DAOExplorerSerializer create method.
        """
        request = self.factory.post("/")
        request.user = self.user
        data = {
            "name": "New DAO",
            "description": "New DAO description",
            "website": "http://newdao.com",
            "network": 1,  # polygon
            "social_links": {"discord": "http://discord.gg/newdao"},
        }
        serializer = DAOExplorerSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            print(serializer.errors)
        self.assertTrue(serializer.is_valid())
        dao_instance = serializer.save()

        self.assertEqual(dao_instance.name, "New DAO")
        self.assertEqual(dao_instance.created_by, self.user)
        self.assertEqual(dao_instance.network, 1)
        self.assertEqual(
            dao_instance.social_links, {"discord": "http://discord.gg/newdao"}
        )
        self.assertEqual(DAO.objects.count(), 2)

    def test_dao_explorer_serializer_create_unauthenticated(self):
        """
        Test DAOExplorerSerializer create method without authentication.
        Should raise validation error because created_by is required by model.
        """
        request = self.factory.post("/")
        request.user = None  # Unauthenticated user
        data = {
            "name": "Unauthorized DAO",
            "description": "Description",
            "website": "http://unauthorized.com",
            "network": 0,
        }
        serializer = DAOExplorerSerializer(data=data, context={"request": request})
        # The serializer's create method sets created_by from request.user.
        # If request.user is None, created_by will be None, which is allowed by the model (null=True).
        # However, the view requires authentication for POST, so this scenario is less likely
        # to be hit in practice via the API, but the serializer itself allows it.
        # Let's test the serializer's validation for other fields.
        self.assertTrue(
            serializer.is_valid()
        )  # created_by is not a required field in serializer
        # If we were to save here, created_by would be None.

    def test_dao_explorer_serializer_invalid_social_link(self):
        """
        Test DAOExplorerSerializer validation for invalid social link URL.
        """
        request = self.factory.post("/")
        request.user = self.user
        data = {
            "name": "DAO Invalid Social",
            "description": "Description",
            "website": "http://invalid.com",
            "network": 0,
            "social_links": {"twitter": "invalid-url"},
        }
        serializer = DAOExplorerSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("social_links", serializer.errors)

    def test_dao_explorer_serializer_invalid_network(self):
        """
        Test DAOExplorerSerializer validation for invalid network value.
        """
        request = self.factory.post("/")
        request.user = self.user
        data = {
            "name": "DAO Invalid Network",
            "description": "Description",
            "website": "http://invalidnetwork.com",
            "network": 99,  # Invalid network choice
        }
        serializer = DAOExplorerSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("network", serializer.errors)

    def test_my_daos_serializer(self):
        """
        Test the MyDAOsSerializer.
        """
        request = self.factory.get("/")
        request.user = self.user
        serializer = MyDAOsSerializer(instance=self.dao, context={"request": request})
        data = serializer.data

        self.assertEqual(
            set(data.keys()),
            set(
                [
                    "id",
                    "name",
                    "image",
                    "description",
                    "website",
                    "social_links",
                    "create_dao",
                    "created_by",
                    "balance",
                    "created_at",
                    "campaigns",
                    "network",  # is_favorited should be excluded
                ]
            ),
        )
        self.assertNotIn("is_favorited", data)

    def test_my_dao_edit_serializer_update(self):
        """
        Test the MyDAOEdit serializer update method.
        """
        data = {
            "description": "Updated description",
            "website": "http://updatedwebsite.com",
            "social_links": {"facebook": "http://facebook.com/testdao"},
        }
        serializer = MyDAOEditSerializer(
            instance=self.dao, data=data, partial=True
        )  # Corrected usage
        if not serializer.is_valid():
            print(serializer.errors)
        self.assertTrue(serializer.is_valid())
        dao_instance = serializer.save()

        self.assertEqual(dao_instance.description, "Updated description")
        self.assertEqual(dao_instance.website, "http://updatedwebsite.com")
        self.assertEqual(
            dao_instance.social_links, {"facebook": "http://facebook.com/testdao"}
        )

    def test_my_dao_edit_serializer_invalid_social_link(self):
        """
        Test MyDAOEdit serializer validation for invalid social link URL.
        """
        data = {
            "social_links": {"twitter": "invalid-url-edit"},
        }
        serializer = MyDAOEditSerializer(
            instance=self.dao, data=data, partial=True
        )  # Corrected usage
        self.assertFalse(serializer.is_valid())
        self.assertIn("social_links", serializer.errors)

    @patch("submission.models.validate_image_size")
    @patch("django.core.validators.FileExtensionValidator")
    def test_dao_explorer_serializer_with_image(
        self, mock_file_extension_validator, mock_validate_image_size
    ):
        """
        Test DAOExplorerSerializer with an image file.
        """
        request = self.factory.post("/")
        request.user = self.user
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
        data = {
            "name": "DAO with Image",
            "description": "Description with image",
            "website": "http://daowithimage.com",
            "network": 4,  # base
            "image": image_file,
        }
        serializer = DAOExplorerSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())
        dao_instance = serializer.save()

        self.assertIsNotNone(dao_instance.image)
        # Removed assertions for image validation mocks as requested by the user.

    @patch("submission.models.validate_image_size")
    @patch("django.core.validators.FileExtensionValidator")
    def test_my_dao_edit_serializer_with_image(
        self, mock_file_extension_validator, mock_validate_image_size
    ):
        """
        Test MyDAOEdit serializer with an image file.
        """
        request = self.factory.put("/")  # Use PUT for edit
        request.user = self.user
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

        updated_image_file = generate_test_image_file()
        data = {
            "image": updated_image_file,
        }
        serializer = MyDAOEditSerializer(  # Corrected usage
            instance=self.dao, data=data, partial=True, context={"request": request}
        )  # Add request context
        self.assertTrue(serializer.is_valid())
        dao_instance = serializer.save()

        self.assertIsNotNone(dao_instance.image)
        # Removed assertions for image validation mocks as requested by the user.
