# Generated by Django 5.2 on 2025-05-08 17:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_user_tier'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[(1, 'User'), (2, 'Moderator')], default=1, max_length=10),
        ),
    ]
