/**
 * File validation utilities for secure file uploads
 */

/**
 * Allowed file types for admin photo uploads
 */
const ALLOWED_FILE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/bmp",
	"image/tiff",
	// "image/svg+xml", // REMOVED: SVG can contain malicious scripts
	"image/webp",
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".webp",
	".gif",
	".bmp",
	".tiff",
	// ".svg", // REMOVED: SVG security risk
];

const MAX_FILENAME_LENGTH = 255;
const MAX_SANITIZED_LENGTH = 100;
const USERID_PATTERN = /^[a-zA-Z0-9-_]+$/;

/**
 * Maximum file size in bytes (4-5MB is large enough even for 4K screans)
 */
const oneMB = 1024 * 1024;
const howManyMB = 4;
const MAX_FILE_SIZE = howManyMB * oneMB;

/**
 * Shared input validation helper
 * @param fileName - File name to validate
 * @param functionName - Name of calling function for error context
 */
function validateInput(fileName: string, functionName: string): void {
	if (!fileName || typeof fileName !== "string") {
		throw new Error(`Invalid filename provided to ${functionName}`);
	}
	if (fileName.length > MAX_FILENAME_LENGTH) {
		throw new Error(`Filename too long in ${functionName}`);
	}
}

/**
 * Extracts file extension consistently
 * @param fileName - File name to extract extension from
 * @returns lowercase file extension including the dot
 */
function getFileExtension(fileName: string): string {
	const lastDotIndex = fileName.lastIndexOf(".");
	if (lastDotIndex === -1 || lastDotIndex === 0) {
		return "";
	}
	return fileName.toLowerCase().substring(lastDotIndex);
}

/**
 * Creates consistent error response format
 * @param error - Error message or Error object
 * @returns standardized error response
 */
function createErrorResponse(error: string | Error): {
	isValid: false;
	error: string;
} {
	return {
		isValid: false,
		error: error instanceof Error ? error.message : error,
	};
}

/**
 * Gets filename without extension
 * @param fileName - File name to process
 * @returns filename without extension
 */
function getFileNameWithoutExtension(fileName: string): string {
	const lastDotIndex = fileName.lastIndexOf(".");
	if (lastDotIndex === -1) {
		return fileName;
	}
	return fileName.substring(0, lastDotIndex);
}

/**
 * Validates if file type is allowed
 * @param fileName - The name of the file to validate
 * @returns true if file type is allowed, false otherwise
 */
export function isAllowedFileType(fileName: string): boolean {
	// Handle empty or invalid filenames
	if (!fileName || typeof fileName !== "string") {
		return false;
	}

	const extension = getFileExtension(fileName);
	return extension !== "" && ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Sanitizes file name to prevent path traversal and other security issues
 * @param fileName - The original file name
 * @returns sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
	// Use shared validation
	validateInput(fileName, "sanitizeFileName");

	// Remove any path traversal attempts - decode first to catch encoded attacks
	let sanitized: string;
	try {
		sanitized = decodeURIComponent(fileName).replace(/[\/\\]/g, "");
	} catch (error) {
		// If decoding fails, use original filename
		sanitized = fileName.replace(/[\/\\]/g, "");
	}

	// Remove path traversal sequences like .. and encoded variants
	sanitized = sanitized.replace(/\0/g, ""); // Remove null bytes
	sanitized = sanitized.replace(/\.{2,}/g, ""); // Remove .. sequences

	// Remove or replace dangerous characters
	sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

	// Prevent files starting with dots
	if (sanitized.startsWith(".")) {
		sanitized = "file_" + sanitized;
	}

	// Ensure reasonable length
	if (sanitized.length > MAX_SANITIZED_LENGTH) {
		const extension = getFileExtension(sanitized);
		const nameWithoutExt = getFileNameWithoutExtension(sanitized);
		sanitized =
			nameWithoutExt.substring(
				0,
				MAX_SANITIZED_LENGTH - extension.length
			) + extension;
	}

	// Final validation - ensure sanitized filename still has valid extension
	if (!isAllowedFileType(sanitized)) {
		throw new Error("File name became invalid after sanitization");
	}

	return sanitized;
}

/**
 * Validates file size based on file name (approximate)
 * Note: This is a basic check. Actual size validation should be done client-side
 * @param estimatedSize - Estimated file size in bytes
 * @returns true if size is within limits
 */
export function isValidFileSize(estimatedSize: number): boolean {
	return estimatedSize <= MAX_FILE_SIZE;
}

/**
 * Comprehensive file validation combining all checks
 * @param fileName - The file name to validate
 * @param fileSize - Optional file size in bytes
 * @returns validation result with details
 */
export function validateFile(
	fileName: string,
	fileSize?: number
): {
	isValid: boolean;
	error?: string;
	sanitizedName?: string;
} {
	try {
		// Use shared validation
		validateInput(fileName, "validateFile");

		// File type validation
		if (!isAllowedFileType(fileName)) {
			return createErrorResponse("File type not allowed");
		}

		// Size validation if provided
		if (fileSize !== undefined && !isValidFileSize(fileSize)) {
			return createErrorResponse(
				`File size exceeds ${howManyMB}MB limit`
			);
		}

		// Sanitization test
		const sanitized = sanitizeFileName(fileName);

		return {
			isValid: true,
			sanitizedName: sanitized,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Validation failed",
		};
	}
}

/**
 * Generates a unique file name with timestamp to prevent conflicts
 * @param originalFileName - Original file name
 * @param userId - User ID for organization
 * @returns unique file name
 */
export function generateUniqueFileName(
	originalFileName: string,
	userId?: string
): string {
	// Use shared validation
	validateInput(originalFileName, "generateUniqueFileName");
	if (
		userId &&
		(typeof userId !== "string" || !USERID_PATTERN.test(userId))
	) {
		throw new Error("Invalid userId format");
	}
	const sanitized = sanitizeFileName(originalFileName);
	const timestamp = Date.now();
	const extension = getFileExtension(sanitized);
	const nameWithoutExt = getFileNameWithoutExtension(sanitized);

	const prefix = userId ? `${userId}_` : "";
	return `${prefix}${nameWithoutExt}_${timestamp}${extension}`;
}
