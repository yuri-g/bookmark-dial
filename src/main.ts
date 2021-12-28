/*
* @todo:
* 1) Improve performance: avoid too many renders, reduce amount of GC calls, avoid doing too much stuff in the loop
* 2) clean-up this file
*/
type BookmarkTreeNode = browser.bookmarks.BookmarkTreeNode;

const itemClasses = [
  'max-w-sm',
  'flex-none',
  'w-16',
  'h-28',
  'max-h-28',
];
const iconClasses = [
  'icon',
  'h-16',
  'max-h-16',
  'w-16',
  'shadow-md',
  'bg-white',
  'rounded-lg',
];
const textClasses = [
  'text',
  'box-border',
  'break-words',
  'text-center',
  'inline-block',
  'mt-2',
  'h-10',
  'p-1.5',
  'max-h-12',
  'text-xs',
  'w-16',
  'line-clamp-2',
  'overflow-hidden'
];

const bookmarksContainer = document.getElementById('bookmarks-container');
const folderNameContainer = document.getElementById('folder-name');
if (bookmarksContainer === null || folderNameContainer === null) {
  throw new Error('Bookmarks container element is missing!');
}

(async (container: HTMLElement, folderNameContainer: HTMLElement) => {
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

      folder.setAttribute('class', 'bookmark-folder flex-none');
      const icon = document.createElement('div');
      const text = document.createElement('div');
      icon.classList.add('icon');
      text.classList.add('text');

      text.textContent = currentFolder.title;
      folder.append(icon, text);

      folder.addEventListener('click', async () => {
        const parentChildren = await browser.bookmarks.getChildren(parent.id);

        browser.storage.local.set({
          lastFolderId: parent.id
        });
        const parentOfParent = await getParent(parent);

        renderBookmarks(parent, parentChildren, parentOfParent);
      });

      folderNameContainer.appendChild(folder);
    }

    for (let bookmark of bookmarks) {
      if (bookmark.type === 'folder') {
        (() => {
          const folder = document.createElement('div');
          const icon = document.createElement('div');
          const text = document.createElement('div');

          icon.classList.add(...iconClasses);
          text.classList.add(...textClasses);

          folder.id = bookmark.id;
          folder.classList.add('bookmark-folder', ...itemClasses);
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

          el.classList.add('bookmark-item', ...itemClasses);
          icon.classList.add(...iconClasses);
          icon.textContent = bookmark.title.substring(0, 1);
          text.classList.add(...textClasses);
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
})(bookmarksContainer, folderNameContainer);
