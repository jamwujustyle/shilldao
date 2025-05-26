from django.core.management.base import BaseCommand
from celery_tasks.tasks import fetch_shill_price


class Command(BaseCommand):
    help = "Test the Celery Shill price fetching task"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Testing Shill price fetch task..."))

        # Run the task synchronously for testing
        result = fetch_shill_price()

        if result is not None:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Task completed successfully! Shill price: ${result}"
                )
            )
        else:
            self.stdout.write(self.style.ERROR("Task failed to fetch Shill price."))
