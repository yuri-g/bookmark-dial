(() => {
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // main.ts
  var require_main = __commonJS({
    "main.ts"(exports) {
      function fetchBookmarks() {
        return __async(this, null, function* () {
          return browser.bookmarks.getTree();
        });
      }
      var bookmarksContainer = document.getElementById("bookmarks-container");
      function handleFolderClick(bookmark2, parent = null) {
        return () => __async(this, null, function* () {
          const children = yield browser.bookmarks.getChildren(bookmark2.id);
          renderBookmarks(children, parent);
          browser.storage.local.set({
            lastFolderId: bookmark2.id
          });
        });
      }
      function renderBookmarks(bookmarks, parent = null) {
        while (bookmarksContainer.firstChild) {
          bookmarksContainer.removeChild(bookmarksContainer.firstChild);
        }
        if (parent !== null) {
          const folder = document.createElement("a");
          folder.setAttribute("class", "bookmark-folder");
          folder.textContent = "..";
          folder.addEventListener("click", () => __async(this, null, function* () {
            const parentChildren = yield browser.bookmarks.getChildren(parent.id);
            browser.storage.local.set({
              lastFolderId: parent.id
            });
            renderBookmarks(parentChildren, parent);
          }));
          bookmarksContainer.appendChild(folder);
        }
        for (bookmark of bookmarks) {
          if (bookmark.type === "folder") {
            (() => {
              const folder = document.createElement("a");
              folder.id = bookmark.id;
              folder.classList.add("bookmark-folder");
              folder.setAttribute("data-id", bookmark.id);
              folder.textContent = bookmark.title;
              bookmarksContainer.appendChild(folder);
              folder.addEventListener("click", handleFolderClick(bookmark, parent));
            })();
          } else {
            const el = document.createElement("a");
            el.classList.add("bookmark-item");
            el.textContent = bookmark.title;
            el.setAttribute("href", bookmark.url);
            bookmarksContainer.appendChild(el);
          }
        }
      }
      (() => __async(exports, null, function* () {
        browser.storage.local.get("lastFolderId").then((result) => __async(exports, null, function* () {
          if (typeof result.lastFolderId === "undefined") {
            const [root] = yield fetchBookmarks();
            if (typeof root === "undefined") {
              return;
            }
            renderBookmarks(root.children, root);
          } else {
            const bookmarkFolder = yield browser.bookmarks.get(result.lastFolderId);
            if (bookmarkFolder.length > 0) {
              const children = yield browser.bookmarks.getChildren(bookmarkFolder[0].id);
              if (bookmarkFolder[0].parentId) {
                const parent = yield browser.bookmarks.get(bookmarkFolder[0].parentId);
                renderBookmarks(children, parent[0]);
              } else {
                renderBookmarks(children);
              }
            }
          }
        }));
        return;
      }))();
    }
  });
  require_main();
})();
