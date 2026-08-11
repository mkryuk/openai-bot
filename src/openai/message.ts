export interface Message {
  [key: string]: any;
  role?: string;
  content?:
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
  type?: string;
  id?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
  status?: string;
}
