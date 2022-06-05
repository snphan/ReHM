from django.test import TestCase
from . import settings

class SettingsTests(TestCase):
    def test_settings_debug_false(self):
        """Settings DEBUG needs to be False for production.
        """
        self.assertEqual(settings.DEBUG, False)
