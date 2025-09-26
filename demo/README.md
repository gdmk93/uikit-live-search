# UIkit Live Search Demo

Demo for the `uikit-live-search` component with [UIkit](https://getuikit.com) and [Leaf PHP](https://leafphp.dev).

## Prerequisites
- PHP >= 7.4
- [Composer](https://getcomposer.org)

## Setup
1. Clone the repo:
   ```bash
   git clone https://github.com/gdmk93/uikit-live-search.git
   cd uikit-live-search/demo
   ```

2. Install PHP dependencies (`composer.json` included):
   ```bash
   composer install
   ```

3. Run the Leaf PHP server:
   ```bash
   leaf serve
   ```

4. Open `http://localhost:5500` in your browser.

## How It Works
To understand the implementation, check the following files:
- `header.blade.php`: Contains the navbar with the live search form.
- `search.blade.php`: Handles the search results and tab filtering.
- `index.php`: Implements the backend logic for search and routing.