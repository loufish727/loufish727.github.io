# SimpleCart

SimpleCart is a clean, mobile-first grocery list Progressive Web App built with plain HTML, CSS, and JavaScript. It stores items in `localStorage`, works offline after the first load, and can be installed on a phone.

## Features

- Add grocery items
- Mark items as complete
- Edit items
- Delete items
- Optional quantity and category fields
- Categories: Produce, Meat, Dairy, Frozen, Pantry, Drinks, Household, Other
- Group items by category
- Search/filter items
- Quick-add common groceries
- Copy a text-message-friendly checklist with `☐` and `☑` markers
- Clear completed items
- Unchecked-first sorting
- Smooth add/remove/check animations
- Saves data in `localStorage`
- Offline support through a service worker
- Installable PWA manifest
- Mobile-friendly, touch-friendly design

## Run Locally

Because service workers require `http://`, run the app from a local web server instead of opening `index.html` directly.

With Python:

```bash
python -m http.server 8000
