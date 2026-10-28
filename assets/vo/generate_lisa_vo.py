# Lisa's voice-over for the LPA GO! intro, generated locally with Chatterbox.
#   pip install chatterbox-tts
#   python assets/vo/generate_lisa_vo.py        (run from the project root; a CUDA GPU is fastest, CPU works)
# Writes assets/vo/lisa-01.wav ... lisa-41.wav from manifest.json and skips clips that already exist.
# Upload the WAVs back into assets/vo/ and the video picks them up.
import json, os, urllib.request
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS

HERE = os.path.dirname(os.path.abspath(__file__))
m = json.load(open(os.path.join(HERE, "manifest.json"), encoding="utf-8"))
v = m["voice"]
ref = os.path.join(HERE, "reference" + os.path.splitext(v["reference"])[1])
if not os.path.exists(ref):
    urllib.request.urlretrieve(v["reference"], ref)

model = ChatterboxTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
for line in m["lines"]:
    out = os.path.join(HERE, line["id"] + ".wav")
    if os.path.exists(out):
        continue
    torch.manual_seed(line["seed"])
    wav = model.generate(line["say"], audio_prompt_path=ref, exaggeration=v["exaggeration"],
                         cfg_weight=v["cfg_weight"], temperature=v["temperature"])
    ta.save(out, wav, model.sr)
    print(line["id"], f"{wav.shape[-1] / model.sr:.2f}s", line["say"])
