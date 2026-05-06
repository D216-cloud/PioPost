import { create } from "zustand";

export const platforms = ["Instagram", "LinkedIn", "X", "Facebook"] as const;

export type Platform = (typeof platforms)[number];

interface PostState {
  caption: string;
  activePlatforms: Platform[];
  setCaption: (caption: string) => void;
  togglePlatform: (platform: Platform) => void;
}

export const usePostStore = create<PostState>((set) => ({
  caption: "Launching PinPost today. Preview once, publish everywhere.",
  activePlatforms: [...platforms],
  setCaption: (caption) => set({ caption }),
  togglePlatform: (platform) =>
    set((state) => ({
      activePlatforms: state.activePlatforms.includes(platform)
        ? state.activePlatforms.filter((item) => item !== platform)
        : [...state.activePlatforms, platform],
    })),
}));
