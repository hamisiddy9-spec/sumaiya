import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from openrouter_pass import run_vision

V = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prompt-7-vision.txt'),
         encoding='utf-8').read()

MODELS = ["nex-agi/nex-n2.5-pro:free", "google/gemma-4-26b-a4b-it:free",
          "thinkingmachines/inkling:free", "dots-studio/dots-3-note-preview:free",
          "google/gemma-4-31b-it:free", "inclusionai/ling-3.0-flash-vl:free"]

img = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'og-image-live.png')
m = run_vision('pass-7-vision-ogcard', V, img, MODELS,
               'pass-7-vision-ogcard.md', max_tokens=4000)
print("PASS7 MODEL:", m, flush=True)
