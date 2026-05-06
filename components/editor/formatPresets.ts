export type FormatKey = "post_square" | "post_portrait" | "story" | "reel" | "linkedin_article" | "x_post";

export const FORMAT_PRESETS: Record<FormatKey, { label: string; shortLabel: string }> = {
  post_square: { label: "Square Post (1:1)", shortLabel: "1:1 Post" },
  post_portrait: { label: "Portrait Post (4:5)", shortLabel: "4:5 Post" },
  story: { label: "Story (9:16)", shortLabel: "Story" },
  reel: { label: "Reel / Short (9:16)", shortLabel: "Reel" },
  linkedin_article: { label: "LinkedIn Article", shortLabel: "Article" },
  x_post: { label: "X / Twitter Post", shortLabel: "X Post" },
};
