const { getAllFilePathsWithExtension, readFile, getFileName } = require('./fileSystem');
const { readLine } = require('./console');

let comments = [];
const tableSettings = {
    importanceColumnWidth: 3,
    userColumnWidth: 6,
    dateColumnWidth: 6,
    textColumnWidth: 9,
    fileNameColumnWidth: 10,
};

app();

function app () {
    let filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    findAllCommentsInFiles(filePaths);
    console.log('Please, write your command!');
    readLine(processCommand);
}

function findAllCommentsInFiles(filePaths) {
    for (let i = 0; i < filePaths.length; i++) {
        parseFile(filePaths[i]);
    }
}

function getFiles () {
    filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');

    return filePaths.map(path => readFile(path));
}

function getTableHead() {
    let importanceColumn = '  !  ';
    let userColumn = `  user${' '.repeat(tableSettings.userColumnWidth-4)}`;
    let dateColumn = `  date${' '.repeat(tableSettings.dateColumnWidth-4)}`;
    let textColumn = `  comment${' '.repeat(tableSettings.textColumnWidth-7)}`;
    let fileNameColumn = `  fileName${' '.repeat(tableSettings.fileNameColumnWidth-8)}`;
    return `${importanceColumn}|${userColumn}|${dateColumn}|${textColumn}|${fileNameColumn}`;
}

function show(comments) {
    let resultSString = [];
    let tableHead = getTableHead();
    resultSString[resultSString.length] = tableHead;
    let separator = '-'.repeat(tableHead.length);
    resultSString[resultSString.length] = separator;
    for (let i = 0; i < comments.length; i++) {
        let comment = comments[i];
        let importance = comment.importance > 0 ? '!' : ' ';
        let user = getShortcut(comment.user || ' ', 10);
        let date = getShortcut(comment.date || ' ', 10);
        let text = getShortcut(comment.text, 50);
        let fileName = getShortcut(comment.fileName, 15);
        importanceColumn = `  ${importance}  `;
        userColumn = `  ${user}${' '.repeat(tableSettings.userColumnWidth-user.length)}`;
        dateColumn = `  ${date}${' '.repeat(tableSettings.dateColumnWidth-date.length)}`;
        textColumn = `  ${text}${' '.repeat(tableSettings.textColumnWidth-text.length)}`;
        fileNameColumn = `  ${fileName}${' '.repeat(tableSettings.fileNameColumnWidth-fileName.length)}`;
        resultSString[resultSString.length] = `${importanceColumn}|${userColumn}|${dateColumn}|${textColumn}|${fileNameColumn}`;
    }
    if (resultSString.length > 2) {
        resultSString[resultSString.length] = separator;
    }
    console.log(resultSString.join('\n'));
}

function getShortcut(str, maxLength) {
    let ending = '...';
    if (str.length > maxLength) {
        return `${str.slice(0, maxLength-ending.length)}${ending}`;
    }

    return str;
}

function processCommand (command) {
    const commands = command.split(/\s+/);
    let preparedComments = comments.map(value => value);
    switch (commands[0]) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            break;
        case 'important':
            preparedComments = comments.filter(comment => comment.importance);
            break;
        case 'user':
            if (typeof commands[1] === 'undefined') {
                console.log('wrong command');
                return;
            }
            preparedComments = comments.filter(comment => comment.user.toLowerCase().startsWith(commands[1].toLowerCase()));
            break;
        case 'date':
            if (typeof commands[1] === 'undefined' || !isCorrectDate(commands[1])) {
                console.log('wrong command');
                return;
            }
            let referenceDate = commands[1];
            preparedComments = comments.filter(comment => comment.date.slice(0, referenceDate.length) >= referenceDate);
            break;
        case 'sort':
            switch (commands[1]) {
                case 'user':
                    let commentsWithUser = preparedComments.filter(comment => comment.user.length > 0);
                    let commentsWithoutUser = preparedComments.filter(comment => comment.user.length === 0);
                    commentsWithUser.sort(compareUsers);
                    preparedComments = commentsWithUser.concat(commentsWithoutUser);
                    break;
                case 'importance':
                    preparedComments.sort(compareImportance);
                    break;
                case 'date':
                    preparedComments.sort(compareDates);
                    break;
                default:
                    console.log('wrong command');
                    return;
            }
            break;
        default:
            console.log('wrong command');
            return;
    }
    updateTableSettings(preparedComments);
    show(preparedComments);
}

