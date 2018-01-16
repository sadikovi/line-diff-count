'use babel';

import { CompositeDisposable } from 'atom';

export default class LineDiffCountView {

  constructor() {
    this.watchedEditors = new WeakSet();
    this.subscriptions = new CompositeDisposable();

    atom.workspace.onDidChangeActivePaneItem(() => {
      this.updateDiff();
    })
  }

  registerEditor(editor) {
    if (this.watchedEditors.has(editor)) return;
    this.watchedEditors.add(editor);
    editor.onDidDestroy(() => {
      this.watchedEditors.delete(editor);
    });

    this.subscriptions.add(editor.onDidStopChanging(() => {
      this.updateDiff();
    }));
    this.subscriptions.add(editor.onDidChangePath(() => {
      this.updateDiff();
    }));

    const editorView = atom.views.getView(editor);
    this.subscriptions.add(editorView.onDidAttach(() => {
      this.updateDiff();
    }));
  }

  setStatusBar(statusBar) {
    this.addTile(statusBar);
    this.updateDiff();
  }

  addTile(statusBar) {
    // create root element
    this.lineDiff = document.createElement('div');
    this.lineDiff.classList.add('line-diff-count', 'inline-block');
    // create icon
    this.lineDiffIcon = document.createElement('span');
    this.lineDiffIcon.classList.add('icon');
    this.lineDiff.appendChild(this.lineDiffIcon);
    // create label
    this.lineDiffLabel = document.createElement('span');
    this.lineDiffLabel.classList.add('line-diff-label');
    this.lineDiff.appendChild(this.lineDiffLabel);

    this.tile = statusBar.addRightTile({
      item: this.lineDiff,
      priority: -1
    });
  }

  updateDiff() {
    console.log("update diff");
  }

  toggle() {
    const style = this.lineDiff.style.display;
    this.lineDiff.style.display = style === 'none' ? '' : 'none';
  }

  // Tear down any state and detach
  destroy() {
    if (this.tile) {
      this.tile.destroy();
      this.tile = null;
    }
    this.watchedEditors = null;
  }
}
