module.exports = ({ env }) => {
  // Media on S3 in AWS (TDD §9.2, D36, BD3244-34): set UPLOAD_PROVIDER=aws-s3. The ECS task role
  // grants bucket access, so there are no AWS keys anywhere. Render dev and local dev keep the
  // default local disk (`public/uploads`).
  if (env('UPLOAD_PROVIDER', 'local') !== 'aws-s3') return {};
  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          // The media domain (CloudFront in front of the bucket, origin access control only).
          baseUrl: env('MEDIA_BASE_URL'),
          rootPath: env('UPLOAD_ROOT_PATH', 'uploads'),
          s3Options: {
            region: env('AWS_REGION'),
            params: { Bucket: env('UPLOAD_BUCKET') },
          },
        },
        // Files stay private in S3; visitors only ever read them through CloudFront.
        actionOptions: { upload: {}, uploadStream: {}, delete: {} },
      },
    },
  };
};
