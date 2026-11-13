"""Build anonymised district areas (Ausbaugebiete) from the Wärme-Pakt street data.

Each district is the area closest to its streets (a raster Voronoi, limited to MAX_DIST around
the streets), traced into smoothed polygons. The landing page shows pledges per district only,
never per street. Standard library only.

Run:  python3 tools/build_districts.py   (writes src/data/districts.json)
"""
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STREETS = ROOT.parent / "data" / "streets.json"
OUT = ROOT / "src" / "data" / "districts.json"

# Four Ausbaugebiete around the town centre: north, west, east (station), south (lake side).
DISTRICTS = [
    {"id": "nord", "name": "Starnberg Nord", "streets": [
        "Josef-Sigl-Straße", "Schießstättstraße", "Am Hochwald", "Hofbuchetstraße", "Waldschmidtstraße"]},
    {"id": "west", "name": "Starnberg West", "streets": [
        "Riedeselstraße", "Bismarckstraße", "Ottostraße", "An der Linde", "Nibelungenweg", "Maximilian-von-Dziembowski-Straße"]},
    {"id": "ost", "name": "Starnberg Ost", "streets": [
        "Schulstraße", "Ferdinand-Maria-Straße", "Giselastraße", "Max-Emanuel-Straße", "Rheinlandstraße"]},
    {"id": "sued", "name": "Starnberg Süd", "streets": ["Jahnstraße", "Prinzenweg", "Wilhelmshöhenstraße", "Oberfeld"]},
]

CELL = 20.0       # raster cell size in metres
MAX_DIST = 560.0  # how far a district reaches beyond its streets (large, so districts tile the town)
PAD = MAX_DIST + 3 * CELL
SIMPLIFY = 30.0   # Douglas-Peucker tolerance in metres
MIN_AREA = 60000  # drop specks below 6 ha


