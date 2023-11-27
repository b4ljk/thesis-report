import aws from "aws-sdk";

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.AWS_REGION,
});

export const s3 = new aws.S3();

export default aws;
