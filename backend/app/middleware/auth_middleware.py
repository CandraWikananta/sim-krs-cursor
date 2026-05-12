from functools import wraps

import jwt
from flask import current_app, g, request

from app.utils.response import err


def require_auth(*allowed_roles):
    roles = tuple(allowed_roles)

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization") or ""
            if not header.startswith("Bearer "):
                return err("Token tidak ditemukan", 401)
            token = header[7:].strip()
            if not token:
                return err("Token tidak valid", 401)
            try:
                payload = jwt.decode(
                    token,
                    current_app.config["JWT_SECRET_KEY"],
                    algorithms=["HS256"],
                )
            except jwt.PyJWTError:
                return err("Token tidak valid atau kadaluarsa", 401)
            role = payload.get("role")
            if roles and role not in roles:
                return err("Akses ditolak untuk peran Anda", 403)
            g.current_user_id = payload.get("sub")
            g.current_role = role
            return fn(*args, **kwargs)

        return wrapper

    return decorator
