const withOffline = require('next-offline');

const nextConfig = {
	poweredByHeader: false,
};

module.exports = withOffline(nextConfig);
