# Generated by Django 5.2.1 on 2025-05-18 13:00

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reward', '0006_reward_submission'),
        ('submission', '0005_alter_submission_created_at_alter_submission_link_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='reward',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='reward',
            name='reward',
            field=models.DecimalField(db_index=True, decimal_places=2, max_digits=10),
        ),
        migrations.AddIndex(
            model_name='reward',
            index=models.Index(fields=['created_at', 'reward'], name='reward_rewa_created_6685ba_idx'),
        ),
    ]