function isCorrectDate(str) {
    return (/^\d{4}(-\d{2}(-\d{2})?)?$/g).test(str) && !(new Date(str) == 'Invalid Date');
}

function compareUsers(comment1, comment2) {
    let user1 = comment1.user.toLowerCase();
    let user2 = comment2.user.toLowerCase();
    return user1 > user2 ? 1
        : user1 < user2 ? -1
        : 0;
}

function compareImportance(comment1, comment2) {
    const importance1 = comment1.importance;
    const importance2 = comment2.importance;
    return importance1 > importance2 ? -1
        : importance1 < importance2 ? 1
        : 0;
}

function compareDates(comment1, comment2) {
    const date1 = comment1.date;
    const date2 = comment2.date;
    return date1 > date2 ? -1
        : date1 < date2 ? 1
        : 0;
}

// TODO you can do it!
// todo ds;20f12; может переименовать? ;   fd;    fdddf;;
function parseComment(rawComment) {
    let commentBody = rawComment.split(/TODO\s*:?\s*/i)[1];
    const comment = {};
    const separatorCount = (commentBody.match(/;/g) || []).length;
    let commentMarkup = new Array(3);
    if (separatorCount < 2) {
        commentMarkup[2] = commentBody;
    } else {
        let offset = 0;
        for (let i = 0; i < commentMarkup.length; i++) {
            if (i < commentMarkup.length-1) {
                const separator = commentBody.slice(offset).match(/;\s*/);
                commentMarkup[i] = commentBody.slice(offset, offset+separator.index);
                offset += commentMarkup[i].length+separator[0].length;
            } else {
                commentMarkup[i] = commentBody.substr(offset);
                break;
            }
        }
    }
    comment.user = commentMarkup[0] || '';
    comment.date = getCorrectDate(commentMarkup[1]);
    comment.text = commentMarkup[2];
    comment.importance = (comment.text.match(/!/g) || '').length;

    return comment;
}
// TODO user; 01.2012; Проверяю разные форматы
function getCorrectDate(str) {
    if (isCorrectDate(str)) {
        return str;
    }
    if (typeof str === 'undefined') {
        return '';
    }
    let numbers = str.split(/\D/);
    if (numbers.length <= 3 && (/\d{4}/.test(numbers[numbers.length-1]))) {
        return getCorrectDate(numbers.reverse().join('-'));
    }

    return '';
}

function parseFile(filePath) {
    let content = readFile(filePath);
    let lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        let rawComment = getComment(lines[i]);
        if (rawComment) {
            comment = parseComment(rawComment);
            comment.fileName = getFileName(filePath);
            comments[comments.length] = comment;
        }
    }
}

function updateTableSettings(comms) {
    resetTableSettings();
    for (let i = 0; i < comms.length; i++) {
        let comment = comms[i];
        tableSettings.userColumnWidth = comment.user.length < 10 ?
            Math.max(comment.user.length + 2, tableSettings.userColumnWidth) : 12;
        tableSettings.dateColumnWidth = comment.date.length < 10 ?
            Math.max(comment.date.length + 2, tableSettings.dateColumnWidth) : 12;
        tableSettings.textColumnWidth = comment.text.length < 50 ?
            Math.max(comment.text.length + 2, tableSettings.textColumnWidth) : 52;
        tableSettings.fileNameColumnWidth = comment.fileName.length < 15 ?
            Math.max(comment.fileName.length + 2, tableSettings.fileNameColumnWidth) : 17;
    }
}

function resetTableSettings() {
    tableSettings.importanceColumnWidth = 3;
    tableSettings.userColumnWidth = 6;
    tableSettings.dateColumnWidth = 6;
    tableSettings.textColumnWidth = 9;
    tableSettings.fileNameColumnWidth = 10;
}

function getComment(line) {
    let str = line;
    let offset = 0;
    let pattern = /\/\/\s*todo(\s|:)/i;
    while (str.match(pattern)) {
        let overlap = str.match(pattern);
        if (!isInQuotes(line, overlap.index+offset)) {
            return line.slice(offset);
        }
        offset += overlap.index+overlap[0].length;
        str = line.slice(offset);
    }

    return '';
}

function isInQuotes(line, index) {
    inSingle = false;
    inDouble = false;
    for (let i = 0; i < line.length; i++) {
        let symbol = line[i];
        if (symbol === "'" && !inDouble) {
            inSingle = !inSingle;
        }
        if (symbol === '"' && !inSingle) {
            inDouble = !inDouble;
        }
        if (i === index) {
            return inSingle || inDouble;
        }
    }
}