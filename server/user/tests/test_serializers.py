from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from user.serializers import (
    UsernameSerializer,
    UserImageSerializer,
    UserSerializer,
    UserRewardsSerializer,
)
import io
from PIL import Image
from reward.models import Reward  # Import Reward model

User = get_user_model()


class UsernameSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            eth_address="0x742d35cc6634c0532925a3b844bc454e4438f44e",
        )
        self.serializer_class = UsernameSerializer

    def test_valid_username(self):
        # Test with valid username
        data = {"username": "validuser123"}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertTrue(serializer.is_valid())

        # Save and verify
        serializer.save()
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "validuser123")

    def test_username_with_underscores(self):
        # Test with username containing underscores
        data = {"username": "valid_user_123"}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertTrue(serializer.is_valid())

    def test_username_with_special_chars(self):
        # Test with username containing special characters
        data = {"username": "invalid@user!"}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_username_too_long(self):
        # Test with username that's too long
        data = {"username": "a" * 20}  # More than 15 characters
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_username_missing(self):
        # Test with missing username
        data = {}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)


class UserImageSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            eth_address="0x742d35cc6634c0532925a3b844bc454e4438f44e",
        )
        self.serializer_class = UserImageSerializer

    def _create_test_image(self, format="JPEG"):
        # Create a test image file
        file = io.BytesIO()
        image = Image.new("RGB", (100, 100), color="red")
        image.save(file, format)
        file.name = f"test.{format.lower()}"
        file.seek(0)
        return file

    def test_valid_jpeg_image(self):
        # Create a JPEG image
        image_file = SimpleUploadedFile(
            name="test_image.jpg",
            content=self._create_test_image("JPEG").read(),
            content_type="image/jpeg",
        )

        # Test serializer
        data = {"image": image_file}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertTrue(serializer.is_valid())

        # Save and verify
        serializer.save()
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.image)

    def test_valid_png_image(self):
        # Create a PNG image
        image_file = SimpleUploadedFile(
            name="test_image.png",
            content=self._create_test_image("PNG").read(),
            content_type="image/png",
        )

        # Test serializer
        data = {"image": image_file}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertTrue(serializer.is_valid())

    def test_invalid_file_type(self):
        # Create a text file
        invalid_file = SimpleUploadedFile(
            name="test_file.txt",
            content=b"This is not an image",
            content_type="text/plain",
        )

        # Test serializer
        data = {"image": invalid_file}
        serializer = self.serializer_class(instance=self.user, data=data)

        # Assertions
        self.assertFalse(serializer.is_valid())
        self.assertIn("image", serializer.errors)


class UserSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            eth_address="0x742d35cc6634c0532925a3b844bc454e4438f44e",
            role=1,  # User role
        )
        self.serializer_class = UserSerializer

    def test_serializer_contains_expected_fields(self):
        # Create serializer instance
        serializer = self.serializer_class(instance=self.user)

        # Get serialized data
        data = serializer.data

        # Assertions
        self.assertIn("username", data)
        self.assertIn("image", data)
        self.assertIn("role", data)

    def test_username_field_content(self):
        # Create serializer instance
        serializer = self.serializer_class(instance=self.user)

        # Get serialized data
        data = serializer.data

        # Assertions
        self.assertEqual(data["username"], self.user.username)

    def test_role_field_content(self):
        # Create serializer instance
        serializer = self.serializer_class(instance=self.user)

        # Get serialized data
        data = serializer.data

        # Assertions
        self.assertEqual(data["role"], self.user.get_role_display())
        self.assertEqual(data["role"], "User")  # Role 1 is "User"

        # Change user role and test again
        self.user.role = 2  # Moderator role
        self.user.save()

        # Create new serializer instance
        serializer = self.serializer_class(instance=self.user)
        data = serializer.data
        # Assertions
        self.assertEqual(data["role"], "Moderator")  # Role 2 is "Moderator"

        # Verify that role=2 was actually saved to the database
        self.user.refresh_from_db()
        self.assertEqual(
            self.user.role, 2, "Role was not persisted as 2 in test_role_field_content"
        )

    def test_read_only_fields(self):
        # Ensure user role is 2 before this test, by explicitly setting and saving if necessary.
        # This makes the test independent of test_role_field_content's success.
        if self.user.role != 2:
            self.user.role = 2
            self.user.save()
            self.user.refresh_from_db()  # Ensure it's saved
            self.assertEqual(
                self.user.role,
                2,
                "Failed to set user role to 2 at start of test_read_only_fields",
            )

        # Attempt to update read-only fields
        data = {"username": "newusername", "role": "Moderator"}
        serializer = self.serializer_class(instance=self.user, data=data, partial=True)

        # Serializer should be valid since read-only fields are ignored
        self.assertTrue(serializer.is_valid())

        # Save and verify fields were not updated
        serializer.save()
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "testuser")  # Unchanged
        self.assertEqual(self.user.role, 2)  # Unchanged from previous test


class UserRewardsSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            eth_address="0x742d35cc6634c0532925a3b844bc454e4438f44e",
        )
        self.reward = Reward.objects.create(
            user=self.user,
            reward=100.00,
            is_paid=False,
            # submission=None # Assuming submission can be null for now
        )
        self.serializer_class = UserRewardsSerializer

    def test_serializer_contains_expected_fields(self):
        serializer = self.serializer_class(instance=self.reward)
        data = serializer.data

        self.assertIn("id", data)
        self.assertIn("reward_amount", data)
        self.assertIn("is_paid", data)
        self.assertIn("created_at", data)
        self.assertIn("submission", data)

    def test_serializer_field_content(self):
        serializer = self.serializer_class(instance=self.reward)
        data = serializer.data

        self.assertEqual(data["reward_amount"], "100.00")
        self.assertEqual(data["is_paid"], False)
        self.assertIsNone(data["submission"])  # Assuming submission is None
