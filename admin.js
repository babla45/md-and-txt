const SUPABASE_URL = 'https://rdnulnsfxbyrfjjbexfy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbnVsbnNmeGJ5cmZqamJleGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTc5NDMsImV4cCI6MjA1NDg3Mzk0M30.BQd7rtzL23BpC45DPDuUVUaNejDfwXwDaML3WKhTcUc'

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showNewFileForm() {
    document.getElementById('fileForm').style.display = 'block'
}

function hideNewFileForm() {
    document.getElementById('fileForm').style.display = 'none'
}

async function loadFiles() {
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .list('')

    if (error) {
        console.error('Error loading files:', error)
        return
    }

    const filesList = document.getElementById('filesList')
    filesList.innerHTML = data.map(file => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${file.name}</h5>
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="editFile('${file.name}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteFile('${file.name}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('')
}

async function editFile(fileName) {
    const { data, error } = await supabaseClient
        .storage
        .from('mdtxt')
        .download(fileName)

    if (error) {
        console.error('Error downloading file:', error)
        return
    }

    const content = await data.text()
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
        if (oldFileName && oldFileName !== fileName) {
            const { error: deleteError } = await supabaseClient
                .storage
                .from('mdtxt')
                .remove([oldFileName])
                
            if (deleteError) {
                throw new Error('Failed to delete old file: ' + deleteError.message)
            }
        }

        const blob = new Blob([content], { 
            type: type === 'md' ? 'text/markdown' : 'text/plain' 
        })

        const { error: uploadError } = await supabaseClient
            .storage
            .from('mdtxt')
            .upload(fileName, blob, {
                upsert: true
            })

        if (uploadError) {
            throw new Error('Failed to save file: ' + uploadError.message)
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

        const { error } = await supabaseClient
            .storage
            .from('mdtxt')
            .remove([fileName])

        if (error) {
            throw new Error('Failed to delete file: ' + error.message)
        }

        await loadFiles()
        alert('File deleted successfully!')
    } catch (error) {
        console.error('Error:', error)
        alert(error.message)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFiles()
    document.getElementById('newFileForm').addEventListener('submit', saveFile)
})
