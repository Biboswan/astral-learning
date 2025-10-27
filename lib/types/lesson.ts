export type Visual = {
  block_id: number;
  imageData: string;
  type: string;
};

export type Lesson = {
  id: string;
  title: string;
  outline: string;
  status: "generating" | "generated_content" | "generated" | "failed";
  created_at: string;
  js_code?: string;
  ts_code?: string;
  visuals?: Visual[];
};