from rest_framework import serializers
from .models import Team, TeamMember
from superheroes.models import Superhero
from superheroes.serializers import SuperheroSerializer


class TeamMemberSerializer(serializers.ModelSerializer):

    superhero_name = serializers.CharField(
        source="superhero.name",
        read_only=True
    )

    superhero_details = SuperheroSerializer(
        source="superhero",
        read_only=True
    )

    class Meta:
        model = TeamMember
        fields = ["id", "superhero", "superhero_name", "superhero_details"]


class TeamSerializer(serializers.ModelSerializer):

    members = TeamMemberSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "created_by",
            "created_at",
            "members",
            "member_ids",
        ]
        read_only_fields = ["created_by"]

    def validate_member_ids(self, value):
        existing_ids = set(Superhero.objects.filter(id__in=value).values_list("id", flat=True))
        if len(existing_ids) != len(set(value)):
            raise serializers.ValidationError("One or more superhero IDs do not exist.")
        return value

    def create(self, validated_data):
        member_ids = validated_data.pop("member_ids", [])
        team = super().create(validated_data)

        if member_ids:
            for superhero_id in set(member_ids):
                TeamMember.objects.create(team=team, superhero_id=superhero_id)

        return team


class CompareTeamMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    alignment = serializers.CharField()
    publisher = serializers.CharField(allow_blank=True)
    image_url = serializers.URLField(allow_blank=True)
    intelligence = serializers.IntegerField()
    strength = serializers.IntegerField()
    speed = serializers.IntegerField()
    durability = serializers.IntegerField()
    power = serializers.IntegerField()
    combat = serializers.IntegerField()
    total_power = serializers.IntegerField()


class CompareTeamInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    members = CompareTeamMemberSerializer(many=True)

    def validate_members(self, value):
        if len(value) < 1:
            raise serializers.ValidationError("Each team must have at least one member.")
        return value


class CompareRequestSerializer(serializers.Serializer):
    teams = CompareTeamInputSerializer(many=True)

    def validate_teams(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("At least two teams are required for comparison.")
        return value


class CompareStoredTeamsSerializer(serializers.Serializer):
    team_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2
    )
