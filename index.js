const SUPABASE_URL = 'https://rdnulnsfxbyrfjjbexfy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbnVsbnNmeGJ5cmZqamJleGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTc5NDMsImV4cCI6MjA1NDg3Mzk0M30.BQd7rtzL23BpC45DPDuUVUaNejDfwXwDaML3WKhTcUc'

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function loadFiles() {
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .list('')

    if (error) {
        console.error('Error loading files:', error)
        return
    }

    const fileGrid = document.getElementById('fileGrid')
    fileGrid.innerHTML = data.map(file => `
        <div class="col">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${file.name}</h5>
                    <p class="card-text text-truncate">${file.name}</p>
                    <button class="btn btn-primary btn-sm" onclick="viewFile('${file.name}')">View More</button>
                </div>
            </div>
        </div>
    `).join('')

    // Hide file viewer on initial load
    document.getElementById('fileViewer').style.display = 'none'
}

async function viewFile(fileName) {
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
    fileContent.innerHTML = fileName.endsWith('.md') ? marked.parse(text) : `<pre>${text}</pre>`
    fileViewer.style.display = 'block'

    // Scroll to the file viewer
    fileViewer.scrollIntoView({ behavior: 'smooth' })
}

function hideFileViewer() {
    document.getElementById('fileViewer').style.display = 'none'
}

document.addEventListener('DOMContentLoaded', loadFiles)
