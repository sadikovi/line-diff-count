'use babel';

import { CompositeDisposable } from 'atom';

export default class LineDiffCountView {

  constructor() {
    this.watchedEditors = new WeakSet();
    this.subscriptions = new CompositeDisposable();

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
      this.watchedEditors.delete(editor);
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

  updateDiff(path) {
    // resolve current file and repository
    var repo = this.repositoryForPath(path);
    // clean up classes for both icon and label
    this.lineDiffIcon.classList.remove('icon-diff-modified', 'status-modified', 'icon-diff-added',
    'status-added', 'icon-diff-ignored', 'status-ignored');
    this.lineDiffLabel.classList.remove('status-modified', 'status-added', 'status-ignored');
    // modified status of the current file
    const status = (repo) ? repo.getCachedPathStatus(path) : 0;

    if (repo && repo.isStatusModified(status)) {
      this.lineDiffIcon.classList.add('icon-diff-modified', 'status-modified');
      this.lineDiffLabel.classList.add('status-modified');
      const stats = repo.getDiffStats(path);

      if (stats.added && stats.deleted) {
        this.lineDiffLabel.textContent = `+${stats.added}, -${stats.deleted}`;
      } else if (stats.added) {
        this.lineDiffLabel.textContent = `+${stats.added}`;
      } else if (stats.deleted) {
        this.lineDiffLabel.textContent = `-${stats.deleted}`;
      } else {
        this.lineDiffLabel.textContent = '';
      }
      this.lineDiff.style.display = '';
    } else if (repo && repo.isStatusNew(status)) {
      this.lineDiffIcon.classList.add('icon-diff-added', 'status-added');
      this.lineDiffLabel.classList.add('status-added');
      const textEditor = atom.workspace.getActiveTextEditor();
      if (textEditor) {
        this.lineDiffLabel.textContent = `+${textEditor.getLineCount()}`;
      } else {
        this.lineDiffLabel.textContent = '';
      }
      this.lineDiff.style.display = '';
    } else if (repo && repo.isPathIgnored(path)) {
      this.lineDiffIcon.classList.add('icon-diff-ignored', 'status-ignored');
      this.lineDiffLabel.classList.add('status-ignored');
      this.lineDiffLabel.textContent = '';
      this.lineDiff.style.display = '';
    } else {
      this.lineDiff.style.display = 'none';
    }
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
    if (this.subscriptions) {
      this.subscriptions.dispose();
      this.subscriptions = null;
    }
    this.watchedEditors = null;
  }
}
