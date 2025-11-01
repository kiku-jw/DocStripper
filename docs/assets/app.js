// DocStripper Web App - File Type Validation and Improved Error Messages
// Function to display error message on UI
// DocStripper Web App - File Type Validation and Improved Error Messages

// ✅ Function to display error message on UI
function showError(message) {
  const uploadArea = document.querySelector('.upload-area');
  const errorDiv = document.createElement('div');
  errorDiv.textContent = message;
  errorDiv.style.color = 'white';
  errorDiv.style.background = 'red';
  errorDiv.style.padding = '10px';
  errorDiv.style.marginTop = '10px';
  errorDiv.style.borderRadius = '5px';
  uploadArea.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 4000); // remove after 4s
}

// ✅ Step 1: Function to handle uploaded files
function processFiles(files) {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxSize = 5 * 1024 * 1024; // 5 MB limit

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      showError(`❌ Unsupported file type "${file.name}". Allowed: TXT, PDF, DOC, DOCX.`);
      return;
    }

    if (file.size > maxSize) {
      showError(`⚠️ The file "${file.name}" is too large. Max 5MB allowed.`);
      return;
    }
  }

  alert("✅ All files are valid and ready to process!");
}

// ✅ Step 2: Listen for file input changes
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('#fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      processFiles(event.target.files);
    });
  } else {
    console.error("⚠️ File input element not found in HTML.");
  }
});



