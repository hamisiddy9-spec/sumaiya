#!/usr/bin/env python
"""Map the current device screen: dump the a11y hierarchy once, print text/clickable
targets with centre coordinates as JSON. One dump per screen; then tap by coordinate."""
import json, re, subprocess, sys, os, time

SER = os.environ.get("SER", "10.229.114.105:5555")
OUT = os.path.join(os.environ.get("LOCALAPPDATA", "."), "Temp", "motion-qa")


def adb(*a, binary=False):
    r = subprocess.run(["adb", "-s", SER, *a], capture_output=True)
    return r.stdout if binary else r.stdout.decode("utf-8", "replace")


def dump(tag="screen"):
    adb("shell", "rm", "-f", "/sdcard/window_dump.xml")
    out = adb("shell", "uiautomator", "dump", "/sdcard/window_dump.xml")
    if "dumped to" not in out:
        # animation in progress -> retry once after a beat
        time.sleep(0.8)
        out = adb("shell", "uiautomator", "dump", "/sdcard/window_dump.xml")
    xml = adb("shell", "cat", "/sdcard/window_dump.xml")
    path = os.path.join(OUT, f"dump-{tag}.xml")
    open(path, "w", encoding="utf-8").write(xml)
    return xml, path


def parse(xml):
    nodes = []
    for m in re.finditer(r"<node ([^>]*?)/?>", xml):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        b = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", attrs.get("bounds", ""))
        if not b:
            continue
        x1, y1, x2, y2 = map(int, b.groups())
        nodes.append({
            "text": attrs.get("text", ""),
            "desc": attrs.get("content-desc", ""),
            "cls": attrs.get("class", ""),
            "clickable": attrs.get("clickable") == "true",
            "res": attrs.get("resource-id", ""),
            "cx": (x1 + x2) // 2, "cy": (y1 + y2) // 2,
            "b": [x1, y1, x2, y2],
        })
    return nodes


if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "screen"
    xml, path = dump(tag)
    nodes = parse(xml)
    os.makedirs(OUT, exist_ok=True)
    mapfile = os.path.join(OUT, f"map-{tag}.json")
    json.dump(nodes, open(mapfile, "w", encoding="utf-8"), indent=1)
    print(f"# dump -> {path}  ({len(xml)} bytes)")
    print(f"# map  -> {mapfile}  ({len(nodes)} nodes)")
    seen = set()
    for n in nodes:
        label = (n["text"] or n["desc"]).strip()
        if not label or label in seen:
            continue
        seen.add(label)
        print(f'{n["cx"]:>5},{n["cy"]:>5}  {"TAP" if n["clickable"] else "   "}  {label[:70]}')
