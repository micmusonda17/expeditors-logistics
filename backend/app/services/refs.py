"""Human-friendly references for quotes (Q260925-7K3Q) and loads (ELL-7K3Q9)."""

import secrets
from datetime import UTC, datetime

# No 0/O/1/I so references are easy to read out over the phone.
ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def _code(n: int) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(n))


def new_quote_ref() -> str:
    return f"Q{datetime.now(UTC):%y%m%d}-{_code(4)}"


def new_load_ref() -> str:
    return f"ELL-{_code(5)}"
