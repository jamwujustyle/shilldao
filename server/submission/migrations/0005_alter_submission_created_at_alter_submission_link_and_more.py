# Generated by Django 5.2.1 on 2025-05-18 13:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submission', '0004_submission_updated_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submission',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='submission',
            name='link',
            field=models.URLField(db_index=True),
        ),
        migrations.AlterField(
            model_name='submission',
            name='status',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Pending'), (2, 'Approved'), (3, 'Rejected')], db_index=True, default=1),
        ),
    ]
