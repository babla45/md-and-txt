# MD/TXT File Viewer

This project is a web application for viewing and managing Markdown and text files using Supabase. It includes a file viewer with dark mode support and an admin panel for uploading, editing, and deleting files.

## Features

- View Markdown and text files with GitHub-style formatting
- Toggle between light and dark modes
- Search for files by name
- Copy file content to clipboard
- Admin panel for managing files (upload, edit, delete)
- Responsive design for mobile and desktop

## Technologies Used

- HTML, CSS, JavaScript
- Bootstrap for styling
- Supabase for storage and authentication
- Marked.js for Markdown rendering
- Highlight.js for syntax highlighting

## Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/babla45/md-and-txt.git
    cd md-and-txt
    ```

2. Open the project in your preferred code editor.

3. Update the Supabase credentials in `index.js` and `admin.js`:


4. Open `index.html` and `admin.html` in your web browser to view and manage files.

## Usage

### Viewing Files

1. Open `index.html` in your web browser.
2. Use the search box to find files by name.
3. Click "View More" to view the content of a file.
4. Use the "Copy" button to copy the file content to the clipboard.
5. Toggle between light and dark modes using the "Dark Mode" button.

### Managing Files

1. Open `admin.html` in your web browser.
2. Click "Add New File" to upload a new file.
3. Click "Edit" to edit an existing file.
4. Click "Delete" to delete a file.
5. Toggle between light and dark modes using the "Toggle Dark Mode" button.


## Acknowledgements

- [Supabase](https://supabase.io/) for providing the backend storage and authentication
- [Marked.js](https://marked.js.org/) for Markdown rendering
- [Highlight.js](https://highlightjs.org/) for syntax highlighting
- [Bootstrap](https://getbootstrap.com/) for styling