from django.urls import path
from .views import TaskView, TaskCreateView

urlpatterns = [
    path("tasks", TaskView.as_view(), name="tasks-list"),
    path("tasks/create", TaskCreateView.as_view(), name="task-create"),
]
