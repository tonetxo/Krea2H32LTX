# Project Submission Dossier: "O Polbo e o Orco: A Galician Story"
### Comfy H3 Sync Sound Community Challenge

---

## 1. Project Overview

- **Title**: *O Polbo e o Orco: A Galician Story*
- **Format**: Multi-Shot Cinematic Short Film with Synchronized Sound Design (4 Shots, 12 seconds each, 48 seconds total)
- **Genre**: Mythological Dark Fantasy / Galician Coastal Realism
- **Setting**: Costa da Morte, Galicia (Storm-lashed granite cliffs, crashing Atlantic surf, misty morning light)
- **Main Characters & Elements**:
  - **The Barnacle Fisherman (*O Percebeiro*)**: A traditional coastal gatherer in a wet black neoprene wetsuit with orange safety accents and a rusted iron scraper.
  - **The Octopus (*O Polbo*)**: A highly intelligent coastal common octopus (*Octopus vulgaris*) with shifting camouflage skin.
  - **The Urco / Orco**: Legendary Galician mythical beast—a colossal horned black sea-hound bound in heavy rusted iron anchor chains.
  - **The Peace Offering**: A traditional golden Galician empanada filled with seafood and onions.

---

## 2. Hardware and Environment

All generations, sparse attention benchmarking, live WebSocket preview streaming, and multi-track audio synthesis were executed locally on consumer workstation hardware:

- **GPU**: NVIDIA GeForce RTX 5070 Ti (16 GB GDDR7 VRAM)
- **CPU**: AMD Ryzen 9 7900X (12 Cores / 24 Threads, up to 5.6 GHz)
- **System Memory (RAM)**: 96 GB DDR5
- **Operating System**: Linux Mint 22.3 (Ubuntu 24.04 LTS)
- **Backend Architecture**: ComfyUI running native PyTorch 2.13.0 with CUDA 13.2, Triton BF16 kernels, and H3-Optimizations.

---

## 3. Workflow & Technical Pipeline

