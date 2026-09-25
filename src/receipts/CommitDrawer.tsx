import { useEffect, useId, useRef } from "react";
import { commitUrl, type LedgerCommit, type LedgerRepo } from "./ledger";
import { int, shortDate } from "../lib/format";
import { useCommitBody } from "./useCommitBody";
import { reflowMessage } from "./message";
import styles from "./Receipts.module.css";

// One commit, in full: the subject, the message body from its shard, the
// numbers, and the link to the same commit on GitHub. A native <dialog>, so
// Escape, the backdrop, the focus trap and focus return are the browser's.
export default function CommitDrawer({
  commit,
  repo,
  onClose,
  onFilterRepo,
}: {
  commit: LedgerCommit | null;
  repo: LedgerRepo | undefined;
  onClose: () => void;
  onFilterRepo: (repo: string) => void;
}) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement | null>(null);
  const { state, retry } = useCommitBody(commit);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (commit && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!commit && dialog.open) {
      dialog.close();
    }
  }, [commit]);

  const close = () => {
    const dialog = ref.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      onClose();
    }
  };

  const url = commit ? commitUrl(repo, commit) : null;
  const time = commit
    ? `${commit.date.slice(11, 16)} ${commit.date.slice(19) || "Z"}`
    : "";

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby={`${uid}-title`}
      onClose={onClose}
    >
      {commit ? (
        <div className={styles.drawerInner}>
          <header className={styles.drawerHead}>
            <p className={styles.drawerEyebrow}>
              <span>{commit.repo}</span>
              <span aria-hidden="true"> · </span>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {commit.sha}
                </a>
              ) : (
                <span>{commit.sha}</span>
              )}
            </p>
            <h2 id={`${uid}-title`} className={styles.drawerTitle}>
              {commit.subject}
            </h2>
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <dl className={styles.drawerMeta}>
            <div>
              <dt>Date</dt>
              <dd>
                {shortDate(commit.date)} · {time}
              </dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>
                {commit.author}
                {commit.coAuthors.length
                  ? ` · with ${commit.coAuthors.join(", ")}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>
                {commit.merge ? (
                  "merge commit"
                ) : (
                  <>
                    <span className={styles.pos}>
                      +{int(commit.additions ?? 0)}
                    </span>{" "}
                    <span className={styles.neg}>
                      −{int(commit.deletions ?? 0)}
                    </span>
                    {commit.files !== null
                      ? ` · ${int(commit.files)} ${commit.files === 1 ? "file" : "files"}`
                      : ""}
                  </>
                )}
              </dd>
            </div>
          </dl>
          <section
            className={styles.drawerBody}
            aria-labelledby={`${uid}-message`}
          >
            <h3 id={`${uid}-message`} className={styles.drawerH3}>
              Message
            </h3>
            {state.status === "loading" ? (
              <p className={styles.quiet} role="status">
                Loading the message…
              </p>
            ) : state.status === "ready" ? (
              <div className={styles.message}>
                {reflowMessage(state.body).map((block, i) =>
                  block.kind === "paragraph" ? (
                    <p key={i}>{block.text}</p>
                  ) : (
                    <pre key={i}>{block.text}</pre>
                  ),
                )}
              </div>
            ) : state.status === "error" ? (
              <p className={styles.quiet} role="status">
                The message could not be loaded.{" "}
                <button
                  type="button"
                  className={styles.linkish}
                  onClick={retry}
                >
                  Try again
                </button>
              </p>
            ) : (
              <p className={styles.quiet}>No message beyond the subject.</p>
            )}
          </section>
          {commit.checked ? (
            <section
              className={styles.checked}
              aria-labelledby={`${uid}-checked`}
            >
              <h3 id={`${uid}-checked`} className={styles.drawerH3}>
                Checked
              </h3>
              <p>{commit.checked}</p>
            </section>
          ) : null}
          <footer className={styles.drawerFoot}>
            {url ? (
              <a
                className={styles.primaryLink}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            ) : null}
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => {
                onFilterRepo(commit.repo);
                close();
              }}
            >
              Only {commit.repo}
            </button>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
}
