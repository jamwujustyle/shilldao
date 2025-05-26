from django.test import TestCase
from django.db.utils import IntegrityError
from core.models import User


class UserManagerTests(TestCase):
    def setUp(self):
        self.valid_eth_address = "0x742d35cc6634c0532925a3b844bc454e4438f44e"
        self.valid_username = "testuser"

    def test_create_user_with_eth_address(self):
        # Create user with eth_address only
        user = User.objects.create_user(eth_address=self.valid_eth_address)

        # Assertions
        self.assertEqual(user.eth_address, self.valid_eth_address)
        self.assertIsNone(user.username)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, 1)  # Default role is User (1)
        self.assertEqual(user.tier, 1)  # Default tier is Bronze (1)

    def test_create_user_with_username(self):
        # Create user with username only
        user = User.objects.create_user(username=self.valid_username)

        # Assertions
        self.assertEqual(user.username, self.valid_username)
        self.assertIsNone(user.eth_address)
        self.assertTrue(user.is_active)

    def test_create_user_with_both(self):
        # Create user with both username and eth_address
        user = User.objects.create_user(
            username=self.valid_username, eth_address=self.valid_eth_address
        )

        # Assertions
        self.assertEqual(user.username, self.valid_username)
        self.assertEqual(user.eth_address, self.valid_eth_address)

    def test_create_user_with_neither(self):
        # Attempt to create user without username or eth_address
        with self.assertRaises(ValueError):
            User.objects.create_user()

    def test_create_user_with_password(self):
        # Create user with password
        password = "securepassword123"
        user = User.objects.create_user(username=self.valid_username, password=password)

        # Assertions
        self.assertTrue(user.has_usable_password())
        self.assertTrue(user.check_password(password))

    def test_create_user_without_password(self):
        # Create user without password
        user = User.objects.create_user(username=self.valid_username)

        # Assertions
        self.assertFalse(user.has_usable_password())

    def test_create_superuser(self):
        # Create superuser
        user = User.objects.create_superuser(
            username=self.valid_username, password="securepassword123"
        )

        # Assertions
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_superuser_with_invalid_flags(self):
        # Attempt to create superuser with is_staff=False
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username=self.valid_username,
                password="securepassword123",
                is_staff=False,
            )

        # Attempt to create superuser with is_superuser=False
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username=self.valid_username,
                password="securepassword123",
                is_superuser=False,
            )


class UserModelTests(TestCase):
    def setUp(self):
        self.valid_eth_address = "0x742d35cc6634c0532925a3b844bc454e4438f44e"
        self.valid_username = "testuser"

        # Create a test user
        self.user = User.objects.create_user(
            username=self.valid_username, eth_address=self.valid_eth_address
        )

    def test_username_uniqueness(self):
        # Attempt to create user with duplicate username
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username=self.valid_username)

    def test_eth_address_uniqueness(self):
        # Attempt to create user with duplicate eth_address
        with self.assertRaises(IntegrityError):
            User.objects.create_user(eth_address=self.valid_eth_address)

    def test_username_case_insensitivity(self):
        # Create a user with uppercase username
        uppercase_username = "TESTUSER2"
        user = User.objects.create_user(username=uppercase_username)

        # Assertions
        self.assertEqual(user.username, uppercase_username.lower())

    def test_string_representation(self):
        # Test __str__ method with username
        self.assertEqual(str(self.user), self.valid_username)

        # Test __str__ method with eth_address only
        user_no_username = User.objects.create_user(
            eth_address="0x123456789abcdef123456789abcdef123456789a"
        )
        self.assertEqual(
            str(user_no_username), "0x123456789abcdef123456789abcdef123456789a"
        )

    def test_role_choices(self):
        # Test role choices
        self.assertEqual(self.user.get_role_display(), "User")

        # Change role and test again
        self.user.role = 2
        self.user.save()
        self.assertEqual(self.user.get_role_display(), "Moderator")

    def test_tier_choices(self):
        # Test tier choices
        self.assertEqual(self.user.get_tier_display(), "Bronze")

        # Change tier and test again
        self.user.tier = 2
        self.user.save()
        self.assertEqual(self.user.get_tier_display(), "Silver")

        self.user.tier = 3
        self.user.save()
        self.assertEqual(self.user.get_tier_display(), "Gold")

        self.user.tier = 4
        self.user.save()
        self.assertEqual(self.user.get_tier_display(), "Platinum")

        self.user.tier = 5
        self.user.save()
        self.assertEqual(self.user.get_tier_display(), "Diamond")

    def test_calculate_tier(self):
        # Mock the submissions relationship
        # Since we can't easily mock the related manager, we'll patch the count methods

        # Create a user with no submissions
        user = User.objects.create_user(username="tiertest")
        self.assertEqual(user.calculate_tier(), 1)  # Bronze

        # We'll test the tier calculation logic directly
        # This is a simplified approach since mocking the related manager is complex

        # Test Silver tier (20+ submissions with 60%+ approval)
        user.submissions = type(
            "obj",
            (object,),
            {
                "count": lambda: 30,
                "filter": lambda status: type("obj", (object,), {"count": lambda: 20}),
            },
        )
        self.assertEqual(user.calculate_tier(), 2)  # Silver

        # Test Gold tier (40+ submissions with 75%+ approval)
        user.submissions = type(
            "obj",
            (object,),
            {
                "count": lambda: 50,
                "filter": lambda status: type("obj", (object,), {"count": lambda: 40}),
            },
        )
        self.assertEqual(user.calculate_tier(), 3)  # Gold

        # Test Platinum tier (70+ submissions with 85%+ approval)
        user.submissions = type(
            "obj",
            (object,),
            {
                "count": lambda: 80,
                "filter": lambda status: type("obj", (object,), {"count": lambda: 70}),
            },
        )
        self.assertEqual(user.calculate_tier(), 4)  # Platinum

        # Test Diamond tier (100+ submissions with 90%+ approval)
        user.submissions = type(
            "obj",
            (object,),
            {
                "count": lambda: 110,
                "filter": lambda status: type("obj", (object,), {"count": lambda: 100}),
            },
        )
        self.assertEqual(user.calculate_tier(), 5)  # Diamond
