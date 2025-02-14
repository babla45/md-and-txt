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
    const fileGrid = document.getElementById('fileGrid');
    fileGrid.innerHTML = files.map(file => {
        const indexNum = String((file.originalIndex || files.indexOf(file)) + 1).padStart(2, '0');
        const fileType = file.name.split('.').pop().toLowerCase();
        
        // Define color schemes for different file types
        const colorScheme = fileType === 'md' 
            ? 'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-blue-200/50 dark:border-blue-900/50'
            : 'from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-200/50 dark:border-purple-900/50';
        
        const iconClass = fileType === 'md' ? 'bi-markdown-fill' : 'bi-file-text-fill';
        const iconColor = fileType === 'md' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
        
        return `
            <div class="group w-full" onclick="viewFile('${file.name}')">
                <div class="relative h-full p-5 lg:p-4 bg-gradient-to-br ${colorScheme} backdrop-blur-sm border dark:border-opacity-20 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]">
                    <div class="flex items-start gap-4 lg:gap-3">
                        <div class="flex-shrink-0 w-12 h-12 sm:h-[40px]  lg:w-10 lg:h-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm">
                            <i class="bi ${iconClass} text-xl lg:text-xl ${iconColor}"></i>
                        </div>
                        <div class="min-w-0 flex-1 flex flex-col">
                            <div class="flex items-start justify-between gap-3">
                                <h5 class="text-lg sm:text-4xl lg:text-xl font-medium text-gray-900 dark:text-white leading-6 break-all line-clamp-2" title="${file.name}">
                                    ${file.name}
                                </h5>
                                <span class="flex-shrink-0 inline-flex sm:text-2xl sm:p-4 p-5 h-6 lg:h-5 items-center px-3 lg:px-2 rounded-full text-sm lg:text-xs font-medium bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 shadow-sm whitespace-nowrap">
                                    #${indexNum}
                                </span>
                            </div>
                            <p class="text-base lg:text-xs text-gray-600 dark:text-gray-400 mt-2 lg:mt-1">
                                ${fileType.toUpperCase()} file
                            </p>
                        </div>
                    </div>
                    <div class="absolute inset-0 rounded-xl bg-white/50 dark:bg-gray-800/50 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('fileViewer').style.display = 'none';
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
    
    resetBtn.classList.toggle('hidden', searchTerm.length === 0);
    
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
    resetBtn.classList.add('hidden');
    displayFiles(allFiles);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function viewFile(fileName) {
    currentViewingFile = fileName;
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .download(fileName);

    if (error) {
        console.error('Error loading file:', error)
        return
    }

    const text = await data.text()
    const fileViewer = document.getElementById('fileViewer')
    const fileTitle = document.getElementById('fileTitle')
    const fileContent = document.getElementById('fileContent')

    // Find the index number for this file
    const fileIndex = allFiles.findIndex(f => f.name === fileName);
    const indexNum = String(fileIndex + 1).padStart(2, '0');
    
    // Update title with index
    fileTitle.textContent = `#${indexNum} ${fileName}`;

    if (fileName.endsWith('.md')) {
        // Update markdown and syntax styles based on current theme before rendering
        const isDark = document.documentElement.classList.contains('dark');
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
    document.getElementById('fileViewer').style.display = 'none';
    
    if (currentViewingFile) {
        // Find the card with the matching filename
        const cards = document.querySelectorAll('.group');
        cards.forEach(card => {
            // Update selector to match the new card structure
            const cardTitle = card.querySelector('.text-lg, .text-base');
            if (cardTitle && cardTitle.textContent.trim() === currentViewingFile) {
                // Remove highlight from all cards
                document.querySelectorAll('.group').forEach(c => {
                    c.classList.remove('highlight', 'scroll-reveal');
                    // Remove any existing highlight styles
                    c.querySelector('.relative').style.borderColor = '';
                });
                
                // Add highlight effect to the clicked card
                const cardContent = card.querySelector('.relative');
                const originalBorder = cardContent.style.border;
                
                // Apply highlight
                cardContent.style.borderWidth = '2px';
                cardContent.style.borderColor = '#0ea5e9';
                
                // Scroll to card with animation
                card.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
                
                // Add animations after scrolling
                setTimeout(() => {
                    card.classList.add('scroll-reveal');
                    
                    // Remove highlight after animation
                    setTimeout(() => {
                        cardContent.style.border = originalBorder;
                    }, 2000);
                }, 500);
            }
        });
        currentViewingFile = null;
    }
}

// Add these functions at the top of index.js
function encrypt(s, f) {
    var strArr = s.split('');
    var sum;

    function process() {
        sum = strArr.length;
        for (var i = 0; i < strArr.length; i++) {
            sum += strArr[i].charCodeAt(0);
            sum %= 128;
            var c = Math.max(37, sum);
            var newChar = strArr[i].charCodeAt(0) ^ c;
            if (newChar <= 33) {
                newChar += 32;
            } else {
                newChar--;
            }
            strArr[i] = String.fromCharCode(newChar);
        }
    }

    while (f-- > 0) {
        process();
    }

    return strArr.join('');
}

function promptPassword() {
    const password = prompt("Enter admin password:");
    if (encrypt(password, 57) === '-?=') {
        localStorage.setItem('adminAuth', 'true');
        window.location.href = 'admin.html';
    } else {
        alert('Invalid password');
    }
}

// Update the toggleDarkMode function
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = !html.classList.contains('dark');
    
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    
    // Update markdown and syntax styles
    document.getElementById('markdown-style').href = 
        `https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown${isDark ? '-dark' : ''}.min.css`;
    document.getElementById('highlight-style').href = 
        `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github${isDark ? '-dark' : ''}.min.css`;

    // Update dark mode button icon and text
    const darkModeBtn = document.querySelector('[onclick="toggleDarkMode()"]');
    if (darkModeBtn) {
        const icon = darkModeBtn.querySelector('i');
        const span = darkModeBtn.querySelector('span');
        if (icon) icon.className = isDark ? 'bi bi-sun-fill mr-2' : 'bi bi-moon-fill mr-2';
        if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }

    // Re-highlight code blocks if file viewer is open
    if (document.getElementById('fileViewer').style.display !== 'none') {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode based on system preference or stored setting
    const html = document.documentElement;
    const darkModeStored = localStorage.getItem('darkMode');
    
    if (darkModeStored === null) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            html.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        }
    } else if (darkModeStored === 'true') {
        html.classList.add('dark');
    }
    
    // Update button state
    const darkModeBtn = document.querySelector('[onclick="toggleDarkMode()"]');
    if (darkModeBtn) {
        const isDark = html.classList.contains('dark');
        const icon = darkModeBtn.querySelector('i');
        const span = darkModeBtn.querySelector('span');
        if (icon) icon.className = isDark ? 'bi bi-sun-fill mr-2' : 'bi bi-moon-fill mr-2';
        if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }

    // Load files
    loadFiles();
});
