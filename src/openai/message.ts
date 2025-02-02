export interface Message {
  role: string;
  content:
    | string
    | [
        {
          type: "text";
          text: string;
        },
        {
          type: "image_url";
          image_url: {
            url: string;
          };
        },
      ];
  tool_call_id?: string;
}
