'use babel';

import LineDiffCountView from './line-diff-count-view';

export default {
  activate(state) {
    this.lineDiffCountView = new LineDiffCountView();
    atom.workspace.observeTextEditors((editor) => {
      if (this.lineDiffCountView) {
        this.lineDiffCountView.registerEditor(editor);
      }
    });
  },

  deactivate() {
    if (this.lineDiffCountView) {
      this.lineDiffCountView.destroy();
      this.lineDiffCountView = null;
    }
  },

  consumeStatusBar(statusBar) {
    if (this.lineDiffCountView) {
      this.lineDiffCountView.setStatusBar(statusBar);
    }
  }
};
