from app.core.config import Settings


def test_notify_email_takes_several_addresses():
    s = Settings(notify_email="michaelmusonda71@gmail.com, maibalombe@yahoo.com,")
    assert s.notify_email_list == ["michaelmusonda71@gmail.com", "maibalombe@yahoo.com"]


def test_email_needs_full_smtp_settings():
    base = {"smtp_host": "smtp.gmail.com", "notify_email": "a@example.com"}
    assert not Settings(**base).email_enabled
    assert not Settings(**base, smtp_user="a@example.com").email_enabled
    assert Settings(**base, smtp_user="a@example.com", smtp_password="app-password").email_enabled
