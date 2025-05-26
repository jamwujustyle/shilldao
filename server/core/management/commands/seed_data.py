import random
from decimal import Decimal
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files import File
from faker import Faker

# Import models from all relevant apps
from core.models import User
from dao.models import DAO
from campaign.models import Campaign
from task.models import Task
from submission.models import Submission
from reward.models import Reward


class Command(BaseCommand):
    help = "Seeds the database with initial data for all main tables."

    def handle(self, *args, **options):  # noqa C901
        self.stdout.write(
            self.style.WARNING("Attempting to clear existing seeded data...")
        )
        # Order of deletion matters due to foreign key constraints
        Submission.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS("Successfully deleted existing Submissions.")
        )
        Task.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Successfully deleted existing Tasks."))
        Reward.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Successfully deleted existing Rewards."))
        Campaign.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS("Successfully deleted existing Campaigns.")
        )
        DAO.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Successfully deleted existing DAOs."))
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(
            self.style.SUCCESS("Successfully deleted existing non-superuser Users.")
        )
        self.stdout.write(self.style.SUCCESS("Existing seeded data cleared."))

        fake = Faker()
        self.stdout.write(self.style.SUCCESS("Starting data seeding process..."))

        # --- Create Users ---
        self.stdout.write("Seeding Users...")
        users = []
        used_eth_addresses = set()

        seed_image_path_users = os.path.join(settings.MEDIA_ROOT, "seed_media")
        user_image_files = []
        if os.path.exists(seed_image_path_users) and os.path.isdir(
            seed_image_path_users
        ):
            user_image_files = [
                f
                for f in os.listdir(seed_image_path_users)
                if os.path.isfile(os.path.join(seed_image_path_users, f))
            ]

        if not user_image_files:
            self.stdout.write(
                self.style.WARNING(
                    f"No seed images found in {seed_image_path_users} for Users. Users will be created without images."
                )
            )

        for i in range(20):
            username = fake.user_name()[
                :9
            ]  # Truncate to 9 to ensure total length <= 13 with the suffix
            eth_address = None
            while not eth_address or eth_address in used_eth_addresses:
                hex_chars = fake.hexify(text="^" * 40, upper=False)
                eth_address = f"0x{hex_chars}"
            used_eth_addresses.add(eth_address)

            # Prepare base user data
            current_user_data = {
                "username": f"{username}_{i}",
                "eth_address": eth_address,
                "password": "password123",
                "role": random.choice(
                    [User.ROLE_CHOICES[0][0], User.ROLE_CHOICES[1][0]]
                ),
            }

            image_assigned_successfully = False
            if user_image_files:
                image_filename = random.choice(user_image_files)
                source_image_path = os.path.join(
                    settings.MEDIA_ROOT, "seed_media", image_filename
                )
                if os.path.exists(source_image_path):
                    try:
                        with open(source_image_path, "rb") as f:
                            django_file = File(f, name=image_filename)
                            current_user_data["image"] = django_file
                            user = User.objects.create_user(**current_user_data)
                            users.append(user)
                            image_assigned_successfully = True
                    except Exception as e_img:
                        self.stderr.write(
                            self.style.ERROR(
                                f"Error creating user {username}_{i} WITH image {image_filename}: {e_img}. Attempting without image."
                            )
                        )
                        # Ensure 'image' key is removed if it caused an error or if we fall through
                        current_user_data.pop("image", None)
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Seed image {source_image_path} not found for user {username}_{i}. Creating without image."
                        )
                    )

            if (
                not image_assigned_successfully
            ):  # If no images available, or selected image not found, or image assignment failed
                current_user_data.pop(
                    "image", None
                )  # Ensure no lingering image File object with closed stream
                try:
                    user = User.objects.create_user(**current_user_data)
                    users.append(user)
                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(
                            f"Error creating user {username}_{i} (final attempt without image): {e}"
                        )
                    )
        self.stdout.write(
            self.style.SUCCESS(f"Successfully seeded {len(users)} Users.")
        )

        # --- Create DAOs ---
        self.stdout.write("Seeding DAOs...")
        daos = []

        seed_image_path_daos = os.path.join(settings.MEDIA_ROOT, "seed_media")
        dao_image_files = []
        if os.path.exists(seed_image_path_daos) and os.path.isdir(seed_image_path_daos):
            dao_image_files = [
                f
                for f in os.listdir(seed_image_path_daos)
                if os.path.isfile(os.path.join(seed_image_path_daos, f))
            ]

        if not dao_image_files:
            self.stdout.write(
                self.style.WARNING(
                    f"No seed images found in {seed_image_path_daos} for DAOs. DAOs will be created without images."
                )
            )

        for _ in range(25):  # Create 25 DAOs
            # Map network IDs to DAO.NETWORK_CHOICES
            network_mapping = {
                1: 0,  # Ethereum
                137: 1,  # Polygon
                10: 2,  # Optimism
                42161: 3,  # Arbitrum
            }
            network_id = random.choice([1, 137, 10, 42161])
            network_choice = network_mapping.get(
                network_id, 0
            )  # Default to Ethereum if not found

            # Prepare base DAO data
            current_dao_data = {
                "name": fake.company()[:50],
                "website": fake.url(),
                "description": fake.text(max_nb_chars=100),  # Add description
                "social_links": {
                    "twitter": f"https://twitter.com/{fake.user_name()}",
                    "discord": f"https://discord.gg/{fake.lexify(text='??????')}",
                },
                "create_dao": fake.boolean(chance_of_getting_true=50),
                "network": network_choice,  # Use the mapped network choice
                "created_by": random.choice(users),
                "balance": Decimal(random.uniform(100, 1000000)).quantize(
                    Decimal("0.000000000000000001")
                ),
            }

            image_assigned_successfully_dao = False
            if dao_image_files:
                image_filename_dao = random.choice(dao_image_files)
                source_image_path_dao = os.path.join(
                    settings.MEDIA_ROOT, "seed_media", image_filename_dao
                )
                if os.path.exists(source_image_path_dao):
                    try:
                        with open(source_image_path_dao, "rb") as f_dao:
                            django_file_dao = File(f_dao, name=image_filename_dao)
                            current_dao_data["image"] = django_file_dao
                            dao = DAO.objects.create(**current_dao_data)
                            daos.append(dao)
                            image_assigned_successfully_dao = True
                    except Exception as e_img_dao:
                        self.stderr.write(
                            self.style.ERROR(
                                f"Error creating DAO WITH image {image_filename_dao}: {e_img_dao}. Attempting without image."
                            )
                        )
                        current_dao_data.pop("image", None)
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Seed image {source_image_path_dao} not found for DAO. Creating without image."
                        )
                    )

            if not image_assigned_successfully_dao:
                current_dao_data.pop("image", None)
                try:
                    dao = DAO.objects.create(**current_dao_data)
                    daos.append(dao)
                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(
                            f"Error creating DAO (final attempt without image): {e}"
                        )
                    )
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(daos)} DAOs."))

        if not daos:
            self.stderr.write(
                self.style.ERROR(
                    "Cannot seed Campaigns without DAOs. Aborting further seeding."
                )
            )
            return

        # --- Create Campaigns ---
        self.stdout.write("Seeding Campaigns...")
        campaigns = []
        for i in range(10):
            try:
                # Convert budget to Decimal since it's now a DecimalField
                budget_decimal = Decimal(random.randint(1000, 100000)).quantize(
                    Decimal("0.01")
                )

                campaign = Campaign.objects.create(
                    name=fake.bs()[:25],
                    description=fake.text(max_nb_chars=200),
                    budget=budget_decimal,  # Use Decimal for budget
                    status=random.choice(
                        [choice[0] for choice in Campaign.STATUS_CHOICES]
                    ),
                    dao=random.choice(daos),
                    progress=Decimal(random.uniform(0, 100)).quantize(
                        Decimal("0.1")
                    ),  # Random progress
                )
                # Manually set created_at to a varied past date
                campaign.created_at = fake.date_time_between(
                    start_date="-1y",
                    end_date="now",
                    tzinfo=timezone.get_current_timezone(),
                )
                campaign.save(update_fields=["created_at"])
                campaigns.append(campaign)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error creating campaign: {e}"))
        self.stdout.write(
            self.style.SUCCESS(f"Successfully seeded {len(campaigns)} Campaigns.")
        )

        if not campaigns:
            self.stderr.write(
                self.style.ERROR(
                    "Cannot seed Tasks without Campaigns. Aborting further seeding."
                )
            )
            return

        if not users:
            self.stderr.write(
                self.style.ERROR(
                    "Cannot seed Tasks/Submissions without Users. Aborting further seeding."
                )
            )
            return

        # --- Create Tasks ---
        self.stdout.write("Seeding Tasks...")
        tasks = []
        for campaign_obj in campaigns:
            for _ in range(random.randint(1, 3)):  # 1 to 3 tasks per campaign
                try:
                    task = Task.objects.create(
                        campaign=campaign_obj,
                        description=fake.sentence(nb_words=10),
                        type=random.choice([choice[0] for choice in Task.TASK_TYPES]),
                        reward=Decimal(random.uniform(10, 500)).quantize(
                            Decimal("0.01")
                        ),
                        quantity=random.randint(1, 20),
                        deadline=fake.future_datetime(
                            end_date="+30d", tzinfo=timezone.get_current_timezone()
                        ),
                        status=random.choice(
                            [choice[0] for choice in Task.STATUS_CHOICES]
                        ),
                    )
                    # Manually set created_at to a varied past date, after campaign creation
                    task_created_at = fake.date_time_between(
                        start_date=campaign_obj.created_at,  # Task created after campaign
                        end_date=timezone.now(),  # Up to now
                        tzinfo=timezone.get_current_timezone(),
                    )
                    task.created_at = task_created_at

                    # Ensure deadline is after task_created_at
                    # If task_created_at is very recent, push deadline further
                    min_deadline_start = task_created_at + timezone.timedelta(days=1)
                    if min_deadline_start > timezone.now() + timezone.timedelta(
                        days=30
                    ):  # If task created_at is too far in future (unlikely with current logic but safe)
                        min_deadline_start = timezone.now() + timezone.timedelta(days=1)

                    task.deadline = fake.date_time_between(
                        start_date=min_deadline_start,
                        end_date=min_deadline_start
                        + timezone.timedelta(
                            days=60
                        ),  # Deadline within 60 days of task creation
                        tzinfo=timezone.get_current_timezone(),
                    )
                    task.save(update_fields=["created_at", "deadline"])
                    tasks.append(task)
                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(
                            f"Error creating task for campaign {campaign_obj.id}: {e}"
                        )
                    )
        self.stdout.write(
            self.style.SUCCESS(f"Successfully seeded {len(tasks)} Tasks.")
        )

        if not tasks:
            self.stderr.write(
                self.style.ERROR(
                    "Cannot seed Submissions without Tasks. Aborting further seeding."
                )
            )
            return

        # --- Create Submissions ---
        self.stdout.write("Seeding Submissions...")
        submissions_list = []
        if users and tasks:  # Ensure we have users and tasks to create submissions for
            num_total_users = len(users)
            for i, user_obj in enumerate(users):
                # Determine target tier profile based on user index to ensure tier distribution
                if (
                    i < num_total_users * 0.1
                ):  # ~10% users aim for Diamond (e.g., 2 users if 20 total)
                    num_submissions_for_user = random.randint(
                        150, 200
                    )  # Needs >= 100 approved
                    user_base_approval_chance = random.uniform(
                        0.95, 0.99
                    )  # Needs >= 0.90 rate
                elif (
                    i < num_total_users * 0.25
                ):  # ~15% users aim for Platinum (e.g., 3 users if 20 total)
                    num_submissions_for_user = random.randint(
                        100, 150
                    )  # Needs >= 70 approved
                    user_base_approval_chance = random.uniform(
                        0.90, 0.97
                    )  # Needs >= 0.85 rate
                elif (
                    i < num_total_users * 0.50
                ):  # ~25% users aim for Gold (e.g., 5 users if 20 total)
                    num_submissions_for_user = random.randint(
                        70, 100
                    )  # Needs >= 40 approved
                    user_base_approval_chance = random.uniform(
                        0.80, 0.92
                    )  # Needs >= 0.75 rate
                elif (
                    i < num_total_users * 0.75
                ):  # ~25% users aim for Silver (e.g., 5 users if 20 total)
                    num_submissions_for_user = random.randint(
                        40, 70
                    )  # Needs >= 20 approved
                    user_base_approval_chance = random.uniform(
                        0.65, 0.85
                    )  # Needs >= 0.60 rate
                else:  # Remaining ~25% users for Bronze or lower Silver
                    num_submissions_for_user = random.randint(10, 40)
                    user_base_approval_chance = random.uniform(0.40, 0.75)

                approved_count_for_user = 0

                for _ in range(num_submissions_for_user):
                    task_obj = random.choice(tasks)

                    if random.random() < user_base_approval_chance:
                        submission_status = 2  # Approved
                        approved_count_for_user += 1
                        feedback = fake.sentence(nb_words=5)  # Add positive feedback
                    else:
                        submission_status = random.choice([1, 3])  # Pending or Rejected
                        feedback = (
                            fake.sentence(nb_words=5)
                            if submission_status == 3
                            else None
                        )  # Add feedback only for rejected

                    # Randomly choose proof type and provide corresponding data
                    proof_type = random.choice([1, 2, 3])
                    proof_text = None
                    proof_image = None
                    proof_video = None
                    link = fake.url()

                    if proof_type == 1:
                        proof_text = fake.paragraph(nb_sentences=3)
                    elif proof_type == 2:
                        try:
                            from PIL import Image
                            import io

                            image = Image.new("RGB", (10, 10), color="white")
                            byte_stream = io.BytesIO()
                            image.save(byte_stream, format="PNG")
                            byte_stream.seek(0)
                            proof_image = File(byte_stream, name=f"{fake.uuid4()}.png")
                        except ImportError:
                            self.stderr.write(
                                self.style.WARNING(
                                    "Pillow not installed. Cannot create dummy image files for seeding."
                                )
                            )
                            proof_type = 1
                            proof_text = fake.paragraph(nb_sentences=3)
                        except Exception as e_img:
                            self.stderr.write(
                                self.style.ERROR(
                                    f"Error creating dummy image for submission: {e_img}. Falling back to text proof."
                                )
                            )
                            proof_type = 1
                            proof_text = fake.paragraph(nb_sentences=3)

                    elif proof_type == 3:
                        try:
                            video_content = b"dummy video content"
                            proof_video = File(
                                io.BytesIO(video_content), name=f"{fake.uuid4()}.mp4"
                            )
                        except Exception as e_vid:
                            self.stderr.write(
                                self.style.ERROR(
                                    f"Error creating dummy video for submission: {e_vid}. Falling back to text proof."
                                )
                            )
                            proof_type = 1
                            proof_text = fake.paragraph(nb_sentences=3)

                    try:
                        submission = Submission.objects.create(
                            task=task_obj,
                            user=user_obj,
                            link=link,
                            proof_text=proof_text,
                            proof_image=proof_image,
                            proof_video=proof_video,
                            proof_type=proof_type,
                            status=submission_status,
                            feedback=feedback,
                        )
                        submission_start_date = task_obj.created_at
                        latest_possible_submission_time = timezone.now()
                        if (
                            task_obj.deadline
                            and task_obj.deadline < latest_possible_submission_time
                        ):
                            latest_possible_submission_time = task_obj.deadline

                        submission_end_date = latest_possible_submission_time
                        if submission_end_date <= submission_start_date:
                            submission_end_date = (
                                submission_start_date + timezone.timedelta(hours=1)
                            )
                            if submission_end_date > timezone.now():
                                submission_end_date = timezone.now()

                        if submission_start_date >= submission_end_date:
                            submission.created_at = submission_start_date
                        else:
                            submission.created_at = fake.date_time_between(
                                start_date=submission_start_date,
                                end_date=submission_end_date,
                                tzinfo=timezone.get_current_timezone(),
                            )
                        submission.save(update_fields=["created_at"])
                        submissions_list.append(submission)
                    except Exception as e:
                        self.stderr.write(
                            self.style.ERROR(
                                f"Error creating submission for task {task_obj.id}: {e}"
                            )
                        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {len(submissions_list)} Submissions."
            )
        )

        # --- Create Rewards ---
        self.stdout.write("Seeding Rewards...")
        rewards_list = []
        # Create rewards for a subset of approved submissions
        approved_submissions = Submission.objects.filter(status=2)
        num_rewards_to_create = min(
            len(approved_submissions), 50
        )  # Create rewards for up to 50 approved submissions

        for submission_obj in random.sample(
            list(approved_submissions), num_rewards_to_create
        ):
            try:
                # Create a reward based on the task's reward for the user and submission
                reward_entry = Reward.objects.create(
                    user=submission_obj.user,
                    submission=submission_obj,  # Link to the submission
                    reward=submission_obj.task.reward,  # Use task's reward
                    is_paid=random.choice([True, False, None]),  # Randomly set is_paid
                )
                # Set created_at to match submission date
                if hasattr(reward_entry, "created_at"):
                    reward_entry.created_at = submission_obj.created_at
                    reward_entry.save(update_fields=["created_at"])
                rewards_list.append(reward_entry)
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"Error creating reward for submission {submission_obj.id}: {e}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f"Successfully seeded {len(rewards_list)} Rewards.")
        )

        # --- Update User Tiers ---
        self.stdout.write("Updating User Tiers based on new submissions...")
        updated_user_tier_count = 0
        if users:  # Ensure users list is not empty
            for user_obj in users:
                try:
                    # The User model's save() method should call determine_actual_tier_id
                    user_obj.save()
                    updated_user_tier_count += 1
                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(
                            f"Error updating tier for user {user_obj.id}: {e}"
                        )
                    )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated tiers for {updated_user_tier_count} Users."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING("No users were created, skipping tier update.")
            )

        # Update campaign progress based on tasks and submissions
        self.stdout.write("Updating Campaign progress...")
        updated_campaign_count = 0
        for campaign_obj in campaigns:
            try:
                campaign_obj.update_progress()
                updated_campaign_count += 1
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"Error updating progress for campaign {campaign_obj.id}: {e}"
                    )
                )
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully updated progress for {updated_campaign_count} Campaigns."
            )
        )

        self.stdout.write(
            self.style.SUCCESS("Database seeding completed successfully!")
        )
