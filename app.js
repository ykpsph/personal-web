const API =
    "https://personal-arkhayv-api.personal-arkhayv-api.workers.dev";

const fileList = document.getElementById("fileList");
const breadcrumb = document.getElementById("breadcrumb");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const newFolderButton = document.getElementById("newFolderButton");

let currentPath = "";


// ============================================
// LOAD DIRECTORY
// ============================================

async function loadDirectory(path = "") {

    currentPath = path;

    fileList.innerHTML =
        `<div class="loading">⏳</div>`;

    try {

        const endpoint =
            path
                ? `${API}/api/list?path=${encodeURIComponent(path)}`
                : `${API}/api/list`;


        const response =
            await fetch(endpoint);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const files =
            await response.json();


        renderBreadcrumb(path);

        renderFiles(files);


    } catch (error) {

        console.error(error);

        fileList.innerHTML = `
            <div class="error">
                Failed to load archive.
                <br>
                ${escapeHtml(error.message)}
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


    const parts =
        path.split("/");


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
            (accumulated ? "/" : "") +
            part;


        const target =
            accumulated;


        html += `
            <span class="breadcrumb-separator">
                /
            </span>

            <span
                class="breadcrumb-link"
                data-path="${escapeHtmlAttribute(target)}"
            >
                ${escapeHtml(part)}
            </span>
        `;
    }


    breadcrumb.innerHTML = html;


    document
        .querySelectorAll(".breadcrumb-link[data-path]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {
                    loadDirectory(
                        element.dataset.path
                    );
                }
            );
        });
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


    files.sort((a, b) => {

        if (
            a.type === "dir" &&
            b.type !== "dir"
        ) {
            return -1;
        }

        if (
            a.type !== "dir" &&
            b.type === "dir"
        ) {
            return 1;
        }

        return a.name.localeCompare(
            b.name,
            undefined,
            {
                numeric: true
            }
        );
    });


    fileList.innerHTML = "";


    for (const file of files) {

    // Hide Git's placeholder file used to represent empty folders.
    if (file.name === ".gitkeep") {
        continue;
    }

    const row =
        document.createElement("div");


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

            ${
                file.type === "file"
                    ? `
                        <button
                            class="delete-button"
                            title="Delete"
                            type="button"
                        >
                            🗑
                        </button>
                    `
                    : ""
            }
        `;


        // Directory / file click

        row.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".delete-button"
                    )
                ) {
                    return;
                }


                if (file.type === "dir") {

                    loadDirectory(
                        file.path
                    );

                } else {

                    openFile(
                        file.path
                    );
                }
            }
        );

        
        // Delete button

        const deleteButton =
            row.querySelector(
                ".delete-button"
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteFile(
                        file.path
                    );
                }
            );
        }


        fileList.appendChild(row);
    }
}


// ============================================
// OPEN FILE
// ============================================

function openFile(path) {

    const url =
        `${API}/api/file?path=${encodeURIComponent(path)}`;


    window.open(
        url,
        "_blank"
    );
}


// ============================================
// UPLOAD
// ============================================

uploadButton.addEventListener(
    "click",
    () => {
        fileInput.click();
    }
);


fileInput.addEventListener(
    "change",
    async () => {

        const file =
            fileInput.files[0];


        if (!file) {
            return;
        }


        try {

            uploadButton.disabled = true;

            uploadButton.textContent =
                "⏳...";


            const buffer =
                await file.arrayBuffer();


            const bytes =
                new Uint8Array(buffer);


            let binary = "";


            const chunkSize =
                0x8000;


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


            const uploadPath =
                currentPath
                    ? `${currentPath}/${file.name}`
                    : file.name;


            const response =
                await fetch(
                    `${API}/api/upload`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                path:
                                    uploadPath,

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


            fileInput.value = "";


            await loadDirectory(
                currentPath
            );


        } catch (error) {

            console.error(error);

            alert(
                `Upload failed:\n${error.message}`
            );


        } finally {

            uploadButton.disabled =
                false;

            uploadButton.textContent =
                "+ Add File";
        }
    }
);

// ============================================
// NEW FOLDER
// ============================================

newFolderButton.addEventListener(
    "click",
    async () => {

        const name = prompt("Folder name:");

        if (!name) {
            return;
        }

        const folderName = name.trim();

        if (!folderName) {
            return;
        }

        // Prevent accidental path traversal / nested paths.
        if (
            folderName.includes("/") ||
            folderName.includes("\\") ||
            folderName === "." ||
            folderName === ".."
        ) {
            alert("Please enter a simple folder name.");
            return;
        }

        const folderPath = currentPath
            ? `${currentPath}/${folderName}`
            : folderName;

        try {

            newFolderButton.disabled = true;
            newFolderButton.textContent = "⏳...";

            const response = await fetch(
                `${API}/api/folder`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        path: folderPath
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    `HTTP ${response.status}`
                );
            }

            await loadDirectory(currentPath);

        } catch (error) {

            console.error(error);

            alert(
                `Folder creation failed:\n${error.message}`
            );

        } finally {

            newFolderButton.disabled = false;
            newFolderButton.textContent = "+ New Folder";
        }
    }
);
// ============================================
// DELETE
// ============================================

async function deleteFile(path) {

    const filename =
        path.split("/").pop();


    const confirmed =
        confirm(
            `Delete "${filename}"?\n\n` +
            `This will permanently remove ` +
            `the file from your archive.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/api/file?path=${encodeURIComponent(path)}`,
                {
                    method: "DELETE"
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


        await loadDirectory(
            currentPath
        );


    } catch (error) {

        console.error(error);

        alert(
            `Delete failed:\n${error.message}`
        );
    }
}


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
        return "📚";
    }


    if (extension === "md") {
        return "📄";
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
        return "📷";
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
// FILE SIZE
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
            Math.pow(
                1024,
                index
            )
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

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeHtmlAttribute(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );
}


// ============================================
// START
// ============================================




loadDirectory();