from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule


class Command(BaseCommand):
    help = "Creates a periodic task to fetch the SHILL price every minute"

    def handle(self, *args, **options):
        # Create or get the interval schedule (1 minute)
        schedule, created = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES,
        )

        # Create the periodic task if it doesn't exist
        task, created = PeriodicTask.objects.get_or_create(
            interval=schedule,
            name="Fetch Shill Price",  # Updated name
            task="celery_tasks.tasks.fetch_shill_price",  # Updated task path
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Successfully created periodic task to fetch Shill price every minute."  # Updated message
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "Periodic task to fetch Shill price already exists."
                )  # Updated message
            )
