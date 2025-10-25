export type Lesson = {
  id: string;
  title: string;
  outline: string;
  status: "generating" | "generated" | "failed";
  created_at: string;
  js_code?: string;
  ts_code?: string;
};