# SimpleCart

SimpleCart is a clean, mobile-first grocery list Progressive Web App built with plain HTML, CSS, and JavaScript. It stores data in `localStorage`, works offline after the first load, and can be installed on a phone.

## Features

- Add, edit, delete, and check off grocery items
- Create and manage store-specific grocery lists
- Rename and delete stores
- Switch between stores from the top of the app
- See saved foods grouped under their stores in the main list
- Collapse and expand store sections
- Re-add an existing food to uncross it instead of making a duplicate
- Save user-created foods as reusable quick-add buttons
- Edit saved foods to remove chips from the quick-add picker
- Optional quantity and category fields
- Category grouping with default grocery categories
- Last bought date when an item is checked off
- Copy a text-message-friendly list with store headers and category icons
- Checked-off items remain visible in copied text with long strike bars
- Search/filter
- Uncheck all completed items for the current store
- Unchecked-first sorting
- Offline support through a service worker
- Installable PWA manifest

## Run Locally

Because service workers require `http://`, run the app from a local web server instead of opening `index.html` directly.

With Python:

```bash
python -m http.server 8000
