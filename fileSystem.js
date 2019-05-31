const fs = require('fs');
const path = require('path');

function getAllFilePathsWithExtension(directoryPath, extension, filePaths) {
    filePaths = filePaths || [];
    const fileNames = fs.readdirSync(directoryPath);
    for (const fileName of fileNames) {
        const filePath = directoryPath + '/' + fileName;
        if (fs.statSync(filePath).isDirectory()) {
            getAllFilePathsWithExtension(filePath, filePaths);
        } else if (filePath.endsWith(`.${extension}`)) {
            filePaths.push(filePath);
        }
    }

    return filePaths;
}

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function getFileName(filePath) {
    return path.basename(filePath);
}

module.exports = {
    getAllFilePathsWithExtension,
    readFile,
    getFileName,
};
