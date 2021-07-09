async function fetchBookmarks() {
  return browser.bookmarks.getTree();
}

const bookmarksContainer = document.getElementById('bookmarks-container');

function handleFolderClick(bookmark, parent = null) {
  return () => {
    renderBookmarks(bookmark.children, parent);
  };
}

function renderBookmarks(bookmarks, parent = null) {
  while (bookmarksContainer.firstChild) {
    bookmarksContainer.removeChild(bookmarksContainer.firstChild);
  }

  console.log('parent!', parent);
  if (parent !== null) {
      const folder = document.createElement('a');

      folder.setAttribute('class', 'bookmark-folder');
      folder.textContent = '..';
      folder.addEventListener('click', () => {
        renderBookmarks(parent.children, parent);
      });
      bookmarksContainer.appendChild(folder);
  }

  for (bookmark of bookmarks) {
    if (bookmark.type === 'folder') {
      (() => {
        const folder = document.createElement('a');

        folder.id = bookmark.id;
        folder.classList.add('bookmark-folder');
        folder.setAttribute('data-id', bookmark.id);
        folder.textContent = bookmark.title;
        bookmarksContainer.appendChild(folder);

        folder.addEventListener('click', handleFolderClick(bookmark, parent));
      })();
    } else {
      const el = document.createElement('a');

      el.classList.add('bookmark-item');
      el.textContent = bookmark.title;
      el.setAttribute('href', bookmark.url);

      bookmarksContainer.appendChild(el);
    }
  }
}

(async () => {
  const [root] = await fetchBookmarks();
  if (typeof root === 'undefined') {
    return;
  }

  renderBookmarks(root.children, root);
})();
