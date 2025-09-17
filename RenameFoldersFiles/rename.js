"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
/*
- This script will rename all files and directories in the target directory and its subdirectories that contain the search string with the replace string.
- Additionally, it will open files and replace the specified strings within their contents.
- This was created by copilot, and since it works nothing was changed.
- to run this open a terminal and run the following command: tsc rename.ts then node rename.js
*/
var targetDir = "../../"; // Go up one directory from the current directory
var replacements = [
    { search: "temp016goochy", replace: "temp016goochy" },
    { search: "temp016Goochy", replace: "temp016Goochy" },
    { search: "Temp016Goochy", replace: "Temp016Goochy" },
];
function renameRecursively(dir) {
    fs.readdir(dir, function (err, files) {
        if (err) {
            console.error("Error reading directory ".concat(dir, ":"), err);
            return;
        }
        files.forEach(function (file) {
            var filePath = path.join(dir, file);
            fs.stat(filePath, function (err, stats) {
                if (err) {
                    console.error("Error getting stats for file ".concat(filePath, ":"), err);
                    return;
                }
                if (stats.isDirectory()) {
                    var newDirPath_1 = filePath;
                    replacements.forEach(function (_a) {
                        var search = _a.search, replace = _a.replace;
                        newDirPath_1 = newDirPath_1.replace(search, replace);
                    });
                    if (filePath !== newDirPath_1) {
                        fs.rename(filePath, newDirPath_1, function (err) {
                            if (err) {
                                console.error("Error renaming directory ".concat(filePath, " to ").concat(newDirPath_1, ":"), err);
                            }
                            else {
                                console.log("Renamed directory ".concat(filePath, " to ").concat(newDirPath_1));
                                renameRecursively(newDirPath_1);
                            }
                        });
                    }
                    else {
                        renameRecursively(filePath);
                    }
                }
                else {
                    var newFilePath_1 = filePath;
                    replacements.forEach(function (_a) {
                        var search = _a.search, replace = _a.replace;
                        newFilePath_1 = newFilePath_1.replace(search, replace);
                    });
                    if (filePath !== newFilePath_1) {
                        fs.rename(filePath, newFilePath_1, function (err) {
                            if (err) {
                                console.error("Error renaming file ".concat(filePath, " to ").concat(newFilePath_1, ":"), err);
                            }
                            else {
                                console.log("Renamed file ".concat(filePath, " to ").concat(newFilePath_1));
                                replaceInFile(newFilePath_1);
                            }
                        });
                    }
                    else {
                        replaceInFile(filePath);
                    }
                }
            });
        });
    });
}
function replaceInFile(filePath) {
    fs.readFile(filePath, "utf8", function (err, data) {
        if (err) {
            console.error("Error reading file ".concat(filePath, ":"), err);
            return;
        }
        var result = data;
        replacements.forEach(function (_a) {
            var search = _a.search, replace = _a.replace;
            result = result.replace(new RegExp(search, "g"), replace);
        });
        fs.writeFile(filePath, result, "utf8", function (err) {
            if (err) {
                console.error("Error writing file ".concat(filePath, ":"), err);
            }
            else {
                console.log("Replaced content in file ".concat(filePath));
            }
        });
    });
}
renameRecursively(targetDir);
