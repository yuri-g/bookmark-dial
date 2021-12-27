/*
* @todo:
* 1) add icons
* 2) Improve performance: avoid too many renders, reduce amount of GC calls, avoid doing too much stuff in the loop
* 2) improve styles
* 3) clean-up this file
*/
type BookmarkTreeNode = browser.bookmarks.BookmarkTreeNode;

const bookmarksContainer = document.getElementById('bookmarks-container');
if (bookmarksContainer === null) {
  throw new Error('Bookmarks container element is missing!');
}

(async (container: HTMLElement) => {
  async function fetchBookmarks(): Promise<BookmarkTreeNode[]> {
    return browser.bookmarks.getTree();
  }

  function handleFolderClick(bookmark: BookmarkTreeNode, parent: BookmarkTreeNode | null = null) {
    return async () => {
      const children = await browser.bookmarks.getChildren(bookmark.id);

      renderBookmarks(bookmark, children, parent);

      browser.storage.local.set({
        lastFolderId: bookmark.id
      });
    };
  }

  async function getParent(node: BookmarkTreeNode): Promise<BookmarkTreeNode | null> {
    if (typeof node.parentId === 'undefined') {
      return null;
    }

    const [parent] = await browser.bookmarks.get(node.parentId);

    return parent;
  }

  /**
  * @todo Pass only currentFolder??
  */
  function renderBookmarks(
    currentFolder: BookmarkTreeNode,
    bookmarks: BookmarkTreeNode[],
    parent: BookmarkTreeNode | null = null
  ) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (parent !== null) {
      const folder = document.createElement('a');

      folder.setAttribute('class', 'bookmark-folder');
      const icon = document.createElement('div');
      const text = document.createElement('div');
      icon.classList.add('icon');
      text.classList.add('text');

      text.textContent = '..';
      folder.append(icon, text);

      folder.addEventListener('click', async () => {
        const parentChildren = await browser.bookmarks.getChildren(parent.id);

        browser.storage.local.set({
          lastFolderId: parent.id
        });
        const parentOfParent = await getParent(parent);

        renderBookmarks(parent, parentChildren, parentOfParent);
      });
      container.appendChild(folder);
    }

    for (let bookmark of bookmarks) {
      if (bookmark.type === 'folder') {
        (() => {
          const folder = document.createElement('div');
          const icon = document.createElement('div');
          const text = document.createElement('div');

          icon.classList.add('icon');
          text.classList.add('text');

          folder.id = bookmark.id;
          folder.classList.add('bookmark-folder');
          text.textContent = bookmark.title;
          folder.append(icon, text);

          container.appendChild(folder);

          folder.addEventListener('click', handleFolderClick(bookmark, currentFolder));
        })();
      } else {
        (() => {
          const el = document.createElement('div');

          const icon = document.createElement('div');
          const text = document.createElement('a');

          el.classList.add('bookmark-item');
          icon.classList.add('icon');
          text.classList.add('text');
          if (bookmark.url) {
            text.setAttribute('href', bookmark.url);
            text.setAttribute('target', '_blank');
          }
          el.append(icon, text);

          text.textContent = bookmark.title;

          container.appendChild(el);
        })()
      }
    }
  }

  const storedData = await browser.storage.local.get('lastFolderId');

  if (typeof storedData.lastFolderId === 'undefined') {
    const [root] = await fetchBookmarks();
    if (typeof root === 'undefined' || typeof root.children === 'undefined') {
      return;
    }

    renderBookmarks(root, root.children);
  } else {
    const bookmarkFolder = await browser.bookmarks.get(storedData.lastFolderId);

    if (bookmarkFolder.length > 0) {
      const children = await browser.bookmarks.getChildren(bookmarkFolder[0].id);
      if (bookmarkFolder[0].parentId) {
        const parent = await browser.bookmarks.get(bookmarkFolder[0].parentId);
        renderBookmarks(bookmarkFolder[0], children, parent[0]);
      } else {
        renderBookmarks(bookmarkFolder[0], children);
      }
    }
  }
})(bookmarksContainer);
