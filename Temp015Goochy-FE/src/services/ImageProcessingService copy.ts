**
 * Client-side image processing service for efficient uploads
 * Handles resizing before upload to reduce bandwidth and Lambda processing
 */
export class ImageProcessingService {
	private static readonly MAX_ORIGINAL_SIZE = 1024 * 4000; // 1 KB * Kilobytes = MB (12024 * 4000 = 4 MB)
	private static readonly VIEWING_SIZE = 800; // 800px for viewing
	private static readonly QUALITY = 0.85;

	/**
	 * Process image on client side before upload
	 * Returns { original: File, viewing: File | null }
	 */
	static async processImage(file: File): Promise<{
		original: File;
		viewing: File | null;
		needsSeparateViewing: boolean;
	}> {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const img = new Image();

		return new Promise((resolve, reject) => {
			img.onload = async () => {
				try {
					const { width, height } = img;
					const maxDimension = Math.max(width, height);

				// Resize original if too large
				let originalFile = file;
				if (maxDimension > this.MAX_ORIGINAL_SIZE) {
					originalFile = await this.resizeImage(
						img,
						canvas,
						ctx,
						this.MAX_ORIGINAL_SIZE
					);
				}

				// Create viewing version if needed
				let viewingFile = null;
				let needsSeparateViewing = false;

				if (maxDimension > this.VIEWING_SIZE) {
					viewingFile = await this.resizeImage(
						img,
						canvas,
						ctx,
						this.VIEWING_SIZE
					);
					needsSeparateViewing = true;
				}

				resolve({
					original: originalFile,
					viewing: viewingFile,
					needsSeparateViewing,
				});
				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () => {
				reject(new Error("Failed to load image"));
			};

			img.src = URL.createObjectURL(file);
		});
	}

	private static resizeImage(
		img: HTMLImageElement,
		canvas: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		maxSize: number
	): Promise<File> {
		const { width, height } = img;
		const scale = Math.min(maxSize / width, maxSize / height);

		canvas.width = width * scale;
		canvas.height = height * scale;

		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		return new Promise<File>((resolve) => {
			canvas.toBlob(
				(blob) => {
					resolve(
						new File([blob!], `resized_${Date.now()}.jpg`, {
							type: "image/jpeg",
						})
					);
				},
				"image/jpeg",
				this.QUALITY
			);
		});
	}
}
