import { atom } from "jotai";
import { DialogueData } from "../types/manga";

const dialoguesAtom = atom<DialogueData[]>([]);

export default dialoguesAtom;
