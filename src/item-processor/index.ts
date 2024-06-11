import { parse } from "csv-parse"
import { S3Client, GetObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3"
import { Context } from "aws-lambda";
import { Readable } from "stream";
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { pipeline } from 'stream/promises'

interface rowItem {
    id: number,
    department: string, 
    major: string,
    degree: string, 
    school: string, 
    courseTitle: string, 
    courseDescription: string,
    cost: number
}

export async function handler(event: any, context: Context) {
    const isProduction = process.env.NODE_ENV === 'production'
    const params: S3ClientConfig = {
        region: process.env.REGION_VAL
    }
    if(!isProduction) {
        params.endpoint = 'http://localhost:4566'
    }
    const s3Client = new S3Client({
        region: process.env.REGION_VAL
    })
    const sourceBucket = process.env.WORK_BUCKET_NAME || 'work-bucket'
    const key = process.env.FILE_KEY
    const command = new GetObjectCommand({
        Bucket: sourceBucket ?? '',
        Key: key
    })

    try{
        const request = await s3Client.send(command)
        const fileStream = request.Body;

        if(!(fileStream instanceof Readable)) {
            throw new Error(`Expected Readable stream but got ${typeof(fileStream)}`)
        }

        let rowCount = 1;
        await pipeline(fileStream, parse({ delimiter: ',', columns: true}), async function(source) {
            for await (const row of source) {
                try {
                    const rowItem: rowItem = {
                        id: rowCount,
                        department: row['Department'],
                        major: row['Major'],
                        degree: row['Degree'],
                        school: row['School'],
                        courseTitle: row['Course Title'],
                        courseDescription: row['Course Description'],
                        cost: row['Cost']
                    }
                    await sendMessage(rowItem)
                    rowCount++;
                } catch (err) {
                    console.error(err)
                    continue;
                }
            }
        })

        await sendFinalMessage()
    } catch(e) {
        console.log("Error while fetching file")
        console.log(JSON.stringify(e))
        throw new Error(JSON.stringify(e))
    }



    return {
        statusCode: 200, 
        body: JSON.stringify("OK")
    }
}
let body: rowItem[] = []
async function sendMessage(item: rowItem) {
    if(body.length === 100) {
        console.log('Message body')
        console.log(JSON.stringify(body))
        const sqsClient = new SQSClient({
            region: process.env.REGION_VAL
        })
        const command = new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(body)
        })
        const result = await sqsClient.send(command)
        console.log(result)
        body = []
    }
    else {
        body.push(item)
    }
}

async function sendFinalMessage() {
    const sqsClient = new SQSClient({
        region: process.env.REGION_VAL
    })
    const command = new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(body)
    })
    console.log(JSON.stringify(body))
    const result = await sqsClient.send(command)
    console.log(result)
}
