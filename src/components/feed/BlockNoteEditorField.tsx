"use client";

import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import styles from "./blocknote.module.css";

type BlockNoteEditorFieldProps = {
  onChange: (json: string) => void;
};

export function BlockNoteEditorField({ onChange }: BlockNoteEditorFieldProps) {
  const editor = useCreateBlockNote({
    initialContent: [{ type: "paragraph", content: "" }] as PartialBlock[],
  });

  return (
    <div className={styles["blocknote-editor"]}>
      <BlockNoteViewRaw
        editor={editor}
        theme="dark"
        onChange={() => onChange(JSON.stringify(editor.document))}
      />
    </div>
  );
}
