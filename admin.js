let allFiles = []; // Add this at the top with other variables
let isSubsequenceMode = true; // Add at the top with other variables
let currentViewingFile = null;

function showNewFileForm() {
    document.getElementById('fileForm').style.display = 'block'
}

function hideNewFileForm() {
    document.getElementById('fileForm').style.display = 'none'
}

async function importFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const statusEl = document.getElementById('importStatus');
    const total = fileList.length;
    let imported = 0;
    let failed = 0;

    statusEl.textContent = `Importing 0/${total}...`;

    for (const file of fileList) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'md' && ext !== 'txt') {
            failed++;
            continue;
        }

        try {
            const content = await file.text();
            await db.collection('files').add({
                name: file.name,
                content: content,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            imported++;
            statusEl.textContent = `Importing ${imported}/${total}...`;
        } catch (err) {
            console.error(`Failed to import ${file.name}:`, err);
            failed++;
        }
    }

    // Reset file input so the same files can be re-selected
    document.getElementById('importFileInput').value = '';

    const msg = `Imported ${imported} file${imported !== 1 ? 's' : ''}` +
        (failed > 0 ? `, ${failed} failed` : '');
    statusEl.textContent = msg;
    setTimeout(() => { statusEl.textContent = ''; }, 4000);

    if (imported > 0) await loadFiles();
}

async function loadFiles() {
    try {
        const snapshot = await db.collection('files').orderBy('created_at', 'desc').get();
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            content: doc.data().content,
            created_at: doc.data().created_at
        }));

        allFiles = data;
        displayFiles(data);
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

function displayFiles(files) {
    const filesList = document.getElementById('filesList')
    filesList.innerHTML = files.map(file => {
        const indexNum = String((file.originalIndex || files.indexOf(file)) + 1).padStart(2, '0');
        return `
        <div class="col">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title" title="${file.name}">#${indexNum} ${file.name}</h5>
                    </div>
                    <p class="card-text text-muted small">${file.name.split('.').pop().toUpperCase()} file</p>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-success me-1" onclick="viewFile('${file.name}')">View</button>
                        <button class="btnedit" onclick="editFile('${file.name}')">Edit</button>
                        <button class="btndel" onclick="deleteFile('${file.name}')">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('')
}

async function editFile(fileName) {
    const fileData = allFiles.find(f => f.name === fileName);
    if (!fileData) {
        console.error('File not found:', fileName);
        return;
    }

    const content = fileData.content;
    const fileNameParts = fileName.split('.')
    const title = fileNameParts.slice(0, -1).join('.')
    const type = fileNameParts.pop()

    document.getElementById('fileTitle').value = title
    document.getElementById('fileType').value = type
    document.getElementById('fileContent').value = content
    document.getElementById('oldFileName').value = fileName

    showNewFileForm()
}

async function saveFile(event) {
    event.preventDefault()
    
    const title = document.getElementById('fileTitle').value
    const content = document.getElementById('fileContent').value
    const type = document.getElementById('fileType').value
    const fileName = `${title}.${type}`
    const oldFileName = document.getElementById('oldFileName').value

    try {
        if (oldFileName) {
            // Editing existing file
            const existingFile = allFiles.find(f => f.name === oldFileName);
            if (existingFile) {
                if (oldFileName !== fileName) {
                    // Name changed: delete old doc and create new one
                    await db.collection('files').doc(existingFile.id).delete();
                    await db.collection('files').add({
                        name: fileName,
                        content: content,
                        created_at: existingFile.created_at || firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Same name: just update content
                    await db.collection('files').doc(existingFile.id).update({
                        content: content
                    });
                }
            }
        } else {
            // New file
            await db.collection('files').add({
                name: fileName,
                content: content,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        hideNewFileForm()
        document.getElementById('oldFileName').value = ''
        event.target.reset()
        await loadFiles()
        alert('File saved successfully!')
    } catch (error) {
        console.error('Error:', error)
        alert(error.message)
    }
}

async function deleteFile(fileName) {
    try {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return
        }

        const fileData = allFiles.find(f => f.name === fileName);
        if (!fileData) {
            throw new Error('File not found');
        }

        await db.collection('files').doc(fileData.id).delete();

        await loadFiles()
        alert('File deleted successfully!')
    } catch (error) {
        console.error('Error:', error)
        alert(error.message)
    }
}

// Add these new functions
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
    
    // Filter files while preserving original indices
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
    currentViewingFile = fileName; // Store current file
    
    // Show file viewer with loading indicator
    const fileViewer = document.getElementById('fileViewer');
    const fileTitle = document.getElementById('viewerFileTitle');
    const fileContent = document.getElementById('viewerFileContent');
    
    // Set initial loading state
    fileTitle.textContent = `Loading ${fileName}...`;
    fileContent.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading file content...</p>
        </div>
    `;
    fileViewer.style.display = 'block';
    fileViewer.scrollIntoView({ behavior: 'smooth' });
    
    try {
        const fileData = allFiles.find(f => f.name === fileName);
        if (!fileData) {
            throw new Error('File not found');
        }

        const text = fileData.content;
        
        // Find the index number for this file
        const fileIndex = allFiles.findIndex(f => f.name === fileName);
        const indexNum = String(fileIndex + 1).padStart(2, '0');
        
        // Update title with index
        fileTitle.textContent = `#${indexNum} ${fileName}`;

        if (fileName.endsWith('.md')) {
            // Store raw content for copying
            fileContent.setAttribute('data-raw-content', text);
            fileContent.innerHTML = marked.parse(text);
            // Initialize syntax highlighting
            fileContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            // For text files, escape HTML before displaying
            fileContent.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
        }
    } catch (error) {
        console.error('Error loading file:', error);
        
        // Show error message in the file viewer
        fileTitle.textContent = `Error Loading: ${fileName}`;
        fileContent.innerHTML = `
            <div class="alert alert-danger m-4">
                <h5><i class="bi bi-exclamation-triangle-fill me-2"></i>Failed to load file</h5>
                <p class="mb-0">There was a problem loading this file. This could be due to a network issue or the file may no longer exist.</p>
                <p class="text-muted mt-2 mb-0"><small>Error details: ${error.message || 'Unknown error'}</small></p>
            </div>
        `;
    }
}

async function copyContent() {
    const content = document.getElementById('viewerFileContent');
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
        const copyBtn = document.querySelector('#fileViewer .btn-primary');
        const originalHtml = copyBtn.innerHTML;
        
        // Show success feedback
        copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy content');
    }
}

function hideFileViewer() {
    document.getElementById('fileViewer').style.display = 'none'
    
    if (currentViewingFile) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const cardTitle = card.querySelector('.card-title');
            if (cardTitle && cardTitle.title === currentViewingFile) {
                // Remove highlight from all cards
                document.querySelectorAll('.card').forEach(c => {
                    c.classList.remove('highlight');
                });
                
                // Scroll to card with animation
                card.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
                
                // Add highlight animation
                card.classList.add('highlight');
                
                // Remove highlight after animation completes
                setTimeout(() => {
                    card.classList.remove('highlight');
                }, 2000);
            }
        });
        currentViewingFile = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFiles()
    document.getElementById('newFileForm').addEventListener('submit', saveFile)
})
