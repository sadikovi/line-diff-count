'use babel';

import LineDiffCountView from './line-diff-count-view';

export default {
  activate(state) { },

  deactivate() {
    if (this.lineDiffCountView) {
      this.lineDiffCountView.destroy();
    }
  },

  consumeStatusBar(statusBar) {
    this.lineDiffCountView = new LineDiffCountView(statusBar);
  }
};