def main():
    streets = {s["name"]: s for s in json.loads(STREETS.read_text(encoding="utf-8"))}
    assigned = [n for d in DISTRICTS for n in d["streets"]]
    assert sorted(assigned) == sorted(streets), set(assigned) ^ set(streets)

    all_pts = [p for s in streets.values() for line in s["geometry"]["coordinates"] for p in line]
    lat0 = sum(p[1] for p in all_pts) / len(all_pts)
    lon0 = sum(p[0] for p in all_pts) / len(all_pts)
    kx, ky = math.cos(math.radians(lat0)) * 111320.0, 110540.0
    to_xy = lambda lon, lat: ((lon - lon0) * kx, (lat - lat0) * ky)
    to_ll = lambda x, y: [round(lon0 + x / kx, 6), round(lat0 + y / ky, 6)]

    # densified street vertices, tagged with their district index
    pts = []
    # Some OSM streets have pieces far apart (e.g. Waldstraße in the north and in the south).
    # A piece far from the rest of its district goes to the district it actually lies in.
    centre = lambda line: (sum(to_xy(*p)[0] for p in line) / len(line), sum(to_xy(*p)[1] for p in line) / len(line))
    anchors = {di: [centre(l) for n in d["streets"] for l in streets[n]["geometry"]["coordinates"]] for di, d in enumerate(DISTRICTS)}
    def district_of(line, di, name):
        cx, cy = centre(line)
        own = [a for n in DISTRICTS[di]["streets"] if n != name for a in map(centre, streets[n]["geometry"]["coordinates"])]
        near = lambda pts_: min(math.hypot(cx - x, cy - y) for x, y in pts_)
        if near(own) <= 700:
            return di
        # only move it if another district is clearly close; isolated pieces stay where they are
        other = min((k for k in anchors if k != di), key=lambda k: near(anchors[k]))
        return other if near(anchors[other]) <= 700 else di

    for di0, d in enumerate(DISTRICTS):
        for name in d["streets"]:
            for line in streets[name]["geometry"]["coordinates"]:
                di = district_of(line, di0, name)
                if di != di0:
                    print(f"  piece of {name} at {line[0][1]:.4f},{line[0][0]:.4f} -> {DISTRICTS[di]['id']}")
                xy = [to_xy(*p) for p in line]
                for (x1, y1), (x2, y2) in zip(xy, xy[1:]):
                    n = max(1, int(math.hypot(x2 - x1, y2 - y1) // 10))
                    pts += [(x1 + (x2 - x1) * t / n, y1 + (y2 - y1) * t / n, di) for t in range(n)]
                pts.append((*xy[-1], di))

    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    minx, miny = min(xs) - PAD, min(ys) - PAD
    nx, ny = int((max(xs) + PAD - minx) / CELL) + 1, int((max(ys) + PAD - miny) / CELL) + 1

    bucket = defaultdict(list)
    B = MAX_DIST
    for p in pts:
        bucket[(int(p[0] // B), int(p[1] // B))].append(p)

    grid = [[-1] * nx for _ in range(ny)]
    for j in range(ny):
        cy = miny + (j + 0.5) * CELL
        for i in range(nx):
            cx = minx + (i + 0.5) * CELL
            bx, by = int(cx // B), int(cy // B)
            best, bd = -1, MAX_DIST * MAX_DIST
            for ox in (-1, 0, 1):
                for oy in (-1, 0, 1):
                    for px, py, di in bucket.get((bx + ox, by + oy), ()):
                        dd = (px - cx) ** 2 + (py - cy) ** 2
                        if dd < bd:
                            bd, best = dd, di
            grid[j][i] = best

    # majority filter: smooth ragged borders
    for _ in range(4):
        g2 = [row[:] for row in grid]
        for j in range(1, ny - 1):
            for i in range(1, nx - 1):
                votes = defaultdict(int)
                for oy in (-1, 0, 1):
                    for ox in (-1, 0, 1):
                        votes[grid[j + oy][i + ox]] += 1
                top, cnt = max(votes.items(), key=lambda kv: kv[1])
                if cnt >= 5:
                    g2[j][i] = top
        grid = g2

    features = []
    for di, d in enumerate(DISTRICTS):
        rings = trace(grid, di, nx, ny)
        polys = []
        for ring in rings:
            ring = [(minx + i * CELL, miny + j * CELL) for i, j in ring]
            ring = chaikin(simplify(ring, SIMPLIFY), 2)
            area = signed_area(ring)
            if abs(area) >= MIN_AREA or area < 0:
                polys.append((area, ring))
        outers = [r for a, r in polys if a > 0 and a >= MIN_AREA]
        holes = [r for a, r in polys if a < 0 and -a >= MIN_AREA / 4]
        multi = []
        for o in outers:
            mine = [h for h in holes if point_in(h[0], o)]
            multi.append([[to_ll(*p) for p in close(o)]] + [[to_ll(*p) for p in close(h)] for h in mine])
        members = [streets[n] for n in d["streets"]]
        features.append({
            "type": "Feature",
            "properties": {"id": d["id"], "name": d["name"], "streets": d["streets"]},
            "geometry": {"type": "MultiPolygon", "coordinates": multi},
        })
        print(f"{d['id']}: {len(multi)} part(s), {sum(len(r) for p in multi for r in p)} points, "
              f"{sum(m['households'] for m in members)} households")

    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT))


def trace(grid, di, nx, ny):
    """Boundary rings of all cells == di, as lists of grid corners (counter-clockwise outer rings)."""
    inside = lambda i, j: 0 <= i < nx and 0 <= j < ny and grid[j][i] == di
    edges = {}
    for j in range(ny):
        for i in range(nx):
            if not inside(i, j):
                continue
            # directed edges with the cell on the left -> outer rings counter-clockwise
            if not inside(i, j - 1):
                edges[(i, j)] = (i + 1, j)
            if not inside(i + 1, j):
                edges[(i + 1, j)] = (i + 1, j + 1)
            if not inside(i, j + 1):
                edges[(i + 1, j + 1)] = (i, j + 1)
            if not inside(i - 1, j):
                edges[(i, j + 1)] = (i, j)
    rings = []
    while edges:
        start, nxt = edges.popitem()
        ring = [start]
        cur = nxt
        while cur != start and cur in edges:
            ring.append(cur)
            cur = edges.pop(cur)
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def simplify(pts, tol):
    if len(pts) < 4:
        return pts
    def rdp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        L = math.hypot(x2 - x1, y2 - y1) or 1e-9
        best, idx = 0.0, -1
        for k in range(a + 1, b):
            x0, y0 = pts[k]
            dist = abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1)) / L
            if dist > best:
                best, idx = dist, k
        if best > tol:
            return rdp(a, idx)[:-1] + rdp(idx, b)
        return [pts[a], pts[b]]
    far = max(range(len(pts)), key=lambda k: (pts[k][0] - pts[0][0]) ** 2 + (pts[k][1] - pts[0][1]) ** 2)
    return rdp(0, far)[:-1] + rdp(far, len(pts) - 1)[:-1] + [pts[-1]]


def chaikin(pts, rounds):
    for _ in range(rounds):
        out = []
        for k in range(len(pts)):
            (x1, y1), (x2, y2) = pts[k], pts[(k + 1) % len(pts)]
            out += [(0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2), (0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2)]
        pts = out
    return pts


def signed_area(pts):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1])) / 2


def point_in(p, poly):
    x, y = p
    inside = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def close(ring):
    return ring + [ring[0]]


if __name__ == "__main__":
    main()
