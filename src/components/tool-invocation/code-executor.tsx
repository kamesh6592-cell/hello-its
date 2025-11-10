import { useCopy } from "@/hooks/use-copy";
import { ToolUIPart } from "ai";

import { callCodeRunWorker } from "lib/code-runner/call-worker";

import {
  CodeRunnerResult,
  LogEntry,
} from "lib/code-runner/code-runner.interface";
import { cn, isString, toAny } from "lib/utils";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRight,
  CopyIcon,
  Loader,
  PlayIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safe } from "ts-safe";

import { CodeBlock } from "ui/CodeBlock";
import { Skeleton } from "ui/skeleton";
import { TextShimmer } from "ui/text-shimmer";

export const CodeExecutor = memo(function CodeExecutor({
  part,
  onResult,
  type,
}: {
  part: ToolUIPart;
  onResult?: (result?: any) => void;
  type: "javascript" | "python";
}) {
  const isRun = useRef(false);

  const { copy, copied } = useCopy();
  const [isExecuting, setIsExecuting] = useState(false);

  const lastStartedAt = useRef<number>(Date.now());

  const [realtimeLogs, setRealtimeLogs] = useState<
    (CodeRunnerResult["logs"][number] & { time: number })[]
  >([]);

  const codeResultContainerRef = useRef<HTMLDivElement>(null);

  const runCode = useCallback(
    async (code: string, type: "javascript" | "python") => {
      lastStartedAt.current = Date.now();
      const result = await callCodeRunWorker(type, {
        code,
        timeout: 30000,
        onLog: (log) => {
          setRealtimeLogs((prev) => [...prev, { ...log, time: Date.now() }]);
        },
      });
      return result;
    },
    [],
  );

  const menualToolCall = useCallback(
    async (code: string) => {
      const result = await runCode(code, type);
      const logstring = JSON.stringify(result.logs);
      onResult?.({
        ...toAny({
          ...result,
          logs:
            logstring.length > 5000
              ? [
                  {
                    type: "info",
                    args: [
                      {
                        type: "data",
                        value:
                          "Log output exceeded storage limit (10KB). Full output was displayed to user but truncated for server storage.",
                      },
                    ],
                  },
                ]
              : result.logs,
        }),
        guide:
          "Execution finished. Provide: 1) Main results/outputs 2) Key insights or findings 3) Error explanations if any. Don't repeat code or raw logs - interpret and summarize for the user.",
      });
    },
    [onResult],
  );
  const isRunning = useMemo(() => {
    return isExecuting || part.state.startsWith("input");
  }, [isExecuting, part.state]);

  const scrollToCode = useCallback(() => {
    codeResultContainerRef.current?.scrollTo({
      top: codeResultContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const result = useMemo(() => {
    if (part.state.startsWith("input")) return null;
    return part.output as CodeRunnerResult;
  }, [part]);

  const logs = useMemo(() => {
    const error = result?.error;
    const logs: (LogEntry & { time?: number })[] = realtimeLogs.length
      ? realtimeLogs
      : (result?.logs ?? []);

    if (error) {
      logs.push({
        type: "error",
        args: [{ type: "data", value: error }],
        time: lastStartedAt.current,
      });
    }

    return logs.map((log, i) => {
      return (
        <div
          key={i}
          className={cn(
            "flex gap-1 text-muted-foreground pl-3",
            log.type == "error" && "text-destructive",
            log.type == "warn" && "text-yellow-500",
          )}
        >
          <div className="w-[8.6rem] hidden md:block">
            {new Date(toAny(log).time || Date.now()).toISOString()}
          </div>
          <div className="h-[15px] flex items-center">
            {log.type == "error" ? (
              <AlertTriangleIcon className="size-2" />
            ) : log.type == "warn" ? (
              <AlertTriangleIcon className="size-2" />
            ) : (
              <ChevronRight className="size-2" />
            )}
          </div>
          <div className="flex-1 min-w-0 whitespace-pre-wrap gap-1">
            {log.args.map((arg, i) => {
              if (arg.type == "image") {
                /* eslint-disable-next-line @next/next/no-img-element */
                return <img key={i} src={arg.value} alt="Code output" />;
              }
              return (
                <span key={i}>
                  {isString(arg?.value)
                    ? arg.value.toString()
                    : JSON.stringify(arg.value ?? arg)}
                </span>
              );
            })}
          </div>
        </div>
      );
    });
  }, [part, realtimeLogs]);

  const reExecute = useCallback(async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setRealtimeLogs([
      {
        type: "log",
        args: [{ type: "data", value: "Re-executing code..." }],
        time: Date.now(),
      },
    ]);
    const code = toAny(part.input)?.code;

    safe(() => runCode(code, type)).watch(() => setIsExecuting(false));
  }, [part.input, isExecuting]);

  const header = useMemo(() => {
    if (isRunning)
      return (
        <>
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20">
            <Loader className="size-3.5 animate-spin text-primary" />
            <TextShimmer className="text-xs font-medium">
              Generating Code...
            </TextShimmer>
          </div>
        </>
      );
    return (
      <>
        {result?.error ? (
          <div className="flex items-center gap-2 px-2 py-1 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangleIcon className="size-3.5 text-destructive" />
            <span className="text-destructive text-xs font-semibold">
              EXECUTION ERROR
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-[9px] bg-green-500 text-white rounded w-5 h-5 flex items-center justify-center font-bold">
              {type == "javascript" ? "JS" : type == "python" ? "PY" : ">_"}
            </div>
            <span className="text-green-500 text-xs font-semibold">
              {type == "javascript"
                ? "JavaScript"
                : type == "python"
                  ? "Python"
                  : "Code"}
            </span>
          </div>
        )}
      </>
    );
  }, [part.state, result, isRunning]);

  const fallback = useMemo(() => {
    return <CodeFallback />;
  }, []);

  useEffect(() => {
    if (
      onResult &&
      part.input &&
      part.state == "input-available" &&
      !isRun.current
    ) {
      isRun.current = true;
      menualToolCall(toAny(part.input)?.code);
    }
  }, [part.state, !!onResult]);

  useEffect(() => {
    if (isRunning) {
      const closeKey = setInterval(scrollToCode, 300);
      return () => clearInterval(closeKey);
    } else if (part.state.startsWith("output") && isRun.current) {
      scrollToCode();
    }
  }, [isRunning]);

  return (
    <div className="flex flex-col">
      <div className="px-6 py-3">
        <div className="border overflow-hidden relative rounded-xl shadow-lg fade-in animate-in duration-500 bg-card">
          {/* Header */}
          <div className="py-3 bg-gradient-to-r from-muted/80 to-muted/50 px-4 flex items-center gap-2 z-10 min-h-[45px] border-b border-border/50">
            {header}
            <div className="flex-1" />

            {part.state.startsWith("output") && (
              <>
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 transition-all rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary font-medium border border-transparent hover:border-primary/20"
                  onClick={reExecute}
                >
                  <PlayIcon className="size-3" />
                  Re-run
                </button>
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 transition-all rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary font-medium border border-transparent hover:border-primary/20"
                  onClick={() => copy(toAny(part.input)?.code ?? "")}
                >
                  {copied ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                  Copy
                </button>
              </>
            )}
          </div>

          {/* Two-column layout: Code | Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
            {/* Left Column: Code */}
            <div className="relative bg-gradient-to-br from-muted/10 to-muted/5">
              <div className="absolute top-3 left-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                Code
              </div>
              <div
                className="min-h-[200px] max-h-[500px] p-6 pt-10 text-xs overflow-y-auto overflow-x-auto"
                ref={codeResultContainerRef}
              >
                <CodeBlock
                  className="text-[11px]"
                  code={toAny(part.input)?.code}
                  lang={type}
                  fallback={fallback}
                />
              </div>
            </div>

            {/* Right Column: Output/Logs */}
            <div className="relative bg-background">
              <div className="absolute top-3 left-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60 flex items-center gap-2">
                Output
                {isRunning && (
                  <Loader className="size-3 animate-spin text-primary" />
                )}
              </div>
              <div className="min-h-[200px] max-h-[500px] p-6 pt-10 text-[11px] overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-foreground flex items-center gap-1.5 mb-2 text-xs font-medium">
                      {isRunning ? (
                        <Loader className="size-3 animate-spin text-primary" />
                      ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full ring-2 ring-green-500/20" />
                      )}
                      <span className="text-muted-foreground">Console</span>
                    </div>
                    {logs}
                    {isRunning && (
                      <div className="ml-3 animate-pulse text-primary">▊</div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    {isRunning ? (
                      <div className="flex items-center gap-2">
                        <Loader className="size-4 animate-spin" />
                        <span>Executing code...</span>
                      </div>
                    ) : (
                      <span>No output</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function CodeFallback() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-1/6" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
