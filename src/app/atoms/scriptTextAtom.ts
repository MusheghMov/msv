import { atomWithListeners } from "./atomWithListeners";

const DEFAULT_V2_SCRIPT = `# Chapter 1: THE DAY WHEN EVERYTHING WENT WRONG

* Opening Scene: Midday. A small, peaceful town surrounded by mountains. Suddenly, a spaceship spirals out of control, crashing toward a nearby field.


Narrator: narrator: {180,180} It was the beginning of the end...
Narrator: narrator: {260,320} When we faced the cruel reality...
Pilot #1: shout: {610,310} SOS! We’ve lost control — engines offline!
Pilot #1: thought: {330,720} I don't want to die here alone...  
Pilot #1: shout: {190,930} Please... Please... Help me... 


* Closing Scene: After the rocket fell, there was destruction nearby. The rocket was completely destroyed. Although the pilot survived, his life was in danger. Everything near the rocket was burning`;

const [scriptTextAtom, useScriptTextListener] =
  atomWithListeners<string>(DEFAULT_V2_SCRIPT);
export default scriptTextAtom;
export { useScriptTextListener };
