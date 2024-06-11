import { SQSEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

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

const params = {
    region: process.env.REGION_VAL
}

export async function handler(event: SQSEvent) {
    for await (const record of event.Records) {
        try {
            const body: rowItem[]  = JSON.parse(record.body)
            console.log(record)
            for await (const bd of body) {
                await putDDBItem(bd)
            }
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    return {
        code: 200,
        body: JSON.stringify("OK")
    }
}

async function putDDBItem(item: rowItem) {
    const ddbClient = new DynamoDBClient(params)
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
    const res =  await ddbDocClient.send(new PutCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Item: item
    }))
}
