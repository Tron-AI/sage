from django.urls import path
from .views import RegisterView, LoginView, UserListView, UserDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path("users/", UserListView.as_view(), name='users'),
    path('user/details/', UserDetailView.as_view(), name='user-details'),
]
