"""Build data/streets.json and data/network.geojson from an Overpass export.

Usage: python3 tools/build_streets.py <overpass-ways.json>
The export is the result of the query in README.md (named highways in Starnberg).
Geometry is real OpenStreetMap data; phases and pledge counts are demo values.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# name: (households, pledged, phase) -- demo values, not real operator data
DEMO = {
    # Ost, near the station: under construction
    "Schulstraße": (46, 38, 1),
    "Ferdinand-Maria-Straße": (30, 24, 1),
    "Giselastraße": (22, 16, 1),
    "Max-Emanuel-Straße": (34, 24, 1),
    "Rheinlandstraße": (40, 27, 1),
    # West: collecting pledges (Ottostraße is the demo street)
    "Riedeselstraße": (26, 17, 2),
    "Bismarckstraße": (40, 25, 2),
    "Ottostraße": (18, 11, 2),
    "An der Linde": (33, 19, 2),
    "Nibelungenweg": (24, 13, 2),
    "Maximilian-von-Dziembowski-Straße": (30, 15, 2),
    # Nord and Süd: in planning
    "Josef-Sigl-Straße": (20, 8, 3),
    "Schießstättstraße": (25, 9, 3),
    "Am Hochwald": (16, 5, 3),
    "Hofbuchetstraße": (44, 12, 3),
    "Waldschmidtstraße": (38, 9, 3),
    "Jahnstraße": (22, 4, 3),
    "Prinzenweg": (26, 4, 3),
    "Wilhelmshöhenstraße": (30, 3, 3),
    "Oberfeld": (14, 1, 3),
}

# Only the town of Starnberg itself; the municipality also has villages that reuse street names.
BBOX = (47.980, 11.310, 48.020, 11.365)  # south, west, north, east

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
        inside = all(BBOX[0] <= p["lat"] <= BBOX[2] and BBOX[1] <= p["lon"] <= BBOX[3] for p in way.get("geometry", []))
        if name in lines and way.get("geometry") and inside:
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
