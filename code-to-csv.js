const path = require('path');
const ts = require('typescript');
const csv = require('csv-stringify/sync');
 
const cwd = process.cwd();
const configJSON = require(path.join(cwd, 'tsconfig.json'));
const config = ts.parseJsonConfigFileContent(configJSON, ts.sys, cwd);
const program = ts.createProgram(
    config.fileNames, 
    config.options, 
    ts.createCompilerHost(config.options)
);
const checker = program.getTypeChecker();

const rows = [];

const addRow = (fileName, name, code, docs = '') => rows.push({
    file_name: path.relative(cwd, fileName),
    name,
    code,
    docs
});

function addFunction(fileName, node) {
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
        const name = symbol.getName();
        const docs = getDocs(symbol);
        const code = node.getText();
        addRow(fileName, name, code, docs);
    }
}

function addClass(fileName, node) {
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
        const name = symbol.getName();
        const docs = getDocs(symbol);
        const code = `class ${name} {}`;
        addRow(fileName, name, code, docs);
        node.members.forEach(m => addClassMember(fileName, name, m));
    }
}

function addClassMember(fileName, className, node) {
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
        const name = className + ':' + symbol.getName();
        const docs = getDocs(symbol);
        const code = node.getText();
        addRow(fileName, name, code, docs);
    }
}

function addInterface(fileName, node) {
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
        const name = symbol.getName();
        const docs = getDocs(symbol);
        const code = `interface ${name} {}`;
        addRow(fileName, name, code, docs);
        node.members.forEach(m => addInterfaceMember(fileName, name, m));
    }
}

function addInterfaceMember(fileName, interfaceName, node) {
    if (!ts.isPropertySignature(node) || !ts.isMethodSignature(node)) {
        return;
    }
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
        const name = interfaceName + ':' + symbol.getName();
        const docs = getDocs(symbol);
        const code = node.getText();
        addRow(fileName, name, code, docs);
    }
}

function getDocs(symbol) {
    return ts.displayPartsToString(symbol.getDocumentationComment(checker));
}

for (const fileName of config.fileNames) {
    const sourceFile = program.getSourceFile(fileName);
    const visitNode = node => {
        if (ts.isFunctionDeclaration(node)) {
            addFunction(fileName, node);
        } else if (ts.isClassDeclaration(node)) {
            addClass(fileName, node);
        } else if (ts.isInterfaceDeclaration(node)) {
            addInterface(fileName, node);
        }
        ts.forEachChild(node, visitNode);
    };
    ts.forEachChild(sourceFile, visitNode);
}

for (const row of rows) {
    row.combined = '';
    if (row.docs) {
        row.combined += `Code documentation: ${row.docs}; `;
    }
    row.combined += `Code: ${row.code}; Name: ${row.name};`;
}

const output = csv.stringify(rows, {
    header: true
});

console.log(output);
