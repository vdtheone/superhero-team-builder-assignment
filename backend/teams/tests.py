from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Team, TeamMember
from superheroes.models import Superhero
from unittest.mock import patch

User = get_user_model()

class TeamAPITestCase(APITestCase):
    def setUp(self):
        # Create dummy superheroes for the team members
        for i in range(1, 7):
            Superhero.objects.create(
                id=i,
                api_id=i,
                name=f'Hero {i}',
                slug=f'hero-{i}',
                alignment='good',
                intelligence=50,
                strength=50,
                speed=50,
                durability=50,
                power=50,
                combat=50
            )

        # Set up test users
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='password123')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='password123')
        
        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)
        
        # Create a team for user1
        self.team1 = Team.objects.create(name='Alpha Team', created_by=self.user1)
        TeamMember.objects.create(team=self.team1, superhero_id=1)
        TeamMember.objects.create(team=self.team1, superhero_id=2)

        # Create a team for user2
        self.team2 = Team.objects.create(name='Beta Team', created_by=self.user2)

    def test_list_teams_authenticated(self):
        response = self.client.get('/api/teams/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see user1's team
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Alpha Team')

    def test_list_teams_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/teams/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_team(self):
        data = {
            'name': 'Gamma Team',
            'member_ids': [3, 4, 5]
        }
        response = self.client.post('/api/teams/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Team.objects.filter(created_by=self.user1).count(), 2)
        new_team = Team.objects.get(name='Gamma Team')
        self.assertEqual(new_team.members.count(), 3)

    def test_get_team_detail_own_team(self):
        response = self.client.get(f'/api/teams/{self.team1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Alpha Team')

    def test_get_team_detail_other_user_team(self):
        # User 1 tries to access User 2's team (get_queryset isolates created_by=request.user)
        response = self.client.get(f'/api/teams/{self.team2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_team(self):
        data = {
            'name': 'Alpha Team Updated',
            'member_ids': [6] # Replacing previous members completely
        }
        response = self.client.put(f'/api/teams/{self.team1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.team1.refresh_from_db()
        self.assertEqual(self.team1.name, 'Alpha Team Updated')
        self.assertEqual(self.team1.members.count(), 1)
        self.assertEqual(self.team1.members.first().superhero_id, 6)

    def test_delete_team(self):
        response = self.client.delete(f'/api/teams/{self.team1.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Team.objects.filter(id=self.team1.id).count(), 0)


class TeamEngineAPITestCase(APITestCase):
    @patch('teams.views.recommend_balanced')
    def test_recommend_balanced_team(self, mock_recommend):
        mock_recommend.return_value = {"members": [{"id": 1}]}
        response = self.client.get('/api/teams/recommend/?strategy=balanced&size=6')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_recommend.assert_called_once_with(6)

    @patch('teams.views.recommend_by_stat')
    def test_recommend_power_team(self, mock_recommend):
        mock_recommend.return_value = {"members": [{"id": 2}]}
        response = self.client.get('/api/teams/recommend/?strategy=power&stat=speed&size=4')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_recommend.assert_called_once_with('speed', 4)

    def test_recommend_invalid_strategy(self):
        response = self.client.get('/api/teams/recommend/?strategy=invalid_strat')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CompareStoredTeamsAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user1', email='user1@example.com', password='password123')
        self.client.force_authenticate(user=self.user)
        self.team1 = Team.objects.create(name='Team 1', created_by=self.user)
        self.team2 = Team.objects.create(name='Team 2', created_by=self.user)

    @patch('teams.views.compare_teams')
    def test_compare_stored_teams(self, mock_compare):
        mock_compare.return_value = {"winner": "Team 1"}
        data = {"team_ids": [self.team1.id, self.team2.id]}
        response = self.client.post('/api/teams/compare_stored/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_compare.assert_called_once()
        
    def test_compare_stored_teams_insufficient_teams(self):
        data = {"team_ids": [self.team1.id]}
        response = self.client.post('/api/teams/compare_stored/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)