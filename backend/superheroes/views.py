import logging
import requests
from .models import Superhero
from django.http import HttpResponse
from .serializers import SuperheroSerializer
from rest_framework import generics, filters, permissions, views
from rest_framework.pagination import PageNumberPagination


logger = logging.getLogger('api')


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin/staff users to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class SuperheroListView(generics.ListAPIView):
    queryset = Superhero.objects.all().order_by('name')
    serializer_class = SuperheroSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'intelligence', 'strength', 'speed', 'power', 'combat', 'durability']

    def get(self, request, *args, **kwargs):
        logger.info(f"Superhero list requested by user: {request.user}")
        return super().get(request, *args, **kwargs)


class SuperheroDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Superhero.objects.all()
    serializer_class = SuperheroSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_update(self, serializer):
        logger.info(f"Admin {self.request.user} is updating superhero ID {serializer.instance.id}.")
        serializer.save(is_edited=True)

    def get(self, request, *args, **kwargs):
        logger.info(f"Superhero detail requested for ID: {kwargs.get('pk', 'unknown')}")
        return super().get(request, *args, **kwargs)


class HeroImageProxy(views.APIView):
    def get(self, request):
        url = request.query_params.get("url")
        logger.info(f"Image proxy requested for URL: {url}")

        headers = {
            "Referer": "https://www.superherodb.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }

        try:
            resp = requests.get(url, headers=headers, timeout=5)
            return HttpResponse(resp.content, content_type="image/jpeg")
        except Exception as e:
            logger.error(f"Error fetching proxy image from {url}: {str(e)}", exc_info=True)
            return HttpResponse(status=502)