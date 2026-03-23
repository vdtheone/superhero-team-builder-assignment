import logging
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import User
from .serializers import UserSerializer, RegisterSerializer

logger = logging.getLogger('api')


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        logger.info("Attempting to register a new user.")
        user = serializer.save()
        logger.info(f"Successfully registered new user: {user.username}")


class UserProfileView(generics.RetrieveAPIView):

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        logger.info(f"User profile requested for user: {self.request.user.username}")
        return self.request.user
