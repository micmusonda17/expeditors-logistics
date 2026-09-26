"""Command line tools.

python -m app.cli create-user --email you@example.com --name "Your Name"
python -m app.cli seed-demo
"""

import argparse
import getpass
import sys
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Load, LoadEvent, Quote, User
from app.services.network import get_network
from app.services.refs import new_quote_ref


def create_user(email: str, name: str, password: str | None) -> None:
    password = password or getpass.getpass("Password (min 10 characters): ")
    if len(password) < 10:
        sys.exit("Password must be at least 10 characters.")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
        if user:
            user.name, user.password_hash, user.is_active = name, hash_password(password), True
            action = "Updated"
        else:
            db.add(User(email=email.lower(), name=name, password_hash=hash_password(password)))
            action = "Created"
        db.commit()
    print(f"{action} staff user {email}")


def seed_demo() -> None:
    """Sample quotes and loads so the portal has something to show. Safe to run once on an empty database."""
    net = get_network()
    now = datetime.now(UTC)
    with SessionLocal() as db:
        if db.scalar(select(func.count(Load.id))):
            sys.exit("Database already has loads. Seed data is only for an empty database.")

        def quote(hours_ago: float, **kw) -> Quote:
            a, b = net.match_hub(kw["pickup"]), net.match_hub(kw["delivery"])
            r = net.shortest(a, b) if a and b else None
            q = Quote(ref=new_quote_ref(), from_hub=a or "", to_hub=b or "", km=r.km if r else 0, **kw)
            q.created_at = q.updated_at = now - timedelta(hours=hours_ago)
            return q

        db.add_all(
            [
                quote(
                    2,
                    service="Dedicated truck hire (daily or monthly)",
                    name="Chanda Mwila",
                    company="Mwila Poultry (sample)",
                    phone="+260 97 000 0101",
                    email="orders@example.com",
                    pickup="Lusaka, Zambia",
                    delivery="Kitwe, Zambia",
                    cargo="Chilled or frozen food",
                    weight=5,
                    truck="Refrigerated truck (3 to 5 t)",
                    load_date=date.today() + timedelta(days=5),
                    notes="Frozen chicken to our Copperbelt outlets, 30-day contract.",
                ),
                quote(
                    5,
                    name="Thandiwe Banda",
                    company="Western Traders (sample)",
                    phone="+260 97 000 0202",
                    pickup="Lusaka, Zambia",
                    delivery="Mongu, Zambia",
                    cargo="General or palletised",
                    weight=3,
                    truck="Not sure, please advise",
                    load_date=date.today() + timedelta(days=3),
                ),
                quote(
                    150,
                    name="Peter Banda",
                    phone="+260 97 000 0505",
                    pickup="Solwezi, Zambia",
                    delivery="Lusaka, Zambia",
                    cargo="Building materials",
                    weight=12,
                    truck="Bigger than 5 t",
                    status="lost",
                    rate=21000,
                    internal_notes="Needed a bigger truck than we have.",
                ),
            ]
        )

        def load(
            ref: str, a: str, b: str, hours_ago: float, events: list[tuple[float, str, str, str]], **kw
        ) -> Load:
            ld = Load(
                ref=ref, from_hub=a, to_hub=b, origin=net.hub_label(a), destination=net.hub_label(b), **kw
            )
            for h, status, at, note in events:
                ev = LoadEvent(status=status, at=at, location=net.place_name(at), note=note)
                ev.created_at = now - timedelta(hours=h)
                ld.events.append(ev)
            last = events[-1]
            ld.status, ld.at, ld.location, ld.public_note = last[1], last[2], net.place_name(last[2]), last[3]
            ld.created_at = now - timedelta(hours=hours_ago)
            ld.updated_at = now - timedelta(hours=last[0])
            return ld

        db.add_all(
            [
                load(
                    "ELL-7K3Q9",
                    "kitwe",
                    "livingstone",
                    29,
                    [
                        (29, "Booked", "kitwe", ""),
                        (14, "Loaded", "kitwe", "Loaded and sealed, reefer set to 2°C."),
                        (9, "In transit", "kabwe", ""),
                        (3, "In transit", "lusaka", "Passed Lusaka, heading south on the T1."),
                    ],
                    customer="Copperbelt Dairies (sample)",
                    customer_phone="+260 96 000 0303",
                    cargo="Chilled dairy",
                    weight=4.5,
                    truck_type="Refrigerated truck (3 to 5 t)",
                    truck_reg="ABC 1021",
                    driver="Joseph Tembo",
                    driver_phone="+260 97 000 0606",
                    rate=14500,
                    currency="ZMW",
                    eta=date.today() + timedelta(days=1),
                ),
                load(
                    "ELL-2HX8P",
                    "lusaka",
                    "chipata",
                    36,
                    [
                        (36, "Booked", "lusaka", ""),
                        (0.7, "Loaded", "lusaka", "Departing this afternoon on the Great East Road."),
                    ],
                    customer="Phiri General Dealers (sample)",
                    customer_phone="+260 95 000 0404",
                    cargo="Beverages and groceries",
                    weight=3,
                    truck_type="Containerised truck (2 to 3 t)",
                    truck_reg="ABD 7712",
                    driver="Kelvin Mulenga",
                    driver_phone="+260 97 000 0808",
                    rate=9500,
                    currency="ZMW",
                    eta=date.today() + timedelta(days=1),
                ),
                load(
                    "ELL-9CWD5",
                    "lusaka",
                    "kasama",
                    240,
                    [
                        (240, "Booked", "lusaka", ""),
                        (230, "Loaded", "lusaka", ""),
                        (216, "In transit", "serenje", ""),
                        (180, "Delivered", "kasama", "Delivered and signed for."),
                    ],
                    customer="Northern Millers (sample)",
                    customer_phone="+260 97 000 1111",
                    cargo="Bagged mealie meal",
                    weight=3,
                    truck_type="Containerised truck (2 to 3 t)",
                    truck_reg="ABD 7712",
                    driver="Moses Zulu",
                    driver_phone="+260 97 000 0707",
                    rate=10500,
                    currency="ZMW",
                    eta=date.today() - timedelta(days=7),
                ),
            ]
        )
        db.commit()
    print("Sample data added: 3 quotes, 3 loads. Track ELL-7K3Q9 on the website.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="cmd", required=True)
    cu = sub.add_parser("create-user", help="Create or reset a staff login")
    cu.add_argument("--email", required=True)
    cu.add_argument("--name", required=True)
    cu.add_argument("--password", help="Leave out to be prompted")
    sub.add_parser("seed-demo", help="Add sample quotes and loads to an empty database")
    args = parser.parse_args()
    if args.cmd == "create-user":
        create_user(args.email, args.name, args.password)
    elif args.cmd == "seed-demo":
        seed_demo()


if __name__ == "__main__":
    main()
