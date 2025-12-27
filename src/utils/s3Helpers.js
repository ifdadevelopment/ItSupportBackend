export const getCloudFrontUrl = (key) => {
  const cloudfrontUrl = process.env.CLOUDFRONT_URL;
  return `${cloudfrontUrl}/${key}`;
};