- **Repository**: [https://github.com/tonetxo/Krea2H32LTX](https://github.com/tonetxo/Krea2H32LTX)
- **Image Generation (Frame Zero / First Frames)**: All base reference images for the I2V video pipeline were generated locally using the custom **Krea2 WebUI** (`Krea2_WebUI.html` / `Krea2_OK.json`), utilizing Flux2/Krea2 architecture with granular RGB variance control. Some image edits (raccord) were made with Klein 9B (standard workflow)
- **Video Generation (I2V / FLF2V with Native Synchronized Audio)**: Generated using the custom **MiniMaxH3 WebUI** (`MiniMaxH3_WebUI.html` / `MiniMaxH3_I2V.json`), combining visual generation and multi-layer sound design in a single forward pass. Final assembly in Kdenlive.
- **Optimization Stack**:
  - **H3-Optimizations (Kitchen INT8 + Sparse Attention)**: Accelerated attention calculating 30% of key-query pairs for a ~40% speedup per sampling step (~25s/step on RTX 5070 Ti).
  - **Chunked Memory Offloading**: Dynamic VRAM staging with 4096-row QKV streaming, enabling full 1080p generation on 16 GB VRAM.
  - **Live Preview Streaming**: Real-time decoding feedback via WebSockets at 6 fps.

---

## 4. Complete Shot-by-Shot Prompts and Sound Design (Prompts were subsequently improved in the web UIs)

---

### SHOT 1: Tug-of-War on the Wet Granite (*O Enfrontamento na Rocha*)

- **Duration**: 12 seconds
- **Sonic Atmosphere**: Physical tension, extreme humidity, isolation on the granite cliff.

#### 1. Text-to-Image Prompt (Frame Zero — Generated with Krea2 WebUI / Flux2)
```text
Cinematic 35mm photograph of a rugged Galician sea cliff in Costa da Morte, heavy Atlantic sea spray. In the foreground, a professional Galician barnacle fisherman (percebeiro) in a wet, glossy black neoprene diving suit with safety orange seams and hood, is kneeling on slippery granite. He holds a weathered, rusted iron scraper (rasqueta) with a wooden handle, aiming to pry a cluster of huge goose barnacles. In the background, a small traditional Galician fishing boat (planeadora) bobs violently on the dark, churning waves. From a dark rock crevice, a massive, realistic common octopus (Octopus vulgaris) with textured, mottled brown and deep maroon skin and dual rows of glistening suction cups under its powerful arms, extends a muscular tentacle, wrapping around the same barnacles. Glistening saltwater, dramatic dark overcast sky, realistic moody coastal lighting.
```

#### 2. Image-to-Video Prompt (MiniMax-H3) with Structured Foley & Audio Design (0–12s)
```text
[Style]: Based on the supplied image reference, a cinematic realistic film style, raw coastal photography, 35mm camera, detailed textures of wet neoprene, rusted iron, and slimy octopus skin.

[Timeline & Action]:
[00-04s] The scene begins from the supplied first frame. The barnacle fisherman in his wet black diving suit tenses his muscles, pulling hard with his rusted iron scraper. The traditional fishing boat in the background pitches dramatically on the wild waves.
[04-08s] The realistic common octopus, camouflage skin pulsing with shifting brown and maroon colors, emerges slightly from the dark crevice, wrapping more muscular tentacles around the goose barnacles, securing its grip with glistening suction cups. A tense, physical tug-of-war begins as both pull with heavy, grounded effort.
[08-12s] The goose barnacles strain under the pressure, stretching slightly but remaining firm. Small rock fragments and white sea foam fly as the metal scraper slides along the wet, mossy granite. Droplets of saltwater fly off the fisherman's neoprene hood and the octopus's slimy tentacles under the dramatic overcast sky, ending with a tense visual freeze.

[Environment]: Churning Atlantic waves crashing hard in the background, heavy white ocean spray, and dark granite rocks shimmering with wetness under moody, diffused lighting.

[Audio & Sound Design Layers for Ref2VA]:
- [00-12s] BACKGROUND AMBIENCE: Uninterrupted, deep roaring Atlantic surf crashing against granite, heavy coastal wind howling, and the continuous hiss of white sea foam (constant white noise spectrum to prevent muting).
- [00-05s] MUSICAL TEXTURE: Low, rhythmic, slow pounding of a traditional Galician bass drum ("bombo"), acting like a tense heartbeat.
- [01-04s] FOLEY (Fisherman): Sharp, high-frequency sound of the rusted iron scraper rasping against granite ('screeech-clink'), mixed with the tight, rubbery stretching sound of wet neoprene fabric.
- [04-08s] FOLEY (Octopus): Wet, squishy, and rhythmic suction sounds ('plop-squeal-plop') as the octopus arms grip the stone and barnacles.
- [05-12s] MUSICAL TENSION: The scraping sound of traditional scallop shells ("cunchas de vieira") starting slow and accelerating, simulating a bone-rattling tension as the tug-of-war intensifies to a climax at the 12th second.
```

---

### SHOT 2: The Emergence of the Urco (*A Emerxencia do Urco*)

- **Duration**: 12 seconds
- **Sonic Atmosphere**: Mythological terror, monumental irruption, brute force of the Atlantic.

#### 1. Text-to-Image Prompt (Frame Zero — Generated with Krea2 WebUI / Flux2)
```text
Cinematic 35mm photograph, epic dark fantasy realism. Surging out from the violent, foaming Atlantic waves of a rugged Galician estuary is the Urco: a colossal, terrifying mythological sea-hound of pitch-black fur, matted with kelp and barnacles. The beast has giant curved ram horns, smoldering deep-red eyes, and heavy, rusted iron anchor chains wrapped around its powerful shoulders and limbs. In the foreground on the wet granite ledge, a barnacle fisherman in a black neoprene wetsuit and a large realistic octopus look up in absolute shock and awe. In the background, the fisherman's traditional motorboat is tossed by the swell. Deep coastal fog, dark granite cliffs, stormy, moody lighting.
```

#### 2. Image-to-Video Prompt (MiniMax-H3) with Structured Foley & Audio Design (0–12s)
```text
[Style]: Based on the supplied image reference, epic dark fantasy realism, realistic cinematic film, 35mm camera, wet fur textures, rusted iron clanking, and high-speed water physics.

[Timeline & Action]:
[00-04s] The scene begins from the supplied first frame. The massive Urco completes its powerful surge out of the ocean, crashing heavily onto the granite ledge. The landing sends a massive spray of sea foam and water across the rock, forcing the fisherman and the octopus to recoil in sheer terror.
[04-08s] The Urco rears its horned head back, its chest expanding as it opens its massive, toothy maw. It unleashes a terrifying, resonant roar that shakes the heavy, rusted anchor chains, making them clatter and slide loudly against the wet granite.
[08-12s] The fierce roar suddenly deflates into a tiny, high-pitched comedic squeak. The Urco stops, looks directly at the fisherman, and blinks foolishly with giant, innocent cartoon eyes while a single drop of water drips from its snout.

[Environment]: Dense sea fog moving rapidly over the dark cliffs, massive crashing waves, and continuous sea spray.

[Audio & Sound Design Layers for Ref2VA]:
- [00-12s] BACKGROUND AMBIENCE: High-velocity ocean wind screaming through rock hollows, underlaid by a massive, wet sub-bass wave rumble.
- [00-04s] FOLEY (The Surge): A cataclysmic water splash, a heavy roaring torrent, and a massive physical 'thud' of wet, heavy weight hitting the granite rock.
- [00-08s] MUSICAL TEXTURE: A continuous, dark, and menacing low-frequency bagpipe drone (the "ronco" of a Galician gaita) that swells dramatically in volume, creating an ominous and ancient atmosphere.
- [04-08s] FOLEY (The Roar & Chains): A deafening, guttural monster roar (a blend of a grizzly bear and a deep sea bullhorn) drenched in heavy granite-cave reverb. Spliced into the roar is the loud, chaotic metallic clanging, rattling, and screeching of heavy rusted anchor chains ('CLANK-CLANK-SCRAPE') dragging over hard stone.
- [08-09s] THE TWIST: The roaring drone cuts out instantly.
- [09-12s] FOLEY (Comedic Anticlimax): A sharp, high-pitched rubber-duck squeak ('squeeeak!'), followed by a single, resonant water droplet hitting a wet puddle ('plop...').
```

---

### SHOT 3: The Shaking Chaos (*O Caos do Sacudón e o Enredo*)

- **Duration**: 12 seconds
- **Sonic Atmosphere**: Frenetic action, chaotic percussion, collision of textures (iron, water, wet fur).

#### 1. Text-to-Image Prompt (Frame Zero — Generated with Krea2 WebUI / Flux2)
```text
Cinematic 35mm photograph, high-speed action shot. On a wet, slippery Galician rock ledge, the colossal black mythological horned hound (the Urco) is shaking its massive, soaking-wet body violently, sending water droplets flying in a high-velocity spray. A large, realistic common octopus is caught mid-air, thrown directly onto the Urco's face, its powerful suction cups clinging to the snout and covering its glowing eyes. Rusted iron anchor chains are whipped and tangled around the beast's paws. In the background, the fisherman in his black wetsuit slips and struggles to maintain balance on the slick granite under a heavy, foggy storm.
```

#### 2. Image-to-Video Prompt (MiniMax-H3) with Structured Foley & Audio Design (0–12s)
```text
[Style]: Based on the supplied image reference, high-speed cinematic action photography, sharp focus, motion blur on water droplets, realistic physical simulation.

[Timeline & Action]:
[00-04s] From the supplied first frame, the Urco shakes its massive head and body in a rapid, violent spiral to rid itself of ocean water, its matted black fur whipping around while millions of glistening water droplets blast outward like a realistic cloud of spray.
[04-08s] Blinded by the realistic octopus clinging firmly to its face, the Urco begins to thrash in panic, spinning and stomping in circles, whipping the heavy, rusted iron chains across the rock. The chains clatter and scrape violently.
[08-12s] The fisherman in his black neoprene diving suit is forced to leap and scramble over the swinging chain loops to avoid being swept off the cliff into the raging Atlantic. The blinded beast stumbles and brushes against a massive granite boulder, causing the octopus to slide down its nose.

[Environment]: Extreme water splashes, high-velocity spray, dense fog, and turbulent waves pounding the cliffs.

[Audio & Sound Design Layers for Ref2VA]:
- [00-12s] BACKGROUND AMBIENCE: Violent, chaotic storm winds, thunderous ocean breakers exploding against the cliffs, and a constant, heavy rain-like sizzle of water spray.
- [00-04s] FOLEY (The Shake): A fast, heavy, and wet rhythmic whipping sound—like a massive, wet heavy carpet being beaten repeatedly ('flap-flap-flap-flap-flap')—accompanied by a cloud of micro-droplet splashes.
- [01-12s] MUSICAL TEXTURE: A frantic, rapid, and syncopated Galician tambourine ("pandeireta") roll, played with sharp, aggressive hand slaps and jingles, driving the chaotic action forward like a cinematic pulse.
- [04-08s] FOLEY (The Octopus Splat): A heavy, wet, and gooey slap ('SPLAT-SQUISH') as the octopus lands on the Urco's face, followed by rapid, panicked suction cup pops and wet wheezes ('pop-pop-pop-schlick') as it covers the beast's muzzle.
- [06-12s] FOLEY (The Chains): High-velocity metallic whipping and clanging ('CLANK-CLANK-WHOOSH-SHREIK') as the iron chains slash through the air and scrape across the granite, punctuated by the heavy, dull thuds of the giant beast stumbling into a boulder.
```

---

### SHOT 4: The Empanada Agreement (*O Pacto da Empanada*)

- **Duration**: 12 seconds
- **Sonic Atmosphere**: Relief, culinary warmth, peaceful and mystical resolution.

#### 1. Text-to-Image Prompt (Frame Zero — Generated with Krea2 WebUI / Flux2)
```text
Cinematic 35mm photograph, moody realistic film style. Close-up on a dark Galician coastal ledge. On the left, the colossal black horned hound (the Urco) lowers its massive head, opening its huge mouth with sharp, wet teeth, exhaling mist. On the right, the calm, brave fisherman in his black neoprene diving suit reaches out, holding a large, golden-brown triangular slice of traditional Galician empanada, showing a detailed filling of onions and seafood. Nearby, a large octopus peeks from a wet rock fissure. In the background, the traditional fishing boat is anchored on calm, misty waters, under soft diffused overcast lighting.
```

#### 2. Image-to-Video Prompt (MiniMax-H3) with Structured Foley & Audio Design (0–12s)
```text
[Style]: Based on the supplied image reference, cinematic realistic film style, detailed food textures, soft coastal lighting, realistic breathing and steam effects.

[Timeline & Action]:
[00-04s] From the supplied first frame, the fisherman calmly and deliberately tosses the large slice of golden Galician empanada directly into the Urco's massive, gaping jaws.
[04-08s] The Urco catches the empanada, chewing it slowly and with visible satisfaction, its massive throat bulging as it swallows. A thick plume of hot steam rises from its nostrils as it relaxes.
[08-12s] Completely calmed by the offering, the giant mythical hound curls up peacefully on the wet granite, closing its glowing red eyes and resting its massive head. The octopus slowly crawls closer, resting a tentacle on the sleeping beast's flank. A slow, cinematic fade-out begins as the scene quietens into a beautiful visual closure.

[Environment]: Calming, gentle sea swell, thinning coastal mist, soft warm diffused morning light reflecting off the wet granite.

[Audio & Sound Design Layers for Ref2VA]:
- [00-12s] BACKGROUND AMBIENCE: The soundscape shifts dramatically. The storm ends; we hear a gentle, rhythmic, and soothing wash of calm, rolling ocean waves, and the faint, distant calling of coastal seagulls.
- [01-04s] FOLEY (The Toss): A subtle, low-frequency 'whoosh' as the empanada slice is tossed through the misty air.
- [04-08s] FOLEY (The Chew): A highly detailed, crisp, and crunchy sound of golden pastry flaking and breaking ('crunch-munch-crunch'), followed by a deep, wet, and heavy swallowing sound ('GULP-SLURP') as the beast's throat bulges.
- [08-10s] FOLEY (The Release): A long, deep, and warm snort of air (hot steam) exhaled through the nostrils, sounding like a satisfied, low-frequency harbor foghorn ('HOOOOOOO').
- [09-12s] MUSICAL RESOLUTION: A beautiful, haunting, and traditional Galician gaita or hurdy-gurdy ("zanfona") melody slowly rises, blending with a soft, warm drone, fading out alongside the visual iris-out, leaving only the gentle sound of the sea.
```

---

## 5. Repository Links & Workflows

- **Repository**: [https://github.com/tonetxo/Krea2H32LTX](https://github.com/tonetxo/Krea2H32LTX)
- **Workflows Included**:
  - `MiniMaxH3_I2V.json` — Universal / Vanilla official ComfyUI Image-to-Video + Native Audio generation (zero external dependencies, guaranteed out-of-the-box compatibility).
  - `MiniMaxH3_Pro_Accelerated.json` — High-Performance Pro workflow (H3 Sparse Attention, Spectrum Accelerator, RTX Video Super Resolution 2x, RIFE Frame Interpolation).
  - `Krea2_OK.json` — Text-to-Image Frame Zero generation (Flux2 / Krea2).
  - `MiniMax_H3_Prewiews_OK.json` — Interactive WebUI base pipeline with real-time WebSocket live previews.
