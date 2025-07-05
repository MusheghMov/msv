import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/Document";
import { MangaScriptVisualizer } from "@/app/pages/MangaScriptVisualizer";
import { setCommonHeaders } from "@/app/headers";
import { Session } from "./session/durableObject";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
};

export default defineApp([
  setCommonHeaders(),
  render(Document, [route("/", MangaScriptVisualizer)]),
]);
