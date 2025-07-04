import { atom } from "jotai";

export type SyncSource = 'text' | 'bubbles' | 'none';

const syncSourceAtom = atom<SyncSource>('none');

export default syncSourceAtom;