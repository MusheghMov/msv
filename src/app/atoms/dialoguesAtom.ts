import { DialogueData } from "../types/manga";
import { atomWithListeners } from "./atomWithListeners";

const [dialoguesAtom, useDialoguesListener] = atomWithListeners<DialogueData[]>(
  [],
);

export default dialoguesAtom;
export { useDialoguesListener };
