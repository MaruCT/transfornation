import { v2 as cloudinary } from 'cloudinary';
import busboy from 'busboy';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const contentType = event.headers['content-type'] || '';

    // Parse multipart form data
    const result = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: { 'content-type': contentType } });
      const uploads = [];
      const filePromises = [];

      bb.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;

        console.log('Receiving file:', filename, mimeType);

        const filePromise = new Promise((resolveFile, rejectFile) => {
          const chunks = [];

          file.on('data', (data) => {
            chunks.push(data);
          });

          file.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const base64 = buffer.toString('base64');
              const dataURI = `data:${mimeType};base64,${base64}`;

              console.log('File size:', buffer.length, 'bytes');

              // Determine resource type based on mime type
              let resourceType = 'image';
              if (mimeType.startsWith('video/')) {
                resourceType = 'video';
              }

              console.log('Uploading to Cloudinary as', resourceType);

              // Upload to Cloudinary
              const uploadResult = await cloudinary.uploader.upload(dataURI, {
                resource_type: resourceType,
                folder: 'transfornation',
                transformation: resourceType === 'image' ? [
                  { width: 1920, height: 1080, crop: 'limit' },
                  { quality: 'auto' },
                  { fetch_format: 'auto' }
                ] : undefined
              });

              console.log('Upload successful:', uploadResult.secure_url);

              uploads.push({
                type: resourceType,
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
              });

              resolveFile();
            } catch (error) {
              console.error('Error uploading file:', error);
              rejectFile(error);
            }
          });

          file.on('error', (error) => {
            console.error('File stream error:', error);
            rejectFile(error);
          });
        });

        filePromises.push(filePromise);
      });

      bb.on('finish', async () => {
        try {
          await Promise.all(filePromises);
          resolve(uploads);
        } catch (error) {
          reject(error);
        }
      });

      bb.on('error', (error) => {
        console.error('Busboy error:', error);
        reject(error);
      });

      // Write the body to busboy
      const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      bb.write(body);
      bb.end();
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        uploads: result,
      }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
