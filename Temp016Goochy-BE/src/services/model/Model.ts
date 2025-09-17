export interface AppEntry {
	id: string;
	location: string;
	name: string;
	viewingPhotoUrl?: string; // For public viewing (optimized size)
	originalPhotoUrl?: string; // For admin downloads (full quality)
}
