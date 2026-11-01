"""Original synthetic tabla/flute-inspired loop; no third-party samples or melodies.
Rebuild with Python + numpy + scipy. Output is served locally, never generated at runtime.
"""
from pathlib import Path
import wave
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 22050
BPM = 64
BEAT = 60 / BPM
DURATION = 64 * BEAT
rng = np.random.default_rng(360)
mix = np.zeros((round(DURATION * RATE), 2), dtype=np.float64)

def add(signal, start, level=1, pan=0):
    indices = (np.arange(len(signal)) + round(start * RATE)) % len(mix)
    mix[indices, 0] += signal * level * np.sqrt((1-pan)/2)
    mix[indices, 1] += signal * level * np.sqrt((1+pan)/2)

def drum(low=False, soft=False):
    t = np.arange(round((1.1 if low else .6)*RATE))/RATE
    f = 73 if low else 293.665
    phase = 2*np.pi*(f*t + (14 if low else 4)*.1*(1-np.exp(-t/.1)))
    signal = sum(np.sin(phase*r) * np.exp(-t/(.37 if low else .19)/(1+i*.6)) * v
                 for i,(r,v) in enumerate([(1,1),(1.51,.35),(2.06,.22),(2.48,.12),(3.5,.08)]))
    noise = rng.normal(0,1,len(t)) * np.exp(-t/.022)
    return (signal*.31 + noise*.06) * (1-np.exp(-t/.0015)) * (.6 if soft else 1)

def flute(freq, duration):
    t = np.arange(round((duration+.5)*RATE))/RATE
    vibrato = .003 * np.sin(2*np.pi*4.6*t) * (1-np.exp(-t/.3))
    phase = 2*np.pi*np.cumsum(freq*(1+vibrato))/RATE
    envelope = np.minimum(t/.19,1) * np.minimum(np.maximum((duration+.5-t)/.5,0),1)
    envelope *= .8+.07*np.sin(2*np.pi*.6*t)
    breath = sosfilt(butter(2,[700,3600],btype='bandpass',fs=RATE,output='sos'),rng.normal(0,1,len(t)))
    return (np.sin(phase)+.15*np.sin(phase*2)+.045*np.sin(phase*3)+breath*.055)*envelope*.125

# Unhurried original 16-beat cycles; spacious strokes, no frenetic fills.
for cycle in range(4):
    base=cycle*16
    for beat,low,level in [(0,True,.29),(0,False,.18),(2,False,.18),(4,True,.22),(6,False,.15),(8,True,.26),(8,False,.16),(10,False,.17),(12,False,.14),(14,True,.19),(15,False,.1)]:
        add(drum(low), (base+beat)*BEAT, level, -.23 if low else .2)
    for beat in [3.5,7.5,11.5]: add(drum(False,True),(base+beat)*BEAT,.09,.2)

# Original D-major pentatonic phrases, with deliberate pauses for breathing.
phrases=[[(1,0,2.2),(4,2,1.6),(6,4,2.6),(10,7,2),(13,4,1.6)],
         [(1,9,2),(4,7,2.3),(7,4,2),(11,2,2.5)],
         [(1,4,2.6),(5,7,1.6),(7,9,2.3),(11,12,2),(14,9,1.1)],
         [(1,7,2.5),(5,4,2.2),(9,2,2),(12,0,2.8)]]
for cycle, phrase in enumerate(phrases):
    for beat,semitone,length in phrase:
        add(flute(587.33*2**(semitone/12),length*BEAT),(cycle*16+beat)*BEAT, .62, -.08)

# Soft continuous drone and circular stereo early reflections preserve the seam.
t=np.arange(len(mix))/RATE
drone=(np.sin(2*np.pi*146.6666666667*t)*.010 + np.sin(2*np.pi*220*t)*.005)
mix += drone[:,None]
dry=mix.copy()
for delay,level in [(.17,.13),(.31,.1),(.47,.07),(.69,.04)]:
    mix += np.roll(dry[:,::-1],round(delay*RATE),axis=0)*level
mix=np.tanh(mix*1.5)
mix *= .76/max(np.max(np.abs(mix)),.01)
target=Path(__file__).resolve().parents[1]/'assets/audio/poorna-golden-hour.wav'
target.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(target),'wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(RATE)
    out.writeframes((mix*32767).astype('<i2').tobytes())
print(f'{target.name}: {DURATION:.0f}s, original synthetic instrumental')
