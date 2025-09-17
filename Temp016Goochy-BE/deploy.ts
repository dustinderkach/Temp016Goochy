import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

// Paths
const frontendPath = path.resolve(__dirname, "../Temp016Goochy-FE");
const logFilePath = path.resolve(__dirname, "deploy.log");

// Helper function to log messages to both console and a log file
const logFile = fs.createWriteStream(logFilePath, { flags: "a" });
const log = (message: string): void => {
	const timestamp = new Date().toISOString();
	const formattedMessage = `${timestamp} - ${message}`;
	console.log(formattedMessage);
	logFile.write(`${formattedMessage}\n`);
};

// Helper function to run shell commands with retry logic
const runCommandWithRetry = (command: string, retries: number = 3): void => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			log(`Running: ${command} (Attempt ${attempt}/${retries})`);
			execSync(command, { stdio: "inherit" });
			return; // Exit the loop if the command succeeds
		} catch (error) {
			log(`❌ Error running command: ${command}`);
			if (attempt === retries) {
				log(`❌ Command failed after ${retries} attempts.`);
				process.exit(1);
			}
		}
	}
};

// Cleanup logic to remove temporary files
const cleanup = (): void => {
	log("🧹 Cleaning up temporary files...");
	try {
		fs.unlinkSync("outputs.json");
		log("✅ Temporary files cleaned up successfully.");
	} catch (error) {
		log("⚠️ No outputs.json file to clean up.");
	}
};

// Validate the environment input
const validateEnvironment = (env: string): void => {
	const validEnvironments = ["DEV", "UAT", "PROD"];
	if (!validEnvironments.includes(env)) {
		log(
			`❌ Invalid environment: ${env}. Valid environments are: ${validEnvironments.join(
				", "
			)}`
		);
		process.exit(1);
	}
};

// Step 0: Install Dependencies (Backend and Frontend in Parallel)
const installDependencies = async (): Promise<void> => {
	log("📦 Installing dependencies...");

	const installBackend = () => runCommandWithRetry("npm install");
	const installFrontend = () =>
		runCommandWithRetry(`cd ${frontendPath} && npm install`);

	// Run backend and frontend installations in parallel
	await Promise.all([installBackend(), installFrontend()]);
	log("✅ Dependencies installed successfully.");
};

// Step 1: Deploy Initial CDK Stack
const deployInitialCdkStack = (env: string): void => {
	log("🚀 Deploying initial CDK stack...");
	// --verbose
	runCommandWithRetry(
		`cdk deploy --all --outputs-file outputs.json --require-approval never --context env=${env}`
	);

	log("✅ Initial CDK stack deployed successfully.");
};

// Step 2: Build Frontend App
const buildFrontendApp = (): void => {
	log("🛠️ Building the frontend app...");
	runCommandWithRetry(`cd ${frontendPath} && npm run build`);
	log("✅ Frontend app built successfully.");
};

// Step 3: Deploy CDK Stack Again (Upload Frontend to S3)
const deployCdkStackWithFrontend = (env: string): void => {
	log("🚀 Deploying CDK stack again to upload frontend...");
	// --verbose
	runCommandWithRetry(
		`cdk deploy --all --outputs-file outputs.json --require-approval never --context env=${env}`
	);

	log("✅ CDK stack deployed with frontend successfully.");
};

// Step 4: Run Outputs Filter Script
const runOutputsFilter = (): void => {
	log("🛠️ Running outputs filter script...");
	runCommandWithRetry("ts-node outputsForFE.ts");
	log("✅ Outputs filter script executed successfully.");
};

// Deployment Process
const deploy = async (env: string): Promise<void> => {
	log(`🚀 Starting deployment for environment: ${env}`);

	// Validate the environment
	validateEnvironment(env);

	// Step 0: Install Dependencies
	await installDependencies();

	// Step 1: Deploy Initial CDK Stack
	deployInitialCdkStack(env);

	// Step 2: Build Frontend App
	buildFrontendApp();

	// Step 3: Deploy CDK Stack Again (Upload Frontend to S3)
	deployCdkStackWithFrontend(env);

	// Step 4: Run Outputs Filter Script
	runOutputsFilter();

	log(`✅ Deployment for environment ${env} completed successfully!`);
};

// Attach cleanup logic to process events
process.on("exit", cleanup);
process.on("SIGINT", cleanup); // Handle Ctrl+C

// Get the environment from command-line arguments (default to DEV)
const env = process.argv[2] || "DEV";
deploy(env).catch((error) => {
	log(`❌ Deployment failed: ${error.message}`);
	process.exit(1);
});
