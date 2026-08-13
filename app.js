const API =
    "https://personal-arkhayv-api.personal-arkhayv-api.workers.dev";

let currentPath = "";

const fileList = document.getElementById("fileList");
const breadcrumb = document.getElementById("breadcrumb");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");


// ============================================
// LOAD DIRECTORY
// ============================================

async function loadDirectory(path = "") {
    currentPath = path;

    fileList.innerHTML = `
        <div class="loading">Loading...</div>
    `;

    try {
        const endpoint = path
            ? `${API}/api/list?path=${encodeURIComponent(path)}`
            : `${API}/api/list`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const files = await response.json();

        renderBreadcrumb(path);
        renderFiles(files);

    } catch (error) {
        console.error(error);

        fileList.innerHTML = `
            <div class="error">
                Failed to load archive.
            </div>
        `;
    }
}


// ============================================
// BREADCRUMB
// ============================================

function renderBreadcrumb(path) {

    if (!path) {
        breadcrumb.innerHTML = `
            <span class="breadcrumb-current">
                📁 /
            </span>
        `;
        return;
    }

    const parts = path.split("/");

    let html = `
        <span
            class="breadcrumb-link"
            onclick="loadDirectory('')"
        >
            📁 /
        </span>
    `;

    let accumulated = "";

    for (const part of parts) {

        accumulated +=
            (accumulated ? "/" : "") + part;

        const currentPath = accumulated;

        html += `
            <span class="breadcrumb-separator">/</span>

            <span
                class="breadcrumb-link"
                onclick="loadDirectory('${escapeHtmlAttribute(currentPath)}')"
            >
                ${escapeHtml(part)}
            </span>
        `;
    }

    breadcrumb.innerHTML = html;
}


// ============================================
// RENDER FILES
// ============================================

function renderFiles(files) {

    if (!files.length) {
        fileList.innerHTML = `
            <div class="empty">
                This directory is empty.
            </div>
        `;
        return;
    }

    // Directories first, files second
    files.sort((a, b) => {

        if (a.type === "dir" && b.type !== "dir") {
            return -1;
        }

        if (a.type !== "dir" && b.type === "dir") {
            return 1;
        }

        return a.name.localeCompare(
            b.name,
            undefined,
            { numeric: true }
        );
    });

    fileList.innerHTML = "";

    for (const file of files) {

        const row = document.createElement("div");

        row.className =
            file.type === "dir"
                ? "file-row directory"
                : "file-row";

        const icon =
            file.type === "dir"
                ? "📁"
                : getFileIcon(file.name);

        row.innerHTML = `
            <div class="file-icon">
                ${icon}
            </div>

            <div class="file-name">
                ${escapeHtml(file.name)}
            </div>

            <div class="file-size">
                ${
                    file.type === "file"
                        ? formatSize(file.size)
                        : ""
                }
            </div>
        `;

        row.addEventListener("click", () => {

            if (file.type === "dir") {
                loadDirectory(file.path);
            } else {
                openFile(file.path);
            }

        });

        fileList.appendChild(row);
    }
}


// ============================================
// OPEN / DOWNLOAD FILE
// ============================================

function openFile(path) {

    const url =
        `${API}/api/file?path=${encodeURIComponent(path)}`;

    window.open(url, "_blank");
}


// ============================================
// UPLOAD
// ============================================

uploadButton.addEventListener("click", () => {
    fileInput.click();
});


fileInput.addEventListener("change", async () => {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    try {

        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";


        // Read file

        const buffer =
            await file.arrayBuffer();

        const bytes =
            new Uint8Array(buffer);


        // Convert to Base64

        let binary = "";

        const chunkSize = 0x8000;

        for (
            let i = 0;
            i < bytes.length;
            i += chunkSize
        ) {

            binary += String.fromCharCode(
                ...bytes.subarray(
                    i,
                    i + chunkSize
                )
            );
        }

        const content =
            btoa(binary);


        // Create path

        const uploadPath =
            currentPath
                ? `${currentPath}/${file.name}`
                : file.name;


        // Upload

        const response =
            await fetch(
                `${API}/api/upload`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        path: uploadPath,
                        content
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                `HTTP ${response.status}`
            );
        }


        alert(
            `Uploaded successfully:\n${uploadPath}`
        );


        fileInput.value = "";


        // Refresh current directory

        await loadDirectory(currentPath);


    } catch (error) {

        console.error(error);

        alert(
            `Upload failed:\n${error.message}`
        );

    } finally {

        uploadButton.disabled = false;
        uploadButton.textContent = "+ Add File";
    }
});


// ============================================
// FILE ICONS
// ============================================

function getFileIcon(filename) {

    const extension =
        filename
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf") {
        return "📕";
    }

    if (extension === "md") {
        return "📝";
    }

    if (extension === "txt") {
        return "📄";
    }

    if (
        [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp",
            "svg"
        ].includes(extension)
    ) {
        return "🖼️";
    }

    if (
        [
            "zip",
            "tar",
            "gz"
        ].includes(extension)
    ) {
        return "📦";
    }

    return "📄";
}


// ============================================
// FORMAT FILE SIZE
// ============================================

function formatSize(bytes) {

    if (!bytes) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        (
            bytes /
            Math.pow(1024, index)
        ).toFixed(
            index === 0 ? 0 : 1
        )
        + " "
        + units[index]
    );
}


// ============================================
// HTML ESCAPING
// ============================================

function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeHtmlAttribute(value) {

    return value
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}


// ============================================
// START something
// ============================================

loadDirectory();