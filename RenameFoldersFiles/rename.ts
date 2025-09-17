import * as fs from "fs";
import * as path from "path";

/*
- This script will rename all files and directories in the target directory and its subdirectories that contain the search string with the replace string.
- Additionally, it will open files and replace the specified strings within their contents.
- This was created by copilot, and since it works nothing was changed.
- to run this open a terminal and run the following command: tsc rename.ts then node rename.js
*/

const targetDir = "../../"; // Go up one directory from the current directory
const replacements = [
	{ search: "temp015goochy", replace: "temp015goochy" },
	{ search: "temp015Goochy", replace: "temp015Goochy" },
	{ search: "Temp015Goochy", replace: "Temp015Goochy" },
];

function renameRecursively(dir: string): void {
	fs.readdir(dir, (err, files) => {
		if (err) {
			console.error(`Error reading directory ${dir}:`, err);
			return;
		}

		files.forEach((file) => {
			const filePath = path.join(dir, file);
			fs.stat(filePath, (err, stats) => {
				if (err) {
					console.error(
						`Error getting stats for file ${filePath}:`,
						err
					);
					return;
				}

				if (stats.isDirectory()) {
					let newDirPath = filePath;
					replacements.forEach(({ search, replace }) => {
						newDirPath = newDirPath.replace(search, replace);
					});
					if (filePath !== newDirPath) {
						fs.rename(filePath, newDirPath, (err) => {
							if (err) {
								console.error(
									`Error renaming directory ${filePath} to ${newDirPath}:`,
									err
								);
							} else {
								console.log(
									`Renamed directory ${filePath} to ${newDirPath}`
								);
								renameRecursively(newDirPath);
							}
						});
					} else {
						renameRecursively(filePath);
					}
				} else {
					let newFilePath = filePath;
					replacements.forEach(({ search, replace }) => {
						newFilePath = newFilePath.replace(search, replace);
					});
					if (filePath !== newFilePath) {
						fs.rename(filePath, newFilePath, (err) => {
							if (err) {
								console.error(
									`Error renaming file ${filePath} to ${newFilePath}:`,
									err
								);
							} else {
								console.log(
									`Renamed file ${filePath} to ${newFilePath}`
								);
								replaceInFile(newFilePath);
							}
						});
					} else {
						replaceInFile(filePath);
					}
				}
			});
		});
	});
}

function replaceInFile(filePath: string): void {
	fs.readFile(filePath, "utf8", (err, data) => {
		if (err) {
			console.error(`Error reading file ${filePath}:`, err);
			return;
		}

		let result = data;
		replacements.forEach(({ search, replace }) => {
			result = result.replace(new RegExp(search, "g"), replace);
		});

		fs.writeFile(filePath, result, "utf8", (err) => {
			if (err) {
				console.error(`Error writing file ${filePath}:`, err);
			} else {
				console.log(`Replaced content in file ${filePath}`);
			}
		});
	});
}

renameRecursively(targetDir);
