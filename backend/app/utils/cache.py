import json
import logging

import requests

from flask import current_app

logger = logging.getLogger(__name__)


def _base_url():
    url = (current_app.config.get("UPSTASH_REDIS_REST_URL") or "").rstrip("/")
    return url


def _headers():
    token = current_app.config.get("UPSTASH_REDIS_REST_TOKEN") or ""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _command(cmd_list):
    url = _base_url()
    token = current_app.config.get("UPSTASH_REDIS_REST_TOKEN") or ""
    if not url or not token:
        return None
    try:
        r = requests.post(url, headers=_headers(), json=cmd_list, timeout=10)
        r.raise_for_status()
        body = r.json()
        if isinstance(body, dict) and "result" in body:
            return body["result"]
        return body
    except Exception as e:
        logger.warning("Upstash Redis error: %s", e)
        return None


def cache_get_json(key):
    raw = _command(["GET", key])
    if raw is None:
        return None
    if raw is False:
        return None
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return None


def cache_set_json(key, value, ttl_seconds):
    try:
        payload = json.dumps(value, default=str)
    except (TypeError, ValueError):
        return False
    if ttl_seconds and ttl_seconds > 0:
        res = _command(["SET", key, payload, "EX", str(int(ttl_seconds))])
    else:
        res = _command(["SET", key, payload])
    return res not in (None, False)


def cache_delete(key):
    _command(["DEL", key])


def invalidate_list_caches():
    for k in ("list:mahasiswa", "list:dosen", "list:mata_kuliah"):
        cache_delete(k)
