from api import views
from django.contrib import admin
from django.urls import path, include

from api.views import CancelBidView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('dj_rest_auth.urls')),
    path("auth/github/", views.GitHubLogin.as_view(), name="github_login"),
    path('tasks/', views.TaskList.as_view(), name='task-list'),
    path('tasks/user/', views.UserTaskList.as_view(), name='user-task-list'),
    path('tasks/<int:uid>/bids/', views.TaskBidList.as_view(), name='task-bid-list'),
    path('tasks/<int:taskid>/bids/<int:bidid>/cancel/', CancelBidView.as_view(), name='cancel-bid'),
    path('tasks/<int:uid>/', views.TaskDetail.as_view(), name='task-detail'),
    path('bids/', views.BidList.as_view(), name='bid-list'),
    path('bids/<int:pk>/', views.BidDetail.as_view(), name='bid-detail'),
    path('wallet/request_nonce/', views.RequestNonceView.as_view(), name='wallet-request-nonce'),
    path('wallet/verify_signature/', views.VerifySignatureView.as_view(), name='wallet-verify-signature'),
]
