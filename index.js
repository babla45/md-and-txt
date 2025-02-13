const SUPABASE_URL = 'https://rdnulnsfxbyrfjjbexfy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbnVsbnNmeGJ5cmZqamJleGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTc5NDMsImV4cCI6MjA1NDg3Mzk0M30.BQd7rtzL23BpC45DPDuUVUaNejDfwXwDaML3WKhTcUc'

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Configure marked for GitHub-style markdown
marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    langPrefix: 'hljs language-',
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return code;
    }
});

let allFiles = []; // Store all files for searching
let isSubsequenceMode = true; // Add at the top with other variables
let currentViewingFile = null; // Add this at the top with other variables

async function loadFiles() {
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .list('', {
            sortBy: { column: 'created_at', order: 'desc' }
        })

    if (error) {
        console.error('Error loading files:', error)
        return
    }

    allFiles = data; // Store files for searching
    displayFiles(data);
}

function displayFiles(files) {
    const fileGrid = document.getElementById('fileGrid')
    fileGrid.innerHTML = files.map(file => {
        const indexNum = String((file.originalIndex || files.indexOf(file)) + 1).padStart(2, '0');
        return `
        <div class="col">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${file.name}</h5>
                        <span class="badge bg-secondary">#${indexNum}</span>
                    </div>
                    <p class="card-text text-truncate">${file.name}</p>
                    <button class="btn btn-primary btn-sm" onclick="viewFile('${file.name}')">View More</button>
                </div>
            </div>
        </div>
    `}).join('')

    document.getElementById('fileViewer').style.display = 'none'
}

// Add this helper function
function isSubsequence(searchStr, fullStr) {
    if (!searchStr) return true;
    let searchIndex = 0;
    for (let i = 0; i < fullStr.length && searchIndex < searchStr.length; i++) {
        if (searchStr[searchIndex].toLowerCase() === fullStr[i].toLowerCase()) {
            searchIndex++;
        }
    }
    return searchIndex === searchStr.length;
}

function toggleSearchMode() {
    isSubsequenceMode = !isSubsequenceMode;
    const btn = document.getElementById('searchModeBtn');
    btn.innerHTML = `<i class="bi bi-arrow-left-right"></i> ${isSubsequenceMode ? 'Subsequence' : 'Substring'}`;
    handleSearch(); // Refresh search results
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const resetBtn = document.getElementById('resetSearchBtn');
    const searchTerm = searchInput.value.toLowerCase();
    
    resetBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    
    const filteredFiles = allFiles.map((file, index) => ({ file, originalIndex: index }))
        .filter(({ file, originalIndex }) => {
            const indexNum = String(originalIndex + 1).padStart(2, '0');
            const indexStr = `#${indexNum}`;
            
            if (isSubsequenceMode) {
                return isSubsequence(searchTerm, file.name.toLowerCase()) || 
                       isSubsequence(searchTerm, indexStr.toLowerCase());
            } else {
                return file.name.toLowerCase().includes(searchTerm) || 
                       indexStr.toLowerCase().includes(searchTerm);
            }
        })
        .map(({ file, originalIndex }) => ({
            ...file,
            originalIndex
        }));

    displayFiles(filteredFiles);
}

function resetSearch() {
    const searchInput = document.getElementById('searchInput');
    const resetBtn = document.getElementById('resetSearchBtn');
    
    searchInput.value = '';
    resetBtn.style.display = 'none';
    displayFiles(allFiles);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function viewFile(fileName) {
    currentViewingFile = fileName; // Store the current file being viewed
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .download(fileName)

    if (error) {
        console.error('Error loading file:', error)
        return
    }

    const text = await data.text()
    const fileViewer = document.getElementById('fileViewer')
    const fileTitle = document.getElementById('fileTitle')
    const fileContent = document.getElementById('fileContent')

    fileTitle.textContent = fileName
    if (fileName.endsWith('.md')) {
        // Update markdown and syntax styles based on current theme before rendering
        const isDark = document.body.classList.contains('dark-mode');
        document.getElementById('markdown-style').href = 
            `https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown${isDark ? '-dark' : ''}.min.css`;
        document.getElementById('highlight-style').href = 
            `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github${isDark ? '-dark' : ''}.min.css`;

        // Store raw content for copying
        fileContent.setAttribute('data-raw-content', text);
        fileContent.innerHTML = marked.parse(text)
        // Initialize syntax highlighting
        fileContent.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } else {
        // For text files, escape HTML before displaying
        fileContent.innerHTML = `<pre>${escapeHtml(text)}</pre>`
    }
    fileViewer.style.display = 'block'
    fileViewer.scrollIntoView({ behavior: 'smooth' })
}

async function copyContent() {
    const content = document.getElementById('fileContent');
    let textToCopy;
    
    // If it's markdown, get the raw text from the data attribute
    if (content.hasAttribute('data-raw-content')) {
        textToCopy = content.getAttribute('data-raw-content');
    } else {
        // For text files, get the content from pre tag
        textToCopy = content.textContent;
    }

    try {
        await navigator.clipboard.writeText(textToCopy);
        const copyBtn = document.querySelector('#fileViewer .btn-outline-primary');
        const originalHtml = copyBtn.innerHTML;
        
        // Show success feedback
        copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        copyBtn.classList.add('btn-success');
        copyBtn.classList.remove('btn-outline-primary');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-outline-primary');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy content');
    }
}

function hideFileViewer() {
    document.getElementById('fileViewer').style.display = 'none'
    
    // Find the card of the file that was being viewed
    if (currentViewingFile) {
        const files = document.querySelectorAll('.card');
        files.forEach(card => {
            if (card.querySelector('.card-title').textContent === currentViewingFile) {
                // Remove highlight from all cards first
                document.querySelectorAll('.card.highlight').forEach(c => c.classList.remove('highlight'));
                
                // Scroll first, then add highlight
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add highlight after scrolling
                setTimeout(() => {
                    card.classList.add('highlight');
                    // Remove highlight after animation
                    setTimeout(() => {
                        card.classList.remove('highlight');
                    }, 2000);
                }, 500); // Wait for scroll to complete
            }
        });
        currentViewingFile = null;
    }
}

document.addEventListener('DOMContentLoaded', loadFiles)
