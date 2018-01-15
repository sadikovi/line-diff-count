'use babel';

import { CompositeDisposable } from 'atom';

export default class LineDiffCountView {

  constructor(statusBar) {
    // Create root element
    this.lineDiff = document.createElement('div');
    this.lineDiff.classList.add('line-diff-count', 'inline-block');
    // create icon
    this.lineDiffIcon = document.createElement('span');
    this.lineDiffIcon.classList.add('icon');
    this.lineDiff.appendChild(this.lineDiffIcon);

    this.tile = statusBar.addRightTile({
      item: this.lineDiff,
      priority: -1
    });

    // Create subscriptions
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'line-diff-count:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(() => {
      this.subscribeToActiveItem()
    }));
    this.subscribeToActiveItem();
  }

  getActiveItemPath() {
    const item = this.getActiveItem();
    return (item && item.getPath) ? item.getPath() : null;
  }

  getActiveItem() {
    return atom.workspace.getActivePaneItem();
  }

  getRepositoryForActiveItem() {
    const rootDir = atom.project.relativizePath(this.getActiveItemPath())[0];
    console.log(rootDir);
    rootDirIndex = atom.project.getPaths().indexOf(rootDir);
    return atom.project.getRepositories()[rootDirIndex];
  }

  updateStatus() {
    // resolve current file and repository
    var path = this.getActiveItemPath();
    var repo = this.getRepositoryForActiveItem();
    console.log(path, repo);
    // modified status of the current file
    const status = (repo) ? repo.getCachedPathStatus(path) : 0;
    if (repo && repo.isStatusModified(status)) {
      this.lineDiffIcon.classList.add('icon-diff-modified', 'status-modified');
      const stats = repo.getDiffStats(path);

      if (stats.added && stats.deleted) {
        this.lineDiffIcon.textContent = `+${stats.added}, -${stats.deleted}`;
      } else if (stats.added) {
        this.lineDiffIcon.textContent = `+${stats.added}`;
      } else if (stats.deleted) {
        this.lineDiffIcon.textContent = `-${stats.deleted}`;
      } else {
        this.lineDiffIcon.textContent = '';
      }
      this.lineDiff.style.display = '';
    } else if (repo && repo.isStatusNew(status)) {
      this.lineDiffIcon.classList.add('icon-diff-added', 'status-added');
      const textEditor = atom.workspace.getActiveTextEditor();
      if (textEditor) {
        this.lineDiffIcon.textContent = `+${textEditor.getLineCount()}`;
      } else {
        this.lineDiffIcon.textContent = '';
      }
      this.lineDiff.style.display = '';
    } else if (repo && repo.isPathIgnored(path)) {
      this.lineDiffIcon.classList.add('icon-diff-ignored', 'status-ignored');
      this.lineDiffIcon.textContent = '';
      this.lineDiff.style.display = '';
    } else {
      this.lineDiff.style.display = 'none';
    }
  }

  subscribeToActiveItem() {
    const item = this.getActiveItem();
    if (this.savedSubscription) {
      this.savedSubscription.dispose();
    }
    if (item && item.onDidSave) {
      this.savedSubscription = item.onDidSave(() => this.updateStatus());
    }
    this.updateStatus();
  }

  toggle() {
    // no-op for now
  }

  // Tear down any state and detach
  destroy() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    if (this.savedSubscription) {
      this.savedSubscription.dispose();
    }
    if (this.tile) {
      this.tile.destroy();
      this.tile = null;
    }
  }
}
