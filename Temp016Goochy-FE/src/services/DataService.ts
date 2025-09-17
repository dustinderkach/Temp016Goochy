import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AuthService } from "./AuthService";
import { Temp016GoochyEntry } from "../components/model/model";
import { ImageProcessingService } from "./ImageProcessingService";
import outputs from "../config/outputsForFE.json";
export class DataService {
	private authService: AuthService;
	private s3Client: S3Client | undefined;
	private awsPrimaryRegion: string = "";
	private apiEndpointAppNameUrl: string = "";
	private apiEndpointPreSignAdminPhoto: string = "";

	constructor(authService: AuthService) {
		this.authService = authService;
		this.initializeDataService().catch((error) => {
			console.error("Failed to initialize DataService:", error);
		});
	}

	private async initializeDataService() {
		try {
			// Extract the required values from the imported config

			// Extract the required values from the JSON file
			const apiEndpoint = outputs["ApiEndpoint-PrimaryRegion"];
			const apiEndpointPreSignAdminPhoto =
				outputs["ApiEndpoint-PrimaryRegion-PreSignPhotoAdmin"];
			const awsPrimaryRegion = outputs.PrimaryRegionName;

			if (!apiEndpoint || !awsPrimaryRegion) {
				throw new Error(
					"Missing necessary parameters in outputsForFE.json"
				);
			}

			console.log("Environment:", outputs.EnvironmentName);
			console.log("apiEndpoint:", apiEndpoint);
			console.log("awsRegion:", awsPrimaryRegion);

			this.awsPrimaryRegion = awsPrimaryRegion;
			this.apiEndpointAppNameUrl = apiEndpoint;
			this.apiEndpointPreSignAdminPhoto = apiEndpointPreSignAdminPhoto;
		} catch (error) {
			console.error("Error initializing DataService:", error);
		}
	}

	public reserveTemp016Goochy(temp016GoochyId: string) {
		return "123";
	}

	public async getTemp016Goochy(): Promise<Temp016GoochyEntry[]> {
		if (!this.apiEndpointAppNameUrl) {
			throw new Error("API endpoint is not defined");
		}
		const getTemp016GoochyResult = await fetch(this.apiEndpointAppNameUrl, {
			method: "GET",
			headers: {
				Authorization: this.authService.jwtToken!,
			},
		});
		const getTemp016GoochyResultJson = await getTemp016GoochyResult.json();
		return getTemp016GoochyResultJson;
	}

	public async createTemp016Goochy(
		name: string,
		location: string,
		photo?: File
	) {
		const temp016Goochy = {} as any;
		temp016Goochy.name = name;
		temp016Goochy.location = location;

		if (photo) {
			// Process image client-side first
			const processedImages = await ImageProcessingService.processImage(
				photo
			);

			// Upload original
			const originalUrl = await this.uploadPublicFile(
				processedImages.original
			);

			if (
				processedImages.needsSeparateViewing &&
				processedImages.viewing
			) {
				// Upload viewing version
				const viewingUrl = await this.uploadPublicFile(
					processedImages.viewing
				);
				temp016Goochy.viewingPhotoUrl = viewingUrl;
				temp016Goochy.originalPhotoUrl = originalUrl;
			} else {
				// Use same URL for both
				temp016Goochy.viewingPhotoUrl = originalUrl;
				temp016Goochy.originalPhotoUrl = originalUrl;
			}
			temp016Goochy.photoUrl = temp016Goochy.viewingPhotoUrl;
		}
		const postResult = await fetch(this.apiEndpointAppNameUrl, {
			method: "POST",
			body: JSON.stringify(temp016Goochy),
			headers: {
				"Content-Type": "application/json",
				Authorization: this.authService.jwtToken!,
			},
		});

		if (!postResult.ok) {
			throw new Error(
				`Failed to create Temp016Goochy: ${postResult.statusText}`
			);
		}
		const postResultJSON = await postResult.json();
		return postResultJSON.id;
	}

	private async uploadPublicFile(file: File): Promise<string> {
		// NEW: Request a pre-signed URL from the backend
		console.log("Requesting pre-signed URL:", {
			url: `${this.apiEndpointPreSignAdminPhoto}`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.authService.jwtToken!,
			},
			body: JSON.stringify({ fileName: file.name }),
		});
		const response = await fetch(`${this.apiEndpointPreSignAdminPhoto}`, {
			method: "POST",
			body: JSON.stringify({ fileName: file.name }),
			headers: {
				"Content-Type": "application/json",
				Authorization: this.authService.jwtToken!,
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to get pre-signed URL: ${response.statusText}`
			);
		}

		const { url } = await response.json();
		console.log("Pre-signed URL:", url);
		// NEW: Upload the file using the pre-signed URL
		const uploadResponse = await fetch(url, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type },
		});

		if (!uploadResponse.ok) {
			throw new Error(
				`Failed to upload file: ${uploadResponse.statusText}`
			);
		}

		// Return the public URL of the uploaded file
		return url.split("?")[0]; // Remove query parameters from the pre-signed URL
	}

	public isAuthorized() {
		return this.authService.isAuthorized();
	}
}
