"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var targetDir = '../'; // Go up one directory from the current directory
var searchString = 'Temp015Goochy'; // Specify the string to search for
var replaceString = 'Temp015Goochy'; // Specify the string to replace with
//to run this open a terminal and run the following command: tsc rename.ts then node rename.js
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
                    renameRecursively(filePath);
                }
                var newFilePath = path.join(dir, file.replace(searchString, replaceString));
                if (filePath !== newFilePath) {
                    fs.rename(filePath, newFilePath, function (err) {
                        if (err) {
                            console.error("Error renaming file ".concat(filePath, " to ").concat(newFilePath, ":"), err);
                        }
                        else {
                            console.log("Renamed ".concat(filePath, " to ").concat(newFilePath));
                        }
                    });
                }
            });
        });
    });
}
renameRecursively(targetDir);
