from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAPITestCase(APITestCase):
    def test_register_user(self):
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "strongpassword123",
            "password2": "strongpassword123"
        }
        response = self.client.post('/api/users/register/', data, format='json')
        # Accept either 200 or 201 based on your exact DRF setup
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_login_user(self):
        User.objects.create_user(username="testuser", email="testlogin@example.com", password="testpassword")
        data = {
            "username": "testuser",
            "password": "testpassword"
        }
        response = self.client.post('/api/users/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assumes Simple JWT, Knox, or standard token auth returns an access token
        self.assertIn('access', response.data)

    def test_get_profile(self):
        user = User.objects.create_user(username="testuser", email="testprofile@example.com", password="testpassword")
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        
    def test_get_profile_unauthenticated(self):
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)