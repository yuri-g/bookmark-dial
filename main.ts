/*
* @todo:
* 1) add icons
* 2) Improve performance: avoid too many renders, reduce amount of GC calls, avoid doing too much stuff in the loop
* 2) improve styles
* 3) clean-up this file
*/

async function fetchBookmarks() {
  return browser.bookmarks.getTree();
}

const bookmarksContainer = document.getElementById('bookmarks-container');

function handleFolderClick(bookmark, parent = null) {
  return async () => {
    const children = await browser.bookmarks.getChildren(bookmark.id);

    renderBookmarks(children, parent);

    browser.storage.local.set({
      lastFolderId: bookmark.id
    });
  };
}

function renderBookmarks(bookmarks, parent = null) {
  // @todo fetch children here?
  while (bookmarksContainer.firstChild) {
    bookmarksContainer.removeChild(bookmarksContainer.firstChild);
  }

  if (parent !== null) {
      const folder = document.createElement('a');

      folder.setAttribute('class', 'bookmark-folder');
      folder.textContent = '..';
      folder.addEventListener('click', async () => {
        const parentChildren = await browser.bookmarks.getChildren(parent.id);

        browser.storage.local.set({
          lastFolderId: parent.id
        });
        renderBookmarks(parentChildren, parent);
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
  browser.storage.local.get('lastFolderId').then(async (result) => {
    if (typeof result.lastFolderId === 'undefined') {
      const [root] = await fetchBookmarks();
      if (typeof root === 'undefined') {
        return;
      }

      renderBookmarks(root.children, root);
    } else {
      const bookmarkFolder = await browser.bookmarks.get(result.lastFolderId);

      if (bookmarkFolder.length > 0) {
        const children = await browser.bookmarks.getChildren(bookmarkFolder[0].id);
        if (bookmarkFolder[0].parentId) {
          const parent = await browser.bookmarks.get(bookmarkFolder[0].parentId);
          renderBookmarks(children, parent[0]);
        } else {
          renderBookmarks(children);
        }
      }
    }
  });

  return;
})();
