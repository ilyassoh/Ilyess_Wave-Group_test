$(document).ready(function() {
    // Fetch fact of the day
    $.ajax({
        url: 'http://numbersapi.com/1/30/date?json',
        method: 'GET',
        success: function(response) {
            $('#fact-content').text(response.text);
        },
        error: function() {
            $('#fact-content').text('Did you know? Regular exercise can improve your mood and reduce symptoms of depression and anxiety.');
        }
    });

    // Test server connection
    $.ajax({
        url: 'http://localhost:5000/test',
        method: 'GET',
        success: function(response) {
            console.log('Server test successful:', response);
        },
        error: function(xhr, status, error) {
            console.error('Server test failed:', error);
        }
    });

    // Handle file drop zone
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0d6efd';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (!files || files.length === 0) {
            alert('Please select at least one file to upload');
            return;
        }

        const formData = new FormData();
        let hasValidFiles = false;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                formData.append('images', file);
                hasValidFiles = true;
            } else {
                console.warn('Skipping non-image file:', file.name);
            }
        }

        if (!hasValidFiles) {
            alert('Please select valid image files (JPEG, PNG, GIF)');
            return;
        }

        // Show loading state
        dropZone.style.opacity = '0.5';

        // Send files to server
        $.ajax({
            url: 'http://localhost:5000/upload',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Upload success:', response);
                alert('Images uploaded successfully!');
                dropZone.style.opacity = '1';
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', {
                    status: xhr.status,
                    error: error,
                    response: xhr.responseText
                });
                alert('Error uploading images: ' + (xhr.responseJSON?.message || error));
                dropZone.style.opacity = '1';
            }
        });
    }
});