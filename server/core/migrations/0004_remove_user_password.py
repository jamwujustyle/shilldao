# Generated by Django 5.2 on 2025-04-24 06:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_remove_user_email'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='password',
        ),
    ]
