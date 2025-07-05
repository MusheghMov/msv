import { ParsedMangaScript } from "@/app/utils/mangaScriptV2Parser";
import { Badge } from "@/app/components/ui/badge";
import { XCircle, AlertCircle, CircleCheck } from "lucide-react";

export default function ScriptStatusBadge({
  parsedScript,
}: {
  parsedScript: ParsedMangaScript | null;
}) {
  if (!parsedScript) {
    return <Badge variant="secondary">Parsing...</Badge>;
  }

  const errorCount = parsedScript.errors.filter(
    (err) => err.severity === "error",
  ).length;
  const warningCount = parsedScript.errors.filter(
    (err) => err.severity === "warning",
  ).length;

  if (errorCount > 0) {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3" />
        {errorCount} Error{errorCount !== 1 ? "s" : ""}
      </Badge>
    );
  }

  if (warningCount > 0) {
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        {warningCount} Warning{warningCount !== 1 ? "s" : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="bg-green-600">
      <CircleCheck className="w-3 h-3 mr-1" />
      Valid
    </Badge>
  );
}
