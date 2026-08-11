export function responseText(text: string | null) {
  return {
    data: {
      output_text: text,
      output:
        text === null
          ? []
          : [{ type: "message", content: [{ type: "output_text", text }] }],
    },
  };
}

export function responseFunctionCall(
  callId: string,
  name: string,
  args: Record<string, unknown> | string,
) {
  return {
    data: {
      output: [
        {
          type: "function_call",
          call_id: callId,
          name,
          arguments: typeof args === "string" ? args : JSON.stringify(args),
          status: "completed",
        },
      ],
    },
  };
}
