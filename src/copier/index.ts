import { Context, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3'

export async function handler(event: any, context: Context): Promise<APIGatewayProxyResult> {
    const s3Client = new S3Client({
        region: process.env.REGION_VAL
    })
    const sourceBucket = process.env.SOURCE_BUCKET_NAME;
    const destinationBucket = process.env.WORK_BUCKET_NAME;
    const key = process.env.FILE_KEY
    
    try{
        const command = new CopyObjectCommand({
            CopySource: `${sourceBucket}/${key}`,
            Bucket: destinationBucket, 
            Key: key
        })
        await s3Client.send(command)
    } catch (e) {
        console.error(JSON.stringify(e))
        return {
            statusCode: 500, 
            body: "Server error"
        }
    }

    return {
        statusCode: 200, 
        body: JSON.stringify("OK")
    }
}
