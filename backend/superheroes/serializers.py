from rest_framework import serializers
from .models import Superhero


class SuperheroSerializer(serializers.ModelSerializer):

    total_power = serializers.IntegerField(read_only=True)
    is_edited = serializers.BooleanField(read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Superhero
        fields = "__all__"

    def get_can_edit(self, obj):
        request = self.context.get("request")
        return bool(request and request.user and request.user.is_staff)