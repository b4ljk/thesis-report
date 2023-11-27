import { type PresignedPost } from "aws-sdk/clients/s3";
import { s3 } from "~/utils/aws";

export const uploadToSignedUrl = async ({
  signedUploadUrl,
  file,
  setUploadProgress,
  index,
}: {
  signedUploadUrl: PresignedPost;
  file: File;
  setUploadProgress: React.Dispatch<React.SetStateAction<number[]>>;
  index: number;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.keys(signedUploadUrl.fields).forEach((key) =>
      formData.append(key, signedUploadUrl.fields[key]!),
    );
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signedUploadUrl.url, true);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        console.log(`Upload is ${percentComplete}% done.`);
        setUploadProgress((prev) => {
          const newProgress = [...prev];
          newProgress[index] = percentComplete;
          return newProgress;
        });
      }
    });

    xhr.onload = () => {
      if (xhr.status > 199 && xhr.status < 300) {
        resolve();
      } else {
        reject(`Error: ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      reject(`Error: ${xhr.status}`);
    };

    xhr.send(formData);
  });
};

export const downloadFileFromS3 = async (
  bucketName: string,
  fileName: string,
) => {
  console.log("downloadFileFromS3", bucketName, fileName);

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data;
  } catch (error) {
    throw new Error(`Could not retrieve file from S3: ${error as string}`);
  }
};

export const uploadFiletoS3 = async (
  bucketName: string,
  fileName: string,
  file: Buffer,
) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file,
  };

  try {
    const data = await s3.putObject(params).promise();
    return data;
  } catch (error) {
    throw new Error(`Could not upload file to S3: ${error as string}`);
  }
};

export const s3OneTimeDownload = async (
  bucketName: string,
  fileName: string,
  expiration = 7,
) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: expiration,
  };

  try {
    const data = await s3.getSignedUrlPromise("getObject", params);
    return data;
  } catch (error) {
    throw new Error(`Could not retrieve file from S3: ${error as string}`);
  }
};
