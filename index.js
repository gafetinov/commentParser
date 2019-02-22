const { getAllFilePathsWithExtension, readFile, getFileName } = require('./fileSystem');
const { readLine } = require('./console');

let comments = [];

const tables = {
    full: undefined,
    important: undefined
};

app();

function app () {
    console.log('Please, write your command!');
    let filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    findAllCommentsInFiles(filePaths);
    readLine(processCommand);
}

function findAllCommentsInFiles(filePaths) {
    for (let i = 0; i < filePaths.length; i++) {
        parseFile(filePaths[i]);
    }
}


function getTableHead(tableOptions) {
    let importanceColumn = '  !  ';
    let userColumn = `  user${' '.repeat(tableOptions.userColumnWidth-4)}`;
    let dateColumn = `  date${' '.repeat(tableOptions.dateColumnWidth-4)}`;
    let textColumn = `  comment${' '.repeat(tableOptions.textColumnWidth-7)}`;
    let fileNameColumn = `  fileName${' '.repeat(tableOptions.fileNameColumnWidth-8)}`;
    return `${importanceColumn}|${userColumn}|${dateColumn}|${textColumn}|${fileNameColumn}`;
}

function show(comments, tableOptions) {
    let resultSString = [];
    let tableHead = getTableHead(tableOptions);
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
        userColumn = `  ${user}${' '.repeat(tableOptions.userColumnWidth-user.length)}`;
        dateColumn = `  ${date}${' '.repeat(tableOptions.dateColumnWidth-date.length)}`;
        textColumn = `  ${text}${' '.repeat(tableOptions.textColumnWidth-text.length)}`;
        fileNameColumn = `  ${fileName}${' '.repeat(tableOptions.fileNameColumnWidth-fileName.length)}`;
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

function parseCommand(command) {
    command = command.trim();
    let index = command.indexOf(' ');
    if (index < 0) {
        return [command]
    }
    let mainCommand = command.slice(0, index);
    let args = command.slice(index).trim();

    return [mainCommand, args]
}


function processCommand (command) {
    let preparedComments = comments.map(value => value);
    let commands = parseCommand(command);
    let tableOptions;
    switch (commands[0]) {
        case 'exit':
            if (commands.length > 1) {
                console.log('wrong command');
                return;
            }
            process.exit(0);
            break;
        case 'show':
            if (commands.length > 1) {
                console.log('wrong command');
                return;
            }
            if (tables.full === undefined) {
                tableOptions = getTableOptions(preparedComments);
                tables.full = tableOptions;
            } else {
                tableOptions = tables.full;
            }
            break;
        case 'important':
            if (commands.length > 1) {
                console.log('wrong command');
                return;
            }
            preparedComments = comments.filter(comment => comment.importance);
            if (!tables.important) {
                tableOptions = getTableOptions(preparedComments);
                tables.important = tableOptions;
            } else {
                tableOptions = tables.important;
            }
            break;
        case 'user':
            if (typeof commands[1] === 'undefined') {
                console.log('wrong command');
                return;
            }
            preparedComments = comments.filter(comment => comment.user.toLowerCase().startsWith(commands[1].toLowerCase()));
            tableOptions = getTableOptions(preparedComments);
            break;
        case 'date':
            if (commands.length > 2) {
                console.log('wrong command');
                return;
            }
            if (typeof commands[1] === 'undefined' || !isCorrectDate(commands[1])) {
                console.log('wrong command');
                return;
            }
            let referenceDate = commands[1];
            preparedComments = comments.filter(comment => comment.date.slice(0, referenceDate.length) >= referenceDate);
            tableOptions = getTableOptions(preparedComments);
            break;
        case 'sort':
            if (commands.length > 2) {
                console.log('wrong command');
                return;
            }
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
            if (tables.full === undefined) {
                tableOptions = getTableOptions(preparedComments);
                tables.full = tableOptions;
            } else {
                tableOptions = tables.full;
            }
            break;
        default:
            console.log('wrong command');
            return;
    }
    show(preparedComments, tableOptions);
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

function parseComment(rawComment) {
    let commentBody = rawComment.split(/TODO\s*:?\s*/i)[1];
    const comment = {};
    const separatorCount = (commentBody.match(/;/g) || []).length;
    let commentMarkup = new Array(3);
    if (separatorCount < 2) {
        commentMarkup[2] = commentBody.trim();
    } else {
        let offset = 0;
        for (let i = 0; i < commentMarkup.length; i++) {
            if (i < commentMarkup.length-1) {
                const separator = commentBody.slice(offset).match(/\s*;\s*/);
                commentMarkup[i] = commentBody.slice(offset, offset+separator.index);
                offset += commentMarkup[i].length+separator[0].length;
            } else {
                commentMarkup[i] = commentBody.slice(offset);
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

function getTableOptions(comms) {
    const tableSettings = {
        importanceColumnWidth: 3,
        userColumnWidth: 6,
        dateColumnWidth: 6,
        textColumnWidth: 9,
        fileNameColumnWidth: 10,
    };
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
    return tableSettings;
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