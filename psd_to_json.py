import json
import sys
import subprocess
import tempfile
import os


import json
import subprocess
import tempfile
import os


MAGICK_EXE = r"P:\pipeline\extra_soft\ImageMagick-7.0.10-Q16\magick.exe"


def generate_magick_json(psd_path: str) -> dict:
    """
    Convert a PSD file to ImageMagick JSON metadata.

    :param psd_path: Path to the PSD file
    :return: ImageMagick JSON output as a Python dict (or list)
    """
    if not os.path.isfile(psd_path):
        raise FileNotFoundError(f"PSD not found: {psd_path}")

    if not os.path.isfile(MAGICK_EXE):
        raise FileNotFoundError(f"ImageMagick not found: {MAGICK_EXE}")

    # Create temporary output json
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
        json_path = tmp.name

    try:
        cmd = [
            MAGICK_EXE,
            "convert",
            psd_path,
            "json:"
        ]

        with open(json_path, "w", encoding="utf-8") as f:
            result = subprocess.run(
                cmd,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True,
                shell=False
            )

        if result.returncode != 0:
            raise RuntimeError(
                f"ImageMagick failed:\n{result.stderr}"
            )

        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)

    finally:
        # Remove temp file (comment out if you want to keep it)
        if os.path.exists(json_path):
            os.remove(json_path)

class Layer:
    def __init__(self) -> None:
        '''
        Example:
            {
                "name": "Layer 128",
                "width": 2258,
                "height": 1063,
                "x": -240,
                "y": 1016
            }
        '''
        self.name = None
        self.width = None
        self.height = None
        self.x = None
        self.y = None

    def to_dict(self):
        """
        Returns a dictionary representation of the Layer instance.
        """
        return {
            "name": self.name,
            "width": self.width,
            "height": self.height,
            "x": self.x,
            "y": self.y
        }


def psd_to_json(psd_path, output_json_path):
    magick_json = generate_magick_json(psd_path=psd_path)
    layers = []
    for mlayer in magick_json:
        layers.append(simplify_magick_layer(mlayer).to_dict())
    print(layers)
    with open(output_json_path,"w") as file:
        file.write(json.dumps(layers,indent=4))


def simplify_magick_layer(_mlayer:dict)->Layer:
    layer=Layer()
    image = _mlayer.get("image")
    if not image:
        return
    properties = image.get("properties")
    geometry = image.get("geometry")
    if geometry:
        layer.x = geometry.get("x")
        layer.y = geometry.get("y")
        layer.width = geometry.get("width")
        layer.height = geometry.get("height")
    geometry = image.get("pageGeometry")
    if geometry:
        layer.x = geometry.get("x")
        layer.y = geometry.get("y")
        layer.width = geometry.get("width")
        layer.height = geometry.get("height")
    if properties:
        layer.name = properties.get("label") or "merged"
    return layer



if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python psd_to_json.py <input.psd> <output.json>")
        sys.exit(1)

    psd_path = sys.argv[1]
    output_json_path = sys.argv[2]
    psd_to_json(psd_path, output_json_path)
    print(f"JSON saved to {output_json_path}")
