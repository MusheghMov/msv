import { atom } from "jotai";
import { DEFAULT_SCRIPT } from "../types/manga";

const scriptTextAtom = atom<string>(DEFAULT_SCRIPT);

export default scriptTextAtom;