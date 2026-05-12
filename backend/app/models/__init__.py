def strip_hash(entity):
    if not entity:
        return entity
    if isinstance(entity, dict):
        out = {k: v for k, v in entity.items() if k != "password_hash"}
        return out
    return entity


def strip_hash_list(rows):
    if not rows:
        return []
    return [strip_hash(r) for r in rows]
