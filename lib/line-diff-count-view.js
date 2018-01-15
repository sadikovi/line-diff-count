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
    // create label
    this.lineDiffLabel = document.createElement('span');
    this.lineDiffLabel.classList.add('line-diff-label');
    this.lineDiff.appendChild(this.lineDiffLabel);

    this.tile = statusBar.addRightTile({
      item: this.lineDiff,
      priority: -1
    });

    // Create subscriptions
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'line-diff-count:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
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
    rootDirIndex = atom.project.getPaths().indexOf(rootDir);
    return atom.project.getRepositories()[rootDirIndex];
  }

  updateStatus() {
    // resolve current file and repository
    var path = this.getActiveItemPath();
    var repo = this.getRepositoryForActiveItem();
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
    const style = this.lineDiff.style.display;
    this.lineDiff.style.display = style === 'none' ? '' : 'none';
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
