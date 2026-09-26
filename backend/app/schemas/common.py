"""Shared schema helpers: camelCase JSON for the frontend, UTC datetimes."""

from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]


class CamelModel(BaseModel):
    """Python uses snake_case, the JSON API uses camelCase."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        str_strip_whitespace=True,
    )


def phone_digits(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) < 9:
        raise ValueError("Enter a phone number with country code, for example +260 97 000 0000.")
    return value
