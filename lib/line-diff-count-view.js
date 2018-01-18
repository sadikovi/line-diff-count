'use babel';

import { CompositeDisposable } from 'atom';

export default class LineDiffCountView {

  constructor() {
    this.watchedEditors = new WeakSet();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'line-diff-count:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(() => {
      this.updateDiff(this.getActiveItemPath());
    }));

    this.subscriptions.add(atom.workspace.onDidOpen((event) => {
      this.updateDiff(event.uri);
    }));
  }

  registerEditor(editor) {
    if (this.watchedEditors.has(editor)) return;
    this.watchedEditors.add(editor);
    editor.onDidDestroy(() => {
      if (this.watchedEditors) {
        this.watchedEditors.delete(editor);
      }
    });

    this.subscriptions.add(editor.onDidSave((event) => {
      this.updateDiff(event.path);
    }));
    this.subscriptions.add(editor.onDidChangePath(() => {
      this.updateDiff(editor.getPath());
      this.subscribeToRepository(editor);
    }));
    this.subscribeToRepository(editor);
  }

  subscribeToRepository(editor) {
    const repo = this.repositoryForPath(editor.getPath());
    if (repo) {
      this.subscriptions.add(repo.onDidChangeStatuses(() => {
        this.updateDiff(editor.getPath());
      }));
      this.subscriptions.add(repo.onDidChangeStatus((changedPath) => {
        this.updateDiff(changedPath.path);
      }));
    }
  }

  setStatusBar(statusBar) {
    this.addTile(statusBar);
    this.updateDiff(this.getActiveItemPath());
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

  getActiveItemPath() {
    const item = this.getActiveItem();
    return (item && item.getPath) ? item.getPath() : null;
  }

  getActiveItem() {
    return atom.workspace.getActivePaneItem();
  }

  repositoryForPath(path) {
    const rootDir = atom.project.relativizePath(path)[0];
    rootDirIndex = atom.project.getPaths().indexOf(rootDir);
    return atom.project.getRepositories()[rootDirIndex];
  }

  clearDiff() {
    // clean up classes for both icon and label
    this.lineDiffIcon.classList.remove(
      'icon-diff-modified', 'status-modified',
      'icon-diff-added', 'status-added',
      'icon-diff-removed', 'status-removed',
      'icon-diff-ignored', 'status-ignored');
    this.lineDiffLabel.classList.remove(
      'status-modified', 'status-added', 'status-removed', 'status-ignored');
    this.lineDiffLabel.textContent = '';
  }

  markAdded(label) {
    this.lineDiffIcon.classList.add('icon-diff-added', 'status-added');
    this.lineDiffLabel.classList.add('status-added');
    this.lineDiffLabel.textContent = label;
  }

  markRemoved(label) {
    this.lineDiffIcon.classList.add('icon-diff-removed', 'status-removed');
    this.lineDiffLabel.classList.add('status-removed');
    this.lineDiffLabel.textContent = label;
  }

  markModified(label) {
    this.lineDiffIcon.classList.add('icon-diff-modified', 'status-modified');
    this.lineDiffLabel.classList.add('status-modified');
    this.lineDiffLabel.textContent = label;
  }

  markIgnored() {
    this.lineDiffIcon.classList.add('icon-diff-ignored', 'status-ignored');
    this.lineDiffLabel.classList.add('status-ignored');
    this.lineDiffLabel.textContent = '';
  }

  updateDiff(path) {
    // resolve current file and repository
    var repo = this.repositoryForPath(path);
    this.clearDiff();
    // modified status of the current file
    const status = (repo) ? repo.getCachedPathStatus(path) : 0;

    if (repo && repo.isStatusModified(status)) {
      const stats = repo.getDiffStats(path);
      if (stats.added && stats.deleted) {
        this.markModified(`+${stats.added}, -${stats.deleted}`);
      } else if (stats.added) {
        this.markAdded(`+${stats.added}`);
      } else if (stats.deleted) {
        this.markRemoved(`-${stats.deleted}`);
      } else {
        // should not happen, but if it does, mark as modified
        this.markModified('');
      }
    } else if (repo && repo.isStatusNew(status)) {
      const textEditor = atom.workspace.getActiveTextEditor();
      this.markAdded((textEditor) ? `+${textEditor.getLineCount()}` : '');
    } else if (repo && repo.isPathIgnored(path)) {
      this.markIgnored();
    } else {
      this.markIgnored();
    }
  }

  visible() {
    return this.lineDiff.style.display != 'none';
  }

  show() {
    this.lineDiff.style.display = '';
  }

  hide() {
    this.lineDiff.style.display = 'none';
  }

  toggle() {
    if (this.visible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Tear down any state and detach
  destroy() {
    if (this.tile) {
      this.tile.destroy();
      this.tile = null;
    }
    if (this.subscriptions) {
      this.subscriptions.dispose();
      this.subscriptions = null;
    }
    this.watchedEditors = null;
  }
}
