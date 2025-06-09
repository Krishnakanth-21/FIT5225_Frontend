  // ---- API URLs ----
  const uploadApiUrl = "https://4s174z2r46.execute-api.us-east-1.amazonaws.com/generate-presigned-url";  // Upload API
  const apiUrl = "https://04vlnhc6i3.execute-api.us-east-1.amazonaws.com/prod/search";  // Species search API
  const thumbnailApiUrl = "https://mfvniqw58g.execute-api.us-east-1.amazonaws.com/prod/find-img-by-thumbnail";  // Thumbnail API
  const deleteApiUrl = "https://qc68zfsvgd.execute-api.us-east-1.amazonaws.com/prod";  // Delete API
  const manualTagApiUrl = "https://88qk34ioua.execute-api.us-east-1.amazonaws.com/manual-tag-update";  // Manual Tagging API

  // ---- Cognito Logout URL ----

  const cognitoDomain = "https://us-east-1qyxfw0qnc.auth.us-east-1.amazoncognito.com";  
  const clientId = "6ppd5q6cs5dpl2tih71272kgi5";  
  const logoutRedirectUrl = "https://us-east-1qyxfw0qnc.auth.us-east-1.amazoncognito.com/login?client_id=6ppd5q6cs5dpl2tih71272kgi5&response_type=code&scope=email+openid+phone+profile&redirect_uri=https%3A%2F%2Fkrishnakanth-21.github.io%2FFIT5225_Frontend%2Fupload.html";  

  function logout() {
    const logoutUrl = "https://us-east-1qyxfw0qnc.auth.us-east-1.amazoncognito.com/login?client_id=6ppd5q6cs5dpl2tih71272kgi5&response_type=code&scope=email+openid+phone+profile&redirect_uri=https%3A%2F%2Fkrishnakanth-21.github.io%2FFIT5225_Frontend%2Fupload.html";
    console.log("Redirecting to logout URL:", logoutUrl);
    window.location.href = logoutUrl;
  }

  // ---- Update Accept Attribute ----
  function updateAcceptAttribute() {
    const fileInput = document.getElementById("fileInput");
    const status = document.getElementById("status");
    const progress = document.getElementById("progress");
    status.innerText = "";
    progress.style.width = "0%";
    document.getElementById("progressBar").style.display = "none";

    const filetype = document.getElementById("filetype").value;
    if (filetype === "image") {
      fileInput.accept = ".jpg";
    } else if (filetype === "video") {
      fileInput.accept = ".mp4";
    } else if (filetype === "audio") {
      fileInput.accept = ".mp3,.wav";
    }
  }

  updateAcceptAttribute();

  // ---- Upload Function ----
  async function upload() {
    const fileInput = document.getElementById("fileInput");
    const filetype = document.getElementById("filetype").value;
    const status = document.getElementById("status");
    const progressBar = document.getElementById("progressBar");
    const progress = document.getElementById("progress");

    status.innerText = "";
    if (!fileInput.files.length) {
      status.innerText = "Please choose a file first.";
      status.style.color = "red";
      return;
    }

    const file = fileInput.files[0];
    const filename = file.name;

    console.log("Uploading file:", filename);

    try {
      const response = await fetch(uploadApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, filetype })
      });

      const data = await response.json();
      console.log("Pre-signed URL Response:", data);

      if (!response.ok) {
        status.innerText = "Failed to get pre-signed URL: " + data.error;
        status.style.color = "red";
        return;
      }

      const uploadUrl = data.upload_url;

      progressBar.style.display = "block";

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          progress.style.width = percent + "%";
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          status.innerText = "Upload successful!";
          status.style.color = "green";
        } else {
          status.innerText = "Upload to S3 failed: " + xhr.status;
          status.style.color = "red";
        }
      };

      xhr.onerror = function () {
        status.innerText = "Upload failed.";
        status.style.color = "red";
      };

      xhr.send(file);
    } catch (error) {
      console.error('Upload Error:', error);
      status.innerText = "Upload failed.";
      status.style.color = "red";
    }
  }

  // ---- Search Function ----
  async function search() {
    const speciesInput = document.getElementById('speciesInput').value.trim();
    const countsInput = document.getElementById('countsInput').value.trim();
    const resultsContainer = document.getElementById('results');

    console.log("Species Input Raw:", speciesInput);
    console.log("Counts Input Raw:", countsInput);

    resultsContainer.innerHTML = '';

    if (!speciesInput) {
      resultsContainer.innerText = 'Please enter species.';
      return;
    }

    const speciesArray = speciesInput.split(',').map(s => s.trim());
    const countsArray = countsInput ? countsInput.split(',').map(c => parseInt(c.trim(), 10)) : [];

    console.log("Parsed Species Array:", speciesArray);
    console.log("Parsed Counts Array:", countsArray);

    const queryBody = {};
    for (let i = 0; i < speciesArray.length; i++) {
      const species = speciesArray[i];
      const count = countsArray[i] || 1;
      queryBody[species] = count;
    }

    console.log("Final Query Body to Send:", queryBody);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      });

      const data = await response.json();
      console.log("Parsed Response JSON:", data);

      if (data.links && data.links.length > 0) {
        data.links.forEach(item => {
          const mediaElement = document.createElement('div');
          mediaElement.style.margin = "10px";

          if (item.type === 'image') {
            mediaElement.innerHTML = `
              <a href="${item.full_url}" target="_blank">
                <img src="${item.thumbnail_url}" style="max-width: 300px; border: 1px solid #ddd; border-radius: 8px;" />
              </a>
            `;
          } else if (item.type === 'video') {
            mediaElement.innerHTML = `
              <a href="${item.url}" download>
                <button style="padding: 10px 20px; margin: 10px; background-color: #28a745; color: white; border: none; border-radius: 8px;">Download Video</button>
              </a>
            `;
          }
          resultsContainer.appendChild(mediaElement);
        });
      } else {
        resultsContainer.innerText = 'No results found.';
      }
    } catch (error) {
      console.error('Search Error:', error);
      resultsContainer.innerText = 'Error fetching results.';
    }
  }

  // ---- Find Full Image by Thumbnail ----
  async function findFullImage() {
    const thumbnailInput = document.getElementById('thumbnailInput').value.trim();
    const resultsContainer = document.getElementById('thumbnailResults');

    resultsContainer.innerHTML = '';

    if (!thumbnailInput) {
      resultsContainer.innerText = 'Please enter a thumbnail URL.';
      return;
    }

    console.log("Thumbnail Input:", thumbnailInput);

    try {
      const response = await fetch(thumbnailApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ thumbnail_url: thumbnailInput })
      });

      const data = await response.json();
      console.log("Thumbnail API Response:", data);

      if (response.ok && data.full_image_url) {
        const fullImageElement = document.createElement('div');
        fullImageElement.innerHTML = `
          <a href="${data.full_image_url}" target="_blank">
            <img src="${data.full_image_url}" style="max-width: 400px; border: 2px solid #007bff; border-radius: 8px;" />
          </a>
        `;
        resultsContainer.appendChild(fullImageElement);
      } else {
        resultsContainer.innerText = data.error || 'No full-size image found.';
      }
    } catch (error) {
      console.error('Thumbnail Search Error:', error);
      resultsContainer.innerText = 'Error fetching full-size image.';
    }
  }

  // ---- Delete Files Function ----
  async function deleteFiles() {
    const deleteUrlsInput = document.getElementById('deleteUrls').value.trim();
    const deleteStatus = document.getElementById('deleteStatus');

    deleteStatus.innerHTML = '';

    if (!deleteUrlsInput) {
      deleteStatus.innerText = 'Please enter URLs to delete.';
      return;
    }

    const urlsArray = deleteUrlsInput.split(',').map(url => url.trim());
    console.log("URLs to Delete:", urlsArray);

    try {
      const response = await fetch(deleteApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls: urlsArray })
      });

      const data = await response.json();
      console.log("Delete API Response:", data);

      if (response.ok && data.deleted) {
        deleteStatus.innerHTML = `<span style="color: green;">Successfully deleted: ${data.deleted.join(', ')}</span>`;
      } else {
        deleteStatus.innerHTML = `<span style="color: red;">Error: ${data.error || 'Failed to delete files.'}</span>`;
      }
    } catch (error) {
      console.error('Delete Files Error:', error);
      deleteStatus.innerText = 'Error deleting files.';
    }
  }

  // ---- Manual Tag Update Function ----
  async function manualTagUpdate() {
    const urlsInput = document.getElementById("tagUrls").value.trim();
    const tagsInput = document.getElementById("tagsInput").value.trim();
    const operation = document.getElementById("operation").value;
    const tagStatus = document.getElementById("taggingStatus");

    if (!urlsInput || !tagsInput) {
      tagStatus.innerText = "Please enter URLs and tags.";
      tagStatus.style.color = "red";
      return;
    }

    const urlArray = urlsInput.split(",").map(url => url.trim());
    const tagsArray = [tagsInput.trim()];

    const payload = {
      url: urlArray,
      operation: parseInt(operation, 10),
      tags: tagsArray
    };

    console.log("Payload for manual tag update:", payload);

    try {
      const response = await fetch(manualTagApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("Manual Tag API Response:", data);

      if (response.ok) {
        tagStatus.innerText = "Tags updated successfully!";
        tagStatus.style.color = "green";
      } else {
        tagStatus.innerText = "Failed to update tags: " + (data.error || "Unknown error");
        tagStatus.style.color = "red";
      }
    } catch (error) {
      console.error("Manual Tag Update Error:", error);
      tagStatus.innerText = "Error updating tags.";
      tagStatus.style.color = "red";
    }
  }
