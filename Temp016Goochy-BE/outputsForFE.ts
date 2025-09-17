import * as fs from "fs";
import * as path from "path";

// Define the structure of the outputs.json file
interface StackOutputs {
	[key: string]: string;
}

interface OutputsFile {
	[stackName: string]: StackOutputs;
}

// Define the structure of the filtered outputs
interface FilteredOutputs {
	[key: string]: string;
}

// Paths
const outputFilePath = "outputs.json";
const appName = path.basename(__dirname).replace("-BE", "");
const feDir = path.resolve(__dirname, "..", `${appName}-FE`);
const configDir = path.join(feDir, "src", "config");
if (!fs.existsSync(configDir)) {
	fs.mkdirSync(configDir, { recursive: true });
}
const frontendConfigPath = path.join(configDir, "outputsForFE.json");

try {
	const outputFileContent = fs.readFileSync(outputFilePath, "utf8");
	const outputFileParsed: OutputsFile = JSON.parse(outputFileContent);
	const filteredOutputs: FilteredOutputs = {};
	let primaryRegion = "us-east-1"; // Replace with your primary region
	let sanitizedRegion = primaryRegion.replace(/-/g, "");
	// Iterate over each stack output
	for (const stack in outputFileParsed) {
		if (outputFileParsed.hasOwnProperty(stack)) {
			// Iterate over each key in the stack output
			for (const key in outputFileParsed[stack]) {
				if (outputFileParsed[stack].hasOwnProperty(key)) {
					const keyName = outputFileParsed[stack][key];

					if (
						keyName &&
						typeof keyName === "string" &&
						keyName.trim() !== ""
					) {
						switch (true) {
							case key.includes("AdminPhotosBucketName"):
								filteredOutputs["AdminPhotosBucketName"] =
									keyName;
								break;
							case key.includes("EnvironmentName"):
								filteredOutputs["EnvironmentName"] = keyName;

								break;
							case key.includes("UserPoolId"):
								filteredOutputs["UserPoolId"] = keyName;
								break;
							case key.includes("UserPoolClientId"):
								filteredOutputs["UserPoolClientId"] = keyName;
								break;
							case key.includes("PrimaryRegionName"):
								filteredOutputs["PrimaryRegionName"] = keyName;
								primaryRegion = keyName;
								break;
							case key.includes("IdentityPoolId"):
								filteredOutputs["IdentityPoolId"] = keyName;
								break;
							case key.endsWith("ApiEndpoint") &&
								keyName.includes(primaryRegion):
								filteredOutputs[`ApiEndpoint-PrimaryRegion`] =
									keyName;
								console.log(`PrimaryRegionKeyName: ${keyName}`);
								break;
							case key.endsWith("ApiEndpoint") &&
								!keyName.includes(primaryRegion):
								filteredOutputs[
									`ApiEndpoint-LastReplicaRegion`
								] = keyName;
								console.log(`PrimaryRegionKeyName: ${keyName}`);
								break;
							case key.endsWith("PreSignAdminPhoto") &&
								keyName.includes(primaryRegion):
								filteredOutputs[
									`ApiEndpoint-PrimaryRegion-PreSignPhotoAdmin`
								] = keyName;
								console.log(`PrimaryRegionKeyName: ${keyName}`);
								break;
							case key.endsWith("PreSignAdminPhoto") &&
								!keyName.includes(primaryRegion):
								filteredOutputs[
									`ApiEndpoint-LastReplicaRegion-PreSignPhotoAdmin`
								] = keyName;
								console.log(`PrimaryRegionKeyName: ${keyName}`);
								break;
							default:
								//PreSignAdminPhoto
								// Do not include this
								break;
						}
					}
				}
			}
		}
	}

	// Concatenate EnvironmentName to ApiEndpoint if both exist
	if (filteredOutputs["ApiEndpoint"] && filteredOutputs["EnvironmentName"]) {
		filteredOutputs[
			"ApiEndpoint"
		] += `/${filteredOutputs["EnvironmentName"]}-`;
	}

	// Write the filtered outputs to the frontend's config directory
	fs.writeFileSync(
		frontendConfigPath,
		JSON.stringify(filteredOutputs, null, 2),
		"utf8"
	);

	// Delete the original outputs.json file
	fs.unlinkSync(outputFilePath);
	
	console.log(
		`Filtered outputs written to ${frontendConfigPath} and outputs.json deleted`
	);
} catch (error) {
	console.error("Error processing outputs.json:", error);
}
