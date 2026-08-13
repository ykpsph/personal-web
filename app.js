const archive = [
    {
        type: "directory",
        name: "AWS"
    },
    {
        type: "directory",
        name: "Kubernetes"
    },
    {
        type: "directory",
        name: "DevOps"
    },
    {
        type: "directory",
        name: "Books"
    },
    {
        type: "file",
        name: "DockerCheatSheet.md",
        size: 10240,
        modified: "2026-08-13"
    },
    {
        type: "file",
        name: "VPC.pdf",
        size: 2097152,
        modified: "2026-08-13"
    },
    {
        type: "file",
        name: "architecture.png",
        size: 819200,
        modified: "2026-08-13"
    }
];


const fileList = document.getElementById("fileList");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const breadcrumb = document.getElementById("breadcrumb");
const addFileButton = document.getElementById("addFileButton");


function formatSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}


function getIcon(item) {

    if (item.type === "directory") {
        return "📁";
    }

    const extension = item.name
        .split(".")
        .pop()
        .toLowerCase();

    switch (extension) {

        case "pdf":
            return "📕";

        case "md":
            return "📝";

        case "txt":
            return "📄";

        case "png":
        case "jpg":
        case "jpeg":
        case "webp":
            return "🖼️";

        default:
            return "📄";
    }
}


function renderFiles(files) {

    loading.classList.add("hidden");

    fileList.innerHTML = "";

    files.forEach(item => {

        const row = document.createElement("a");

        row.className = "file-row";

        if (item.type === "directory") {

            row.href = "#";

            row.addEventListener("click", event => {
                event.preventDefault();

                alert(`Opening ${item.name}/`);
            });

        } else {

            row.href = "#";

            row.addEventListener("click", event => {
                event.preventDefault();

                alert(`Opening ${item.name}`);
            });
        }

        row.innerHTML = `
            <span class="file-icon">
                ${getIcon(item)}
            </span>

            <span class="file-name">
                ${item.name}${item.type === "directory" ? "/" : ""}
            </span>

            <span class="file-size">
                ${item.type === "directory" ? "-" : formatSize(item.size)}
            </span>

            <span class="file-date">
                ${item.modified ?? ""}
            </span>
        `;

        fileList.appendChild(row);
    });
}


addFileButton.addEventListener("click", () => {

    alert("File upload will be implemented through the GitHub API.");

});


renderFiles(archive);
