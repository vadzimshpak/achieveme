"use client";

import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import styles from "./blocknote.module.css";

type BlockNoteViewerProps = {
  content: unknown;
};

export function BlockNoteViewer({ content }: BlockNoteViewerProps) {
  const blocks = (Array.isArray(content) ? content : []) as PartialBlock[];

  const editor = useCreateBlockNote({
    initialContent: blocks.length > 0 ? blocks : [{ type: "paragraph", content: "" }],
  });

  return (
    <div className={styles["blocknote-viewer"]}>
      <BlockNoteViewRaw editor={editor} editable={false} theme="dark" />
    </div>
  );
}
