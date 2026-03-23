from django.contrib import admin
from .models import Team, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):

    list_display = ("id", "name", "created_by", "created_at")
    inlines = [TeamMemberInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):

    list_display = ("id", "team", "superhero")