/**
 * A real code editor (CodeMirror 6) for lessons and coding assignments:
 * syntax colours, line numbers, auto-closing tags, autocomplete, bracket
 * matching. It is loaded on demand so it never weighs down other pages.
 */

export interface EditorHandle {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  destroy(): void;
}

export interface MountOptions {
  parent: HTMLElement;
  value: string;
  language: "html" | "css";
  onChange: (value: string) => void;
  /** Accessible name announced by screen readers. */
  label?: string;
}

export async function mountEditor(opts: MountOptions): Promise<EditorHandle> {
  const [{ EditorView, basicSetup }, { EditorState }, { html }, { css }, { oneDark }] = await Promise.all([
    import("codemirror"),
    import("@codemirror/state"),
    import("@codemirror/lang-html"),
    import("@codemirror/lang-css"),
    import("@codemirror/theme-one-dark"),
  ]);

  const dark = document.documentElement.classList.contains("dark");
  let silent = false; // setValue() must not echo back into onChange

  const view = new EditorView({
    parent: opts.parent,
    state: EditorState.create({
      doc: opts.value,
      extensions: [
        basicSetup,
        opts.language === "html" ? html({ autoCloseTags: true }) : css(),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": opts.label ?? "Code editor", spellcheck: "false", autocapitalize: "off" }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px", ...(dark ? {} : { backgroundColor: "hsl(var(--card))" }) },
          "&.cm-focused": { outline: "2px solid hsl(var(--primary) / 0.45)", outlineOffset: "-2px" },
          ".cm-scroller": {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
            lineHeight: "1.6",
            overflow: "auto",
          },
          ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "hsl(var(--muted-foreground))" },
        }),
        ...(dark ? [oneDark] : []),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && !silent) opts.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });

  return {
    getValue: () => view.state.doc.toString(),
    setValue: (value) => {
      silent = true;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
      silent = false;
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
