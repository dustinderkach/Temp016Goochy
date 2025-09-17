import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

interface ImageProcessingRequest {
    originalImageKey: string;
    entryId: string;
    needsViewing: boolean;
}

export async function processImageHandler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const request: ImageProcessingRequest = JSON.parse(event.body!);
        
        if (request.needsViewing) {
            // Image is large enough to need separate viewing version
            const viewingImageKey = await createViewingImage(request.originalImageKey);
            
            // Update database with both URLs
            await updateImageUrls(request.entryId, {
                originalUrl: getS3Url(request.originalImageKey),
                viewingUrl: getS3Url(viewingImageKey)
            });
        } else {
            // Image is small enough, use same for both
            const originalUrl = getS3Url(request.originalImageKey);
            await updateImageUrls(request.entryId, {
                originalUrl: originalUrl,
                viewingUrl: originalUrl
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Image processing completed" })
        };
    } catch (error) {
        console.error("Image processing error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Image processing failed" })
        };
    }
}

async function createViewingImage(originalKey: string): Promise<string> {
    // For Lambda, keep this lightweight - just copy with metadata
    // Real resizing should be done client-side or via separate service
    const viewingKey = originalKey.replace(/\.[^/.]+$/, "_viewing.jpg");
    
    // Simple copy for now - in production, you might use sharp library
    const getCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: originalKey
    });
    
    const object = await s3Client.send(getCommand);
    
    const putCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: viewingKey,
        Body: object.Body,
        ContentType: object.ContentType,
        Metadata: { purpose: "viewing" }
    });
    
    await s3Client.send(putCommand);
    return viewingKey;
}

async function updateImageUrls(entryId: string, urls: { originalUrl: string; viewingUrl: string }) {
    const updateCommand = new UpdateItemCommand({
        TableName: process.env.TABLE_NAME!,
        Key: marshall({ id: entryId }),
        UpdateExpression: "SET originalPhotoUrl = :orig, viewingPhotoUrl = :view",
        ExpressionAttributeValues: marshall({
            ":orig": urls.originalUrl,
            ":view": urls.viewingUrl
        })
    });
    
    await ddbClient.send(updateCommand);
}

function getS3Url(key: string): string {
    return `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}