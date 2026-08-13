const API =
    "https://personal-arkhayv-api.personal-arkhayv-api.workers.dev";

let currentPath = "";

const fileList = document.getElementById("fileList");
const breadcrumb = document.getElementById("breadcrumb");

const uploadButton =
    document.getElementById("uploadButton");

const fileInput =
    document.getElementById("fileInput");


// ========================================
// LOAD DIRECTORY
// ========================================

async function loadDirectory(path = "") {
    currentPath = path;

    fileList.innerHTML = "Loading...";

    try {
        const url = path
            ? `${API}/api/list?path=${encodeURIComponent(path)}`
            : `${API}/api/list`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const files = await response.json();

        renderBreadcrumb(path);
        renderFiles(files);

    } catch (error) {
        console.error(error);

        fileList.innerHTML = `
            <div style="padding:24px">
                Failed to load archive.
            </div>
        `;
    }
}


// ========================================
// BREADCRUMB
// ========================================

function renderBreadcrumb(path) {
    if (!path) {
        breadcrumb.innerHTML = "📁 /";
        return;
    }

    const parts = path.split("/");

    let html = `
        <span
            style="cursor:pointer"
            onclick="loadDirectory('')"
        >
            📁 /
        </span>
    `;

    let accumulated = "";

    for (const part of parts) {
        accumulated +=
            (accumulated ? "/" : "") + part;

        const current = accumulated;

        html += `
            <span> / </span>

            <span
                style="cursor:pointer"
                onclick="loadDirectory('${current}')"
            >
                ${escapeHtml(part)}
            </span>
        `;
    }

    breadcrumb.innerHTML = html;
}


// ========================================
// RENDER FILES
// ========================================

function renderFiles(files) {
    if (!files.length) {
        fileList.innerHTML = `
            <div style="padding:24px">
                This directory is empty.
            </div>
        `;

        return;
    }

    fileList.innerHTML = "";

    files.forEach(file => {
        const row = document.createElement("div");

        row.className = "file";

        if (file.type === "dir") {
            row.classList.add("directory");
        }

        const icon =
            file.type === "dir"
                ? "📁"
                : getFileIcon(file.name);

        row.innerHTML = `
            <span class="icon">
                ${icon}
            </span>

            <span class="name">
                ${escapeHtml(file.name)}
            </span>

            <span class="size">
                ${
                    file.type === "file"
                        ? formatSize(file.size)
                        : ""
                }
            </span>
        `;

        row.onclick = () => {
            if (file.type === "dir") {
                loadDirectory(file.path);
            } else {
                openFile(file.path);
            }
        };

        fileList.appendChild(row);
    });
}


// ========================================
// OPEN FILE
// ========================================

function openFile(path) {
    const url =
        `${API}/api/file?path=${encodeURIComponent(path)}`;

    window.open(url, "_blank");
}


// ========================================
// UPLOAD
// ========================================

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

        uploadButton.textContent =
            "Uploading...";


        // Read file

        const buffer =
            await file.arrayBuffer();


        // Convert to Base64

        const bytes =
            new Uint8Array(buffer);

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


        // Determine path

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


        alert("File uploaded successfully!");


        fileInput.value = "";


        // Refresh current directory

        await loadDirectory(
            currentPath
        );


    } catch (error) {

        console.error(error);

        alert(
            `Upload failed: ${error.message}`
        );

    } finally {

        uploadButton.disabled = false;

        uploadButton.textContent =
            "+ Add File";
    }
});


// ========================================
// HELPERS
// ========================================

function getFileIcon(filename) {

    const extension =
        filename
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf")
        return "📕";


    if (extension === "md")
        return "📝";


    if (extension === "txt")
        return "📄";


    if (
        [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp"
        ].includes(extension)
    ) {
        return "🖼️";
    }


    return "📄";
}


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
            Math.pow(
                1024,
                index
            )
        ).toFixed(
            index === 0 ? 0 : 1
        )
        +
        " " +
        units[index]
    );
}


function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// INITIAL LOAD
// ========================================

loadDirectory();