# step-functions-sample

This is a sample AWS Step Functions Standard Workflow which inserts csv data into dynamodb table. 
The flow is as follows: 

COPY FILE Source Bucket -> Work Bucket 
PARSE FILE and insert items in an SQS Queue
Insert Queue objects into DynamoDB 
