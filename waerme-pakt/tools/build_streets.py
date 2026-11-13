"""Build data/streets.json and data/network.geojson from an Overpass export.

Usage: python3 tools/build_streets.py <overpass-ways.json>
The export is the result of the query in README.md (named highways in Unterhaching).
Geometry is real OpenStreetMap data; phases and pledge counts are demo values.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# name: (households, pledged, phase) -- demo values, not real operator data
DEMO = {
    "Rathausstraße": (46, 38, 1),
    "Schulstraße": (30, 24, 1),
    "Kapellenstraße": (22, 16, 1),
    "Parkstraße": (34, 24, 1),
    "Am Sportpark": (40, 27, 1),
    "Fasangartenstraße": (26, 17, 2),
    "Robert-Koch-Straße": (40, 25, 2),
    "Jägerstraße": (18, 11, 2),
    "Bussardstraße": (33, 19, 2),
    "Mühlweg": (24, 13, 2),
    "Ludwig-Thoma-Straße": (30, 15, 2),
    "Grünauer Allee": (20, 8, 3),
    "Waldstraße": (25, 9, 3),
    "Forststraße": (16, 5, 3),
    "Walter-Paetzmann-Straße": (44, 12, 3),
    "Bürgermeister-Prenn-Straße": (38, 9, 3),
    "Sankt-Alto-Straße": (22, 4, 3),
    "Pittingerstraße": (26, 4, 3),
    "Liebigstraße": (30, 3, 3),
    "Lilienweg": (14, 1, 3),
}

PHASES = {
    1: {"label": "Bauphase 1", "status": "Im Bau", "expectedConnection": "Herbst 2027"},
    2: {"label": "Bauphase 2", "status": "Zusagen werden gesammelt", "expectedConnection": "2029"},
    3: {"label": "Bauphase 3", "status": "In Planung", "expectedConnection": "2031"},
}


def main(src):
    ways = json.loads(Path(src).read_text())["elements"]
    lines = {name: [] for name in DEMO}
    for way in ways:
        name = way["tags"].get("name")
        if name in lines and way.get("geometry"):
            lines[name].append([[round(p["lon"], 5), round(p["lat"], 5)] for p in way["geometry"]])

    streets, features = [], []
    for name, (households, pledged, phase) in DEMO.items():
        if not lines[name]:
            sys.exit(f"no geometry for {name}")
        geometry = {"type": "MultiLineString", "coordinates": lines[name]}
        streets.append({
            "name": name,
            "households": households,
            "pledged": pledged,
            "phase": phase,
            **PHASES[phase],
            "geometry": geometry,
        })
        features.append({"type": "Feature", "properties": {"name": name, "phase": phase}, "geometry": geometry})

    (ROOT / "data/streets.json").write_text(json.dumps(streets, ensure_ascii=False, indent=1))
    (ROOT / "data/network.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False))
    print(f"{len(streets)} streets written")


if __name__ == "__main__":
    main(sys.argv[1])
