# Asset provenance

## Original music

`audio/poorna-golden-hour.wav` is **Golden Hour**, an original synthetic tabla-and-flute-inspired instrumental composed for this project. It uses original note sequences and synthesized percussion/breath tones, with no sampled performances or third-party melody. It is not a live tabla or bansuri recording.

- Reproducible source: `scripts/compose_music.py` (Python, NumPy and SciPy, authoring only).
- 60 seconds, 64 BPM, stereo 16-bit PCM at 22,050 Hz; seamless circular reverb tail.
- Peak 0.76 full scale, zero clipped samples. Playback defaults to 30% with a gentle gain ramp.
- The approved Pixabay track, “Indian Classical Flute & Tabla — Mystcial Fusion” by bineleyas, could not be obtained because its normal page/download was blocked by a browser challenge. On 1 November 2026 the user explicitly selected an original local loop instead. No audio from that track is included, and no claim to its license is made for this original composition.

## Telugu shop signs

`fonts/NotoSansTelugu-Regular.ttf`, downloaded on 1 November 2026 from:
https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf

Distributed with `fonts/OFL.txt` under the SIL Open Font License. The browser loads the font locally before drawing the bilingual sign textures.

## Scene materials

Stone paving, plaster, wood grain, woven bamboo, soft contact shadows and bilingual sign textures are generated locally by deterministic canvas code in `js/scene.js`. They are material maps and lettering, not photographic reconstructions. Geometry is original scene code with shared/instanced shapes. Original repository photographs are retained unchanged but are not loaded by this scene.
