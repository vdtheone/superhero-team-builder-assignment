from rest_framework.test import APITestCase
from rest_framework import status

class HeroesAPITestCase(APITestCase):
    # NOTE: Heroes are often read-only endpoints populated directly by an external DB or script.
    # These tests assume there are heroes in the test DB, or assert formatting structure.
    
    def test_list_heroes(self):
        response = self.client.get('/api/heroes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert pagination structure
        if 'results' in response.data:
            self.assertTrue(isinstance(response.data['results'], list))
        else:
            self.assertTrue(isinstance(response.data, list))
            
    def test_search_heroes(self):
        response = self.client.get('/api/heroes/?search=batman')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_order_heroes(self):
        response = self.client.get('/api/heroes/?ordering=-intelligence')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_hero_detail(self):
        # Test with a generally known integer ID like 1
        response = self.client.get('/api/heroes/1/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])