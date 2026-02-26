/**
 * EmojiPicker - Emoji selection component using emoji-mart
 *
 * A wrapper component around emoji-mart picker with theme support.
 *
 * @example
 * ```tsx
 * <EmojiPicker onEmojiSelect={(emoji) => console.log(emoji)} />
 * ```
 */

import * as React from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

export interface Emoji {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

export interface EmojiPickerProps {
  /**
   * Callback when an emoji is selected
   */
  onEmojiSelect?: (emoji: Emoji) => void;
  /**
   * Theme mode
   * @default 'auto'
   */
  theme?: "auto" | "light" | "dark";
  /**
   * Locale for emoji names
   * @default 'en'
   */
  locale?: string;
  /**
   * Number of emojis per row
   * @default 9
   */
  perLine?: number;
  /**
   * Show preview of selected emoji
   * @default false
   */
  preview?: boolean;
  /**
   * Show search input
   * @default true
   */
  searchPosition?: "sticky" | "static" | "none";
  /**
   * Show skin tone selector
   * @default true
   */
  skinTonePosition?: "preview" | "search" | "none";
  /**
   * Maximum frequently used emojis
   * @default 16
   */
  maxFrequentRows?: number;
}

/**
 * EmojiPicker component
 */
export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  theme = "auto",
  locale = "en",
  perLine = 9,
  preview = false,
  searchPosition = "sticky",
  skinTonePosition = "search",
  maxFrequentRows = 4,
}) => {
  return (
    <Picker
      data={data}
      onEmojiSelect={onEmojiSelect}
      theme={theme}
      locale={locale}
      perLine={perLine}
      previewPosition={preview ? "bottom" : "none"}
      searchPosition={searchPosition}
      skinTonePosition={skinTonePosition}
      maxFrequentRows={maxFrequentRows}
      navPosition="bottom"
      set="native"
    />
  );
};

EmojiPicker.displayName = "EmojiPicker";
