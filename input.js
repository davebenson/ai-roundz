// Keyboard state: keys.has('ArrowUp') is true while the key is held.
const keys = new Set();
addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => keys.delete(e.code));
