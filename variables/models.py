import operator

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q
from projects.models import Project


class VariableFavoriteManager(models.Manager):
    def search(self, search_terms):
        terms = [term.strip() for term in search_terms.split()]
        q_objects = []
        for term in terms:
            q_objects.append(Q(name__icontains=term))

        # Start with a bare QuerySet
        qs = self.get_queryset()

        # Use operator's or_ to string together all of your Q objects.
        return qs.filter(reduce(operator.and_, [reduce(operator.or_, q_objects), Q(active=True)]))

class VariableFavorite(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(null=True)
    active = models.BooleanField(default=True)
    last_date_saved = models.DateTimeField(auto_now_add=True)
    objects = VariableFavoriteManager()

    '''
    Sets the last viewed time for a cohort
    '''
    def mark_viewed (self, request, user=None):
        if user is None:
            user = request.user

        last_view = self.variablefavorite_last_view_set.filter(user=user)
        if last_view is None or len(last_view) is 0:
            last_view = self.variablefavorite_last_view_set.create(user=user)
        else:
            last_view = last_view[0]

        last_view.save(False, True)

        return last_view

class VariableFavorite_Last_View(models.Model):
    variablefavorite = models.ForeignKey(VariableFavorite, blank=False)
    user = models.ForeignKey(User, null=False, blank=False)
    last_view = models.DateTimeField(auto_now_add=True, auto_now=True)

class Variable(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(null=False, blank=False)
    project = models.ForeignKey(Project, null=False, blank=False)
    feature_col_name = models.TextField(null=False, blank=False)
    feature_table_name = models.TextField(null=False, blank=False)