from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from reward.models import Reward  # Import Reward model

User = get_user_model()


class UserViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            eth_address="0x742d35cc6634c0532925a3b844bc454e4438f44e",
        )
        self.client.force_authenticate(user=self.user)


class UsernameViewTests(UserViewTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("username-update")

    def test_update_username_success(self):
        # Test data
        new_username = "newusername"

        # Make request
        response = self.client.patch(
            self.url, {"username": new_username}, format="json"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, new_username)

    def test_update_username_invalid_format(self):
        # Test with invalid username (special characters)
        invalid_username = "user@name!"

        # Make request
        response = self.client.patch(
            self.url, {"username": invalid_username}, format="json"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_update_username_too_long(self):
        # Test with username that's too long
        long_username = "a" * 20  # More than 15 characters

        # Make request
        response = self.client.patch(
            self.url, {"username": long_username}, format="json"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_update_username_missing_field(self):
        # Make request without username field
        response = self.client.patch(self.url, {}, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_update_username_unauthenticated(self):
        # Create unauthenticated client
        client = APIClient()

        # Make request
        response = client.patch(self.url, {"username": "newusername"}, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserImageViewTests(UserViewTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("user-image-update")

        # Create a test image
        self.image = self._create_test_image()

    def _create_test_image(self):
        # Create a test image file
        file = io.BytesIO()
        image = Image.new("RGB", (100, 100), color="red")
        image.save(file, "jpeg")
        file.name = "test.jpg"
        file.seek(0)
        return file

    def test_update_user_image_success(self):
        # Create image file for upload
        image_file = SimpleUploadedFile(
            name="test_image.jpg", content=self.image.read(), content_type="image/jpeg"
        )

        # Make request
        response = self.client.patch(
            self.url, {"image": image_file}, format="multipart"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.image)

    def test_update_user_image_invalid_format(self):
        # Create invalid file (not an image)
        invalid_file = SimpleUploadedFile(
            name="test_file.txt",
            content=b"This is not an image",
            content_type="text/plain",
        )

        # Make request
        response = self.client.patch(
            self.url, {"image": invalid_file}, format="multipart"
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_user_image_unauthenticated(self):
        # Create unauthenticated client
        client = APIClient()

        # Create image file for upload
        image_file = SimpleUploadedFile(
            name="test_image.jpg", content=self.image.read(), content_type="image/jpeg"
        )

        # Make request
        response = client.patch(self.url, {"image": image_file}, format="multipart")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserImageRemoveViewTests(UserViewTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("user-image-remove")

        # Create a test image and assign to user
        file = io.BytesIO()
        image = Image.new("RGB", (100, 100), color="red")
        image.save(file, "jpeg")
        file.name = "test.jpg"
        file.seek(0)

        self.user.image = SimpleUploadedFile(
            name="test_image.jpg", content=file.read(), content_type="image/jpeg"
        )
        self.user.save()

    def test_remove_user_image_success(self):
        # Verify user has image
        self.assertIsNotNone(self.user.image)

        # Make request
        response = self.client.delete(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Refresh user from database
        self.user.refresh_from_db()
        self.assertFalse(self.user.image, "User image should be falsey after removal")

    def test_remove_user_image_unauthenticated(self):
        # Create unauthenticated client
        client = APIClient()

        # Make request
        response = client.delete(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserViewTests(UserViewTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("user-me")

    def test_get_user_info_success(self):
        # Make request
        response = self.client.get(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["role"], self.user.get_role_display())

    def test_get_user_info_unauthenticated(self):
        # Create unauthenticated client
        client = APIClient()

        # Make request
        response = client.get(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserRewardsViewTests(UserViewTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("my-rewards")  # Assuming the URL name is 'user-rewards'

        # Create some rewards for the user
        Reward.objects.create(user=self.user, reward=50.00, is_paid=False)
        Reward.objects.create(user=self.user, reward=75.00, is_paid=True)
        # Create a reward for another user to ensure filtering works
        other_user = User.objects.create_user(
            username="otheruser",
            eth_address="0x1234567890123456789012345678901234567890",
        )
        Reward.objects.create(user=other_user, reward=200.00, is_paid=False)

    def test_get_user_rewards_success(self):
        # Make request
        response = self.client.get(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should return 2 rewards for the user

        # Check if the correct rewards are returned
        reward_amounts = [
            float(reward["reward_amount"]) for reward in response.data["results"]
        ]
        self.assertIn(50.00, reward_amounts)
        self.assertIn(75.00, reward_amounts)

    def test_get_user_rewards_unauthenticated(self):
        # Create unauthenticated client
        client = APIClient()

        # Make request
        response = client.get(self.url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
