from api import views
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('dj_rest_auth.urls')),
    path("auth/github/", views.GitHubLogin.as_view(), name="github_login"),
    path('tasks/', views.TaskList.as_view(), name='task-list'),
    path('tasks/user/', views.UserTaskList.as_view(), name='user-task-list'),
    path('tasks/<int:pk>/bids/', views.TaskBidList.as_view(), name='task-bid-list'),
    path('tasks/<int:pk>/', views.TaskDetail.as_view(), name='task-detail'),
    path('bids/', views.BidList.as_view(), name='bid-list'),
    path('bids/<int:pk>/', views.BidDetail.as_view(), name='bid-detail'),
]
