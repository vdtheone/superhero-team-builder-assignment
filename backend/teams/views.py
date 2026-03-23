import logging
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Team, TeamMember
from .serializers import TeamSerializer, CompareStoredTeamsSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from django.conf import settings
from .serializers import CompareRequestSerializer
from .engine import (
    recommend_balanced,
    recommend_by_stat,
    recommend_random,
    compare_teams,
    _to_dict,
    STAT_FIELDS,
)

logger = logging.getLogger('api')


class TeamListCreateView(generics.ListCreateAPIView):

    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        logger.info(f"User {self.request.user} requested their teams list.")
        return Team.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        logger.info(f"User {self.request.user} is creating a new team.")
        team = serializer.save(created_by=self.request.user)
        logger.info(f"User {self.request.user} successfully created team '{team.name}' with ID {team.id}.")


class TeamDetailView(generics.RetrieveUpdateAPIView):

    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(created_by=self.request.user)

    def perform_update(self, serializer):
        logger.info(f"User {self.request.user} Id {self.request.user.id} is updating team ID {serializer.instance.id}.")
        team = serializer.save()

        member_ids = self.request.data.get("member_ids")

        if member_ids is not None:
            logger.debug(f"Updating team members for team ID {team.id}.")

            team.members.all().delete()
    
            members = [
                TeamMember(team=team, superhero_id=hero_id)
                for hero_id in member_ids
            ]
            TeamMember.objects.bulk_create(members)

        logger.info(f"User {self.request.user} successfully updated team '{team.name}'.")


class TeamDeleteView(generics.DestroyAPIView):
    
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(created_by=self.request.user)

    def perform_destroy(self, instance):
        logger.info(f"User {self.request.user} is deleting team ID {instance.id}.")
        super().perform_destroy(instance)


class RecommendTeamView(APIView):
    
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        strategy = request.query_params.get("strategy", "balanced")
        size = min(int(request.query_params.get("size", 6)), 12)
        stat = request.query_params.get("stat", "strength")
        refresh = request.query_params.get("refresh", "false").lower() == "true"

        # Cache key for non-random strategies
        cache_key = f"team_recommend_{strategy}_{stat}_{size}"
        
        logger.info(f"Team recommendation requested: strategy={strategy}, size={size}, stat={stat}, refresh={refresh}")

        if strategy != "random" and not refresh:
            cached = cache.get(cache_key)
            if cached:
                logger.debug(f"Serving team recommendation from cache for key: {cache_key}")
                return Response(cached)

        if strategy == "balanced":
            result = recommend_balanced(size)
        elif strategy == "power":
            if stat not in STAT_FIELDS:
                logger.warning(f"Invalid stat provided for recommendation: {stat}")
                return Response(
                    {"detail": f"Invalid stat. Choose from: {STAT_FIELDS}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            result = recommend_by_stat(stat, size)
        elif strategy == "random":
            result = recommend_random(size)
        else:
            logger.warning(f"Invalid strategy provided for recommendation: {strategy}")
            return Response(
                {"detail": "Invalid strategy. Choose: balanced | power | random"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if strategy != "random":
            cache.set(cache_key, result, settings.CACHE_TTL_TEAMS)
            logger.debug(f"Cached new team recommendation for key: {cache_key}")

        return Response(result)


class CompareTeamsView(APIView):
    """
    POST /api/teams/compare/
    Body: { "teams": [{ "name": "...", "members": [...] }, ...] }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("CompareTeamsView requested (unsaved teams).")
        serializer = CompareRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"CompareTeamsView invalid data: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        teams_data = serializer.validated_data["teams"]
        result = compare_teams(teams_data)
        return Response(result)


class CompareStoredTeamsView(APIView):
    """
    POST /api/teams/compare_stored/
    Body: { "team_ids": [1, 2] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"User {request.user} requested CompareStoredTeamsView.")
        print('request.data: ', request.data)
        serializer = CompareStoredTeamsSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"CompareStoredTeamsView invalid data: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        team_ids = serializer.validated_data["team_ids"]
        teams = Team.objects.filter(id__in=team_ids, created_by=request.user)

        if teams.count() < 2:
            logger.warning(f"User {request.user} tried to compare teams but did not provide at least two valid teams. team_ids={team_ids}")
            return Response({"detail": "At least two valid teams are required."}, status=status.HTTP_400_BAD_REQUEST)

        teams_data = []
        for team in teams:
            members = [_to_dict(tm.superhero) for tm in team.members.all()]
            teams_data.append({"name": team.name, "members": members})

        result = compare_teams(teams_data)
        return Response(result)