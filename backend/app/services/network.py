"""Route network shared with the frontend (shared/network.json).

The API uses it to validate towns, work out distances for quote requests and
name places in tracking updates, so the numbers match what customers see.
"""

import heapq
import json
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.core.config import get_settings


@dataclass(frozen=True)
class Route:
    nodes: list[str]
    edges: list[int]
    km: int


class Network:
    def __init__(self, data: dict[str, Any]) -> None:
        self.countries: dict[str, str] = data["countries"]
        self.stages: list[str] = data["stages"]
        self.hubs: dict[str, dict[str, Any]] = data["hubs"]
        self.borders: dict[str, dict[str, Any]] = data["borders"]
        self.roads: list[dict[str, Any]] = data["roads"]
        self.aliases: dict[str, str] = data.get("aliases", {})
        self._adj: dict[str, list[tuple[str, int, int]]] = {}
        for i, road in enumerate(self.roads):
            self._adj.setdefault(road["from"], []).append((road["to"], road["km"], i))
            self._adj.setdefault(road["to"], []).append((road["from"], road["km"], i))

    # ---- places -------------------------------------------------------
    def is_hub(self, key: str) -> bool:
        return key in self.hubs

    def is_place(self, key: str) -> bool:
        return key in self.hubs or key in self.borders

    def hub_label(self, key: str) -> str:
        hub = self.hubs[key]
        return f"{hub['name']}, {self.countries[hub['country']]}"

    def place_name(self, key: str) -> str:
        if key in self.hubs:
            return self.hubs[key]["name"]
        if key in self.borders:
            b = self.borders[key]
            return f"{b['name']} border ({'/'.join(b['pair'])})"
        return key

    def match_hub(self, text: str | None) -> str | None:
        """Match free text such as 'Kitwe', 'kitwe, zambia' or 'jhb' to a hub key."""
        if not text:
            return None
        t = " ".join(text.lower().split(",")[0].split())
        if t in self.aliases:
            return self.aliases[t]
        for key, hub in self.hubs.items():
            if key == t or hub["name"].lower() == t:
                return key
        return None

    # ---- routing ------------------------------------------------------
    def shortest(self, start: str, end: str) -> Route | None:
        if start not in self.hubs or end not in self.hubs or start == end:
            return None
        dist: dict[str, int] = {start: 0}
        prev: dict[str, tuple[str, int]] = {}
        heap: list[tuple[int, str]] = [(0, start)]
        while heap:
            d, node = heapq.heappop(heap)
            if node == end:
                break
            if d > dist.get(node, 1 << 30):
                continue
            for nxt, km, idx in self._adj.get(node, []):
                nd = d + km
                if nd < dist.get(nxt, 1 << 30):
                    dist[nxt] = nd
                    prev[nxt] = (node, idx)
                    heapq.heappush(heap, (nd, nxt))
        if end not in dist:
            return None
        nodes, edges, cur = [end], [], end
        while cur != start:
            p, idx = prev[cur]
            edges.insert(0, idx)
            nodes.insert(0, p)
            cur = p
        return Route(nodes=nodes, edges=edges, km=dist[end])

    def borders_on(self, route: Route) -> list[str]:
        out: list[str] = []
        for i, idx in enumerate(route.edges):
            road = self.roads[idx]
            keys = [w for w in road["via"] if isinstance(w, str)]
            if road["from"] != route.nodes[i]:
                keys.reverse()
            out.extend(keys)
        return out

    def stops(self, route: Route) -> list[str]:
        """Hubs and border posts along a route, in order."""
        out = [route.nodes[0]]
        for i, idx in enumerate(route.edges):
            road = self.roads[idx]
            keys = [w for w in road["via"] if isinstance(w, str)]
            if road["from"] != route.nodes[i]:
                keys.reverse()
            out.extend(keys)
            out.append(route.nodes[i + 1])
        return out


@lru_cache
def get_network() -> Network:
    with open(get_settings().network_file, encoding="utf-8") as fh:
        return Network(json.load(fh))
