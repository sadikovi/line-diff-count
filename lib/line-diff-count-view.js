'use babel';

import { CompositeDisposable } from 'atom';

export default class LineDiffCountView {

  constructor(statusBar) {
    // Create root element
    const element = document.createElement('div');
    element.classList.add('line-diff-count', 'inline-block');

    // Create message element
    const message = document.createElement('span');
    message.textContent = 'The LineDiffCount package is Alive! It\'s ALIVE!';
    message.classList.add('message');
    element.appendChild(message);

    this.tile = statusBar.addRightTile({
      item: element,
      priority: -500
    });

    console.log(this.tile);

    // Create subscriptions
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'line-diff-count:toggle': () => this.toggle()
    }));
  }

  toggle() {
    const style = this.tile.item.style.display;
    this.tile.item.style.display = style === 'none' ? '' : 'none';
  }

  // Tear down any state and detach
  destroy() {
    this.tile.destroy();
    this.tile = null;
    this.subscriptions.dispose();
  }
}
