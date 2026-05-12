import re


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_non_empty_str(value, max_len=None):
    if value is None or not isinstance(value, str):
        return False
    s = value.strip()
    if not s:
        return False
    if max_len is not None and len(s) > max_len:
        return False
    return True


def valid_email(email):
    return bool(email and EMAIL_RE.match(email.strip()))


def valid_password(password, min_len=8):
    return isinstance(password, str) and len(password) >= min_len


def valid_uuid(value):
    if not value or not isinstance(value, str):
        return False
    return bool(
        re.match(
            r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            value.strip(),
        )
    )


def parse_int(value, min_v=None, max_v=None):
    if value is None:
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if min_v is not None and n < min_v:
        return None
    if max_v is not None and n > max_v:
        return None
    return n
