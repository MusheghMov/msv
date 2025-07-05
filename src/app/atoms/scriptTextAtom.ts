import { atom } from "jotai";

const DEFAULT_V2_SCRIPT = `# Chapter 1: The Storm Approaches

* Opening Scene: Dark clouds gather over the city as our heroes prepare for battle

Kenji: speech: {200,300} The storm is coming faster than we expected.
Yumi: thought: {500,200} I can sense something dark in those clouds.
Ryo: speech: {700,450} We need to evacuate the civilians immediately!

* The Evacuation: Chaos fills the streets as people flee from the approaching storm

Kenji: shout: {100,150} Everyone move to the shelters!
Civilian: speech: {400,300} What about the children at the school?
Yumi: speech: {600,400} I'll handle the school. You two focus on the residential area.

* The Storm Hits: Lightning tears through the sky as the supernatural storm begins

Narrator: narrator: {400,50} As the first lightning bolt struck, the city knew this was no ordinary storm.
Kenji: shout: {200,500} Take cover!
Yumi: thought: {800,200} This feels... familiar. Like I've seen this before.
Whisper: whisper: {300,800} The ancient power stirs...`;

const scriptTextAtom = atom<string>(DEFAULT_V2_SCRIPT);

export default scriptTextAtom;