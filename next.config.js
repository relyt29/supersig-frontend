const isProd = process.env.NODE_ENV === 'production'


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  //assetPrefix: isProd ? 'https://gateway.ipfs.io/ipns/k51qzi5uqu5dl7vaqi3ldltrgdbd6fgpvkhueqgiwuo3v1zu47nxamyc6egyyh' : '',
  assetPrefix: isProd ? '' : '',
}

module.exports = nextConfig
